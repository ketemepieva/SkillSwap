const db = require("../config/db");

const AuthSession = {
  create: async ({ user_id, jti, ip, user_agent }) => {
    const [ins] = await db.execute(
      `INSERT INTO auth_sessions (user_id, jti, ip, user_agent, revoked) VALUES (?, ?, ?, ?, 0)`,
      [user_id, jti, ip ?? null, user_agent ?? null]
    );
    return ins.insertId;
  },

  /** @returns {Promise<boolean>} */
  isActive: async (userId, jti) => {
    const [rows] = await db.execute(
      "SELECT id FROM auth_sessions WHERE user_id = ? AND jti = ? AND revoked = 0 LIMIT 1",
      [userId, jti]
    );
    return Boolean(rows[0]);
  },

  revokeByJti: async (jti, userId) => {
    await db.execute("UPDATE auth_sessions SET revoked = 1 WHERE jti = ? AND user_id = ?", [jti, userId]);
  },

  revokeById: async (sessionId, userId) => {
    const [r] = await db.execute("UPDATE auth_sessions SET revoked = 1 WHERE id = ? AND user_id = ?", [
      sessionId,
      userId,
    ]);
    return r.affectedRows > 0;
  },

  revokeOthers: async (userId, keepJti) => {
    await db.execute("UPDATE auth_sessions SET revoked = 1 WHERE user_id = ? AND jti <> ?", [userId, keepJti]);
  },

  listForUser: async (userId) => {
    const [rows] = await db.execute(
      `SELECT id, jti, created_at, ip, user_agent, revoked
       FROM auth_sessions
       WHERE user_id = ?
       ORDER BY datetime(created_at) DESC
       LIMIT 30`,
      [userId]
    );
    return rows;
  },
};

module.exports = AuthSession;
