import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import { Avatar } from "../components/Avatar.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { formatRelativeTimeFr } from "../utils/time.js";
import { getNotificationLocation, getNotificationMessage } from "./notifications/types.js";

const DEFAULT_CATEGORY = "Divers";
const DEFAULT_LEVEL = "Debutant";

const SKILL_GRID =
  "grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3 w-full min-w-0 [&>*]:min-w-0";

function SkillCard({ label, skillId, onRemove }) {
  return (
    <article className="flex flex-col gap-4 rounded-xl border border-[var(--dash-card-border)] bg-[color-mix(in_srgb,var(--grid-input-bg)_92%,transparent)] p-4">
      <p className="m-0 flex-1 break-words text-sm font-medium leading-snug text-[var(--text-main)] sm:text-[0.95rem]">
        {label}
      </p>
      <button
        type="button"
        className="btn btn-ghost-light mt-auto w-full min-h-10 text-sm shrink-0 sm:min-h-0"
        onClick={() => void onRemove(skillId)}
      >
        Retirer
      </button>
    </article>
  );
}

function SectionHeader({ title, description, actionLabel, onAction }) {
  return (
    <div className="mb-5 flex w-full min-w-0 flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0 flex-1">
        <h3 className="logo-text m-0 text-lg font-semibold tracking-tight text-[var(--text-main)]">{title}</h3>
        {description ? (
          <p className="mb-0 mt-1 max-w-prose text-sm leading-relaxed text-[var(--text-muted)]">{description}</p>
        ) : null}
      </div>
      {actionLabel ? (
        <button
          type="button"
          className="btn btn-primary box-border w-full min-h-11 shrink-0 sm:mt-0 sm:w-auto sm:min-w-0"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

const PREVIEW_NOTIF = 6;
const PREVIEW_MSG = 5;

/**
 * Tableau de bord personnel uniquement — pas de fil communautaire ici.
 */
export function DashboardPage() {
  const { token, user } = useAuth();
  const [skills, setSkills] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [loadingFeeds, setLoadingFeeds] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [modal, setModal] = useState(null);
  const [newName, setNewName] = useState("");

  const loadAll = useCallback(async () => {
    setLoadingSkills(true);
    setLoadingFeeds(true);
    setFeedback("");
    try {
      const [skillData, notifData, convData] = await Promise.all([
        apiFetch("/api/skills/my-skills", { token }),
        apiFetch("/api/notifications", { token }),
        apiFetch("/api/messages/conversations", { token }),
      ]);
      setSkills(Array.isArray(skillData) ? skillData : []);
      setNotifications(Array.isArray(notifData) ? notifData.slice(0, PREVIEW_NOTIF) : []);
      setConversations(Array.isArray(convData) ? convData.slice(0, PREVIEW_MSG) : []);
    } catch (e) {
      setFeedback(e.message || "Certaines données n’ont pas pu être chargées.");
      setSkills([]);
      setNotifications([]);
      setConversations([]);
    } finally {
      setLoadingSkills(false);
      setLoadingFeeds(false);
    }
  }, [token]);

  useEffect(() => {
    const tid = window.setTimeout(() => void loadAll(), 0);
    return () => clearTimeout(tid);
  }, [loadAll]);

  const offered = skills.filter((s) => Number(s.is_offer) === 1);
  const sought = skills.filter((s) => Number(s.is_offer) === 0);

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
      await loadAll();
    } catch (err) {
      setFeedback(err.message || "Erreur à l’ajout.");
    }
  };

  const removeSkill = async (skillId) => {
    if (!window.confirm("Retirer cette entrée du profil ?")) return;
    setFeedback("");
    try {
      await apiFetch(`/api/skills/${skillId}`, { method: "DELETE", token });
      await loadAll();
    } catch (err) {
      setFeedback(err.message || "Impossible de supprimer.");
    }
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-10 md:gap-12">
      <div className="min-w-0">
        <h1 className="logo-text m-0 text-xl font-bold text-[var(--text-main)] sm:text-2xl md:text-3xl">
          Tableau de bord
        </h1>
        <p className="mb-0 mt-2 max-w-prose text-sm leading-relaxed text-[var(--text-muted)]">
          Vue personnelle&nbsp;: vos compétences, alertes récentes et messages. Pour parcourir les autres membres,
          utilisez&nbsp;
          <Link to="/app" className="font-semibold text-[var(--accent)] underline underline-offset-2 hover:no-underline">
            Accueil
          </Link>
          .
        </p>
        <p className="mb-0 mt-1 text-xs text-[var(--text-muted)]">Connecté : {user?.nom}</p>
      </div>

      {feedback ? (
        <p className="message m-0 rounded-[var(--radius-md)] px-3 py-2" role="status">
          {feedback}
        </p>
      ) : null}

      {/* Notifications en premier pour un accès rapide */}
      <section className="dash-section">
        <div className="mb-5 flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h3 className="logo-text m-0 text-lg font-semibold tracking-tight text-[var(--text-main)]">Mes notifications</h3>
            <p className="mb-0 mt-1 text-sm leading-relaxed text-[var(--text-muted)]">
              Aperçu — cliquez pour ouvrir le profil, l’échange ou la conversation.
            </p>
          </div>
          <Link
            to="/app/notifications"
            className="btn btn-ghost-light w-full min-h-11 shrink-0 box-border text-center no-underline sm:w-auto"
          >
            Voir tout
          </Link>
        </div>
        {loadingFeeds ? (
          <p className="mb-0 text-sm text-[var(--text-muted)]">Chargement…</p>
        ) : notifications.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--dash-card-border)] bg-[color-mix(in_srgb,var(--grid-input-bg)_88%,transparent)] px-4 py-10 text-center">
            <p className="m-0 text-sm text-[var(--text-muted)]">Aucune notification.</p>
          </div>
        ) : (
          <ul className="m-0 flex w-full min-w-0 list-none flex-col gap-3 p-0">
            {notifications.map((n) => {
              const unread = !n.read;
              return (
                <li key={n.id} className="min-w-0">
                  <Link
                    to={getNotificationLocation(n)}
                    className={`notification-card flex w-full max-w-full min-w-0 box-border flex-col gap-2 rounded-xl border border-[var(--dash-card-border)] bg-[color-mix(in_srgb,var(--dash-card-bg)_96%,transparent)] px-4 py-3 text-left text-inherit no-underline shadow-[var(--shadow-soft)] transition sm:px-5 sm:py-4 ${
                      unread ? "ring-1 ring-[var(--accent)]/35" : ""
                    }`}
                  >
                    <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <div className="flex min-w-0 flex-1 gap-3 sm:items-start">
                        <Avatar
                          nom={n.related_user_nom}
                          avatarUrl={n.related_user_avatar_url}
                          size="sm"
                          className="mt-0.5 shrink-0"
                        />
                        <p className="m-0 min-w-0 flex-1 break-words text-sm font-semibold text-[var(--text-main)]">
                          {getNotificationMessage(n)}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs whitespace-nowrap text-[var(--text-muted)] tabular-nums">
                        {formatRelativeTimeFr(n.created_at)}
                      </span>
                    </div>
                    {unread ? <span className="text-xs font-medium text-[var(--accent)]">Non lu</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="dash-section">
        <div className="mb-5 flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h3 className="logo-text m-0 text-lg font-semibold tracking-tight text-[var(--text-main)]">Mes messages récents</h3>
            <p className="mb-0 mt-1 text-sm leading-relaxed text-[var(--text-muted)]">
              Accès rapide — la liste complète est dans l’entrée Messages.
            </p>
          </div>
          <Link
            to="/app/messages"
            className="btn btn-ghost-light w-full min-h-11 shrink-0 box-border text-center no-underline sm:w-auto"
          >
            Toutes les conversations
          </Link>
        </div>
        {loadingFeeds ? (
          <p className="mb-0 text-sm text-[var(--text-muted)]">Chargement…</p>
        ) : conversations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--dash-card-border)] bg-[color-mix(in_srgb,var(--grid-input-bg)_88%,transparent)] px-4 py-10 text-center">
            <p className="m-0 text-sm text-[var(--text-muted)]">Aucune conversation.</p>
          </div>
        ) : (
          <ul className="m-0 flex w-full min-w-0 flex-col gap-3 p-0 [&>li]:min-w-0">
            {conversations.map((c) => {
              const peerId = String(c.peer_user_id);
              const unread = Number(c.unread_count) > 0;
              return (
                <li key={peerId}>
                  <Link
                    to={`/app/messages/${encodeURIComponent(peerId)}`}
                    state={{ peerName: c.peer_nom ?? null, peerAvatarUrl: c.peer_avatar_url ?? null }}
                    className="flex w-full max-w-full min-w-0 box-border flex-col gap-2 rounded-xl border border-[var(--dash-card-border)] bg-[color-mix(in_srgb,var(--grid-input-bg)_90%,transparent)] px-4 py-3 text-left text-inherit no-underline shadow-[var(--shadow-soft)] transition sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-4"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <Avatar nom={c.peer_nom} avatarUrl={c.peer_avatar_url} size="sm" className="mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="m-0 truncate text-sm font-semibold text-[var(--text-main)]">
                          {c.peer_nom || `Membre #${peerId}`}
                        </p>
                        <p className="mb-0 mt-1 line-clamp-2 text-sm leading-snug text-[var(--text-muted)]">{c.last_body}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-row items-center justify-between gap-2 sm:flex-col sm:items-end">
                      <span className="text-xs text-[var(--text-muted)]">{formatRelativeTimeFr(c.last_at)}</span>
                      {unread ? (
                        <span className="inline-flex min-h-6 min-w-6 items-center justify-center rounded-full bg-[var(--accent)] px-2 text-[11px] font-bold tabular-nums text-white">
                          {c.unread_count}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="dash-section">
        <SectionHeader
          title="Mes compétences proposées"
          description="Ce que vous enseignez ou proposez aux autres membres."
          actionLabel="Ajouter une compétence"
          onAction={() => setModal("offer")}
        />
        {loadingSkills ? (
          <p className="mb-0 text-sm text-[var(--text-muted)]">Chargement…</p>
        ) : offered.length === 0 ? (
          <p className="mb-0 text-sm text-[var(--text-muted)]">Aucune entrée pour le moment.</p>
        ) : (
          <div className={SKILL_GRID}>
            {offered.map((s) => (
              <SkillCard key={s.id} label={s.nom_competence} skillId={s.id} onRemove={removeSkill} />
            ))}
          </div>
        )}
      </section>

      <section className="dash-section">
        <SectionHeader
          title="Mes compétences recherchées"
          description="Ce que vous aimeriez apprendre via la communauté."
          actionLabel="Ajouter une compétence recherchée"
          onAction={() => setModal("seek")}
        />
        {loadingSkills ? (
          <p className="mb-0 text-sm text-[var(--text-muted)]">Chargement…</p>
        ) : sought.length === 0 ? (
          <p className="mb-0 text-sm text-[var(--text-muted)]">Aucune entrée pour le moment.</p>
        ) : (
          <div className={SKILL_GRID}>
            {sought.map((s) => (
              <SkillCard key={s.id} label={s.nom_competence} skillId={s.id} onRemove={removeSkill} />
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
            aria-labelledby="dash-skill-modal-title"
            className="w-full max-w-md box-border rounded-2xl border border-[var(--dash-card-border)] bg-[var(--dash-card-bg)] p-5 shadow-[var(--shadow-strong)] sm:p-6"
            onClick={(ev) => ev.stopPropagation()}
          >
            <h4 id="dash-skill-modal-title" className="logo-text m-0 text-base text-[var(--text-main)] sm:text-lg">
              {modal === "offer" ? "Nouvelle compétence" : "Compétence recherchée"}
            </h4>
            <p className="mb-0 mt-2 text-sm text-[var(--text-muted)]">Indiquez un intitulé court (ex. : anglais, couture, Excel).</p>
            <form className="mt-4 flex w-full min-w-0 flex-col gap-3" onSubmit={submitAdd}>
              <input
                className="simple-input box-border min-h-11 w-full max-w-full"
                autoFocus
                placeholder="Ex. : Photographie"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={120}
              />
              <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2">
                <button type="button" className="btn btn-ghost-light w-full min-h-11 sm:w-auto" onClick={closeModal}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary w-full min-h-11 sm:w-auto" disabled={!newName.trim()}>
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
