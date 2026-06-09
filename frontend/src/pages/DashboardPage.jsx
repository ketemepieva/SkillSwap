import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import { Avatar } from "../components/Avatar.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { levelMeta, profileLevel } from "../utils/profileLevel.js";

const DEFAULT_CATEGORY = "Divers";
const DEFAULT_LEVEL = "Debutant";

const SKILL_GRID =
  "grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3 w-full min-w-0 [&>*]:min-w-0";

function SkillCard({ label, level, skillId, onRemove }) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-[var(--dash-card-border)] bg-[color-mix(in_srgb,var(--grid-input-bg)_92%,transparent)] p-4">
      <p className="m-0 flex-1 break-words text-sm font-medium leading-snug text-[var(--text-main)]">{label}</p>
      {level ? <p className="m-0 text-xs text-[var(--text-muted)]">Niveau : {level}</p> : null}
      <button
        type="button"
        className="btn btn-ghost-light mt-auto w-full min-h-10 text-sm shrink-0"
        onClick={() => void onRemove(skillId)}
      >
        Retirer
      </button>
    </article>
  );
}

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-[var(--dash-card-border)] bg-[color-mix(in_srgb,var(--grid-input-bg)_90%,transparent)] px-4 py-3">
      <p className="m-0 text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="m-0 mt-1 text-xl font-bold tabular-nums text-[var(--text-main)]">{value}</p>
      {hint ? <p className="mb-0 mt-1 text-xs text-[var(--text-muted)]">{hint}</p> : null}
    </div>
  );
}

/**
 * Mon espace — profil personnel uniquement (compétences, niveau, badges, stats).
 */
export function DashboardPage() {
  const { token, user } = useAuth();
  const [skills, setSkills] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [modal, setModal] = useState(null);
  const [newName, setNewName] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setFeedback("");
    try {
      const [skillData, profileData] = await Promise.all([
        apiFetch("/api/skills/my-skills", { token }),
        apiFetch("/api/profile/me", { token }),
      ]);
      setSkills(Array.isArray(skillData) ? skillData : []);
      setProfile(profileData && typeof profileData === "object" ? profileData : null);
    } catch (e) {
      setFeedback(e.message || "Impossible de charger votre espace.");
      setSkills([]);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const tid = window.setTimeout(() => void load(), 0);
    return () => clearTimeout(tid);
  }, [load]);

  const offered = skills.filter((s) => Number(s.is_offer) === 1);
  const sought = skills.filter((s) => Number(s.is_offer) === 0);

  const level = profileLevel(profile ?? user);
  const meta = levelMeta(level);
  const displayBadge = profile?.badge_label || user?.badge_label || meta.label;

  const stats = useMemo(
    () => ({
      offered: offered.length,
      sought: sought.length,
      rating: profile?.average_rating != null ? Number(profile.average_rating).toFixed(1) : "—",
      reviews: profile?.total_reviews ?? 0,
      credibility: Number(profile?.credibility_score ?? user?.credibility_score ?? 0).toFixed(1),
    }),
    [offered.length, sought.length, profile, user]
  );

  const closeModal = () => {
    setModal(null);
    setNewName("");
  };

  const submitAdd = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setFeedback("");
    try {
      await apiFetch("/api/skills/add", {
        method: "POST",
        token,
        body: {
          nom_competence: name,
          categorie: DEFAULT_CATEGORY,
          niveau: DEFAULT_LEVEL,
          rarete_weight: 1,
          is_offer: modal === "offer" ? 1 : 0,
        },
      });
      closeModal();
      await load();
    } catch (err) {
      setFeedback(err.message || "Erreur à l’ajout.");
    }
  };

  const removeSkill = async (skillId) => {
    if (!window.confirm("Retirer cette compétence ?")) return;
    setFeedback("");
    try {
      await apiFetch(`/api/skills/${skillId}`, { method: "DELETE", token });
      await load();
    } catch (err) {
      setFeedback(err.message || "Impossible de supprimer.");
    }
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-8 md:gap-10">
      <header className="min-w-0">
        <p className="m-0 text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">Espace personnel</p>
        <h1 className="logo-text m-0 mt-1 text-xl font-bold text-[var(--text-main)] sm:text-2xl md:text-3xl">Mon espace</h1>
        <p className="mb-0 mt-2 max-w-prose text-sm leading-relaxed text-[var(--text-muted)]">
          Vos compétences, votre progression et votre profil. Pour découvrir la communauté, rendez-vous sur{" "}
          <Link to="/app" className="font-semibold text-[var(--accent)] underline underline-offset-2 hover:no-underline">
            Accueil
          </Link>
          .
        </p>
      </header>

      {feedback ? (
        <p className="message m-0 rounded-[var(--radius-md)] px-3 py-2" role="status">
          {feedback}
        </p>
      ) : null}

      <section className="dash-section">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar nom={user?.nom} avatarUrl={user?.avatar_url ?? profile?.avatar_url} size="xl" />
          <div className="min-w-0 flex-1">
            <h2 className="logo-text m-0 text-lg font-semibold text-[var(--text-main)]">{user?.nom}</h2>
            <p className="mb-0 mt-1 break-all text-sm text-[var(--text-muted)]">{user?.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${meta.badgeClass}`}
              >
                <span aria-hidden>{meta.icon}</span>
                Niveau : {meta.label}
              </span>
              {displayBadge ? (
                <span className="inline-flex items-center rounded-full border border-violet-400/35 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-800 dark:text-violet-200">
                  Badge : {displayBadge}
                </span>
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/app/profil" className="btn btn-ghost-light min-h-10 text-sm no-underline">
                Modifier ma présentation
              </Link>
              {user?.id != null ? (
                <Link
                  to={`/app/profile/${encodeURIComponent(String(user.id))}`}
                  className="btn btn-ghost-light min-h-10 text-sm no-underline"
                >
                  Voir mon profil public
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Proposées" value={stats.offered} />
          <StatCard label="Recherchées" value={stats.sought} />
          <StatCard label="Note moyenne" value={stats.rating} hint={`${stats.reviews} avis`} />
          <StatCard label="Crédibilité" value={stats.credibility} />
        </div>
      </section>

      <section className="dash-section">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="logo-text m-0 text-lg font-semibold text-[var(--text-main)]">Mes compétences proposées</h3>
            <p className="mb-0 mt-1 text-sm text-[var(--text-muted)]">Ce que vous pouvez enseigner aux autres membres.</p>
          </div>
          <button type="button" className="btn btn-primary min-h-11 w-full sm:w-auto" onClick={() => setModal("offer")}>
            Ajouter
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-[var(--text-muted)]">Chargement…</p>
        ) : offered.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Aucune compétence proposée.</p>
        ) : (
          <div className={SKILL_GRID}>
            {offered.map((s) => (
              <SkillCard key={s.id} label={s.nom_competence} level={s.niveau} skillId={s.id} onRemove={removeSkill} />
            ))}
          </div>
        )}
      </section>

      <section className="dash-section">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="logo-text m-0 text-lg font-semibold text-[var(--text-main)]">Mes compétences recherchées</h3>
            <p className="mb-0 mt-1 text-sm text-[var(--text-muted)]">Ce que vous souhaitez apprendre via la communauté.</p>
          </div>
          <button type="button" className="btn btn-primary min-h-11 w-full sm:w-auto" onClick={() => setModal("seek")}>
            Ajouter
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-[var(--text-muted)]">Chargement…</p>
        ) : sought.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Aucune compétence recherchée.</p>
        ) : (
          <div className={SKILL_GRID}>
            {sought.map((s) => (
              <SkillCard key={s.id} label={s.nom_competence} level={s.niveau} skillId={s.id} onRemove={removeSkill} />
            ))}
          </div>
        )}
      </section>

      {modal ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-4 backdrop-blur-[2px] sm:items-center"
          role="presentation"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl border border-[var(--dash-card-border)] bg-[var(--dash-card-bg)] p-5 shadow-[var(--shadow-strong)] sm:p-6"
            onClick={(ev) => ev.stopPropagation()}
          >
            <h4 className="logo-text m-0 text-base text-[var(--text-main)]">
              {modal === "offer" ? "Nouvelle compétence proposée" : "Nouvelle compétence recherchée"}
            </h4>
            <form className="mt-4 flex flex-col gap-3" onSubmit={submitAdd}>
              <input
                className="simple-input min-h-11 w-full"
                autoFocus
                placeholder="Ex. : Photographie"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={120}
              />
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" className="btn btn-ghost-light min-h-11" onClick={closeModal}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary min-h-11" disabled={!newName.trim()}>
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}



