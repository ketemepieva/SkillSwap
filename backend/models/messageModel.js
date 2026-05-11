const db = require("../config/db");

const Message = {
  send: async ({ from_user_id, to_user_id, body }) => {
    const text = String(body || "").trim();
    if (!text) {
      const err = new Error("empty_body");
      err.code = "EMPTY";
      throw err;
    }
    const [r] = await db.execute(
      "INSERT INTO messages (from_user_id, to_user_id, body) VALUES (?, ?, ?)",
      [from_user_id, to_user_id, text]
    );
    return r.insertId;
  },

  /**
   * Dernières conversations : un rang par interlocuteur + compteur non lus (messages entrants).
   */
  listConversations: async (userId) => {
    const uid = Number(userId);
    const [rows] = await db.execute(
      `WITH ranked AS (
         SELECT
           m.id,
           m.from_user_id,
           m.to_user_id,
           m.body,
           m.created_at,
           m.read_at,
           CASE WHEN m.from_user_id = ? THEN m.to_user_id ELSE m.from_user_id END AS peer_id,
           ROW_NUMBER() OVER (
             PARTITION BY CASE WHEN m.from_user_id = ? THEN m.to_user_id ELSE m.from_user_id END
             ORDER BY m.created_at DESC
           ) AS rn
         FROM messages m
         WHERE m.from_user_id = ? OR m.to_user_id = ?
       )
       SELECT r.peer_id AS peer_user_id,
              u.nom AS peer_nom,
              u.avatar_filename AS peer_avatar_filename,
              r.body AS last_body,
              r.created_at AS last_at,
              COALESCE(
                (SELECT COUNT(*) FROM messages m2
                 WHERE m2.to_user_id = ?
                   AND m2.from_user_id = r.peer_id
                   AND m2.read_at IS NULL),
                0
              ) AS unread_count
       FROM ranked r
       JOIN users u ON u.id = r.peer_id
       WHERE r.rn = 1
       ORDER BY r.created_at DESC`,
      [uid, uid, uid, uid, uid]
    );
    return rows;
  },

  getThread: async (myUserId, peerUserId) => {
    const me = Number(myUserId);
    const peer = Number(peerUserId);
    const [rows] = await db.execute(
      `SELECT id, from_user_id, to_user_id, body, created_at, read_at
       FROM messages
       WHERE (from_user_id = ? AND to_user_id = ?)
          OR (from_user_id = ? AND to_user_id = ?)
       ORDER BY created_at ASC`,
      [me, peer, peer, me]
    );
    return rows;
  },

  markIncomingRead: async (myUserId, peerUserId) => {
    const now = new Date().toISOString();
    await db.execute(
      "UPDATE messages SET read_at = ? WHERE to_user_id = ? AND from_user_id = ? AND read_at IS NULL",
      [now, Number(myUserId), Number(peerUserId)]
    );
  },
};

module.exports = Message;
