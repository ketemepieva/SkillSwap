const ITEMS = [
  {
    title: "Communauté bienveillante",
    desc: "Des échanges encadrés par des règles simples : respect, clarté des attentes et feedback constructif.",
    icon: "🤝",
  },
  {
    title: "Échanges sécurisés",
    desc: "Session par compte, traçabilité des propositions — prêt à se connecter à votre API et votre politique de confiance.",
    icon: "🔒",
  },
  {
    title: "Tout niveau accepté",
    desc: "Du débutant à l’expert : l’important est la complémentarité et la progression, pas le diplôme.",
    icon: "📈",
  },
];

export function BenefitsSection() {
  return (
    <section className="overflow-x-hidden px-3 pb-16 pt-4 sm:px-4 sm:pb-20 md:px-6">
      <div className="mx-auto w-full max-w-6xl min-w-0">
        {/* 1 col défaut • 2 cols md • 3 cols lg */}
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3 lg:gap-6">
          {ITEMS.map((it) => (
            <div
              key={it.title}
              className="w-full min-w-0 rounded-2xl border border-[var(--swap-glass-border)] bg-[var(--swap-card)] p-4 shadow-[var(--swap-shadow-soft)] backdrop-blur-2xl sm:rounded-3xl sm:p-5 md:p-6"
            >
              <div
                className="mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-[var(--swap-glass)] text-lg sm:mb-4 sm:size-11 sm:rounded-2xl sm:text-xl"
                aria-hidden
              >
                {it.icon}
              </div>
              <h3 className="logo-text text-base font-bold text-[var(--swap-text)] sm:text-lg">{it.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--swap-muted)] sm:text-sm">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
