import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { LandingThemeIconButton } from "./LandingThemeIconButton.jsx";
import { Logo } from "../Logo.jsx";

/**
 * En-tête landing.
 * @param {{ minimal?: boolean }} props — `minimal` : logo + thème seulement (CTA dans le hero).
 */
export function LandingHeader({ minimal = false }) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  return (
    <header
      className="sticky top-0 z-50 border-b border-[var(--swap-glass-border)] bg-[color-mix(in_srgb,var(--swap-surface-elevated)_78%,transparent)] backdrop-blur-xl"
      style={{ boxShadow: "var(--swap-shadow-soft)" }}
    >
      <div className="mx-auto flex min-w-0 max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-4">
        <Link to="/" className="group flex min-w-0 shrink items-center gap-2">
          <Logo size="md" tone="landing" className="opacity-[0.97] transition-opacity group-hover:opacity-100" />
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <LandingThemeIconButton />

          {!minimal && ready && !user ? (
            <>
              <Link
                to="/login"
                className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-[var(--swap-muted)] no-underline transition hover:bg-[var(--swap-glass)] hover:text-[var(--swap-text)] sm:inline"
              >
                Connexion
              </Link>
              <Link
                to="/inscription"
                className="hidden rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 px-3 py-2 text-sm font-semibold text-white no-underline shadow-[var(--swap-shadow-soft)] transition hover:opacity-95 sm:inline"
              >
                Inscription
              </Link>
            </>
          ) : null}

          {ready && user ? (
            <button
              type="button"
              onClick={() => navigate("/app/dashboard")}
              className="rounded-xl border border-[var(--swap-glass-border)] bg-[var(--swap-glass)] px-3 py-2 text-sm font-semibold text-[var(--swap-text)] transition hover:border-violet-400/40"
            >
              Mon espace
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
