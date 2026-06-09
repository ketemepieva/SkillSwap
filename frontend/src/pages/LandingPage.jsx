import { useEffect } from "react";
import { useAuth } from "../hooks/useAuth.js";
import { LandingHeader } from "../components/landing/LandingHeader.jsx";
import { LandingIntro } from "../components/landing/LandingIntro.jsx";

/**
 * Page d’entrée publique : marque, slogan, accès connexion / inscription.
 */
export function LandingPage() {
  const { user, ready } = useAuth();

  useEffect(() => {
    document.body.classList.add("swap-landing-active");
    return () => document.body.classList.remove("swap-landing-active");
  }, []);

  return (
    <div className="swap-landing flex min-h-screen flex-col overflow-x-hidden bg-[var(--swap-bg-gradient)] text-[var(--swap-text)]">
      <LandingHeader minimal />
      <main className="flex-1">
        <LandingIntro isLoggedIn={Boolean(ready && user)} />
      </main>
      <footer className="border-t border-[var(--swap-glass-border)] px-4 py-6 text-center text-xs text-[var(--swap-muted)] sm:py-8">
        <p className="m-0">© {new Date().getFullYear()} SkillSwap · Échange de compétences</p>
      </footer>
    </div>
  );
}
