const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const exchangeController = require("../controllers/exchangeController");

const router = express.Router();

router.post("/", authMiddleware, exchangeController.createExchange);
router.get("/mine", authMiddleware, exchangeController.listMyExchanges);
router.patch("/:id/status", authMiddleware, exchangeController.updateExchangeStatus);
router.post("/:exchangeId/sessions", authMiddleware, exchangeController.createSession);
router.get("/sessions/mine", authMiddleware, exchangeController.mySessions);

module.exports = router;
