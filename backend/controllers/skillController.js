const Skill = require("../models/skillModel");

exports.addSkill = async (req, res) => {
  try {
    const { nom_competence, categorie, niveau, rarete_weight, is_offer } = req.body;
    if (!nom_competence || !categorie || !niveau) {
      return res.status(400).json({ message: "nom_competence, categorie et niveau sont requis" });
    }

    await Skill.add({
      nom_competence,
      categorie,
      niveau,
      rarete_weight: Number(rarete_weight || 1),
      is_offer: Number(is_offer ?? 1),
      user_id: req.user.id,
    });
    return res.status(201).json({ message: "Competence ajoutee" });
  } catch (error) {
    return res.status(500).json({ message: "Erreur ajout competence" });
  }
};

exports.getUserSkills = async (req, res) => {
  try {
    const skills = await Skill.findByUserId(req.user.id);
    return res.json(skills);
  } catch (error) {
    return res.status(500).json({ message: "Erreur lecture competences" });
  }
};

exports.searchSkills = async (req, res) => {
  try {
    const skills = await Skill.search(req.query, req.user.id);
    return res.json(skills);
  } catch (error) {
    return res.status(500).json({ message: "Erreur recherche competences" });
  }
};

exports.deleteSkill = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      return res.status(400).json({ message: "Identifiant invalide" });
    }
    const ok = await Skill.deleteByIdForUser(id, req.user.id);
    if (!ok) return res.status(404).json({ message: "Competence introuvable" });
    return res.json({ message: "Competence supprimee" });
  } catch (error) {
    return res.status(500).json({ message: "Erreur suppression competence" });
  }
};