import { API_BASE } from "../api/client.js";

/** Préfixe une URL relative d’API média (avatars) pour l’attribut `src` en dev/production. */
export function mediaUrl(publicPath) {
  if (!publicPath || typeof publicPath !== "string") return null;
  if (/^https?:\/\//i.test(publicPath)) return publicPath;
  const p = publicPath.startsWith("/") ? publicPath : `/${publicPath}`;
  return `${API_BASE}${p}`;
}
