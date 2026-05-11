import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LandingHeader } from "../components/landing/LandingHeader.jsx";
import { HeroSection } from "../components/landing/HeroSection.jsx";
import { AvailableExchangesSection } from "../components/landing/AvailableExchangesSection.jsx";
import { BenefitsSection } from "../components/landing/BenefitsSection.jsx";

/**
 * Landing marketing « Swap » — variables `--swap-*` définies sur `.swap-landing` (voir `src/index.css`).
 */
export function LandingPage() {
  const [intent, setIntent] = useState(null);

  useEffect(() => {
    document.body.classList.add("swap-landing-active");
    return () => document.body.classList.remove("swap-landing-active");
  }, []);

  return (
    <div className="swap-landing min-h-screen overflow-x-hidden bg-[var(--swap-bg-gradient)] text-[var(--swap-text)]">
      <LandingHeader />

      <main>
        <HeroSection intent={intent} onOfferClick={() => setIntent("offer")} onSeekClick={() => setIntent("seek")} />
        <AvailableExchangesSection filter={intent} />
        <BenefitsSection />
      </main>

      <footer className="border-t border-[var(--swap-glass-border)] bg-[color-mix(in_srgb,var(--swap-surface-elevated)_70%,transparent)] px-3 py-8 backdrop-blur-xl sm:px-4 md:px-6 sm:py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center text-xs text-[var(--swap-muted)] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:text-left sm:text-sm">
          <p className="m-0 max-w-full">© {new Date().getFullYear()} SkillSwap · Échange de compétences</p>
          <div className="flex w-full max-w-xs flex-col gap-2 font-semibold sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-end sm:gap-4">
            <Link to="/login" className="inline-block rounded-lg py-2 hover:text-[var(--swap-text)] sm:py-0">
              Connexion
            </Link>
            <Link to="/app" className="inline-block rounded-lg py-2 hover:text-[var(--swap-text)] sm:py-0">
              Espace membre
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
