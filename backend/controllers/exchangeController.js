const db = require("../config/db");
const Notification = require("../models/notificationModel");

exports.createExchange = async (req, res) => {
  try {
    const { receiver_id, offered_skill_id, requested_skill_id, learning_objective, estimated_duration_weeks } =
      req.body;

    const rid = Number(receiver_id);
    const oid = Number(offered_skill_id);
    const rqid = Number(requested_skill_id);
    if (![rid, oid, rqid].every((n) => Number.isFinite(n) && n > 0)) {
      return res.status(400).json({ message: "IDs receveur et competences invalides." });
    }
    if (rid === Number(req.user.id)) {
      return res.status(400).json({ message: "Impossible de s echanger avec soi meme." });
    }

    const [ins] = await db.execute(
      `INSERT INTO exchanges
       (proposer_id, receiver_id, offered_skill_id, requested_skill_id, learning_objective, estimated_duration_weeks)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        rid,
        oid,
        rqid,
        learning_objective || "",
        Number(estimated_duration_weeks || 1),
      ]
    );
    const exchangeId = ins.insertId;
    try {
      await Notification.insert({
        user_id: rid,
        type: "exchange_request",
        related_user_id: req.user.id,
        target_id: exchangeId ? String(exchangeId) : null,
      });
    } catch (e) {
      console.warn("[exchange/create] notification:", e.message);
    }
    return res.status(201).json({ message: "Proposition d'echange envoyee", exchange_id: exchangeId });

  } catch (error) {
    return res.status(500).json({ message: "Erreur creation echange" });
  }
};

exports.updateExchangeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await db.execute("UPDATE exchanges SET status = ? WHERE id = ? AND receiver_id = ?", [
      status,
      req.params.id,
      req.user.id,
    ]);
    return res.json({ message: "Statut mis a jour" });
  } catch (error) {
    return res.status(500).json({ message: "Erreur mise a jour echange" });
  }
};

exports.listMyExchanges = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT e.*, p.nom AS proposer_nom, r.nom AS receiver_nom
       FROM exchanges e
       JOIN users p ON p.id = e.proposer_id
       JOIN users r ON r.id = e.receiver_id
       WHERE e.proposer_id = ? OR e.receiver_id = ?
       ORDER BY e.created_at DESC`,
      [req.user.id, req.user.id]
    );
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Erreur lecture echanges" });
  }
};

exports.createSession = async (req, res) => {
  try {
    const { step_number, title, session_date } = req.body;
    await db.execute(
      "INSERT INTO sessions (exchange_id, step_number, title, session_date) VALUES (?, ?, ?, ?)",
      [req.params.exchangeId, Number(step_number || 1), title, session_date]
    );
    return res.status(201).json({ message: "Session planifiee" });
  } catch (error) {
    return res.status(500).json({ message: "Erreur planification session" });
  }
};

exports.mySessions = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT s.*, e.proposer_id, e.receiver_id, e.learning_objective
       FROM sessions s
       JOIN exchanges e ON e.id = s.exchange_id
       WHERE e.proposer_id = ? OR e.receiver_id = ?
       ORDER BY s.session_date ASC`,
      [req.user.id, req.user.id]
    );
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Erreur sessions" });
  }
};
