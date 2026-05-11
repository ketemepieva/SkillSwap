/**
 * Illustration vectorielle décorative (léger SVG inline) pour l'écran d'authentification.
 */
export function AuthHeroIllustration() {
  return (
    <svg
      className="auth-hero-art"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 360 220"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="auth-stroke-flow" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#5eead4" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#818cf8" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="auth-fill-node" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(94,234,212,0.15)" />
          <stop offset="100%" stopColor="rgba(129,140,248,0.2)" />
        </linearGradient>
      </defs>

      {/* Fond pointillé discret */}
      <circle cx="320" cy="40" r="2" fill="rgba(255,255,255,0.15)" />
      <circle cx="40" cy="190" r="2" fill="rgba(255,255,255,0.12)" />
      <circle cx="180" cy="26" r="1.5" fill="rgba(94,234,212,0.5)" />

      {/* Nœuds (deux membres qui échangent une compétence) */}
      <g stroke="url(#auth-stroke-flow)" strokeWidth="1.75" opacity="0.88">
        <circle cx="86" cy="96" r="46" strokeOpacity="1" />
        <circle cx="274" cy="96" r="46" strokeOpacity="1" />

        {/* Arc lien principal */}
        <path
          d="M138 104 C 174 154, 226 154, 262 104"
          strokeDasharray="5 10"
          strokeLinecap="round"
          opacity="0.75"
        />
        <circle cx="200" cy="136" r="5" fill="rgba(253,224,71,0.35)" stroke="rgba(253,224,71,0.8)" />

        {/* Cercles satellites (talents possibles) */}
        <circle cx="86" cy="174" r="18" opacity="0.55" strokeDasharray="4 8" />
        <circle cx="274" cy="174" r="18" opacity="0.55" strokeDasharray="4 8" />

        {/* Petites connexions secondaires */}
        <path d="M86 146 L86 168" opacity="0.45" strokeLinecap="round" />
        <path d="M274 146 L274 168" opacity="0.45" strokeLinecap="round" />
      </g>

      {/* Capsules représentant des briques du savoir échangées */}
      <path
        d="M150 118 h60 a8 8 0 008-8 v-14 a8 8 0 00-8-8 h-52 a8 8 0 00-8 8 v14 a8 8 0 008 8z"
        fill="url(#auth-fill-node)"
        stroke="url(#auth-stroke-flow)"
        strokeWidth="1.4"
      />
      <path
        d="M174 126 h12"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <text
        fill="rgba(226,232,240,0.75)"
        fontFamily="inherit"
        fontSize="11"
        fontWeight={600}
        letterSpacing={0.8}
      >
        <tspan x="158" y="112">
          SWAP
        </tspan>
      </text>

      {/* Flèches directionnelles légères */}
      <path
        d="M122 132 L132 138 M122 132 L129 141"
        stroke="#5eead4"
        strokeOpacity="0.7"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M238 132 L228 138 M238 132 L231 141"
        stroke="#818cf8"
        strokeOpacity="0.7"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
