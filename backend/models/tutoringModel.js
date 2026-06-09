const db = require("../config/db");

const SESSION_FIELDS = `
  ts.id, ts.tutor_id, ts.learner_id, ts.status,
  ts.duration_value, ts.duration_unit, ts.start_at, ts.end_at, ts.created_at,
  tu.nom AS tutor_nom, le.nom AS learner_nom
`;

const SESSION_JOINS = `
  FROM tutoring_sessions ts
  JOIN users tu ON tu.id = ts.tutor_id
  JOIN users le ON le.id = ts.learner_id
`;

const Tutoring = {
  create: async ({ tutor_id, learner_id }) => {
    const [r] = await db.execute(
      "INSERT INTO tutoring_sessions (tutor_id, learner_id, status) VALUES (?, ?, 'pending')",
      [tutor_id, learner_id]
    );
    return r.insertId;
  },

  findById: async (id) => {
    const [rows] = await db.execute(`SELECT ${SESSION_FIELDS} ${SESSION_JOINS} WHERE ts.id = ?`, [id]);
    return rows[0] || null;
  },

  /** Session en cours (pending/accepted/active) entre deux membres, peu importe les rôles. */
  findOpenBetween: async (userA, userB) => {
    const [rows] = await db.execute(
      `SELECT ${SESSION_FIELDS} ${SESSION_JOINS}
       WHERE ts.status IN ('pending', 'accepted', 'active')
         AND ((ts.tutor_id = ? AND ts.learner_id = ?) OR (ts.tutor_id = ? AND ts.learner_id = ?))
       ORDER BY ts.id DESC LIMIT 1`,
      [userA, userB, userB, userA]
    );
    return rows[0] || null;
  },

  /** Dernière session terminée entre deux membres, avec son éventuelle évaluation. */
  findLatestCompletedBetween: async (userA, userB) => {
    const [rows] = await db.execute(
      `SELECT ${SESSION_FIELDS}, tr.id AS review_id, tr.rating AS review_rating
       ${SESSION_JOINS}
       LEFT JOIN tutoring_reviews tr ON tr.session_id = ts.id
       WHERE ts.status = 'completed'
         AND ((ts.tutor_id = ? AND ts.learner_id = ?) OR (ts.tutor_id = ? AND ts.learner_id = ?))
       ORDER BY ts.id DESC LIMIT 1`,
      [userA, userB, userB, userA]
    );
    return rows[0] || null;
  },

  /** Historique des sessions d'un membre (tuteur ou apprenant). */
  listForUser: async (userId, limit = 50) => {
    const lim = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const [rows] = await db.execute(
      `SELECT ${SESSION_FIELDS}, tr.id AS review_id, tr.rating AS review_rating
       ${SESSION_JOINS}
       LEFT JOIN tutoring_reviews tr ON tr.session_id = ts.id
       WHERE ts.tutor_id = ? OR ts.learner_id = ?
       ORDER BY ts.id DESC LIMIT ?`,
      [userId, userId, lim]
    );
    return rows;
  },

  setStatus: async (id, status) => {
    const [r] = await db.execute("UPDATE tutoring_sessions SET status = ? WHERE id = ?", [status, id]);
    return r.affectedRows > 0;
  },

  /** Passe la session en actif avec la durée choisie par le tuteur. */
  activate: async (id, { duration_value, duration_unit, start_at, end_at }) => {
    const [r] = await db.execute(
      `UPDATE tutoring_sessions
          SET status = 'active', duration_value = ?, duration_unit = ?, start_at = ?, end_at = ?
        WHERE id = ? AND status = 'accepted'`,
      [duration_value, duration_unit, start_at, end_at, id]
    );
    return r.affectedRows > 0;
  },

  /** Sessions actives arrivées à échéance (à clôturer). */
  listExpired: async (nowIso) => {
    const [rows] = await db.execute(
      `SELECT ${SESSION_FIELDS} ${SESSION_JOINS}
       WHERE ts.status = 'active' AND ts.end_at IS NOT NULL AND ts.end_at <= ?`,
      [nowIso]
    );
    return rows;
  },

  /** Sessions actives dont l'échéance approche et sans rappel déjà envoyé pour ce seuil. */
  listDueForReminder: async (thresholdMinutes, nowIso) => {
    const [rows] = await db.execute(
      `SELECT ${SESSION_FIELDS} ${SESSION_JOINS}
       WHERE ts.status = 'active'
         AND ts.end_at IS NOT NULL
         AND ts.end_at > ?
         AND NOT EXISTS (
           SELECT 1 FROM tutoring_reminders r
            WHERE r.session_id = ts.id AND r.threshold_minutes = ?
         )`,
      [nowIso, thresholdMinutes]
    );
    return rows;
  },

  markReminderSent: async (sessionId, thresholdMinutes) => {
    await db.execute(
      "INSERT OR IGNORE INTO tutoring_reminders (session_id, threshold_minutes) VALUES (?, ?)",
      [sessionId, thresholdMinutes]
    );
  },

  insertReview: async ({ session_id, reviewer_id, reviewee_id, rating, comment }) => {
    const [r] = await db.execute(
      `INSERT INTO tutoring_reviews (session_id, reviewer_id, reviewee_id, rating, comment)
       VALUES (?, ?, ?, ?, ?)`,
      [session_id, reviewer_id, reviewee_id, rating, comment ?? null]
    );
    return r.insertId;
  },

  findReviewBySession: async (sessionId) => {
    const [rows] = await db.execute("SELECT * FROM tutoring_reviews WHERE session_id = ?", [sessionId]);
    return rows[0] || null;
  },

  /** Avis reçus par un tuteur (visibles sur son profil). */
  listReviewsForUser: async (revieweeId, limit = 30) => {
    const lim = Math.min(Math.max(Number(limit) || 30, 1), 100);
    const [rows] = await db.execute(
      `SELECT tr.id, tr.rating, tr.comment, tr.created_at,
              u.id AS reviewer_id, u.nom AS reviewer_nom, u.avatar_filename AS reviewer_avatar_filename
       FROM tutoring_reviews tr
       JOIN users u ON u.id = tr.reviewer_id
       WHERE tr.reviewee_id = ?
       ORDER BY tr.created_at DESC
       LIMIT ?`,
      [revieweeId, lim]
    );
    return rows;
  },

  ratingSummary: async (revieweeId) => {
    const [rows] = await db.execute(
      "SELECT COUNT(*) AS count, AVG(rating) AS average FROM tutoring_reviews WHERE reviewee_id = ?",
      [revieweeId]
    );
    const row = rows[0] || {};
    return {
      count: Number(row.count) || 0,
      average: row.average != null ? Math.round(Number(row.average) * 10) / 10 : null,
    };
  },
};

module.exports = Tutoring;
