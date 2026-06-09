import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import { Avatar } from "../components/Avatar.jsx";
import { ConversationThread } from "../components/messages/ConversationThread.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { formatRelativeTimeFr } from "../utils/time.js";

/**
 * Messagerie en vue unique : liste des conversations (volet gauche)
 * + fil de discussion (volet droit) sur la même page.
 * Sur mobile : la liste et le fil s'affichent en alternance.
 */
export function MessagesPage() {
  const { token } = useAuth();
  const { conversationId } = useParams();
  const location = useLocation();
  const selectedId = conversationId ?? null;
  const stateName = typeof location.state?.peerName === "string" ? location.state.peerName : null;
  const stateAvatarUrl = typeof location.state?.peerAvatarUrl === "string" ? location.state.peerAvatarUrl : null;

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
        setFeedback("");
      }
      try {
        const data = await apiFetch("/api/messages/conversations", { token });
        setConversations(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!silent) {
          setFeedback(e.message || "Impossible de charger les conversations.");
          setConversations([]);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    const tid = window.setTimeout(() => void load(), 0);
    return () => clearTimeout(tid);
  }, [load]);

  /** Le fil ouvert a été lu : retire le compteur non-lu de la liste. */
  const markConversationRead = useCallback((peerId) => {
    setConversations((prev) =>
      prev.map((c) => (String(c.peer_user_id) === String(peerId) ? { ...c, unread_count: 0 } : c))
    );
  }, []);

  const refreshListSilently = useCallback(() => void load({ silent: true }), [load]);

  const totalUnread = conversations.reduce((n, c) => n + Math.max(0, Number(c.unread_count) || 0), 0);
  const selectedConv =
    selectedId != null
      ? conversations.find((c) => String(c.peer_user_id) === String(selectedId)) ?? null
      : null;

  return (
    <div className="w-full min-w-0">
      {/* En-tête — masqué sur mobile quand un fil est ouvert (gain de place) */}
      <section
        className={`${selectedId ? "hidden md:block" : ""} mb-6 overflow-hidden rounded-2xl border-2 border-sky-500/25 bg-gradient-to-br from-sky-500/15 via-blue-500/10 to-[color-mix(in_srgb,var(--dash-card-bg)_92%,transparent)] p-5 shadow-[var(--shadow-soft)] sm:p-6 md:mb-8`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="m-0 flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
              <span
                className="inline-flex flex-none items-center justify-center rounded-lg bg-sky-500 text-white shadow-sm"
                style={{ width: "2rem", height: "2rem" }}
                aria-hidden
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a8 8 0 0 1-8 8H8l-5 3v-3H5a8 8 0 1 1 16 0Z" strokeLinejoin="round" />
                </svg>
              </span>
              Messagerie privée
            </p>
            <h2 className="logo-text m-0 mt-2 text-xl font-bold text-[var(--text-main)] sm:text-2xl md:text-3xl">
              Conversations
            </h2>
            <p className="mb-0 mt-2 max-w-prose text-sm leading-relaxed text-[var(--text-muted)]">
              Chat en direct avec les membres — la conversation s&apos;ouvre juste à côté de la liste.
              Les propositions de compétences sont dans{" "}
              <strong className="font-semibold text-[var(--text-main)]">Échanges</strong>.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
            <Link
              to="/app/echanges"
              className="btn btn-ghost-light shrink-0 self-start text-center text-sm no-underline sm:self-auto"
            >
              Voir les échanges →
            </Link>
            {totalUnread > 0 ? (
              <p className="m-0 inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/15 px-3 py-1.5 text-sm font-semibold text-sky-900 dark:text-sky-100">
                <span className="inline-flex size-2 rounded-full bg-sky-500" aria-hidden />
                {totalUnread} message{totalUnread > 1 ? "s" : ""} non lu{totalUnread > 1 ? "s" : ""}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {feedback ? (
        <p className="message mb-6 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2" role="status">
          {feedback}
        </p>
      ) : null}

      {/* Vue 2 volets : liste | conversation */}
      <div className="min-w-0 md:grid md:h-[clamp(26rem,calc(100dvh-21rem),44rem)] md:grid-cols-[minmax(15rem,21rem)_minmax(0,1fr)] md:items-stretch md:gap-4 lg:gap-5">
        {/* Volet gauche — liste des conversations */}
        <aside
          className={`${selectedId ? "hidden md:flex" : "flex"} min-h-0 min-w-0 flex-col md:h-full`}
          aria-label="Liste des conversations"
        >
          {loading ? (
            <p className="text-sm text-[var(--text-muted)]">Chargement des conversations…</p>
          ) : conversations.length === 0 ? (
            <section className="flex min-h-[14rem] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-sky-500/30 bg-sky-500/5 px-4 py-12 text-center">
              <span
                className="inline-flex flex-none items-center justify-center rounded-2xl bg-sky-500/15 text-sky-500"
                style={{ width: "3.25rem", height: "3.25rem" }}
                aria-hidden
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M21 12a8 8 0 0 1-8 8H8l-5 3v-3H5a8 8 0 1 1 16 0Z" strokeLinejoin="round" />
                </svg>
              </span>
              <p className="m-0 text-sm font-medium text-[var(--text-main)]">Aucune conversation pour le moment</p>
              <p className="m-0 max-w-sm text-xs text-[var(--text-muted)]">
                Ouvrez un profil membre et utilisez « Envoyer un message » pour démarrer un chat privé.
              </p>
            </section>
          ) : (
            <ul className="m-0 flex w-full min-w-0 list-none flex-col gap-2 p-0 md:min-h-0 md:flex-1 md:overflow-y-auto md:pr-1">
              {conversations.map((c) => {
                const peerId = String(c.peer_user_id);
                const unread = Number(c.unread_count) > 0;
                const active = selectedId != null && String(selectedId) === peerId;
                return (
                  <li key={peerId} className="min-w-0">
                    <Link
                      to={`/app/messages/${encodeURIComponent(peerId)}`}
                      state={{ peerName: c.peer_nom ?? null, peerAvatarUrl: c.peer_avatar_url ?? null }}
                      aria-current={active ? "true" : undefined}
                      className={`flex min-w-0 items-center gap-3 rounded-xl border-2 px-3 py-2.5 no-underline shadow-[var(--shadow-soft)] transition ${
                        active
                          ? "border-sky-500/60 bg-sky-500/15"
                          : unread
                            ? "border-sky-500/40 bg-[color-mix(in_srgb,var(--grid-input-bg)_90%,#0ea5e9_10%)]"
                            : "border-sky-500/15 bg-[color-mix(in_srgb,var(--grid-input-bg)_94%,#0ea5e9_6%)] hover:border-sky-500/40"
                      }`}
                    >
                      <div className="relative shrink-0">
                        <Avatar nom={c.peer_nom} avatarUrl={c.peer_avatar_url} size="md" />
                        {unread ? (
                          <span
                            className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-[var(--dash-card-bg)] bg-sky-500"
                            aria-hidden
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className={`m-0 truncate text-sm text-[var(--text-main)] ${unread ? "font-bold" : "font-semibold"}`}>
                            {c.peer_nom || `Membre #${peerId}`}
                          </p>
                          <span className="shrink-0 text-[11px] text-[var(--text-muted)] tabular-nums">
                            {formatRelativeTimeFr(c.last_at)}
                          </span>
                        </div>
                        <p
                          className={`mb-0 mt-0.5 truncate text-xs leading-snug ${
                            unread ? "font-medium text-[var(--text-main)]" : "text-[var(--text-muted)]"
                          }`}
                        >
                          {c.last_body || "—"}
                        </p>
                      </div>
                      {unread ? (
                        <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-sky-500 px-1.5 text-[11px] font-bold tabular-nums text-white">
                          {c.unread_count}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Volet droit — fil de discussion */}
        <section
          className={`${selectedId ? "flex" : "hidden md:flex"} mt-4 min-h-0 min-w-0 flex-col md:mt-0 md:h-full ${
            selectedId ? "h-[clamp(20rem,calc(100dvh-14rem),40rem)] md:h-full" : ""
          }`}
          aria-label="Conversation"
        >
          {selectedId ? (
            <ConversationThread
              key={selectedId}
              peerId={selectedId}
              initialPeerName={selectedConv?.peer_nom ?? stateName}
              initialPeerAvatarUrl={selectedConv?.peer_avatar_url ?? stateAvatarUrl}
              onThreadRead={markConversationRead}
              onActivity={refreshListSilently}
            />
          ) : (
            <div className="flex h-full min-h-[18rem] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-sky-500/25 bg-sky-500/5 px-6 text-center">
              <span
                className="inline-flex flex-none items-center justify-center rounded-2xl bg-sky-500/15 text-sky-500"
                style={{ width: "3.25rem", height: "3.25rem" }}
                aria-hidden
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M21 12a8 8 0 0 1-8 8H8l-5 3v-3H5a8 8 0 1 1 16 0Z" strokeLinejoin="round" />
                </svg>
              </span>
              <p className="m-0 text-sm font-semibold text-[var(--text-main)]">Sélectionnez une conversation</p>
              <p className="m-0 max-w-xs text-xs text-[var(--text-muted)]">
                Cliquez sur un contact dans la liste pour afficher vos échanges et répondre directement ici.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
