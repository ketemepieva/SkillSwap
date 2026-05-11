import { useEffect, useState } from "react";

const STORAGE_KEY = "skillswap-theme";

function readStored() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "auto") return v;
  } catch {
    /* ignore */
  }
  return "auto";
}

const MODES = ["auto", "light", "dark"];

/**
 * Bouton compact : cycle automatique · clair · sombre (même stockage que ThemeToggle global).
 */
export function LandingThemeIconButton({ className = "" }) {
  const [mode, setMode] = useState(readStored);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, [mode]);

  const cycle = () => {
    const i = MODES.indexOf(mode);
    setMode(MODES[(i + 1) % MODES.length]);
  };

  const label =
    mode === "auto" ? "Thème automatique (mobile clair / desktop sombre)" : mode === "light" ? "Thème clair" : "Thème sombre";

  return (
    <button
      type="button"
      onClick={cycle}
      title={label}
      aria-label={label}
      className={
        `inline-flex size-11 items-center justify-center rounded-xl border backdrop-blur-md transition hover:scale-[1.02] active:scale-[0.98] ` +
        `border-[var(--swap-glass-border)] bg-[var(--swap-glass)] text-[var(--swap-text)] shadow-[var(--swap-shadow-soft)] ` +
        className
      }
    >
      {mode === "light" ? <SunIcon /> : mode === "dark" ? <MoonIcon /> : <AutoIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 14.23A8.93 8.93 0 0 1 9.77 3a8.93 8.93 0 1 0 11.23 11.23Z"
      />
    </svg>
  );
}

function AutoIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M8 21h8" />
      <path strokeLinecap="round" d="M5 13a7 7 0 0 1 14 0" />
    </svg>
  );
}
