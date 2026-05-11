const jwt = require("jsonwebtoken");
const AuthSession = require("../models/authSessionModel");

module.exports = async (req, res, next) => {
  const authorization = req.header("Authorization");
  if (!authorization) {
    return res.status(401).json({ message: "Token manquant" });
  }
  try {
    const token = authorization.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "skillswap-secret");
    if (!decoded.jti) {
      return res.status(401).json({ message: "Session expirée, reconnectez-vous." });
    }
    const active = await AuthSession.isActive(decoded.id, decoded.jti);
    if (!active) {
      return res.status(401).json({ message: "Session révoquée ou expirée." });
    }
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalide" });
  }
};
