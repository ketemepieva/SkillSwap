const Notification = require("../models/notificationModel");
const { avatarPublicPath } = require("../utils/avatarPublicUrl");

exports.list = async (req, res) => {
  try {
    const items = await Notification.listForUser(req.user.id);
    const mapped = items.map((n) => ({
      ...n,
      related_user_avatar_url: avatarPublicPath(n.related_user_avatar_filename),
    }));
    return res.json(mapped);
  } catch (error) {
    return res.status(500).json({ message: "Erreur notifications" });
  }
};

exports.markRead = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Identifiant invalide" });
    }
    const ok = await Notification.markRead(id, req.user.id);
    if (!ok) return res.status(404).json({ message: "Notification introuvable" });
    return res.json({ message: "OK" });
  } catch (error) {
    return res.status(500).json({ message: "Erreur mise à jour notification" });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await Notification.markAllRead(req.user.id);
    return res.json({ message: "OK" });
  } catch (error) {
    return res.status(500).json({ message: "Erreur" });
  }
};
