const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const tutoringController = require("../controllers/tutoringController");

const router = express.Router();

router.post("/start", authMiddleware, tutoringController.start);
router.post("/:id/accept", authMiddleware, tutoringController.accept);
router.post("/:id/decline", authMiddleware, tutoringController.decline);
router.post("/:id/duration", authMiddleware, tutoringController.setDuration);
router.post("/:id/review", authMiddleware, tutoringController.review);

router.get("/mine", authMiddleware, tutoringController.mine);
router.get("/with/:peerId", authMiddleware, tutoringController.withPeer);
router.get("/reviews/:userId", authMiddleware, tutoringController.reviewsForUser);

module.exports = router;
