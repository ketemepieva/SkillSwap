const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { upload } = require("../middleware/avatarUpload");
const profileController = require("../controllers/profileController");

const router = express.Router();

router.patch("/me", authMiddleware, profileController.updateMe);
router.post(
  "/me/avatar",
  authMiddleware,
  upload.single("image"),
  profileController.uploadAvatar
);
router.delete("/me/avatar", authMiddleware, profileController.removeAvatar);
router.get("/browse", authMiddleware, profileController.browseMembers);
router.get("/categories", authMiddleware, profileController.listCategories);
router.get("/popular-skills", authMiddleware, profileController.popularSkills);
router.get("/member/:id", authMiddleware, profileController.getMemberProfile);
router.post("/member/:id/view", authMiddleware, profileController.recordProfileView);

router.get("/me", authMiddleware, profileController.me);
router.get("/search", authMiddleware, profileController.searchUsers);

module.exports = router;
