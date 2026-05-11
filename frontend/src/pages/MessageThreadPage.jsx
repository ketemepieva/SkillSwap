import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import { Avatar } from "../components/Avatar.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { formatRelativeTimeFr } from "../utils/time.js";

export function MessageThreadPage() {
  const { conversationId } = useParams();
  const location = useLocation();
  const { token, user } = useAuth();
  const peerId = conversationId ?? "";
  const stateName = typeof location.state?.peerName === "string" ? location.state.peerName : null;
  const stateAvatarUrl = typeof location.state?.peerAvatarUrl === "string" ? location.state.peerAvatarUrl : null;

  const [peerName, setPeerName] = useState(stateName);
  const [peerAvatarUrl, setPeerAvatarUrl] = useState(stateAvatarUrl);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [draft, setDraft] = useState("");
  const bottomRef = useRef(null);

  const loadThread = useCallback(async () => {
    if (!peerId) return;
    setLoading(true);
    setFeedback("");
    try {
      const data = await apiFetch(`/api/messages/with/${encodeURIComponent(peerId)}`, { token });
      const list = Array.isArray(data?.messages) ? data.messages : [];
      setMessages(list);
      if (data?.peer?.nom) setPeerName(data.peer.nom);
      if (data?.peer && "avatar_url" in data.peer) {
        setPeerAvatarUrl(data.peer.avatar_url || null);
      }
    } catch (e) {
      setFeedback(e.message || "Conversation introuvable.");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [token, peerId]);

  useEffect(() => {
    const tid = window.setTimeout(() => void loadThread(), 0);
    return () => clearTimeout(tid);
  }, [loadThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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
      await loadThread();
    } catch (err) {
      setFeedback(err.message || "Envoi impossible.");
    } finally {
      setSending(false);
    }
  };

  const uid = user?.id;

  return (
    <div className="flex min-w-0 flex-col gap-6 md:gap-8">
      <div className="min-w-0">
        <h2 className="logo-text m-0 text-xl font-bold text-[var(--text-main)] sm:text-2xl md:text-3xl">
          Conversation
        </h2>
        <div className="mb-0 mt-2 flex min-w-0 flex-wrap items-center gap-3 text-sm text-[var(--text-muted)]">
          <Avatar nom={peerName || undefined} avatarUrl={peerAvatarUrl} size="md" />
          <p className="m-0 flex flex-wrap items-baseline gap-x-1 gap-y-0">
            {peerName ? (
              <>
                <span>Avec</span>
                <span className="font-semibold text-[var(--text-main)]">{peerName}</span>
                <span aria-hidden>·</span>
              </>
            ) : null}
            <span className="tabular-nums text-[var(--text-main)]">#{peerId}</span>
          </p>
        </div>
      </div>

      {feedback ? (
        <p className="message m-0 rounded-[var(--radius-md)] px-3 py-2" role="status">
          {feedback}
        </p>
      ) : null}

      <section className="dash-section overflow-hidden p-0">
        <div className="box-border flex min-h-[10rem] w-full flex-col">
          {loading ? (
            <p className="p-5 text-sm text-[var(--text-muted)]">Chargement…</p>
          ) : messages.length === 0 ? (
            <p className="mx-auto mb-0 max-w-sm px-5 py-10 text-center text-sm text-[var(--text-muted)]">
              Pas encore de message — utilisez le formulaire ci‑dessous pour écrire le premier.
            </p>
          ) : (
            <ul className="m-0 flex max-h-[min(420px,55vh)] w-full flex-col gap-3 overflow-y-auto p-4 sm:p-5">
              {messages.map((m) => {
                const mine = Number(m.from_user_id) === Number(uid);
                return (
                  <li
                    key={m.id}
                    className={`flex w-full min-w-0 items-end ${mine ? "justify-end" : "justify-start gap-2"}`}
                  >
                    {!mine ? (
                      <Avatar nom={peerName || undefined} avatarUrl={peerAvatarUrl} size="sm" className="mb-0.5 shrink-0" />
                    ) : null}
                    <div
                      className={`max-w-[min(100%,20rem)] min-w-0 rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-[var(--shadow-soft)] sm:max-w-md ${
                        mine
                          ? "bg-[var(--accent)] text-white"
                          : "border border-[var(--dash-card-border)] bg-[var(--section-row-bg)] text-[var(--text-main)]"
                      }`}
                    >
                      <p className="mb-0 break-words">{m.body}</p>
                      <p
                        className={`mb-0 mt-1 text-[10px] opacity-85 sm:text-xs ${mine ? "text-white/90" : "text-[var(--text-muted)]"} tabular-nums`}
                      >
                        {formatRelativeTimeFr(m.created_at)}
                      </p>
                    </div>
                  </li>
                );
              })}
              <li ref={bottomRef} className="h-1 shrink-0" aria-hidden />
            </ul>
          )}
        </div>
      </section>

      <section className="dash-section">
        <h3 className="logo-text mb-4 m-0 text-base font-semibold text-[var(--text-main)]">Nouveau message</h3>
        <form
          className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-3"
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
            className="btn btn-primary box-border min-h-11 w-full shrink-0 sm:w-auto sm:min-w-[6.75rem]"
            disabled={!draft.trim() || sending}
          >
            Envoyer
          </button>
        </form>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-3">
        <Link to="/app/messages" className="btn btn-ghost-light w-full text-center no-underline box-border sm:w-auto">
          Toutes les conversations
        </Link>
        <Link to="/app/notifications" className="btn btn-ghost-light w-full text-center no-underline box-border sm:w-auto">
          Notifications
        </Link>
      </div>
    </div>
  );
}
