const { avatarPublicPath } = require("./avatarPublicUrl");

/** Objet utilisateur sérialisé pour le front (avec URL publique d’avatar). */
function publicUser(row) {
  if (!row) return null;
  const url = avatarPublicPath(row.avatar_filename);
  return {
    id: row.id,
    nom: row.nom,
    email: row.email,
    role: row.role || "user",
    bio: row.bio ?? null,
    credibility_score: row.credibility_score ?? 0,
    city: row.city ?? null,
    country: row.country ?? null,
    expertise_level: row.expertise_level ?? null,
    badge_label: row.badge_label ?? null,
    avatar_filename: row.avatar_filename ?? null,
    avatar_url: url,
  };
}

function publicMemberProfile(row) {
  if (!row) return null;
  const url = avatarPublicPath(row.avatar_filename);
  return {
    id: row.id,
    nom: row.nom,
    bio: row.bio ?? null,
    credibility_score: row.credibility_score ?? 0,
    city: row.city ?? null,
    country: row.country ?? null,
    expertise_level: row.expertise_level ?? null,
    badge_label: row.badge_label ?? null,
    avatar_filename: row.avatar_filename ?? null,
    avatar_url: url,
  };
}

module.exports = { publicUser, publicMemberProfile };
