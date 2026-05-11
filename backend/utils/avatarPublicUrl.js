/** Chemin URL public servi par Express.static (sans slash initial si besoin dans JSON). */
function avatarPublicPath(filename) {
  if (!filename || typeof filename !== "string") return null;
  const safe = filename.replace(/\\/g, "/").split("/").pop();
  if (!safe || safe.includes("..")) return null;
  return `/uploads/avatars/${safe}`;
}

module.exports = { avatarPublicPath };
