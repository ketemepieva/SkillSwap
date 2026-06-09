import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle.jsx";
import { Avatar } from "./Avatar.jsx";
import { Logo } from "./Logo.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useNotifications } from "../hooks/useNotifications.js";

const pill = ({ isActive }) =>
  [
    "rounded-full px-4 py-2 text-sm font-semibold transition whitespace-nowrap shrink-0",
    isActive
      ? "bg-[var(--tab-active-bg)] text-[var(--tab-active-fg)] shadow-[var(--shadow-soft)]"
      : "text-[var(--text-muted)] hover:bg-[var(--tab-hover-bg)] hover:text-[var(--text-main)]",
  ].join(" ");

const pillDrawer = (isActive) =>
  [
    "rounded-xl px-4 py-3 text-sm font-semibold transition motion-safe:duration-200",
    isActive
      ? "bg-[var(--tab-active-bg)] text-[var(--tab-active-fg)] shadow-[var(--shadow-soft)]"
      : "text-[var(--text-main)] hover:bg-[var(--tab-hover-bg)]",
    "flex w-full min-h-11 touch-manipulation items-center justify-center text-center no-underline",
  ].join(" ");

function HamburgerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <path fill="currentColor" d="M4 6.5h16v1.8H4V6.5zm0 5.1h16v1.8H4v-1.8zm0 5.1h16v1.8H4v-1.8z" />
    </svg>
  );
}

function IconHome({ className }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5Z" strokeLinejoin="round" />
    </svg>
  );
}

function IconDashboard({ className }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="11" width="7" height="10" rx="1" />
      <rect x="3" y="15" width="7" height="6" rx="1" />
    </svg>
  );
}

function IconMessages({ className }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 12a8 8 0 0 1-8 8H8l-5 3v-3H5a8 8 0 1 1 16 0Z" strokeLinejoin="round" />
    </svg>
  );
}

function IconExchange({ className }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconBell({ className }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Badge numéroté des notifications non lues (affiche « 9+ » au-delà).
 *  Dimensions verrouillées en inline style pour rester un petit rond
 *  quel que soit le contexte flex/grid parent. */
function UnreadBadge({ count, className = "" }) {
  if (!count) return null;
  return (
    <span
      className={`inline-flex flex-none items-center justify-center rounded-full bg-red-500/90 font-semibold text-white ${className}`}
      style={{
        height: "1rem",
        minWidth: "1rem",
        maxWidth: "max-content",
        padding: "0 0.28rem",
        fontSize: "0.6rem",
        lineHeight: 1,
      }}
      aria-label={`${count} notification${count > 1 ? "s" : ""} non lue${count > 1 ? "s" : ""}`}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

/** Navigation desktop (toutes les sections, y compris Profil). */
const desktopNavLinks = [
  { to: "/app", end: true, label: "Accueil" },
  { to: "/app/dashboard", label: "Mon espace" },
  { to: "/app/echanges", label: "Échanges" },
  { to: "/app/messages", label: "Messages" },
  { to: "/app/notifications", label: "Notifications" },
];

/** Barre inférieure mobile — accès rapide sans ouvrir le menu compte. */
const mobileBottomNav = [
  { to: "/app", end: true, label: "Accueil", Icon: IconHome },
  { to: "/app/dashboard", end: false, label: "Mon espace", Icon: IconDashboard },
  { to: "/app/messages", end: false, label: "Messages", Icon: IconMessages },
  { to: "/app/echanges", end: false, label: "Échanges", Icon: IconExchange },
  { to: "/app/notifications", end: false, label: "Notifs", Icon: IconBell },
];

export function AppShellLayout() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const parametresBase = "/app/parametres";
  const onParamPage = location.pathname === parametresBase;
  const modifierCompteActive = onParamPage && location.hash === "#modifier-compte";
  const parametresSeulActif = onParamPage && !modifierCompteActive;

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <div className="app-shell-wrapper min-h-screen min-w-0 overflow-x-hidden bg-transparent">
      {/* Espace pour la bottom nav mobile (safe area inclus) */}
      <div className="app-shell mx-auto w-full max-w-6xl min-w-0 box-border px-5 pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))] pt-6 sm:px-7 sm:pb-8 sm:pt-8 md:px-9 md:pb-10 md:pt-10 lg:px-10 lg:py-12">
        <header className="mb-8 border-b border-[var(--dash-card-border)] pb-6 md:mb-10">
          <div className="flex min-w-0 items-center justify-between gap-3 md:gap-6">
            <div className="flex min-w-0 max-w-[min(100%,82%)] shrink flex-col md:max-w-none">
              <Logo
                size="sm"
                tone="app"
                to="/"
                className="min-w-0"
                showSlogan
                sloganClassName="auth-app-header-slogan hidden max-w-full sm:block"
              />
            </div>

            <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
              <div className="hidden items-center gap-2 md:flex">
                <ThemeToggle className="dashboard-theme !w-auto shrink-0" />
                <span className="hidden max-w-[10rem] truncate text-sm lg:inline">
                  <strong className="truncate">{user?.nom}</strong>
                </span>
              </div>

              <button
                type="button"
                className="inline-flex h-11 min-w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl border border-[var(--dash-card-border)] bg-[var(--dash-card-bg)] text-[var(--text-main)] shadow-[var(--shadow-soft)] motion-safe:transition-[transform,box-shadow] motion-safe:duration-200 active:scale-[0.98]"
                aria-expanded={drawerOpen}
                aria-controls="app-settings-drawer"
                aria-label={drawerOpen ? "Fermer le menu compte" : "Menu compte"}
                onClick={() => setDrawerOpen((v) => !v)}
              >
                <HamburgerIcon />
              </button>
            </div>
          </div>
        </header>

        <nav
          className="mb-8 hidden flex-wrap gap-2 md:flex md:min-h-0"
          aria-label="Sections de l’application"
        >
          {desktopNavLinks.map(({ to, end, label }) => (
            <NavLink key={to + String(Boolean(end))} to={to} end={end} className={pill}>
              {to === "/app/notifications" && unreadCount > 0 ? (
                <span className="inline-flex items-center gap-1.5">
                  {label}
                  <UnreadBadge count={unreadCount} />
                </span>
              ) : (
                label
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom navigation — mobile uniquement */}
        <nav
          className="fixed inset-x-0 bottom-0 z-[140] border-t border-[var(--dash-card-border)] bg-[color-mix(in_srgb,var(--dash-card-bg)_96%,transparent)] px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-md md:hidden"
          aria-label="Navigation principale"
        >
          <ul className="m-0 flex list-none items-stretch justify-between gap-0.5 p-0">
            {mobileBottomNav.map(({ to, end, label, Icon }) => (
              <li key={to + String(Boolean(end))} className="min-w-0 flex-1">
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    [
                      "flex min-h-[3.25rem] min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[10px] font-semibold leading-tight no-underline motion-safe:transition-colors motion-safe:duration-200",
                      isActive
                        ? "text-[var(--accent)]"
                        : "text-[var(--text-muted)] hover:text-[var(--text-main)]",
                    ].join(" ")
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={[
                          "relative grid size-9 shrink-0 place-items-center rounded-xl motion-safe:transition-[background-color,box-shadow] motion-safe:duration-200",
                          isActive
                            ? "bg-[var(--tab-active-bg)] text-[var(--tab-active-fg)] shadow-[var(--shadow-soft)]"
                            : "bg-transparent text-current",
                        ].join(" ")}
                      >
                        <Icon className="shrink-0" />
                        {to === "/app/notifications" ? (
                          <UnreadBadge count={unreadCount} className="absolute -right-1.5 -top-1" />
                        ) : null}
                      </span>
                      <span className="line-clamp-2 max-w-full text-center">{label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Overlay + tiroir compte */}
        <div
          className={`fixed inset-0 z-[180] motion-safe:transition-opacity motion-safe:duration-300 motion-safe:ease-out ${
            drawerOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
          aria-hidden={!drawerOpen}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px] motion-safe:transition-opacity motion-safe:duration-300"
            aria-label="Fermer le menu"
            tabIndex={drawerOpen ? 0 : -1}
            onClick={() => setDrawerOpen(false)}
          />
        </div>

        <div
          id="app-settings-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Compte et préférences"
          aria-hidden={!drawerOpen}
          tabIndex={-1}
          className={`fixed inset-y-0 right-0 z-[190] flex w-[min(100%,20rem)] flex-col overflow-y-auto border-l border-[var(--dash-card-border)] bg-[var(--dash-card-bg)] px-4 py-5 shadow-2xl motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.32,0.72,0,1)] ${
            drawerOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
          }`}
        >
          <div className="flex items-center gap-3 border-b border-[var(--dash-card-border)] pb-4">
            <Avatar nom={user?.nom} avatarUrl={user?.avatar_url} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="m-0 truncate text-sm font-semibold text-[var(--text-main)]">{user?.nom}</p>
              <p className="m-0 truncate text-xs text-[var(--text-muted)]">{user?.email}</p>
            </div>
          </div>

          <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Compte</p>
          <nav className="flex flex-col gap-2" aria-label="Options du compte">
            <NavLink
              to="/app/profil"
              className={({ isActive }) => pillDrawer(isActive)}
              onClick={() => setDrawerOpen(false)}
            >
              Mon profil
            </NavLink>
            <NavLink
              to={parametresBase}
              className={() => pillDrawer(parametresSeulActif)}
              onClick={() => setDrawerOpen(false)}
            >
              Paramètres
            </NavLink>
            <NavLink
              to={`${parametresBase}#modifier-compte`}
              className={() => pillDrawer(modifierCompteActive)}
              onClick={() => setDrawerOpen(false)}
            >
              Modifier le compte
            </NavLink>
            <button
              type="button"
              className="btn btn-ghost-light mt-1 w-full min-h-11 text-[var(--text-main)]"
              onClick={() => void logout()}
            >
              Déconnexion
            </button>
          </nav>

          <div className="mt-6 border-t border-[var(--dash-card-border)] pt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Thème</p>
            <ThemeToggle className="dashboard-theme max-w-full" />
          </div>
        </div>

        <main className="relative z-0 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
