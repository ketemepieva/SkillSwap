import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import { Avatar } from "../components/Avatar.jsx";
import { useAuth } from "../hooks/useAuth.js";

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
const LEVEL_ORDER = { expert: 0, intermediate: 1, beginner: 2 };

function levelFromCredibility(scoreRaw) {
  const score = Number(scoreRaw || 0);
  // Palier simple et lisible, ajustable plus tard via backend si besoin.
  if (score >= 4) return "expert";
  if (score >= 2) return "intermediate";
  return "beginner";
}

function normalizedLevel(rawLevel) {
  const v = String(rawLevel || "")
    .trim()
    .toLowerCase();
  if (["expert"].includes(v)) return "expert";
  if (["intermediaire", "intermédiaire", "intermediate"].includes(v)) return "intermediate";
  if (["debutant", "débutant", "beginner"].includes(v)) return "beginner";
  return null;
}

function profileLevel(profile) {
  return normalizedLevel(profile?.expertise_level) || levelFromCredibility(profile?.credibility_score);
}

function levelMeta(level) {
  if (level === "expert") {
    return {
      label: "Expert",
      icon: "●",
      badgeClass:
        "border-amber-200/55 bg-[color-mix(in_srgb,#f59e0b_10%,transparent)] text-amber-700 dark:text-amber-200",
      cardClass: "border-[var(--dash-card-border)]",
      ringClass: "",
    };
  }
  if (level === "intermediate") {
    return {
      label: "Intermédiaire",
      icon: "●",
      badgeClass:
        "border-sky-200/55 bg-[color-mix(in_srgb,#0ea5e9_10%,transparent)] text-sky-700 dark:text-sky-200",
      cardClass: "border-[var(--dash-card-border)]",
      ringClass: "",
    };
  }
  return {
    label: "Débutant",
    icon: "●",
    badgeClass:
      "border-[var(--dash-card-border)] bg-[color-mix(in_srgb,var(--grid-input-bg)_88%,transparent)] text-[var(--text-muted)]",
    cardClass: "border-[var(--dash-card-border)]",
    ringClass: "",
  };
}

function compareMembers(a, b) {
  const aLevel = profileLevel(a?.profile);
  const bLevel = profileLevel(b?.profile);
  const byLevel = LEVEL_ORDER[aLevel] - LEVEL_ORDER[bLevel];
  if (byLevel !== 0) return byLevel;

  const aScore = Number(a?.profile?.credibility_score || 0);
  const bScore = Number(b?.profile?.credibility_score || 0);
  if (aScore !== bScore) return bScore - aScore;

  return Number(b?.profile?.id || 0) - Number(a?.profile?.id || 0);
}

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

  const sortedMembers = useMemo(() => {
    return [...members].sort(compareMembers);
  }, [members]);

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
        <h1 className="logo-text m-0 text-xl font-bold tracking-tight text-[var(--text-main)] sm:text-2xl md:text-3xl">
          Accueil
        </h1>
        <p className="mb-0 mt-2 max-w-prose text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
          Découvrez les profils et leurs compétences. Les experts sont valorisés en premier, tout en gardant de la
          visibilité aux membres débutants.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(180px,220px)_minmax(180px,220px)_auto] md:items-center">
          <label className="flex min-w-0 items-center gap-2 rounded-xl border border-[var(--dash-card-border)] bg-[color-mix(in_srgb,var(--grid-input-bg)_90%,transparent)] px-3 py-2">
            <span aria-hidden className="text-sm text-[var(--text-muted)]">
              🔎
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
                  className={`dash-section flex min-h-0 flex-col gap-4 !p-5 sm:!p-[1.35rem] ${meta.cardClass} ${meta.ringClass}`}
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
