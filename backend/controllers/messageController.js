const Message = require("../models/messageModel");
const Notification = require("../models/notificationModel");
const User = require("../models/userModel");
const { publicMemberProfile } = require("../utils/userDto");
const { avatarPublicPath } = require("../utils/avatarPublicUrl");

exports.listConversations = async (req, res) => {
  try {
    const rows = await Message.listConversations(req.user.id);
    const mapped = rows.map((r) => ({
      ...r,
      peer_avatar_url: avatarPublicPath(r.peer_avatar_filename),
    }));
    return res.json(mapped);
  } catch (error) {
    return res.status(500).json({ message: "Erreur liste conversations" });
  }
};

exports.getThread = async (req, res) => {
  try {
    const peerId = Number(req.params.peerUserId);
    if (!Number.isFinite(peerId) || peerId < 1) {
      return res.status(400).json({ message: "Interlocuteur invalide" });
    }
    if (peerId === Number(req.user.id)) {
      return res.status(400).json({ message: "Impossible de chatter avec vous-même" });
    }
    await Message.markIncomingRead(req.user.id, peerId);
    const messages = await Message.getThread(req.user.id, peerId);
    const peerRow = (await User.findPublicById(peerId)) || null;
    const peer = peerRow ? publicMemberProfile(peerRow) : null;
    return res.json({ peer, messages });
  } catch (error) {
    return res.status(500).json({ message: "Erreur lecture messages" });
  }
};

exports.send = async (req, res) => {
  try {
    const peerId = Number(req.body.to_user_id);
    const { body } = req.body;
    if (!Number.isFinite(peerId) || peerId < 1) {
      return res.status(400).json({ message: "Destinataire invalide" });
    }
    if (peerId === Number(req.user.id)) {
      return res.status(400).json({ message: "Impossible de vous envoyer un message" });
    }
    await Message.send({ from_user_id: req.user.id, to_user_id: peerId, body });
    try {
      await Notification.insert({
        user_id: peerId,
        type: "message",
        related_user_id: req.user.id,
        target_id: String(req.user.id),
      });
    } catch (e) {
      console.warn("[messages/send] notification:", e.message);
    }
    return res.status(201).json({ message: "Message envoye" });
  } catch (error) {
    if (error.code === "EMPTY") {
      return res.status(400).json({ message: "Message vide" });
    }
    return res.status(500).json({ message: "Erreur envoi message" });
  }
};
