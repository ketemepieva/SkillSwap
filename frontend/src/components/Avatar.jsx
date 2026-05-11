import { mediaUrl } from "../utils/mediaUrl.js";

function initialsFromNom(nom) {
  if (!nom || typeof nom !== "string") return "?";
  const p = nom.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

const sizeMap = {
  sm: "size-8 text-[11px] rounded-xl",
  md: "size-10 text-xs rounded-2xl",
  lg: "size-12 text-sm rounded-2xl",
  xl: "size-16 text-lg rounded-3xl",
};

/**
 * @param {{ nom?: string|null, avatarUrl?: string|null, label?: string, size?: keyof typeof sizeMap, className?: string }} props
 */
export function Avatar({ nom, avatarUrl, label, size = "md", className = "" }) {
  const sizeClass = sizeMap[size] ?? sizeMap.md;
  const src = mediaUrl(avatarUrl);
  const letter = initialsFromNom(nom);

  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden bg-gradient-to-br from-[var(--accent)]/90 to-[var(--indigo)]/85 font-bold leading-none text-white shadow-[var(--shadow-soft)] ${sizeClass} ${className}`.trim()}
      role="img"
      aria-label={label || (nom ? `Avatar de ${nom}` : "Avatar")}
    >
      {src ? (
        <img src={src} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" />
      ) : (
        <span className="tabular-nums">{letter}</span>
      )}
    </span>
  );
}
