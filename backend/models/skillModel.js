const db = require("../config/db");

const Skill = {
  add: async (skillData) => {
    const { nom_competence, categorie, niveau, rarete_weight, is_offer, user_id } = skillData;
    const sql = `INSERT INTO skills (nom_competence, categorie, niveau, rarete_weight, is_offer, user_id)
                 VALUES (?, ?, ?, ?, ?, ?)`;
    return db.execute(sql, [nom_competence, categorie, niveau, rarete_weight, is_offer, user_id]);
  },

  findByUserId: async (userId) => {
    const [rows] = await db.execute("SELECT * FROM skills WHERE user_id = ? ORDER BY created_at DESC", [userId]);
    return rows;
  },

  deleteByIdForUser: async (skillId, userId) => {
    const [r] = await db.execute("DELETE FROM skills WHERE id = ? AND user_id = ?", [skillId, userId]);
    return r.affectedRows > 0;
  },

  search: async ({ keyword = "", category = "", level = "" }, excludeUserId) => {
    const sql = `SELECT s.*, u.nom AS owner_name, u.id AS owner_id
                 FROM skills s
                 JOIN users u ON u.id = s.user_id
                 WHERE s.nom_competence LIKE ?
                 AND (? = '' OR s.categorie = ?)
                 AND (? = '' OR s.niveau = ?)
                 AND (? IS NULL OR s.user_id <> ?)
                 ORDER BY s.created_at DESC`;
    const [rows] = await db.execute(sql, [
      `%${keyword}%`,
      category,
      category,
      level,
      level,
      excludeUserId ?? null,
      excludeUserId ?? null,
    ]);
    return rows;
  },
};

module.exports = Skill;