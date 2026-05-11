const fs = require("fs");
const path = require("path");
const db = require("../config/db");
const User = require("../models/userModel");
const Skill = require("../models/skillModel");
const Notification = require("../models/notificationModel");
const { publicUser, publicMemberProfile } = require("../utils/userDto");
const { avatarsDir } = require("../middleware/avatarUpload");

function unlinkAvatarFileSafe(filename) {
  if (!filename || typeof filename !== "string") return;
  const safe = path.basename(filename);
  if (!safe || safe.includes("..")) return;
  const full = path.join(avatarsDir, safe);
  fs.unlink(full, () => {});
}

exports.updateMe = async (req, res) => {
  try {
    const bio = typeof req.body?.bio === "string" ? req.body.bio.trim() : "";
    if (bio.length > 2000) {
      return res.status(400).json({ message: "La bio est trop longue (2000 caractères max)." });
    }
    await User.updateBio(req.user.id, bio);
    const fresh = await User.findById(req.user.id);
    return res.json({
      message: "Profil mis a jour",
      user: publicUser(fresh),
    });
  } catch (error) {
    return res.status(500).json({ message: "Erreur mise à jour profil" });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file?.filename) {
      return res.status(400).json({ message: "Fichier image requis (JPEG, PNG, WebP ou GIF)." });
    }
    const prev = await User.findById(req.user.id);
    const nextName = req.file.filename;
    await User.updateAvatarFilename(req.user.id, nextName);
    if (prev?.avatar_filename && prev.avatar_filename !== nextName) {
      unlinkAvatarFileSafe(prev.avatar_filename);
    }
    const fresh = await User.findById(req.user.id);
    return res.json({
      message: "Photo mise a jour",
      user: publicUser(fresh),
    });
  } catch (error) {
    return res.status(500).json({ message: "Erreur enregistrement de la photo" });
  }
};

exports.removeAvatar = async (req, res) => {
  try {
    const prev = await User.findById(req.user.id);
    await User.updateAvatarFilename(req.user.id, null);
    if (prev?.avatar_filename) unlinkAvatarFileSafe(prev.avatar_filename);
    const fresh = await User.findById(req.user.id);
    return res.json({
      message: "Photo retiree",
      user: publicUser(fresh),
    });
  } catch (error) {
    return res.status(500).json({ message: "Erreur suppression photo" });
  }
};

exports.getMemberProfile = async (req, res) => {
  try {
    const uid = Number(req.params.id);
    if (!Number.isFinite(uid) || uid < 1) {
      return res.status(400).json({ message: "Profil invalide" });
    }
    const profile = await User.findPublicById(uid);
    if (!profile) {
      return res.status(404).json({ message: "Profil introuvable" });
    }
    const all = await Skill.findByUserId(uid);
    const offers = all.filter((s) => Number(s.is_offer) === 1);
    const seeks = all.filter((s) => Number(s.is_offer) === 0);
    /* Email volontairement absent */
    return res.json({ profile: publicMemberProfile(profile), offered_skills: offers, sought_skills: seeks });
  } catch (error) {
    return res.status(500).json({ message: "Erreur lecture profil membre" });
  }
};

exports.recordProfileView = async (req, res) => {
  try {
    const uid = Number(req.params.id);
    const viewerId = Number(req.user.id);
    if (!Number.isFinite(uid) || uid < 1 || uid === viewerId) {
      return res.status(204).send();
    }
    const exists = await User.findPublicById(uid);
    if (!exists) return res.status(404).json({ message: "Profil introuvable" });
    await Notification.insert({
      user_id: uid,
      type: "profile_view",
      related_user_id: viewerId,
      target_id: String(viewerId),
    });
    return res.status(201).json({ message: "OK" });
  } catch (error) {
    return res.status(500).json({ message: "Erreur enregistrement vue profil" });
  }
};

exports.me = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT u.id, u.nom, u.email, u.role, u.bio, u.credibility_score, u.avatar_filename, u.city, u.country, u.expertise_level, u.badge_label,
              COALESCE(AVG(r.rating), 0) AS average_rating,
              COUNT(r.id) AS total_reviews
       FROM users u
       LEFT JOIN reviews r ON r.reviewee_id = u.id
       WHERE u.id = ?
       GROUP BY u.id`,
      [req.user.id]
    );
    const row = rows[0];
    if (!row) return res.json(null);
    const pu = publicUser(row);
    return res.json({
      ...pu,
      average_rating: row.average_rating,
      total_reviews: row.total_reviews,
    });
  } catch (error) {
    return res.status(500).json({ message: "Erreur profil" });
  }
};

/** Parcourir les autres membres avec leurs compétences (feed plateforme). */
exports.browseMembers = async (req, res) => {
  try {
    const me = req.user.id;
    const limit = Math.min(Math.max(Number(req.query.limit) || 24, 1), 48);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;
    const q = String(req.query.q || "").trim().toLowerCase();
    const qLike = `%${q}%`;
    const category = String(req.query.category || "").trim().toLowerCase();

    const [users] = await db.execute(
      `SELECT id, nom, bio, credibility_score, avatar_filename, city, country, expertise_level, badge_label
       FROM users u
       WHERE u.id <> ?
         AND (
           ? = ''
           OR LOWER(u.nom) LIKE ?
           OR LOWER(COALESCE(u.bio, '')) LIKE ?
           OR LOWER(COALESCE(u.city, '')) LIKE ?
           OR LOWER(COALESCE(u.country, '')) LIKE ?
           OR EXISTS (
             SELECT 1
             FROM skills s
             WHERE s.user_id = u.id
               AND (
                 LOWER(COALESCE(s.nom_competence, '')) LIKE ?
                 OR LOWER(COALESCE(s.categorie, '')) LIKE ?
               )
           )
         )
         AND (
           ? = ''
           OR EXISTS (
             SELECT 1
             FROM skills s2
             WHERE s2.user_id = u.id
               AND LOWER(COALESCE(s2.categorie, '')) = ?
           )
         )
       ORDER BY u.id DESC
       LIMIT ? OFFSET ?`,
      [me, q, qLike, qLike, qLike, qLike, qLike, qLike, category, category, limit, offset]
    );
    if (!users.length) return res.json([]);

    const ids = users.map((u) => u.id);
    const placeholders = ids.map(() => "?").join(",");
    const [skills] = await db.execute(
      `SELECT id, user_id, nom_competence, niveau, categorie, is_offer FROM skills WHERE user_id IN (${placeholders}) ORDER BY created_at DESC`,
      ids
    );

    const byUser = {};
    for (const uid of ids) {
      byUser[uid] = { offered_skills: [], sought_skills: [] };
    }
    for (const s of skills) {
      const row = {
        id: s.id,
        nom_competence: s.nom_competence,
        niveau: s.niveau,
        categorie: s.categorie,
      };
      if (Number(s.is_offer) === 1) byUser[s.user_id].offered_skills.push(row);
      else byUser[s.user_id].sought_skills.push(row);
    }

    const out = users.map((u) => ({
      profile: publicMemberProfile(u),
      offered_skills: byUser[u.id].offered_skills,
      sought_skills: byUser[u.id].sought_skills,
    }));
    return res.json(out);
  } catch (error) {
    console.error("[profile/browse]", error);
    return res.status(500).json({ message: "Erreur parcours plateforme" });
  }
};

exports.listCategories = async (_req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT c.id, c.name,
              COALESCE(COUNT(s.id), 0) AS skills_count,
              COALESCE(COUNT(DISTINCT s.user_id), 0) AS users_count
       FROM skill_categories c
       LEFT JOIN skills s ON LOWER(COALESCE(s.categorie, '')) = LOWER(c.name)
       GROUP BY c.id, c.name
       ORDER BY users_count DESC, skills_count DESC, c.name ASC`
    );
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Erreur catégories" });
  }
};

exports.popularSkills = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 30);
    const [rows] = await db.execute(
      `SELECT LOWER(TRIM(s.nom_competence)) AS key_name,
              MIN(s.nom_competence) AS label,
              MIN(s.categorie) AS categorie,
              COUNT(*) AS usage_count
       FROM skills s
       WHERE TRIM(COALESCE(s.nom_competence, '')) <> ''
       GROUP BY key_name
       ORDER BY usage_count DESC, label ASC
       LIMIT ?`,
      [limit]
    );
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Erreur suggestions compétences" });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const keyword = `%${req.query.keyword || ""}%`;
    const category = req.query.category || "";
    const level = req.query.level || "";
    const minRating = Number(req.query.minRating || 0);

    const sql = `SELECT DISTINCT u.id, u.nom, u.email,
      COALESCE(AVG(r.rating), 0) AS average_rating
      FROM users u
      LEFT JOIN skills s ON s.user_id = u.id
      LEFT JOIN reviews r ON r.reviewee_id = u.id
      WHERE (u.nom LIKE ? OR s.nom_competence LIKE ?)
      AND (? = '' OR s.categorie = ?)
      AND (? = '' OR s.niveau = ?)
      GROUP BY u.id
      HAVING average_rating >= ?
      ORDER BY average_rating DESC`;

    const [rows] = await db.execute(sql, [
      keyword,
      keyword,
      category,
      category,
      level,
      level,
      minRating,
    ]);
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Erreur recherche utilisateurs" });
  }
};
