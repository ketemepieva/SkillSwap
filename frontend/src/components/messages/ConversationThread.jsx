import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../api/client.js";
import { Avatar } from "../Avatar.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { formatRelativeTimeFr } from "../../utils/time.js";
import { TutoringSessionPanel } from "./TutoringSessionPanel.jsx";

/** Rafraîchissement silencieux du fil ouvert (nouveaux messages). */
const THREAD_POLL_MS = 15_000;

/**
 * Fil de discussion embarqué dans la page Messages (volet droit).
 * Monter avec `key={peerId}` pour réinitialiser l'état à chaque conversation.
 *
 * @param {{ peerId: string,
 *           initialPeerName?: string|null,
 *           initialPeerAvatarUrl?: string|null,
 *           onThreadRead?: (peerId: string) => void,
 *           onActivity?: () => void }} props
 */
export function ConversationThread({
  peerId,
  initialPeerName = null,
  initialPeerAvatarUrl = null,
  onThreadRead,
  onActivity,
}) {
  const { token, user } = useAuth();
  const [peerName, setPeerName] = useState(initialPeerName);
  const [peerAvatarUrl, setPeerAvatarUrl] = useState(initialPeerAvatarUrl);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [draft, setDraft] = useState("");
  const scrollRef = useRef(null);
  const prevCountRef = useRef(-1);

  const loadThread = useCallback(
    async ({ silent = false } = {}) => {
      if (!peerId) return;
      if (!silent) {
        setLoading(true);
        setFeedback("");
      }
      try {
        const data = await apiFetch(`/api/messages/with/${encodeURIComponent(peerId)}`, { token });
        setMessages(Array.isArray(data?.messages) ? data.messages : []);
        if (data?.peer?.nom) setPeerName(data.peer.nom);
        if (data?.peer && "avatar_url" in data.peer) {
          setPeerAvatarUrl(data.peer.avatar_url || null);
        }
        onThreadRead?.(peerId);
      } catch (e) {
        if (!silent) {
          setFeedback(e.message || "Conversation introuvable.");
          setMessages([]);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [token, peerId, onThreadRead]
  );

  useEffect(() => {
    const tid = window.setTimeout(() => void loadThread(), 0);
    const intervalId = window.setInterval(() => void loadThread({ silent: true }), THREAD_POLL_MS);
    return () => {
      window.clearTimeout(tid);
      window.clearInterval(intervalId);
    };
  }, [loadThread]);

  /* Auto-scroll en bas du volet (sans faire défiler la page entière) */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (messages.length !== prevCountRef.current) {
      el.scrollTop = el.scrollHeight;
      prevCountRef.current = messages.length;
    }
  }, [messages, loading]);

  const send = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending || !peerId) return;
    setSending(true);
    setFeedback("");
    try {
      await apiFetch("/api/messages/send", {
        method: "POST",
        token,
        body: { to_user_id: Number(peerId), body: text },
      });
      setDraft("");
      await loadThread({ silent: true });
      onActivity?.();
    } catch (err) {
      setFeedback(err.message || "Envoi impossible.");
    } finally {
      setSending(false);
    }
  };

  const uid = user?.id;

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-2xl border-2 border-sky-500/20 bg-[color-mix(in_srgb,var(--grid-input-bg)_94%,#0ea5e9_6%)] shadow-[var(--shadow-soft)]">
      {/* En-tête du fil */}
      <div className="flex shrink-0 items-center gap-3 border-b border-sky-500/20 bg-[color-mix(in_srgb,var(--dash-card-bg)_92%,transparent)] px-3 py-2.5 sm:px-4">
        <Link
          to="/app/messages"
          className="inline-flex flex-none items-center justify-center rounded-xl border border-[var(--dash-card-border)] bg-[var(--dash-card-bg)] text-[var(--text-main)] no-underline shadow-[var(--shadow-soft)] transition hover:bg-[var(--tab-hover-bg)] md:hidden"
          style={{ width: "2.5rem", height: "2.5rem" }}
          aria-label="Retour aux conversations"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            className="flex-none"
            aria-hidden
          >
            <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <Avatar nom={peerName || undefined} avatarUrl={peerAvatarUrl} size="md" className="flex-none" />
        <div className="min-w-0 flex-1 pl-0.5">
          <Link
            to={`/app/profile/${encodeURIComponent(peerId)}`}
            className="block truncate text-sm font-bold leading-tight text-[var(--text-main)] no-underline hover:underline"
          >
            {peerName || `Membre #${peerId}`}
          </Link>
          <p className="m-0 mt-0.5 text-[11px] leading-none text-[var(--text-muted)]">Chat privé</p>
        </div>
      </div>

      {/* Session de tutorat entre les deux membres */}
      <TutoringSessionPanel peerId={peerId} peerName={peerName} />

      {/* Messages */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <p className="p-5 text-sm text-[var(--text-muted)]">Chargement…</p>
        ) : messages.length === 0 ? (
          <p className="mx-auto mb-0 max-w-sm px-5 py-10 text-center text-sm text-[var(--text-muted)]">
            Pas encore de message — écrivez le premier ci‑dessous.
          </p>
        ) : (
          <ul className="m-0 flex w-full list-none flex-col gap-3 p-3 sm:p-4">
            {messages.map((m) => {
              const mine = Number(m.from_user_id) === Number(uid);
              return (
                <li
                  key={m.id}
                  className={`flex w-full min-w-0 items-end ${mine ? "justify-end" : "justify-start gap-2"}`}
                >
                  {!mine ? (
                    <Avatar
                      nom={peerName || undefined}
                      avatarUrl={peerAvatarUrl}
                      size="sm"
                      className="mb-0.5 shrink-0"
                    />
                  ) : null}
                  <div
                    className={`min-w-0 max-w-[min(100%,20rem)] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-[var(--shadow-soft)] sm:max-w-md ${
                      mine
                        ? "bg-sky-600 text-white"
                        : "border border-sky-500/25 bg-[var(--section-row-bg)] text-[var(--text-main)]"
                    }`}
                  >
                    <p className="mb-0 break-words">{m.body}</p>
                    <p
                      className={`mb-0 mt-1 text-[10px] opacity-85 ${mine ? "text-white/90" : "text-[var(--text-muted)]"} tabular-nums`}
                    >
                      {formatRelativeTimeFr(m.created_at)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {feedback ? (
        <p className="message m-0 shrink-0 border-t border-sky-500/20 px-3 py-2 text-sm" role="status">
          {feedback}
        </p>
      ) : null}

      {/* Saisie */}
      <form
        className="flex shrink-0 items-stretch gap-2 border-t border-sky-500/20 bg-[color-mix(in_srgb,var(--dash-card-bg)_92%,transparent)] p-2.5 sm:p-3"
        onSubmit={(e) => void send(e)}
      >
        <label className="sr-only" htmlFor="thread-input">
          Votre message
        </label>
        <input
          id="thread-input"
          className="simple-input box-border min-h-11 min-w-0 w-full flex-1"
          placeholder="Écrire un message…"
          value={draft}
          maxLength={4000}
          onChange={(e) => setDraft(e.target.value)}
          disabled={!peerId || sending}
          autoComplete="off"
        />
        <button
          type="submit"
          className="btn btn-primary box-border min-h-11 shrink-0 bg-sky-600 px-4 sm:min-w-[6.5rem]"
          disabled={!draft.trim() || sending}
        >
          Envoyer
        </button>
      </form>
    </div>
  );
}
