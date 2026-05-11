const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", authMiddleware, authController.me);
router.post("/logout", authMiddleware, authController.logout);
router.get("/sessions", authMiddleware, authController.listSessions);
router.delete("/sessions/:id", authMiddleware, authController.revokeSession);
router.post("/sessions/revoke-others", authMiddleware, authController.revokeOtherSessions);
router.patch("/account", authMiddleware, authController.updateAccount);

module.exports = router;
