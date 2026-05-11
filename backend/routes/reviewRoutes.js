const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const reviewController = require("../controllers/reviewController");

const router = express.Router();

router.post("/", authMiddleware, reviewController.addReview);
router.get("/user/:userId", authMiddleware, reviewController.reviewsByUser);

module.exports = router;
