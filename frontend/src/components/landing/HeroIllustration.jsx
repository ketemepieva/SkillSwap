/**
 * Illustration vectorielle légère (skills / réseau) — aucune dépendance image externe.
 * Taille responsive : réduite sur mobile, plus grande à partir de sm / lg.
 */
export function HeroIllustration({ className = "" }) {
  return (
    <svg
      className={`swap-hero-illustration mx-auto h-auto w-[min(100%,17rem)] max-w-full drop-shadow-[0_16px_40px_rgba(99,102,241,0.3)] sm:w-[min(100%,22rem)] md:w-[min(100%,26rem)] lg:max-w-lg lg:w-full ${className}`}
      viewBox="0 0 520 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Échange de compétences entre profils connectés"
    >
      <defs>
        <linearGradient id="hg1" x1="60" y1="40" x2="480" y2="340" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8b5cf6" />
          <stop offset="0.45" stopColor="#6366f1" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id="hg2" x1="120" y1="320" x2="440" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a78bfa" stopOpacity="0.9" />
          <stop offset="1" stopColor="#38bdf8" stopOpacity="0.35" />
        </linearGradient>
        <radialGradient id="hgGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(280 170) rotate(90) scale(200 260)">
          <stop stopColor="#c084fc" stopOpacity="0.65" />
          <stop offset="1" stopColor="#0ea5e9" stopOpacity="0" />
        </radialGradient>
        <filter id="blurSoft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
      </defs>

      <rect x="32" y="28" width="456" height="324" rx="36" fill="url(#hg2)" opacity="0.35" />
      <ellipse cx="280" cy="190" rx="220" ry="170" fill="url(#hgGlow)" filter="url(#blurSoft)" />

      <g opacity="0.95">
        <path
          d="M220 205 C 285 155, 320 235, 380 165"
          stroke="url(#hg1)"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.55"
        />
        <circle cx="220" cy="205" r="10" fill="#e879f9" opacity="0.9" />
        <circle cx="380" cy="165" r="10" fill="#22d3ee" opacity="0.95" />

        <rect x="90" y="120" width="150" height="110" rx="22" stroke="url(#hg1)" strokeWidth="3" fill="rgba(15,23,42,0.35)" />
        <rect x="280" y="70" width="150" height="110" rx="22" stroke="url(#hg1)" strokeWidth="3" fill="rgba(15,23,42,0.28)" />
        <rect x="240" y="210" width="170" height="120" rx="22" stroke="url(#hg1)" strokeWidth="3" fill="rgba(15,23,42,0.32)" />

        <circle cx="130" cy="158" r="22" fill="rgba(236,233,254,0.22)" stroke="rgba(236,233,254,0.55)" strokeWidth="2" />
        <circle cx="330" cy="108" r="22" fill="rgba(224,231,255,0.2)" stroke="rgba(167,139,250,0.55)" strokeWidth="2" />
        <circle cx="300" cy="252" r="24" fill="rgba(207,250,254,0.22)" stroke="rgba(103,232,249,0.55)" strokeWidth="2" />

        <rect x="108" y="192" width="78" height="10" rx="5" fill="rgba(248,250,252,0.85)" opacity="0.75" />
        <rect x="108" y="206" width="52" height="10" rx="5" fill="rgba(226,232,240,0.45)" />

        <rect x="296" y="142" width="88" height="10" rx="5" fill="rgba(248,250,252,0.85)" opacity="0.75" />
        <rect x="296" y="156" width="62" height="10" rx="5" fill="rgba(226,232,240,0.45)" />

        <rect x="268" y="292" width="104" height="10" rx="5" fill="rgba(248,250,252,0.85)" opacity="0.75" />
        <rect x="268" y="306" width="72" height="10" rx="5" fill="rgba(226,232,240,0.45)" />

        <path
          d="M196 296h48M220 284l12 12-12 12M324 296h48M376 296l-12-12 12-12"
          stroke="rgba(226,232,240,0.75)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
