/** Affichage relatif simple (FR) depuis une date ISO stockée en base. */
export function formatRelativeTimeFr(iso) {
  if (!iso || typeof iso !== "string") return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const sec = Math.floor((Date.now() - t) / 1000);
  if (sec < 45) return "À l'instant";
  if (sec < 3600) return `Il y a ${Math.floor(sec / 60)} min`;
  if (sec < 86400) return `Il y a ${Math.floor(sec / 3600)} h`;
  if (sec < 604800) return `Il y a ${Math.floor(sec / 86400)} j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}
