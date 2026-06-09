const db = require("../config/db");

const Notification = {
  insert: async ({ user_id, type, title, body, related_user_id, target_id }) => {
    await db.execute(
      `INSERT INTO notifications (user_id, type, title, body, related_user_id, target_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, type, title ?? null, body ?? null, related_user_id ?? null, target_id ?? null]
    );
  },

  listForUser: async (userId, limit = 80) => {
    const lim = Math.min(Math.max(Number(limit) || 80, 1), 200);
    const [rows] = await db.execute(
      `SELECT n.id, n.user_id, n.type, n.title, n.body, n.related_user_id, n.target_id, n.read, n.created_at,
              u.nom AS related_user_nom,
              u.avatar_filename AS related_user_avatar_filename
       FROM notifications n
       LEFT JOIN users u ON u.id = n.related_user_id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT ?`,
      [userId, lim]
    );
    return rows;
  },

  countUnread: async (userId) => {
    const [rows] = await db.execute(
      "SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND read = 0",
      [userId]
    );
    return Number(rows?.[0]?.count) || 0;
  },

  markRead: async (notificationId, ownerUserId) => {
    const [r] = await db.execute(
      "UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?",
      [notificationId, ownerUserId]
    );
    return r.affectedRows > 0;
  },

  markAllRead: async (ownerUserId) => {
    await db.execute("UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0", [ownerUserId]);
  },
};

module.exports = Notification;
