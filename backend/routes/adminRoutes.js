const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const adminController = require("../controllers/adminController");

const router = express.Router();

router.get("/dashboard", authMiddleware, adminMiddleware, adminController.dashboard);
router.get("/users", authMiddleware, adminMiddleware, adminController.listUsers);
router.patch("/users/:id/role", authMiddleware, adminMiddleware, adminController.updateUserRole);

module.exports = router;
