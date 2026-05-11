import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import { Avatar } from "../components/Avatar.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { formatRelativeTimeFr } from "../utils/time.js";

export function MessagesPage() {
  const { token } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setFeedback("");
    try {
      const data = await apiFetch("/api/messages/conversations", { token });
      setConversations(Array.isArray(data) ? data : []);
    } catch (e) {
      setFeedback(e.message || "Impossible de charger les conversations.");
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const tid = window.setTimeout(() => void load(), 0);
    return () => clearTimeout(tid);
  }, [load]);

  return (
    <div className="w-full min-w-0">
      <section className="dash-section mb-8 md:mb-10">
        <h2 className="logo-text m-0 text-xl font-bold text-[var(--text-main)] sm:text-2xl md:text-3xl">Messages</h2>
        <p className="mb-0 mt-2 max-w-prose text-sm leading-relaxed text-[var(--text-muted)]">
          Une colonne sur mobile, alignement stable : rien ne dépasse du cadre.
        </p>
      </section>

      {feedback ? (
        <p className="message mb-6 rounded-[var(--radius-md)] px-3 py-2" role="status">
          {feedback}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Chargement…</p>
      ) : conversations.length === 0 ? (
        <section className="dash-section flex min-h-[12rem] flex-col items-center justify-center gap-2 px-4 py-10 text-center">
          <p className="m-0 text-sm text-[var(--text-muted)]">Aucun message pour le moment.</p>
          <p className="m-0 max-w-xs text-xs text-[var(--text-muted)]">
            Ouvrez un profil membre puis « Envoyer un message » pour démarrer une conversation.
          </p>
        </section>
      ) : (
        <ul className="m-0 flex w-full min-w-0 list-none flex-col gap-4 p-0 md:gap-5">
          {conversations.map((c) => {
            const peerId = String(c.peer_user_id);
            const unread = Number(c.unread_count) > 0;
            return (
              <li key={peerId} className="min-w-0">
                <Link
                  to={`/app/messages/${encodeURIComponent(peerId)}`}
                  state={{ peerName: c.peer_nom ?? null, peerAvatarUrl: c.peer_avatar_url ?? null }}
                  className="flex max-w-full min-w-0 flex-col gap-3 rounded-xl border border-[var(--dash-card-border)] bg-[color-mix(in_srgb,var(--grid-input-bg)_90%,transparent)] px-4 py-3 text-left text-inherit no-underline shadow-[var(--shadow-soft)] transition sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-4"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <Avatar nom={c.peer_nom} avatarUrl={c.peer_avatar_url} size="md" className="mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="m-0 truncate text-sm font-semibold text-[var(--text-main)]">{c.peer_nom || `Membre #${peerId}`}</p>
                      <p className="mb-0 mt-1 line-clamp-2 text-sm leading-snug text-[var(--text-muted)]">{c.last_body}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center">
                    <span className="text-xs whitespace-nowrap text-[var(--text-muted)]">{formatRelativeTimeFr(c.last_at)}</span>
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
    </div>
  );
}
