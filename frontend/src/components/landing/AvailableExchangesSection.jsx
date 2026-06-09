import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { fetchAvailableExchanges } from "../../services/exchanges.js";

function avatarLetter(name) {
  const c = String(name || "?").trim()[0];
  return c?.toUpperCase() ?? "?";
}

export function AvailableExchangesSection({ filter }) {
  const { token, user, ready } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const rows = await fetchAvailableExchanges({ token: token ?? null });
      if (!cancelled) {
        setItems(rows);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const visible = useMemo(() => {
    if (filter === "offer") return items.filter((_, i) => i % 2 === 0);
    if (filter === "seek") return items.filter((_, i) => i % 2 === 1);
    return items;
  }, [items, filter]);

  const viewProfile = (exchange) => {
    if (!ready) return;
    if (!user) {
      navigate("/login", { state: { from: "/", highlight: exchange.id } });
      return;
    }
    navigate("/app/dashboard");
  };

  return (
    <section
      id="swap-disponibles"
      className="scroll-mt-20 overflow-x-hidden px-3 py-10 sm:scroll-mt-24 sm:px-4 md:scroll-mt-28 md:px-6 md:py-12 lg:py-14"
    >
      <div className="mx-auto w-full max-w-6xl min-w-0">
        <div className="mb-6 flex w-full flex-col gap-4 sm:mb-8 md:mb-10 md:flex-row md:flex-wrap md:items-end md:justify-between">
          <div className="min-w-0 flex-1 text-center md:text-left">
            <h2 className="logo-text text-2xl font-bold tracking-tight text-[var(--swap-text)] sm:text-3xl lg:text-4xl">
              Échanges disponibles
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-[var(--swap-muted)] sm:text-base md:mx-0">
              Des membres prêts à partager leur savoir — les données peuvent être chargées depuis votre API lorsque l’endpoint est prêt.
            </p>
          </div>
          <div className="shrink-0 self-center rounded-2xl border border-[var(--swap-glass-border)] bg-[var(--swap-glass)] px-3 py-2 text-[10px] font-semibold text-[var(--swap-muted)] backdrop-blur-md sm:self-end sm:text-xs sm:px-4">
            {loading ? "Chargement…" : `${visible.length} profil${visible.length > 1 ? "s" : ""}`}
          </div>
        </div>

        {/* 1 col par défaut, 2 cols dès sm, 3 cols dès lg */}
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {visible.map((x) => (
            <article
              key={x.id}
              className="group flex w-full min-w-0 flex-col rounded-2xl border border-[var(--swap-glass-border)] bg-[var(--swap-card)] p-4 shadow-[var(--swap-shadow-card)] backdrop-blur-2xl transition hover:border-violet-400/35 sm:rounded-3xl sm:p-5 md:p-6 lg:hover:shadow-[0_28px_60px_-20px_rgba(99,102,241,0.35)]"
            >
              <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 text-base font-bold text-white shadow-lg shadow-indigo-600/25 sm:size-14 sm:rounded-2xl sm:text-lg">
                  {x.avatarUrl ? <img src={x.avatarUrl} alt="" className="size-full rounded-xl object-cover sm:rounded-2xl" /> : avatarLetter(x.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-[10px] font-bold uppercase tracking-wider text-transparent sm:text-xs">
                    Propose
                  </p>
                  <p className="mt-0.5 break-words text-base font-semibold leading-snug text-[var(--swap-text)] sm:text-lg">{x.offeredSkill}</p>
                  <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-[var(--swap-muted)] sm:text-sm">{x.offeredDesc}</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-[var(--swap-glass-border)] bg-[color-mix(in_srgb,var(--swap-surface)_88%,transparent)] p-3 sm:mt-5 sm:rounded-2xl sm:p-4">
                <p className="bg-gradient-to-r from-cyan-500 to-sky-600 bg-clip-text text-[10px] font-bold uppercase tracking-wider text-transparent sm:text-xs">
                  Recherche
                </p>
                <p className="mt-1 break-words text-sm font-semibold text-[var(--swap-text)]">{x.wantedSkill}</p>
              </div>

              <div className="mt-4 flex min-w-0 flex-col gap-3 sm:mt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <p className="truncate text-sm font-bold text-[var(--swap-text)]">{x.name}</p>
                  <p className="truncate text-xs text-[var(--swap-muted)]">{x.location}</p>
                </div>
                <button
                  type="button"
                  onClick={() => viewProfile(x)}
                  className="w-full shrink-0 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition hover:brightness-110 active:scale-[0.98] sm:w-auto sm:min-w-[7.5rem]"
                >
                  Voir le profil
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
