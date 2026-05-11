const db = require("../config/db");

exports.dashboard = async (req, res) => {
  try {
    const [uRows] = await db.execute("SELECT COUNT(*) AS total_users FROM users");
    const [sRows] = await db.execute("SELECT COUNT(*) AS total_sessions FROM sessions");
    const [rRows] = await db.execute("SELECT COUNT(*) AS total_reviews FROM reviews");
    return res.json({
      total_users: uRows[0]?.total_users ?? 0,
      total_sessions: sRows[0]?.total_sessions ?? 0,
      total_reviews: rRows[0]?.total_reviews ?? 0,
    });
  } catch (error) {
    return res.status(500).json({ message: "Erreur tableau de bord" });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT id, nom, email, role, credibility_score, created_at FROM users ORDER BY created_at DESC"
    );
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Erreur liste utilisateurs" });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    await db.execute("UPDATE users SET role = ? WHERE id = ?", [req.body.role, req.params.id]);
    return res.json({ message: "Role mis a jour" });
  } catch (error) {
    return res.status(500).json({ message: "Erreur mise a jour role" });
  }
};
