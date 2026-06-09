require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const authController = require("./controllers/authController");
const authRoutes = require("./routes/authRoutes");
const skillRoutes = require("./routes/skillRoutes");
const profileRoutes = require("./routes/profileRoutes");
const exchangeRoutes = require("./routes/exchangeRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const messageRoutes = require("./routes/messageRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const tutoringRoutes = require("./routes/tutoringRoutes");
const { startTutoringScheduler } = require("./services/tutoringScheduler");

const app = express();
app.disable("x-powered-by");
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const uploadsRoot = path.join(__dirname, "uploads");
const avatarsDir = path.join(uploadsRoot, "avatars");
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}
app.use(
  "/uploads",
  express.static(uploadsRoot, {
    maxAge: process.env.NODE_ENV === "production" ? "7d" : 0,
  })
);

/** Journal HTTP (méthode, URL → statut, durée) */
function requestLogger(req, res, next) {
  const started = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - started;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${ms} ms)`);
  });
  next();
}
app.use(requestLogger);

app.get("/", (req, res) => {
  res.json({
    message: "SkillSwap API opérationnelle",
    loginPost: "/api/login",
    legacyAuth: "/api/auth/login",
  });
});

/** Connexion au format minimal : POST JSON { email, password } */
app.post("/api/login", authController.login);
app.post("/api/register", authController.register);

/* Alias racine POST /login (anciens clients) */
app.post("/login", authController.login);

app.use("/api/auth", authRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/exchanges", exchangeRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/tutoring", tutoringRoutes);

/* Fallback 404 JSON (évite réponses HTML inattendues) */
app.use((req, res) => {
  res.status(404).json({ message: `Route introuvable : ${req.method} ${req.originalUrl}` });
});

/* Erreurs d’upload (multer) */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Fichier trop volumineux (2 Mo maximum)."
        : "Erreur lors de l’envoi du fichier.";
    return res.status(400).json({ message });
  }
  next(err);
});

/* Gestionnaire d’erreurs central (évite plantages silencieux) */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error(`[${new Date().toISOString()}] Erreur non gérée sur ${req.method} ${req.originalUrl}:`, err);
  if (res.headersSent) return;
  if (typeof err.message === "string" && err.message.includes("image")) {
    return res.status(400).json({ message: err.message });
  }
  res.status(500).json({ message: "Erreur interne du serveur." });
});

const PORT = Number(process.env.PORT || 5000);
const HOST = process.env.HOST || "0.0.0.0";

startTutoringScheduler();

const server = app.listen(PORT, HOST, () => {
  console.log(`[SkillSwap API] Listening on http://${HOST}:${PORT}`);
  console.log(
    `[SkillSwap API] Connexion : POST http://localhost:${PORT}/api/login (JSON { email, password }) · alias /api/auth/login · POST /login`
  );
});

server.on("error", (err) => {
  console.error("[SkillSwap API] Impossible d’écouter sur le port", PORT, "-", err.message);
  if (err.code === "EADDRINUSE") {
    console.error(`→ Une autre app utilise déjà le port ${PORT}. Changez PORT dans backend/.env ou arrêtez l’autre processus.`);
  }
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("[SkillSwap API] Promesse non gérée :", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[SkillSwap API] Exception non capturée :", err);
  process.exit(1);
});