import { useId } from "react";
import { Link } from "react-router-dom";

/** Slogan officiel */
export const SKILLSWAP_TAGLINE = "Apprendre. Partager. Grandir ensemble.";

const markSizes = {
  sm: "h-8 w-8 shrink-0 sm:h-9 sm:w-9",
  md: "h-9 w-9 shrink-0 sm:h-10 sm:w-10",
  lg: "h-10 w-10 shrink-0 sm:h-11 sm:w-11",
  xl: "h-11 w-11 shrink-0 sm:h-[3.25rem] sm:w-[3.25rem] md:h-14 md:w-14",
};

const wordSizes = {
  sm: "text-lg tracking-tight sm:text-xl",
  md: "text-xl tracking-tight sm:text-2xl",
  lg: "text-[1.35rem] tracking-tight sm:text-2xl md:text-[1.65rem]",
  xl: "text-[clamp(1.5rem,3.8vw,2.15rem)] leading-[1.08] tracking-tight sm:text-3xl md:text-[2.25rem]",
};

const sloganSizes = {
  sm: "text-[9px] sm:text-[10px]",
  md: "text-[10px] sm:text-[11px]",
  lg: "text-[10px] sm:text-xs",
  xl: "text-[10px] leading-snug sm:text-[11px] md:text-xs",
};

/**
 * Marque SVG (deux courbes / sens d’échange) — sans bitmap.
 */
export function SkillSwapMark({ className = "" }) {
  const uid = useId().replace(/:/g, "");
  const gBlue = `ssb-${uid}`;
  const gTeal = `sst-${uid}`;

  return (
    <svg
      className={`${className} [filter:drop-shadow(0_0_10px_rgba(59,130,246,0.28))]`.trim()}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id={gBlue} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#7dd3fc" />
          <stop offset="0.55" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#1e3a8a" />
        </linearGradient>
        <linearGradient id={gTeal} x1="1" y1="0" x2="0" y2="1">
          <stop stopColor="#99f6e4" />
          <stop offset="0.5" stopColor="#14b8a6" />
          <stop offset="1" stopColor="#0f766e" />
        </linearGradient>
      </defs>
      {/* Courbes d’échange (lisibles à toutes tailles) */}
      <path
        d="M9 34c2-15 13.5-22 26.5-18.5C38 16.5 41 20.5 41 25.5"
        stroke={`url(#${gBlue})`}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M39 14c-2 15-13.5 23-26.5 19.5C10 31.5 7 27.5 7 22.5"
        stroke={`url(#${gTeal})`}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** Duo typographique Skill / Swap */
function SkillSwapWordmark({ size = "sm", tone = "app" }) {
  const tw = wordSizes[size] ?? wordSizes.sm;

  const skill =
    tone === "landing" ? (
      <span className="text-[var(--swap-text)]">Skill</span>
    ) : tone === "auth" ? (
      <span className="text-white/95 [text-shadow:0_1px_18px_rgba(0,0,0,0.35)]">Skill</span>
    ) : (
      <span className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 bg-clip-text text-transparent dark:from-slate-100 dark:via-slate-50 dark:to-slate-200">
        Skill
      </span>
    );

  const swap =
    tone === "landing" ? (
      <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-500 bg-clip-text text-transparent">
        Swap
      </span>
    ) : tone === "auth" ? (
      <span className="bg-gradient-to-r from-teal-300 via-teal-200 to-cyan-200 bg-clip-text text-transparent [text-shadow:0_0_28px_rgba(45,212,191,0.35)]">
        Swap
      </span>
    ) : (
      <span className="bg-gradient-to-r from-teal-400 via-teal-500 to-emerald-600 bg-clip-text text-transparent [text-shadow:0_0_20px_rgba(20,184,166,0.2)]">
        Swap
      </span>
    );

  return (
    <span className={`logo-text inline-flex min-w-0 items-baseline gap-0 font-bold ${tw}`.trim()}>
      {skill}
      {swap}
    </span>
  );
}

/**
 * Identité native : marque SVG + « SkillSwap » + slogan optionnel (pas d’image).
 * @param {{
 *   size?: keyof typeof markSizes,
 *   tone?: "app" | "auth" | "landing",
 *   to?: string,
 *   className?: string,
 *   showSlogan?: boolean,
 *   sloganClassName?: string,
 * }} props
 */
export function Logo({
  size = "sm",
  tone = "app",
  to,
  className = "",
  showSlogan = false,
  sloganClassName = "",
}) {
  const mark = <SkillSwapMark className={markSizes[size] ?? markSizes.sm} />;
  const word = <SkillSwapWordmark size={size} tone={tone} />;

  const inner = (
    <span className="flex min-w-0 flex-col gap-1 sm:gap-1.5">
      <span className="flex min-w-0 items-center gap-2.5 sm:gap-3">
        {mark}
        {word}
      </span>
      {showSlogan ? (
        <p
          className={
            (sloganClassName ?? "").trim()
              ? `m-0 max-w-md ${sloganClassName}`.trim()
              : `m-0 max-w-md font-semibold uppercase leading-relaxed tracking-[0.14em] ${sloganSizes[size] ?? sloganSizes.sm} text-[var(--text-muted)] dark:text-slate-400`.trim()
          }
        >
          {SKILLSWAP_TAGLINE}
        </p>
      ) : null}
    </span>
  );

  const wrapClass = ["inline-flex min-w-0 text-inherit no-underline", to ? "" : "cursor-default", className]
    .filter(Boolean)
    .join(" ");

  if (to) {
    return (
      <Link to={to} className={wrapClass}>
        {inner}
      </Link>
    );
  }

  return <span className={wrapClass}>{inner}</span>;
}

/** Bloc carte auth : marque + slogan intégrés au flux. */
export function LogoLockup({
  size = "lg",
  tone = "app",
  to,
  className = "",
  sloganClassName = "auth-card-slogan",
}) {
  return (
    <Logo size={size} tone={tone} to={to} showSlogan className={className} sloganClassName={sloganClassName} />
  );
}
