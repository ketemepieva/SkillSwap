const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const messageController = require("../controllers/messageController");

const router = express.Router();

router.get("/conversations", authMiddleware, messageController.listConversations);
router.get("/with/:peerUserId", authMiddleware, messageController.getThread);
router.post("/send", authMiddleware, messageController.send);

module.exports = router;
