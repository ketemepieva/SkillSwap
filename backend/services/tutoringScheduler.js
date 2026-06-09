const Tutoring = require("../models/tutoringModel");
const Notification = require("../models/notificationModel");
const { REMINDER_MINUTES, reminderLabel, SWEEP_INTERVAL_MS } = require("../config/tutoringConfig");

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
    console.warn("[tutoring-scheduler] notification:", e.message);
  }
}

/** Temps restant lisible : « 7 jours », « 24 heures », « 1 heure »… */
function remainingLabel(minutes) {
  if (minutes >= 36 * 60) {
    const d = Math.round(minutes / (24 * 60));
    return `${d} jour${d > 1 ? "s" : ""}`;
  }
  if (minutes >= 50) {
    const h = Math.round(minutes / 60);
    return `${h} heure${h > 1 ? "s" : ""}`;
  }
  const m = Math.max(1, Math.round(minutes));
  return `${m} minute${m > 1 ? "s" : ""}`;
}

/**
 * Rappels d'échéance : une notification aux deux membres à chaque seuil franchi
 * (au plus une par session et par passage), avec le temps restant réel.
 */
async function sendReminders(now) {
  const notifiedThisSweep = new Set();
  // REMINDER_MINUTES est trié décroissant (ex. 10080, 1440, 60)
  for (const threshold of REMINDER_MINUTES) {
    const due = await Tutoring.listDueForReminder(threshold, now.toISOString());
    for (const s of due) {
      const remainingMin = (new Date(s.end_at).getTime() - now.getTime()) / 60000;
      if (remainingMin > threshold) continue; // fenêtre de ce seuil pas encore atteinte

      await Tutoring.markReminderSent(s.id, threshold);
      if (notifiedThisSweep.has(s.id)) continue; // déjà prévenu via un seuil plus large
      notifiedThisSweep.add(s.id);

      const label = remainingLabel(remainingMin);
      await notify(s.tutor_id, s.learner_id, s.id, `Votre session de tutorat avec ${s.learner_nom} se termine dans ${label}.`);
      await notify(s.learner_id, s.tutor_id, s.id, `Votre session de tutorat avec ${s.tutor_nom} se termine dans ${label}.`);
    }
  }
}

/** Clôture automatique des sessions arrivées à échéance. */
async function closeExpired(now) {
  const expired = await Tutoring.listExpired(now.toISOString());
  for (const s of expired) {
    await Tutoring.setStatus(s.id, "completed");
    await notify(
      s.tutor_id,
      s.learner_id,
      s.id,
      `Votre session de tutorat avec ${s.learner_nom} est terminée — elle attend l'évaluation de l'apprenant.`
    );
    await notify(
      s.learner_id,
      s.tutor_id,
      s.id,
      `Votre session de tutorat avec ${s.tutor_nom} est terminée — évaluez votre tuteur depuis le chat.`
    );
  }
}

async function sweep() {
  const now = new Date();
  try {
    await sendReminders(now);
    await closeExpired(now);
  } catch (e) {
    console.error("[tutoring-scheduler]", e);
  }
}

/** Démarre la boucle de suivi des sessions (rappels + clôture auto). */
function startTutoringScheduler() {
  void sweep(); // passage immédiat au démarrage (rattrape les échéances manquées)
  const timer = setInterval(() => void sweep(), SWEEP_INTERVAL_MS);
  timer.unref?.();
  console.log(
    `[tutoring-scheduler] Actif — rappels à ${REMINDER_MINUTES.map(reminderLabel).join(", ")} de la fin (toutes les ${Math.round(SWEEP_INTERVAL_MS / 1000)} s).`
  );
}

module.exports = { startTutoringScheduler };
