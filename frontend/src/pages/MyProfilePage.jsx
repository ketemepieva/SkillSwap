import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import { Avatar } from "../components/Avatar.jsx";
import { useAuth } from "../hooks/useAuth.js";

/**
 * Page « Profil » : données du compte connecté uniquement — bio modifiable et accès aux autres sections dédiées.
 */
export function MyProfilePage() {
  const { token, user, refreshUser } = useAuth();
  const [detail, setDetail] = useState(null);
  const [bioDraft, setBioDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingBio, setSavingBio] = useState(false);
  const [feedback, setFeedback] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setFeedback("");
    try {
      const row = await apiFetch("/api/profile/me", { token });
      setDetail(row && typeof row === "object" ? row : null);
      const b = typeof row?.bio === "string" ? row.bio : "";
      setBioDraft(b);
    } catch (e) {
      setFeedback(e.message || "Impossible de charger votre profil.");
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const tid = window.setTimeout(() => void load(), 0);
    return () => clearTimeout(tid);
  }, [load]);

  const submitBio = async (e) => {
    e.preventDefault();
    setSavingBio(true);
    setFeedback("");
    try {
      await apiFetch("/api/profile/me", {
        method: "PATCH",
        token,
        body: { bio: bioDraft.trim() },
      });
      await refreshUser();
      await load();
      setFeedback("Présentation enregistrée.");
    } catch (err) {
      setFeedback(err.message || "Erreur à l’enregistrement.");
    } finally {
      setSavingBio(false);
    }
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-8 md:gap-10">
      <header className="min-w-0">
        <h1 className="logo-text m-0 text-xl font-bold text-[var(--text-main)] sm:text-2xl md:text-3xl">Mon profil</h1>
        <p className="mb-0 mt-2 max-w-prose text-sm leading-relaxed text-[var(--text-muted)]">
          Ces informations représentent votre compte&nbsp;: elles sont distinctes du fil communautaire (Accueil).
        </p>
      </header>

      {feedback ? (
        <p className="message m-0 rounded-[var(--radius-md)] px-3 py-2" role="status">
          {feedback}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Chargement…</p>
      ) : (
        <section className="dash-section space-y-5">
          <div className="min-w-0 border-b border-[var(--dash-card-border)] pb-5">
            <p className="m-0 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Informations générales
            </p>
            <div className="mt-3 flex min-w-0 flex-wrap items-center gap-4">
              <Avatar nom={user?.nom ?? detail?.nom} avatarUrl={user?.avatar_url ?? detail?.avatar_url} size="xl" />
              <p className="logo-text m-0 mb-1 text-xl font-semibold text-[var(--text-main)]">
                {user?.nom ?? detail?.nom}
              </p>
            </div>
            <p className="mb-0 mt-1 break-all text-sm text-[var(--text-muted)]">{user?.email ?? detail?.email}</p>
            <p className="mb-0 mt-3 text-sm text-[var(--text-muted)]">
              Réputation agrégée :{" "}
              <span className="font-semibold tabular-nums text-[var(--text-main)]">
                {detail?.average_rating != null ? Number(detail.average_rating).toFixed(1) : "—"}
              </span>{" "}
              ·{" "}
              <span className="tabular-nums">{detail?.total_reviews ?? 0} avis</span>
              {" · "}Crédibilité :{" "}
              <span className="font-semibold tabular-nums text-[var(--text-main)]">
                {Number(detail?.credibility_score || 0).toFixed(1)}
              </span>
            </p>
          </div>

          <form className="flex w-full min-w-0 flex-col gap-3" onSubmit={(e) => void submitBio(e)}>
            <div>
              <label htmlFor="profil-bio" className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                Présentation visible sur les cartes communautaires
              </label>
              <textarea
                id="profil-bio"
                className="simple-input box-border min-h-[7rem] w-full max-w-full resize-y"
                placeholder="Quelques lignes sur vous, vos passions, ce que vous aimez enseigner ou apprendre…"
                value={bioDraft}
                maxLength={2000}
                onChange={(e) => setBioDraft(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-full min-h-11 shrink-0 sm:ml-auto sm:w-auto sm:max-w-xs"
              disabled={savingBio}
            >
              {savingBio ? "Enregistrement…" : "Enregistrer"}
            </button>
          </form>

          <div className="flex flex-col gap-2 border-t border-[var(--dash-card-border)] pt-5 sm:flex-row sm:flex-wrap sm:gap-3">
            <Link
              to="/app/dashboard"
              className="btn btn-ghost-light w-full min-h-11 text-center no-underline sm:w-auto"
            >
              Mon espace (compétences)
            </Link>
            {(user?.id ?? detail?.id) != null ? (
              <Link
                to={`/app/profile/${encodeURIComponent(String(user?.id ?? detail?.id))}`}
                className="btn btn-ghost-light w-full min-h-11 text-center no-underline sm:w-auto"
              >
                Aperçu public de mon profil
              </Link>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}
