import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { LandingThemeIconButton } from "./LandingThemeIconButton.jsx";
import { Logo } from "../Logo.jsx";

const navCls = ({ isActive }) =>
  [
    "rounded-xl px-3 py-2 text-sm font-semibold transition",
    isActive
      ? "bg-[color-mix(in_srgb,var(--swap-accent)_22%,transparent)] text-[var(--swap-text)]"
      : "text-[var(--swap-muted)] hover:bg-[var(--swap-glass)] hover:text-[var(--swap-text)]",
  ].join(" ");

export function LandingHeader() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const go = (path, state) => {
    setOpen(false);
    navigate(path, state ? { state } : undefined);
  };

  const requireAuth = (path, state) => {
    setOpen(false);
    if (!user) {
      navigate("/login", { state: { from: path } });
      return;
    }
    navigate(path, state ? { state } : undefined);
  };

  return (
    <header
      className="sticky top-0 z-50 border-b border-[var(--swap-glass-border)] bg-[color-mix(in_srgb,var(--swap-surface-elevated)_78%,transparent)] backdrop-blur-xl"
      style={{ boxShadow: "var(--swap-shadow-soft)" }}
    >
      <div className="mx-auto flex min-w-0 max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-4 md:gap-4 md:px-6 md:py-4">
        <Link
          to="/"
          className="group flex min-w-0 shrink items-center gap-2 sm:gap-2.5"
          onClick={() => setOpen(false)}
        >
          <Logo size="md" tone="landing" className="opacity-[0.97] transition-opacity group-hover:opacity-100" />
        </Link>

        {/* ≥ md (768px) — en dessous : menu hamburger */}
        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 md:flex lg:gap-2" aria-label="Navigation principale">
          <NavLink to="/" end className={navCls}>
            Accueil
          </NavLink>
          <button type="button" className={navCls({ isActive: false })} onClick={() => requireAuth("/app")}>
            Mon espace
          </button>
          <button type="button" className={navCls({ isActive: false })} onClick={() => requireAuth("/app/echanges")}>
            Échanges
          </button>
          <button type="button" className={navCls({ isActive: false })} onClick={() => requireAuth("/app/messages")}>
            Messages
          </button>
          <button type="button" className={navCls({ isActive: false })} onClick={() => requireAuth("/app/notifications")}>
            Notifications
          </button>
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <LandingThemeIconButton />

          {ready && user ? (
            <button
              type="button"
              onClick={() => go("/app")}
              className="flex max-w-[10rem] min-w-0 items-center gap-1.5 rounded-full border border-[var(--swap-glass-border)] bg-[var(--swap-glass)] py-1 pl-1 pr-2 text-left shadow-[var(--swap-shadow-soft)] transition hover:border-violet-400/40 sm:gap-2 sm:pr-3"
              title={user.nom}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500/90 to-indigo-600/90 text-[10px] font-bold text-white sm:size-9 sm:text-xs">
                {initials(user.nom)}
              </span>
              <span className="hidden truncate text-sm font-semibold text-[var(--swap-text)] sm:inline">{user.nom}</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="grid size-10 place-items-center rounded-full border border-[var(--swap-glass-border)] bg-[var(--swap-glass)] text-sm font-bold text-[var(--swap-muted)] shadow-[var(--swap-shadow-soft)] transition hover:text-[var(--swap-text)] sm:size-11"
              title="Connexion"
            >
              <span aria-hidden>👤</span>
            </Link>
          )}

          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-xl border border-[var(--swap-glass-border)] bg-[var(--swap-glass)] text-[var(--swap-text)] md:hidden sm:size-11"
            aria-expanded={open}
            aria-controls="swap-mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">Menu</span>
            <span aria-hidden className="text-lg leading-none">
              {open ? "✕" : "☰"}
            </span>
          </button>
        </div>
      </div>

      {/* Menu mobile (< md) */}
      {open ? (
        <div
          id="swap-mobile-nav"
          className="border-t border-[var(--swap-glass-border)] bg-[var(--swap-surface)] px-3 py-3 sm:px-4 md:hidden"
        >
          <nav className="flex flex-col gap-1">
            <NavLink
              to="/"
              end
              className="rounded-xl px-3 py-3 text-center text-sm font-semibold text-[var(--swap-text)] hover:bg-[var(--swap-glass)] sm:text-left"
              onClick={() => setOpen(false)}
            >
              Accueil
            </NavLink>
            <button
              type="button"
              className="rounded-xl px-3 py-3 text-center text-sm font-semibold text-[var(--swap-text)] hover:bg-[var(--swap-glass)] sm:text-left"
              onClick={() => requireAuth("/app")}
            >
              Mon espace
            </button>
            <button
              type="button"
              className="rounded-xl px-3 py-3 text-center text-sm font-semibold text-[var(--swap-text)] hover:bg-[var(--swap-glass)] sm:text-left"
              onClick={() => requireAuth("/app/echanges")}
            >
              Échanges
            </button>
            <button
              type="button"
              className="rounded-xl px-3 py-3 text-center text-sm font-semibold text-[var(--swap-text)] hover:bg-[var(--swap-glass)] sm:text-left"
              onClick={() => requireAuth("/app/messages")}
            >
              Messages
            </button>
            <button
              type="button"
              className="rounded-xl px-3 py-3 text-center text-sm font-semibold text-[var(--swap-text)] hover:bg-[var(--swap-glass)] sm:text-left"
              onClick={() => requireAuth("/app/notifications")}
            >
              Notifications
            </button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function initials(name) {
  if (!name || typeof name !== "string") return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
