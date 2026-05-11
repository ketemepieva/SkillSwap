import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import { Avatar } from "../components/Avatar.jsx";
import { useAuth } from "../hooks/useAuth.js";

export function UserProfilePage() {
  const { userId } = useParams();
  const { token, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const viewSentRef = useRef(false);

  const load = useCallback(async () => {
    const idParam = userId ?? "";
    if (!idParam) return;
    setLoading(true);
    setFeedback("");
    try {
      const raw = await apiFetch(`/api/profile/member/${encodeURIComponent(idParam)}`, { token });
      setData(raw && typeof raw === "object" ? raw : null);
    } catch (e) {
      setFeedback(e.message || "Profil introuvable.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token, userId]);

  useEffect(() => {
    viewSentRef.current = false;
    const tid = window.setTimeout(() => void load(), 0);
    return () => clearTimeout(tid);
  }, [load]);

  useEffect(() => {
    const idParam = userId ?? "";
    if (!idParam || !token || viewSentRef.current) return;
    const oid = Number(idParam);
    if (!Number.isFinite(oid) || oid === Number(user?.id)) return;

    const key = `skillswap_profile_view_${user?.id ?? "anon"}_${idParam}`;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(key)) {
      viewSentRef.current = true;
      return;
    }

    viewSentRef.current = true;
    void (async () => {
      try {
        await apiFetch(`/api/profile/member/${encodeURIComponent(idParam)}/view`, {
          method: "POST",
          token,
          body: {},
        });
        try {
          sessionStorage.setItem(key, "1");
        } catch {
          /* privé / quotas */
        }
      } catch {
        viewSentRef.current = false;
      }
    })();
  }, [token, user?.id, userId]);

  const profile = data?.profile;
  const mine = Number(user?.id) === Number(userId);
  const badgeLabel =
    profile?.badge_label ||
    (Number(profile?.credibility_score || 0) >= 4
      ? "Expert"
      : Number(profile?.credibility_score || 0) >= 2
        ? "Intermédiaire"
        : "Débutant");

  return (
    <div className="min-w-0">
      <h2 className="logo-text m-0 text-xl font-bold text-[var(--text-main)] sm:text-2xl md:text-3xl">Profil</h2>

      {feedback ? (
        <p className="message mt-4" role="status">
          {feedback}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-8 text-sm text-[var(--text-muted)]">Chargement…</p>
      ) : !profile ? null : (
        <div className="mt-6 space-y-6">
          <div className="simple-panel">
            <div className="flex min-w-0 flex-wrap items-center gap-4">
              <Avatar nom={profile.nom} avatarUrl={profile.avatar_url} size="xl" />
              <div className="min-w-0">
                <p className="m-0 truncate text-lg font-semibold text-[var(--text-main)] sm:text-xl">{profile.nom}</p>
                <p className="mb-0 mt-1 inline-flex items-center gap-1 rounded-full border border-[var(--dash-card-border)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  <span aria-hidden>✦</span>
                  {badgeLabel}
                </p>
              </div>
            </div>
            {profile.bio ? (
              <p className="mb-0 mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-muted)]">{profile.bio}</p>
            ) : (
              <p className="mb-0 mt-3 text-sm text-[var(--text-muted)]">Aucune biographie renseignée.</p>
            )}
            {profile.city || profile.country ? (
              <p className="mb-0 mt-3 text-xs text-[var(--text-muted)]">
                Localisation :{" "}
                <span className="font-medium text-[var(--text-main)]">
                  {profile.city ? profile.city : "Ville non renseignée"}
                  {profile.country ? `, ${profile.country}` : ""}
                </span>
              </p>
            ) : null}
            <p className="mb-0 mt-3 text-xs text-[var(--text-muted)]">
              Crédibilité : <span className="tabular-nums font-medium text-[var(--text-main)]">{Number(profile.credibility_score || 0).toFixed(1)}</span>
            </p>
          </div>

          <section className="simple-panel grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
            <div className="min-w-0">
              <h3 className="m-0 text-sm font-semibold text-[var(--text-main)]">Compétences proposées</h3>
              {data.offered_skills?.length ? (
                <ul className="simple-list mt-3">
                  {data.offered_skills.map((s) => (
                    <li key={s.id}>{s.nom_competence}</li>
                  ))}
                </ul>
              ) : (
                <p className="mb-0 mt-3 text-sm text-[var(--text-muted)]">Aucune proposition listée.</p>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="m-0 text-sm font-semibold text-[var(--text-main)]">Compétences recherchées</h3>
              {data.sought_skills?.length ? (
                <ul className="simple-list mt-3">
                  {data.sought_skills.map((s) => (
                    <li key={s.id}>{s.nom_competence}</li>
                  ))}
                </ul>
              ) : (
                <p className="mb-0 mt-3 text-sm text-[var(--text-muted)]">Aucune recherche listée.</p>
              )}
            </div>
          </section>

          {!mine ? (
            <Link
              to={`/app/messages/${encodeURIComponent(String(profile.id))}`}
              state={{ peerName: profile.nom, peerAvatarUrl: profile.avatar_url ?? null }}
              className="btn btn-primary block w-full text-center no-underline sm:inline-block sm:w-auto"
            >
              Envoyer un message
            </Link>
          ) : (
            <p className="m-0 text-sm text-[var(--text-muted)]">C’est votre propre profil.</p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
            <Link to="/app" className="btn btn-ghost-light block w-full text-center no-underline sm:inline-block sm:w-auto">
              Accueil communautaire
            </Link>
            <Link
              to="/app/dashboard"
              className="btn btn-ghost-light block w-full text-center no-underline sm:inline-block sm:w-auto"
            >
              Mon tableau de bord
            </Link>
            <Link to="/app/notifications" className="btn btn-ghost-light block w-full text-center no-underline sm:inline-block sm:w-auto">
              Notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
