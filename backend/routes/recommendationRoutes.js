const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const recommendationController = require("../controllers/recommendationController");

const router = express.Router();

router.get("/", authMiddleware, recommendationController.getRecommendations);

module.exports = router;
