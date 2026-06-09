const Tutoring = require("../models/tutoringModel");
const Notification = require("../models/notificationModel");
const { avatarPublicPath } = require("../utils/avatarPublicUrl");

/** Notification « système » liée à une session de tutorat (cliquable vers le chat). */
async function notify(userId, relatedUserId, sessionId, title) {
  try {
    await Notification.insert({
      user_id: userId,
      type: "system",
      title,
      related_user_id: relatedUserId,
      target_id: `tutoring:${sessionId}`,
    });
  } catch (e) {
    console.warn("[tutoring] notification:", e.message);
  }
}

const UNITS = { jours: 1, semaines: 7, mois: null };

/** Date de fin selon la durée choisie (mois calendaires réels). */
function computeEnd(start, value, unit) {
  const end = new Date(start.getTime());
  if (unit === "mois") {
    end.setMonth(end.getMonth() + value);
  } else {
    end.setDate(end.getDate() + value * UNITS[unit]);
  }
  return end;
}

function dateFr(iso) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

/* ── Lancement : le tuteur propose une session à l'apprenant ── */
exports.start = async (req, res) => {
  try {
    const learnerId = Number(req.body.learner_id);
    if (!Number.isFinite(learnerId) || learnerId < 1) {
      return res.status(400).json({ message: "Apprenant invalide" });
    }
    if (learnerId === Number(req.user.id)) {
      return res.status(400).json({ message: "Impossible de démarrer une session avec vous-même" });
    }
    const open = await Tutoring.findOpenBetween(req.user.id, learnerId);
    if (open) {
      return res.status(409).json({ message: "Une session est déjà en cours avec ce membre." });
    }
    const id = await Tutoring.create({ tutor_id: req.user.id, learner_id: learnerId });
    const created = await Tutoring.findById(id);
    await notify(
      learnerId,
      req.user.id,
      id,
      `${created.tutor_nom} vous propose une session de tutorat — acceptez pour démarrer l'apprentissage`
    );
    return res.status(201).json(created);
  } catch (error) {
    console.error("[tutoring/start]", error);
    return res.status(500).json({ message: "Erreur lancement de session" });
  }
};

/* ── L'apprenant accepte ou refuse la demande ── */
exports.accept = async (req, res) => {
  try {
    const session = await Tutoring.findById(Number(req.params.id));
    if (!session) return res.status(404).json({ message: "Session introuvable" });
    if (Number(session.learner_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Seul l'apprenant peut accepter cette session." });
    }
    if (session.status !== "pending") {
      return res.status(409).json({ message: "Cette demande n'est plus en attente." });
    }
    await Tutoring.setStatus(session.id, "accepted");
    await notify(
      session.tutor_id,
      session.learner_id,
      session.id,
      `${session.learner_nom} a accepté votre session de tutorat — définissez maintenant sa durée`
    );
    return res.json(await Tutoring.findById(session.id));
  } catch (error) {
    return res.status(500).json({ message: "Erreur acceptation de session" });
  }
};

exports.decline = async (req, res) => {
  try {
    const session = await Tutoring.findById(Number(req.params.id));
    if (!session) return res.status(404).json({ message: "Session introuvable" });
    if (Number(session.learner_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Seul l'apprenant peut refuser cette session." });
    }
    if (session.status !== "pending") {
      return res.status(409).json({ message: "Cette demande n'est plus en attente." });
    }
    await Tutoring.setStatus(session.id, "declined");
    await notify(
      session.tutor_id,
      session.learner_id,
      session.id,
      `${session.learner_nom} a refusé votre proposition de session de tutorat`
    );
    return res.json(await Tutoring.findById(session.id));
  } catch (error) {
    return res.status(500).json({ message: "Erreur refus de session" });
  }
};

/* ── Paramétrage : le tuteur fixe la durée, la session devient active ── */
exports.setDuration = async (req, res) => {
  try {
    const session = await Tutoring.findById(Number(req.params.id));
    if (!session) return res.status(404).json({ message: "Session introuvable" });
    if (Number(session.tutor_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Seul le tuteur peut définir la durée." });
    }
    if (session.status !== "accepted") {
      return res.status(409).json({ message: "La session doit d'abord être acceptée par l'apprenant." });
    }

    const value = Number(req.body.duration_value);
    const unit = String(req.body.duration_unit || "");
    if (!Number.isInteger(value) || value < 1 || value > 365) {
      return res.status(400).json({ message: "Durée invalide (entier entre 1 et 365)." });
    }
    if (!Object.prototype.hasOwnProperty.call(UNITS, unit)) {
      return res.status(400).json({ message: "Unité invalide (jours, semaines ou mois)." });
    }

    const start = new Date();
    const end = computeEnd(start, value, unit);
    const ok = await Tutoring.activate(session.id, {
      duration_value: value,
      duration_unit: unit,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
    });
    if (!ok) return res.status(409).json({ message: "Activation impossible." });

    const endLabel = dateFr(end.toISOString());
    await notify(
      session.learner_id,
      session.tutor_id,
      session.id,
      `${session.tutor_nom} a démarré votre session de tutorat (${value} ${unit}) — fin prévue le ${endLabel}`
    );
    await notify(
      session.tutor_id,
      session.learner_id,
      session.id,
      `Session de tutorat avec ${session.learner_nom} démarrée (${value} ${unit}) — fin prévue le ${endLabel}`
    );
    return res.json(await Tutoring.findById(session.id));
  } catch (error) {
    console.error("[tutoring/duration]", error);
    return res.status(500).json({ message: "Erreur paramétrage de session" });
  }
};

/* ── Évaluation par l'apprenant après clôture ── */
exports.review = async (req, res) => {
  try {
    const session = await Tutoring.findById(Number(req.params.id));
    if (!session) return res.status(404).json({ message: "Session introuvable" });
    if (Number(session.learner_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Seul l'apprenant peut évaluer le tutorat." });
    }
    if (session.status !== "completed") {
      return res.status(409).json({ message: "La session doit être terminée pour être évaluée." });
    }
    if (await Tutoring.findReviewBySession(session.id)) {
      return res.status(409).json({ message: "Cette session a déjà été évaluée." });
    }

    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Note invalide (1 à 5)." });
    }
    const comment = typeof req.body.comment === "string" ? req.body.comment.trim().slice(0, 2000) : null;

    await Tutoring.insertReview({
      session_id: session.id,
      reviewer_id: session.learner_id,
      reviewee_id: session.tutor_id,
      rating,
      comment: comment || null,
    });
    await notify(
      session.tutor_id,
      session.learner_id,
      session.id,
      `${session.learner_nom} a évalué votre tutorat : ${rating}/5${comment ? " avec un commentaire" : ""}`
    );
    return res.status(201).json({ message: "Évaluation enregistrée" });
  } catch (error) {
    console.error("[tutoring/review]", error);
    return res.status(500).json({ message: "Erreur enregistrement de l'évaluation" });
  }
};

/* ── Lectures ── */

/** État de la session avec un interlocuteur donné (panneau du chat). */
exports.withPeer = async (req, res) => {
  try {
    const peerId = Number(req.params.peerId);
    if (!Number.isFinite(peerId) || peerId < 1) {
      return res.status(400).json({ message: "Membre invalide" });
    }
    const current = await Tutoring.findOpenBetween(req.user.id, peerId);
    const lastCompleted = await Tutoring.findLatestCompletedBetween(req.user.id, peerId);
    return res.json({ current, lastCompleted });
  } catch (error) {
    return res.status(500).json({ message: "Erreur lecture session" });
  }
};

/** Historique des sessions du membre connecté. */
exports.mine = async (req, res) => {
  try {
    return res.json(await Tutoring.listForUser(req.user.id));
  } catch (error) {
    return res.status(500).json({ message: "Erreur historique sessions" });
  }
};

/** Avis publics d'un tuteur (profil). */
exports.reviewsForUser = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isFinite(userId) || userId < 1) {
      return res.status(400).json({ message: "Membre invalide" });
    }
    const summary = await Tutoring.ratingSummary(userId);
    const reviews = (await Tutoring.listReviewsForUser(userId)).map((r) => ({
      ...r,
      reviewer_avatar_url: avatarPublicPath(r.reviewer_avatar_filename),
    }));
    return res.json({ ...summary, reviews });
  } catch (error) {
    return res.status(500).json({ message: "Erreur lecture des avis" });
  }
};
