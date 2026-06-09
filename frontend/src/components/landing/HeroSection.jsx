import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { HeroIllustration } from "./HeroIllustration.jsx";

export function HeroSection({ intent, onOfferClick, onSeekClick }) {
  const navigate = useNavigate();
  const { user, ready } = useAuth();

  const createExchange = () => {
    if (!ready) return;
    if (!user) {
      navigate("/login", { state: { from: "/app/dashboard", intent: "create-exchange" } });
      return;
    }
    navigate("/app/dashboard");
  };

  const scrollAvail = () => {
    document.getElementById("swap-disponibles")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleJePropose = () => {
    onOfferClick?.();
    scrollAvail();
  };

  const handleJeCherche = () => {
    onSeekClick?.();
    scrollAvail();
  };

  const heroBtnSecondary =
    "w-full rounded-2xl border border-[var(--swap-glass-border)] bg-[var(--swap-glass)] px-4 py-3 text-sm font-semibold text-[var(--swap-text)] shadow-[var(--swap-shadow-soft)] backdrop-blur-md transition hover:border-violet-400/45 sm:w-auto sm:px-5";

  return (
    <section
      id="swap-hero"
      className="relative overflow-x-hidden px-3 pb-12 pt-8 sm:px-4 sm:pb-16 sm:pt-10 md:px-6 md:pb-20 md:pt-14 scroll-mt-20"
    >
      {/* Blobs contenus pour éviter scroll horizontal sur petits écrans */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-16 top-6 h-48 w-48 rounded-full bg-violet-600/25 blur-3xl sm:-left-20 sm:h-64 sm:w-64 md:h-72 md:w-72" />
        <div className="absolute -right-8 top-24 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl sm:right-0 sm:h-72 sm:w-72 md:h-80 md:w-80" />
        <div className="absolute bottom-0 left-1/4 h-48 w-48 rounded-full bg-indigo-600/20 blur-3xl sm:left-1/3 sm:h-64 sm:w-64" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-8 md:gap-10 lg:grid-cols-[minmax(0,1.06fr)_minmax(0,0.94fr)] lg:gap-12">
        {/* Colonne texte — centrée jusqu’à lg, puis alignée gauche */}
        <div className="min-w-0 text-center lg:text-left">
          <div className="mb-4 flex justify-center lg:justify-start">
            <p className="inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-[var(--swap-glass-border)] bg-[var(--swap-glass)] px-3 py-1.5 text-[10px] font-semibold uppercase leading-snug tracking-wider text-[var(--swap-muted)] sm:text-xs sm:px-4">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-violet-400 to-cyan-400" aria-hidden />
              <span>Échange de compétences</span>
              {intent === "offer" ? (
                <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">· Je propose</span>
              ) : intent === "seek" ? (
                <span className="bg-gradient-to-r from-cyan-500 to-sky-600 bg-clip-text text-transparent">· Je cherche</span>
              ) : null}
            </p>
          </div>

          <h1 className="logo-text text-balance text-2xl font-bold leading-tight tracking-tight text-[var(--swap-text)] sm:text-3xl md:text-4xl lg:text-5xl lg:leading-[1.08]">
            Échange tes compétences,{" "}
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              développe ton réseau
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[var(--swap-muted)] sm:mt-5 sm:text-base md:text-lg lg:mx-0">
            SkillSwap met en relation des profils complémentaires : propose ce que tu maîtrises, indique ce que tu veux apprendre, et lance un échange clair et
            bienveillant — sans friction.
          </p>

          {/* Mobile : pile + pleine largeur ; sm+ : ligne */}
          <div className="mt-6 flex w-full flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center lg:justify-start">
            <button type="button" onClick={handleJePropose} className={`${heroBtnSecondary} hover:shadow-violet-500/20`}>
              Je propose
            </button>
            <button
              type="button"
              onClick={handleJeCherche}
              className={`w-full rounded-2xl border border-[var(--swap-glass-border)] bg-[var(--swap-glass)] px-4 py-3 text-sm font-semibold text-[var(--swap-text)] shadow-[var(--swap-shadow-soft)] backdrop-blur-md transition hover:border-cyan-400/45 hover:shadow-cyan-500/15 sm:w-auto sm:px-5`}
            >
              Je cherche
            </button>
            <button
              type="button"
              onClick={createExchange}
              className="w-full rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/35 transition hover:brightness-110 active:scale-[0.98] sm:w-auto sm:px-6"
            >
              Créer un échange
            </button>
          </div>
        </div>

        {/* Illustration — sous le texte en colonne unique, à droite sur lg */}
        <div className="relative order-last flex min-w-0 justify-center lg:order-none lg:justify-end">
          <div className="pointer-events-none absolute inset-4 -z-10 hidden rounded-[2rem] bg-gradient-to-br from-violet-600/30 via-transparent to-cyan-500/25 blur-2xl sm:block" />
          <HeroIllustration />
        </div>
      </div>
    </section>
  );
}
