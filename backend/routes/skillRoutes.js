const express = require("express");
const router = express.Router();
const skillController = require("../controllers/skillController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/add", authMiddleware, skillController.addSkill);
router.get("/my-skills", authMiddleware, skillController.getUserSkills);
router.get("/search", authMiddleware, skillController.searchSkills);
router.delete("/:id", authMiddleware, skillController.deleteSkill);

module.exports = router;