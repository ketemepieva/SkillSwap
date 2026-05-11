const db = require("../config/db");

const User = {
  create: async (userData) => {
    const { nom, email, password } = userData;
    const sql = "INSERT INTO users (nom, email, password) VALUES (?, ?, ?)";
    const [result] = await db.execute(sql, [nom, email, password]);
    return result.insertId;
  },

  findByEmail: async (email) => {
    const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    return rows[0];
  },

  findById: async (id) => {
    const [rows] = await db.execute(
      "SELECT id, nom, email, role, bio, credibility_score, avatar_filename, city, country, expertise_level, badge_label FROM users WHERE id = ?",
      [id]
    );
    return rows[0];
  },

  findByIdWithPassword: async (id) => {
    const [rows] = await db.execute("SELECT * FROM users WHERE id = ?", [id]);
    return rows[0];
  },

  findPublicById: async (id) => {
    const [rows] = await db.execute(
      "SELECT id, nom, bio, credibility_score, avatar_filename, city, country, expertise_level, badge_label FROM users WHERE id = ?",
      [id]
    );
    return rows[0];
  },

  updateBio: async (userId, bio) => {
    const text = typeof bio === "string" ? bio.trim() : "";
    await db.execute("UPDATE users SET bio = ? WHERE id = ?", [text, userId]);
  },

  updateAvatarFilename: async (userId, filename) => {
    await db.execute("UPDATE users SET avatar_filename = ? WHERE id = ?", [filename ?? null, userId]);
  },

  updateEmail: async (userId, email) => {
    await db.execute("UPDATE users SET email = ? WHERE id = ?", [email.trim().toLowerCase(), userId]);
  },

  updatePassword: async (userId, hashedPassword) => {
    await db.execute("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId]);
  },

  emailTakenByOther: async (email, excludeUserId) => {
    const [rows] = await db.execute("SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id <> ?", [
      email.trim(),
      excludeUserId,
    ]);
    return Boolean(rows[0]);
  },
};

module.exports = User;