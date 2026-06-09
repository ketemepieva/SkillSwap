import { Link } from "react-router-dom";
import { Logo } from "../Logo.jsx";
import { HeroIllustration } from "./HeroIllustration.jsx";

/**
 * Entrée publique minimaliste : marque, slogan, accès auth uniquement.
 */
export function LandingIntro({ isLoggedIn }) {
  return (
    <section className="relative flex min-h-[calc(100vh-5.5rem)] flex-col items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-violet-600/25 blur-3xl" />
        <div className="absolute -right-10 top-32 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-indigo-600/15 blur-3xl" />
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
        <Logo size="xl" tone="landing" showSlogan sloganClassName="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--swap-muted)] sm:text-xs" />

        <h1 className="logo-text mt-8 text-balance text-3xl font-bold leading-tight tracking-tight text-[var(--swap-text)] sm:text-4xl md:text-5xl md:leading-[1.08]">
          Échange tes compétences,{" "}
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
            développe ton réseau
          </span>
        </h1>

        <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
          {isLoggedIn ? (
            <Link
              to="/app/dashboard"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-600/35 no-underline transition hover:brightness-110 sm:w-auto"
            >
              Mon espace
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-[var(--swap-glass-border)] bg-[var(--swap-glass)] px-6 text-sm font-semibold text-[var(--swap-text)] no-underline shadow-[var(--swap-shadow-soft)] backdrop-blur-md transition hover:border-violet-400/45 sm:w-auto sm:min-w-[10rem]"
              >
                Se connecter
              </Link>
              <Link
                to="/inscription"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 px-6 text-sm font-semibold text-white shadow-[var(--swap-shadow-soft)] no-underline transition hover:opacity-95 sm:w-auto sm:min-w-[10rem]"
              >
                S&apos;inscrire
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute right-4 top-1/2 hidden max-w-[min(40vw,280px)] -translate-y-1/2 opacity-40 lg:block xl:right-8 xl:opacity-55">
        <HeroIllustration />
      </div>
    </section>
  );
}
