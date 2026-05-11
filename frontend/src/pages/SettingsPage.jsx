import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { apiFetch, apiFetchForm } from "../api/client.js";
import { Avatar } from "../components/Avatar.jsx";
import { useAuth } from "../hooks/useAuth.js";

function formatDt(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return String(iso);
  }
}

export function SettingsPage() {
  const location = useLocation();
  const { token, user, logout, refreshUser } = useAuth();
  const [detail, setDetail] = useState(null);
  const [bioDraft, setBioDraft] = useState("");
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [savingBio, setSavingBio] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [accountSaving, setAccountSaving] = useState(false);

  const [emailDraft, setEmailDraft] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setFeedback("");
    try {
      const [meProfile, sess] = await Promise.all([
        apiFetch("/api/profile/me", { token }),
        apiFetch("/api/auth/sessions", { token }),
      ]);
      setDetail(meProfile && typeof meProfile === "object" ? meProfile : null);
      const b = typeof meProfile?.bio === "string" ? meProfile.bio : "";
      setBioDraft(b);
      setEmailDraft(typeof meProfile?.email === "string" ? meProfile.email : user?.email || "");
      setSessions(Array.isArray(sess) ? sess : []);
      await refreshUser();
    } catch (e) {
      setFeedback(e.message || "Chargement impossible.");
      setDetail(null);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [token, refreshUser, user]);

  useEffect(() => {
    const tid = window.setTimeout(() => void load(), 0);
    return () => clearTimeout(tid);
  }, [load]);

  useEffect(() => {
    if (loading) return;
    if (location.hash !== "#modifier-compte") return;
    const id = window.setTimeout(() => {
      document.getElementById("modifier-compte")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
    return () => clearTimeout(id);
  }, [loading, location.pathname, location.hash]);

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
      await load();
      setFeedback("Présentation enregistrée.");
    } catch (err) {
      setFeedback(err.message || "Erreur à l’enregistrement.");
    } finally {
      setSavingBio(false);
    }
  };

  const onPickAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setFeedback("");
    try {
      const fd = new FormData();
      fd.append("image", file);
      const data = await apiFetchForm("/api/profile/me/avatar", { token, body: fd });
      if (data?.user) {
        await refreshUser();
      }
      await load();
      setFeedback("Photo de profil mise à jour.");
    } catch (err) {
      setFeedback(err.message || "Envoi de la photo impossible.");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const removeAvatar = async () => {
    setUploadingAvatar(true);
    setFeedback("");
    try {
      await apiFetch("/api/profile/me/avatar", { method: "DELETE", token });
      await refreshUser();
      await load();
      setFeedback("Photo retirée — l’avatar par défaut est affiché.");
    } catch (err) {
      setFeedback(err.message || "Suppression impossible.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const submitAccount = async (e) => {
    e.preventDefault();
    setAccountSaving(true);
    setFeedback("");
    try {
      const body = {};
      const wantEmail = typeof emailDraft === "string" && emailDraft.trim().toLowerCase() !== String(user?.email || "").trim().toLowerCase();
      if (wantEmail) body.email = emailDraft.trim().toLowerCase();
      const np = typeof newPassword === "string" ? newPassword : "";
      if (np.length > 0) body.newPassword = np;
      body.currentPassword = currentPassword;

      if (!wantEmail && np.length === 0) {
        setFeedback("Renseignez un nouvel e-mail ou un nouveau mot de passe, ou utilisez uniquement déconnexion / sessions.");
        setAccountSaving(false);
        return;
      }
      await apiFetch("/api/auth/account", { method: "PATCH", token, body });
      setCurrentPassword("");
      setNewPassword("");
      await load();
      setFeedback("Identifiants du compte mis à jour.");
    } catch (err) {
      setFeedback(err.message || "Mise à jour du compte impossible.");
    } finally {
      setAccountSaving(false);
    }
  };

  const revokeSession = async (id) => {
    setFeedback("");
    try {
      await apiFetch(`/api/auth/sessions/${encodeURIComponent(String(id))}`, { method: "DELETE", token });
      await load();
      setFeedback("Session fermée.");
    } catch (err) {
      setFeedback(err.message || "Action impossible.");
    }
  };

  const revokeOthers = async () => {
    setFeedback("");
    try {
      await apiFetch("/api/auth/sessions/revoke-others", { method: "POST", token, body: {} });
      await load();
      setFeedback("Les autres appareils ont été déconnectés.");
    } catch (err) {
      setFeedback(err.message || "Action impossible.");
    }
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-8 md:gap-10">
      <header className="min-w-0">
        <h1 className="logo-text m-0 text-xl font-bold text-[var(--text-main)] sm:text-2xl md:text-3xl">Paramètres</h1>
        <p className="mb-0 mt-2 max-w-prose text-sm leading-relaxed text-[var(--text-muted)]">
          Compte, profil, sécurité et sessions actives — tout reste enregistré pour vos prochaines connexions.
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
        <>
          <section className="dash-section space-y-4">
            <h2 className="m-0 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">Compte connecté</h2>
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <Avatar nom={user?.nom} avatarUrl={user?.avatar_url} size="xl" />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="logo-text m-0 text-lg font-semibold text-[var(--text-main)]">{user?.nom}</p>
                <p className="m-0 break-all text-sm text-[var(--text-muted)]">{user?.email}</p>
                <p className="m-0 text-sm text-[var(--text-muted)]">
                  Rôle : <span className="font-medium text-[var(--text-main)]">{user?.role || "user"}</span>
                  {" · "}Réputation :{" "}
                  <span className="font-semibold tabular-nums text-[var(--text-main)]">
                    {detail?.average_rating != null ? Number(detail.average_rating).toFixed(1) : "—"}
                  </span>
                  {" · "}
                  <span className="tabular-nums">{detail?.total_reviews ?? 0} avis</span>
                  {" · "}Crédibilité :{" "}
                  <span className="font-semibold tabular-nums text-[var(--text-main)]">
                    {Number(detail?.credibility_score || 0).toFixed(1)}
                  </span>
                </p>
              </div>
            </div>
          </section>

          <section className="dash-section space-y-4">
            <h2 className="m-0 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">Photo de profil</h2>
            <p className="m-0 text-sm text-[var(--text-muted)]">
              JPEG, PNG, WebP ou GIF — 2&nbsp;Mo maximum. Sans photo, vos initiales servent d’avatar.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <label className="btn btn-primary inline-flex min-h-11 cursor-pointer items-center justify-center px-4 text-center">
                <span>{uploadingAvatar ? "Traitement…" : "Choisir une photo"}</span>
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => void onPickAvatar(e)} disabled={uploadingAvatar} />
              </label>
              {(user?.avatar_url || detail?.avatar_url) ? (
                <button
                  type="button"
                  className="btn btn-ghost-light min-h-11"
                  disabled={uploadingAvatar}
                  onClick={() => void removeAvatar()}
                >
                  Retirer la photo
                </button>
              ) : null}
            </div>
          </section>

          <section className="dash-section space-y-4">
            <h2 className="m-0 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">Modifier le profil</h2>
            <form className="flex w-full min-w-0 flex-col gap-3" onSubmit={(e) => void submitBio(e)}>
              <div>
                <label htmlFor="settings-bio" className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                  Présentation publique
                </label>
                <textarea
                  id="settings-bio"
                  className="simple-input box-border min-h-[7rem] w-full max-w-full resize-y"
                  placeholder="Présentez-vous en quelques lignes…"
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
                {savingBio ? "Enregistrement…" : "Enregistrer la présentation"}
              </button>
            </form>
          </section>

          <section id="modifier-compte" className="dash-section scroll-mt-24 space-y-4">
            <h2 className="m-0 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">Modifier le compte</h2>
            <form className="grid w-full min-w-0 grid-cols-1 gap-3 sm:max-w-xl" onSubmit={(e) => void submitAccount(e)}>
              <div>
                <label htmlFor="settings-email" className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                  Adresse e-mail
                </label>
                <input
                  id="settings-email"
                  type="email"
                  autoComplete="email"
                  className="simple-input box-border min-h-11 w-full"
                  value={emailDraft}
                  onChange={(e) => setEmailDraft(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="settings-current-pw" className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                  Mot de passe actuel <span className="text-[var(--text-muted)]">(obligatoire)</span>
                </label>
                <input
                  id="settings-current-pw"
                  type="password"
                  autoComplete="current-password"
                  className="simple-input box-border min-h-11 w-full"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="settings-new-pw" className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                  Nouveau mot de passe <span className="font-normal text-[var(--text-muted)]">(optionnel)</span>
                </label>
                <input
                  id="settings-new-pw"
                  type="password"
                  autoComplete="new-password"
                  className="simple-input box-border min-h-11 w-full"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary mt-2 min-h-11 w-full sm:w-auto" disabled={accountSaving}>
                {accountSaving ? "Enregistrement…" : "Mettre à jour l’accès"}
              </button>
            </form>
          </section>

          <section className="dash-section space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="m-0 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">Sessions actives</h2>
              <button type="button" className="btn btn-ghost-light min-h-10 w-full shrink-0 sm:w-auto" onClick={() => void revokeOthers()}>
                Déconnecter les autres appareils
              </button>
            </div>
            {sessions.filter((s) => !Number(s.revoked)).length === 0 ? (
              <p className="m-0 text-sm text-[var(--text-muted)]">Aucune session enregistrée.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {sessions
                  .filter((s) => !Number(s.revoked))
                  .map((s) => (
                    <li
                      key={s.id}
                      className="flex flex-col gap-2 rounded-xl border border-[var(--dash-card-border)] bg-[color-mix(in_srgb,var(--grid-input-bg)_90%,transparent)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="m-0 text-sm font-medium text-[var(--text-main)]">
                          Session #{s.id}
                          {s.is_current ? (
                            <span className="ml-2 rounded-full bg-[var(--accent)]/15 px-2 py-0.5 text-[11px] font-semibold text-[var(--accent)]">
                              Cette session
                            </span>
                          ) : null}
                        </p>
                        <p className="mb-0 mt-1 break-words text-xs text-[var(--text-muted)]">
                          Ouverte le {formatDt(s.created_at)} · IP {s.ip || "—"}
                        </p>
                        <p className="mb-0 mt-1 line-clamp-2 text-xs text-[var(--text-muted)]" title={s.user_agent || ""}>
                          {s.user_agent?.slice(0, 180) || "—"}
                        </p>
                      </div>
                      {!s.is_current ? (
                        <button type="button" className="btn btn-ghost-light min-h-10 shrink-0" onClick={() => void revokeSession(s.id)}>
                          Fermer
                        </button>
                      ) : null}
                    </li>
                  ))}
              </ul>
            )}
          </section>

          <section className="dash-section flex flex-col gap-3 border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent)_6%,transparent)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="m-0 text-sm font-semibold text-[var(--text-main)]">Terminer votre session SkillSwap sur cet appareil</p>
              <p className="mb-0 mt-1 max-w-md text-xs text-[var(--text-muted)]">
                Déconnexion : vous pourrez vous reconnecter avec vos identifiants.
              </p>
            </div>
            <button type="button" className="btn btn-primary min-h-11 shrink-0" onClick={() => void logout()}>
              Déconnexion
            </button>
          </section>

          <div className="flex flex-wrap gap-2">
            <Link className="btn btn-ghost-light min-h-10 no-underline" to="/app/profil">
              Page Profil (aperçu clair)
            </Link>
            <Link className="btn btn-ghost-light min-h-10 no-underline" to="/app">
              Accueil
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
