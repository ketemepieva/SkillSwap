import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import { Avatar } from "../components/Avatar.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { fetchAvailableExchanges } from "../services/exchanges.js";
import { compareMembersByLevel, levelMeta, profileLevel } from "../utils/profileLevel.js";

function ChipList({ label, skills, accentClass, onCategoryClick }) {
  const list = Array.isArray(skills) ? skills : [];
  const max = 3;
  const shown = list.slice(0, max);
  const extra = list.length - shown.length;

  return (
    <div className="min-w-0">
      <p className={`mb-2 text-[11px] font-semibold uppercase tracking-wide ${accentClass}`}>{label}</p>
      {shown.length === 0 ? (
        <p className="mb-0 text-xs text-[var(--text-muted)]">—</p>
      ) : (
        <ul className="m-0 flex min-w-0 flex-wrap gap-2 p-0 list-none">
          {shown.map((s) => (
            <li
              key={s.id}
              className="group max-w-[12rem] truncate rounded-full border border-[var(--dash-card-border)] bg-[color-mix(in_srgb,var(--grid-input-bg)_94%,transparent)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-main)]"
              title={`${s.nom_competence} · ${s.niveau}`}
            >
              <button
                type="button"
                className="max-w-full cursor-pointer truncate text-left transition-opacity group-hover:opacity-90"
                onClick={() => onCategoryClick?.(s.categorie)}
                title={`Filtrer par ${s.categorie}`}
              >
                {s.nom_competence}
              </button>
            </li>
          ))}
          {extra > 0 ? (
            <li className="rounded-full border border-dashed border-[var(--dash-card-border)] px-3 py-1 text-xs text-[var(--text-muted)]">
              +{extra}
            </li>
          ) : null}
        </ul>
      )}
    </div>
  );
}

const PAGE_LIMIT = 12;

export function PlatformHomePage() {
  const { token } = useAuth();
  const [members, setMembers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [popularSkills, setPopularSkills] = useState([]);
  const [queryInput, setQueryInput] = useState("");
  const [queryDebounced, setQueryDebounced] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const sortedMembers = useMemo(() => {
    return [...members].sort(compareMembersByLevel);
  }, [members]);

  const featuredExperts = useMemo(() => {
    return sortedMembers.filter((e) => profileLevel(e?.profile) === "expert").slice(0, 4);
  }, [sortedMembers]);

  const visibleMembers = useMemo(() => {
    if (levelFilter === "all") return sortedMembers;
    return sortedMembers.filter((entry) => profileLevel(entry?.profile) === levelFilter);
  }, [levelFilter, sortedMembers]);

  useEffect(() => {
    const tid = window.setTimeout(() => setQueryDebounced(queryInput.trim()), 250);
    return () => clearTimeout(tid);
  }, [queryInput]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [cats, popular] = await Promise.all([
          apiFetch("/api/profile/categories", { token }),
          apiFetch("/api/profile/popular-skills?limit=10", { token }),
        ]);
        if (cancelled) return;
        setCategories(Array.isArray(cats) ? cats : []);
        setPopularSkills(Array.isArray(popular) ? popular : []);
      } catch {
        if (!cancelled) {
          setCategories([]);
          setPopularSkills([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    void fetchAvailableExchanges({ token }).then((rows) => {
      if (!cancelled) setSuggestions(rows.slice(0, 3));
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    const tid = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        setFeedback("");
        try {
          const params = new URLSearchParams({
            limit: String(PAGE_LIMIT),
            page: "1",
          });
          if (queryDebounced) params.set("q", queryDebounced);
          if (categoryFilter) params.set("category", categoryFilter);
          const data = await apiFetch(`/api/profile/browse?${params.toString()}`, { token });
          if (cancelled) return;
          const rows = Array.isArray(data) ? data : [];
          setMembers(rows);
          setPage(1);
          setHasMore(rows.length >= PAGE_LIMIT);
        } catch (e) {
          if (!cancelled) {
            setFeedback(e.message || "Impossible de charger les membres.");
            setMembers([]);
            setHasMore(false);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(tid);
    };
  }, [token, queryDebounced, categoryFilter]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const next = page + 1;
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_LIMIT),
        page: String(next),
      });
      if (queryDebounced) params.set("q", queryDebounced);
      if (categoryFilter) params.set("category", categoryFilter);
      const data = await apiFetch(`/api/profile/browse?${params.toString()}`, { token });
      const rows = Array.isArray(data) ? data : [];
      setMembers((prev) => [...prev, ...rows]);
      setPage(next);
      setHasMore(rows.length >= PAGE_LIMIT);
    } catch (e) {
      setFeedback(e.message || "Chargement impossible.");
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-8 md:gap-10">
      <header className="min-w-0">
        <p className="m-0 text-xs font-bold uppercase tracking-wide text-[var(--accent)]">Découverte</p>
        <h1 className="logo-text m-0 mt-1 text-xl font-bold tracking-tight text-[var(--text-main)] sm:text-2xl md:text-3xl">
          Accueil communauté
        </h1>
        <p className="mb-0 mt-2 max-w-prose text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
          Parcourez les profils, recherchez des compétences et trouvez des échanges. Votre espace personnel est dans{" "}
          <Link to="/app/dashboard" className="font-semibold text-[var(--accent)] underline underline-offset-2 hover:no-underline">
            Mon espace
          </Link>
          .
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(180px,220px)_minmax(180px,220px)_auto] md:items-center">
          <label className="flex min-w-0 items-center gap-2 rounded-xl border border-[var(--dash-card-border)] bg-[color-mix(in_srgb,var(--grid-input-bg)_90%,transparent)] px-3 py-2">
            <span aria-hidden className="inline-flex flex-none items-center text-[var(--text-muted)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
            </span>
            <input
              className="w-full min-w-0 bg-transparent text-sm text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted)]"
              placeholder="Rechercher une compétence, un domaine ou un utilisateur..."
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
            />
          </label>
          <label className="sr-only" htmlFor="category-filter">
            Catégorie
          </label>
          <select
            id="category-filter"
            className="simple-input min-h-10 text-sm"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Toutes catégories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="level-filter">
            Niveau
          </label>
          <select
            id="level-filter"
            className="simple-input min-h-10 text-sm"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
          >
            <option value="all">Tous niveaux</option>
            <option value="expert">Experts</option>
            <option value="intermediate">Intermédiaires</option>
            <option value="beginner">Débutants</option>
          </select>
          <button
            type="button"
            className="btn btn-ghost-light min-h-10"
            onClick={() => {
              setQueryInput("");
              setCategoryFilter("");
              setLevelFilter("all");
            }}
          >
            Réinitialiser filtres
          </button>
        </div>
        {popularSkills.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Populaires:</span>
            {popularSkills.slice(0, 6).map((s) => (
              <button
                key={s.key_name}
                type="button"
                className="rounded-full border border-[var(--dash-card-border)] px-2.5 py-1 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)]"
                onClick={() => setQueryInput(String(s.label || ""))}
                title={`Utilisée ${s.usage_count} fois`}
              >
                {s.label}
              </button>
            ))}
          </div>
        ) : null}
      </header>

      {feedback ? (
        <p className="message m-0 rounded-[var(--radius-md)] px-3 py-2" role="status">
          {feedback}
        </p>
      ) : null}

      {featuredExperts.length > 0 ? (
        <section className="dash-section">
          <h2 className="logo-text m-0 text-lg font-semibold text-[var(--text-main)]">Experts mis en avant</h2>
          <p className="mb-4 mt-1 text-sm text-[var(--text-muted)]">Profils à forte crédibilité sur la plateforme.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredExperts.map((entry) => {
              const p = entry.profile;
              const meta = levelMeta("expert");
              return (
                <Link
                  key={p.id}
                  to={`/app/profile/${encodeURIComponent(String(p.id))}`}
                  className={`flex flex-col gap-2 rounded-xl border-2 p-4 no-underline transition hover:shadow-[var(--shadow-soft)] ${meta.cardClass}`}
                >
                  <Avatar nom={p.nom} avatarUrl={p.avatar_url} size="md" />
                  <p className="m-0 truncate text-sm font-bold text-[var(--text-main)]">{p.nom}</p>
                  <span className={`w-fit rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${meta.badgeClass}`}>
                    {p.badge_label || meta.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {suggestions.length > 0 ? (
        <section className="dash-section border-2 border-amber-500/15 bg-amber-500/5">
          <h2 className="logo-text m-0 text-lg font-semibold text-[var(--text-main)]">Suggestions d&apos;échanges</h2>
          <p className="mb-4 mt-1 text-sm text-[var(--text-muted)]">
            Idées de mise en relation — gérez vos demandes dans{" "}
            <Link to="/app/echanges" className="font-semibold text-[var(--accent)] hover:no-underline">
              Échanges
            </Link>
            .
          </p>
          <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-3">
            {suggestions.map((s) => (
              <li key={s.id} className="rounded-xl border border-amber-500/20 bg-[var(--dash-card-bg)] p-3 text-sm">
                <p className="m-0 font-semibold text-[var(--text-main)]">{s.name}</p>
                <p className="mb-0 mt-1 text-xs text-[var(--text-muted)]">
                  Propose <strong>{s.offeredSkill}</strong> · Cherche <strong>{s.wantedSkill}</strong>
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="dash-section">
        <h2 className="logo-text m-0 text-lg font-semibold text-[var(--text-main)]">Tous les profils</h2>
        <p className="mb-4 mt-1 text-sm text-[var(--text-muted)]">Filtrés par recherche, catégorie et niveau.</p>
      </section>

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Chargement du fil…</p>
      ) : visibleMembers.length === 0 ? (
        <section className="dash-section py-12 text-center">
          <p className="m-0 text-sm text-[var(--text-muted)]">
            Aucun profil ne correspond à ce filtre pour le moment.
          </p>
        </section>
      ) : (
        <>
          <div className="grid w-full min-w-0 grid-cols-1 gap-6 sm:gap-7 md:grid-cols-2 xl:grid-cols-3">
            {visibleMembers.map((entry) => {
              const p = entry.profile;
              const id = String(p.id);
              const level = profileLevel(p);
              const meta = levelMeta(level);
              const badgeLabel = p.badge_label || meta.label;
              return (
                <article
                  key={id}
                  className={`dash-section flex min-h-0 flex-col gap-4 !p-5 sm:!p-[1.35rem] ${meta.cardClass}`}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <Avatar nom={p.nom} avatarUrl={p.avatar_url} size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <h2 className="m-0 truncate text-base font-semibold text-[var(--text-main)]">{p.nom}</h2>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${meta.badgeClass}`}
                        >
                          <span aria-hidden>{meta.icon}</span>
                          {badgeLabel}
                        </span>
                      </div>
                      {p.bio ? (
                        <p className="mb-0 mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--text-muted)]">{p.bio}</p>
                      ) : (
                        <p className="mb-0 mt-2 text-xs italic text-[var(--text-muted)]">Pas de présentation publique.</p>
                      )}
                      <p className="mb-0 mt-2 text-[11px] text-[var(--text-muted)] tabular-nums">
                        Score :{" "}
                        <span className="font-medium text-[var(--text-main)]">
                          {Number(p.credibility_score || 0).toFixed(1)}
                        </span>
                      </p>
                      {p.city || p.country ? (
                        <p className="mb-0 mt-1 text-[11px] text-[var(--text-muted)]">
                          {p.city ? p.city : "Ville non renseignee"}
                          {p.country ? `, ${p.country}` : ""}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid min-w-0 gap-4 border-t border-[var(--dash-card-border)] pt-4">
                    <ChipList
                      label="Propose"
                      skills={entry.offered_skills}
                      accentClass="text-[var(--accent)]"
                      onCategoryClick={(cat) => setCategoryFilter(String(cat || ""))}
                    />
                    <ChipList
                      label="Cherche"
                      skills={entry.sought_skills}
                      accentClass="text-[var(--indigo)]"
                      onCategoryClick={(cat) => setCategoryFilter(String(cat || ""))}
                    />
                  </div>

                  <div className="mt-auto flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:gap-2">
                    <Link
                      to={`/app/profile/${encodeURIComponent(id)}`}
                      state={{ userName: p.nom }}
                      className="btn btn-ghost-light inline-flex w-full min-h-11 shrink-0 flex-1 items-center justify-center text-center text-sm no-underline"
                    >
                      Voir profil
                    </Link>
                    <Link
                      to={`/app/messages/${encodeURIComponent(id)}`}
                      state={{ peerName: p.nom, peerAvatarUrl: p.avatar_url ?? null }}
                      className="btn btn-primary inline-flex w-full min-h-11 shrink-0 flex-1 items-center justify-center text-center text-sm no-underline"
                    >
                      Contacter
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          {hasMore ? (
            <div className="flex justify-center">
              <button
                type="button"
                className="btn btn-ghost-light min-h-11 w-full max-w-sm"
                disabled={loadingMore}
                onClick={() => void loadMore()}
              >
                {loadingMore ? "Chargement…" : "Afficher plus"}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
