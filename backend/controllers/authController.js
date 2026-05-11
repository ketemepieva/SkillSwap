const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const AuthSession = require("../models/authSessionModel");
const { publicUser } = require("../utils/userDto");

const jwtSecret = () => process.env.JWT_SECRET || "skillswap-secret";

function clientMeta(req) {
  const xf = req.headers["x-forwarded-for"];
  const ip =
    (typeof xf === "string" && xf.split(",")[0].trim()) || (req.ip ? String(req.ip) : "") || "";
  const ua = req.get("user-agent") || "";
  return { ip: ip.slice(0, 200), user_agent: ua.slice(0, 500) };
}

async function issueSessionToken(userRow, req) {
  const jti = crypto.randomBytes(24).toString("hex");
  const { ip, user_agent } = clientMeta(req);
  await AuthSession.create({ user_id: userRow.id, jti, ip, user_agent });
  return jwt.sign({ id: userRow.id, role: userRow.role || "user", jti }, jwtSecret(), { expiresIn: "7d" });
}

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }
    return res.json({
      user: publicUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Erreur lecture session" });
  }
};

exports.register = async (req, res) => {
  try {
    const { nom, email, password } = req.body;
    if (!nom || !email || !password) {
      return res.status(400).json({ message: "Nom, email et mot de passe requis." });
    }

    const userExists = await User.findByEmail(email);
    if (userExists) {
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userId = await User.create({ nom, email, password: hashedPassword });
    const token = await issueSessionToken(
      { id: userId, nom, email, password: hashedPassword, role: "user" },
      req
    );
    const fresh = await User.findById(userId);

    return res.status(201).json({
      message: "Utilisateur cree avec succes",
      token,
      user: publicUser(fresh),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis." });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "Aucun compte avec cet email." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Mot de passe incorrect." });
    }

    const token = await issueSessionToken(user, req);
    const slim = await User.findById(user.id);

    return res.json({
      token,
      user: publicUser(slim || user),
    });
  } catch (error) {
    console.error("[auth/login]", error);
    return res.status(500).json({ message: "Erreur serveur lors de la connexion." });
  }
};

exports.logout = async (req, res) => {
  try {
    await AuthSession.revokeByJti(req.user.jti, req.user.id);
    return res.json({ message: "Deconnecte" });
  } catch (error) {
    return res.status(500).json({ message: "Erreur deconnexion" });
  }
};

exports.listSessions = async (req, res) => {
  try {
    const rows = await AuthSession.listForUser(req.user.id);
    const out = rows.map((r) => ({
      id: r.id,
      created_at: r.created_at,
      ip: r.ip,
      user_agent: r.user_agent,
      revoked: r.revoked,
      is_current: r.jti === req.user.jti,
    }));
    return res.json(out);
  } catch (error) {
    return res.status(500).json({ message: "Erreur sessions" });
  }
};

exports.revokeSession = async (req, res) => {
  try {
    const sid = Number(req.params.id);
    if (!Number.isFinite(sid)) return res.status(400).json({ message: "ID invalide" });
    const db = require("../config/db");
    const [rows] = await db.execute("SELECT jti FROM auth_sessions WHERE id = ? AND user_id = ?", [
      sid,
      req.user.id,
    ]);
    const row = rows[0];
    if (!row) return res.status(404).json({ message: "Session introuvable" });
    if (row.jti === req.user.jti) {
      return res.status(400).json({
        message: "Utilisez Déconnexion pour terminer cette session sur cet appareil.",
      });
    }
    const ok = await AuthSession.revokeById(sid, req.user.id);
    return ok ? res.json({ message: "Session revoquee" }) : res.status(404).json({ message: "Non trouvee" });
  } catch (error) {
    return res.status(500).json({ message: "Erreur" });
  }
};

exports.revokeOtherSessions = async (req, res) => {
  try {
    await AuthSession.revokeOthers(req.user.id, req.user.jti);
    return res.json({ message: "Autres sessions fermees" });
  } catch (error) {
    return res.status(500).json({ message: "Erreur" });
  }
};

exports.updateAccount = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body || {};
    if (!currentPassword || typeof currentPassword !== "string") {
      return res.status(400).json({ message: "Mot de passe actuel requis." });
    }
    const user = await User.findByIdWithPassword(req.user.id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(401).json({ message: "Mot de passe actuel incorrect." });
    }

    if (email !== undefined && email !== user.email) {
      const trimmed = String(email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        return res.status(400).json({ message: "Adresse email invalide." });
      }
      const taken = await User.emailTakenByOther(trimmed, req.user.id);
      if (taken) return res.status(400).json({ message: "Cet email est deja utilise." });
      await User.updateEmail(req.user.id, trimmed);
    }

    if (newPassword !== undefined && String(newPassword).length > 0) {
      if (String(newPassword).length < 6) {
        return res.status(400).json({ message: "Le nouveau mot de passe doit faire au moins 6 caracteres." });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(String(newPassword), salt);
      await User.updatePassword(req.user.id, hashedPassword);
    }

    const fresh = await User.findById(req.user.id);
    return res.json({
      message: "Compte mis a jour",
      user: publicUser(fresh),
    });
  } catch (error) {
    console.error("[auth/account]", error);
    return res.status(500).json({ message: "Erreur mise a jour du compte" });
  }
};
