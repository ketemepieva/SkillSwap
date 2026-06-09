/** Chemin après connexion : destination demandée ou tableau de bord personnel. */
export function resolvePostAuthPath(from) {
  if (typeof from === "string" && from.startsWith("/app")) return from;
  return "/app/dashboard";
}

export function isAuthPath(pathname) {
  return pathname === "/login" || pathname === "/inscription";
}
