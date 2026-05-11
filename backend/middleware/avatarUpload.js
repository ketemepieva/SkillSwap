const path = require("path");
const multer = require("multer");

const avatarsDir = path.join(__dirname, "..", "uploads", "avatars");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    const safeExt = allowed.includes(ext) ? ext : ".jpg";
    cb(null, `${req.user.id}-${Date.now()}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) return cb(null, true);
    cb(new Error("Fichier image requis (JPEG, PNG, WebP ou GIF)."));
  },
});

module.exports = { upload, avatarsDir };
