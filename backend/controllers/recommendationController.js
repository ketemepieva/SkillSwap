const db = require("../config/db");

exports.getRecommendations = async (req, res) => {
  try {
    const [owned] = await db.execute("SELECT categorie FROM skills WHERE user_id = ?", [req.user.id]);
    const ownedCategories = new Set(owned.map((s) => s.categorie));

    const [rows] = await db.execute(
      `SELECT s.categorie, s.nom_competence, COUNT(*) AS demand_count
       FROM skills s
       WHERE s.is_offer = 1 AND s.user_id <> ?
       GROUP BY s.categorie, s.nom_competence
       ORDER BY demand_count DESC
       LIMIT 15`,
      [req.user.id]
    );

    const suggestions = rows.filter((item) => !ownedCategories.has(item.categorie)).slice(0, 6);
    return res.json(suggestions);
  } catch (error) {
    return res.status(500).json({ message: "Erreur recommandations" });
  }
};
