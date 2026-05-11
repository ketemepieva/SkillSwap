const db = require("../config/db");

exports.addReview = async (req, res) => {
  try {
    const { session_id, reviewee_id, rating, comment, badge } = req.body;
    const [sessions] = await db.execute("SELECT * FROM sessions WHERE id = ?", [session_id]);
    if (!sessions.length || sessions[0].status !== "done") {
      return res.status(400).json({ message: "Evaluation possible uniquement apres session terminee" });
    }

    await db.execute(
      `INSERT INTO reviews (session_id, reviewer_id, reviewee_id, rating, comment, badge)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [session_id, req.user.id, reviewee_id, Number(rating), comment || "", badge || null]
    );

    await db.execute(
      `UPDATE users u
       SET credibility_score = (
         SELECT COALESCE(AVG(r.rating) * 20, 0) FROM reviews r WHERE r.reviewee_id = u.id
       )
       WHERE u.id = ?`,
      [reviewee_id]
    );

    return res.status(201).json({ message: "Evaluation enregistree" });
  } catch (error) {
    return res.status(500).json({ message: "Erreur evaluation" });
  }
};

exports.reviewsByUser = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT r.*, u.nom AS reviewer_name
       FROM reviews r
       JOIN users u ON u.id = r.reviewer_id
       WHERE r.reviewee_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.userId]
    );
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Erreur lecture avis" });
  }
};
