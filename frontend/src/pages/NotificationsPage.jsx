import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import { Avatar } from "../components/Avatar.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useNotifications } from "../hooks/useNotifications.js";
import { formatRelativeTimeFr } from "../utils/time.js";
import { getNotificationLocation, getNotificationMessage } from "./notifications/types.js";

export function NotificationsPage() {
  const { token } = useAuth();
  const { syncUnread } = useNotifications();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setFeedback("");
    try {
      const data = await apiFetch("/api/notifications", { token });
      const list = Array.isArray(data) ? data : [];
      setItems(list);
      syncUnread(list.filter((n) => !n.read).length);
    } catch (e) {
      setFeedback(e.message || "Impossible de charger les notifications.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [token, syncUnread]);

  useEffect(() => {
    const tid = window.setTimeout(() => void load(), 0);
    return () => clearTimeout(tid);
  }, [load]);

  const markAndGo = async (e, n) => {
    e.preventDefault();
    if (!n.read) {
      try {
        await apiFetch(`/api/notifications/${n.id}/read`, { method: "PATCH", token });
        setItems((prev) => {
          const next = prev.map((x) => (x.id === n.id ? { ...x, read: 1 } : x));
          syncUnread(next.filter((x) => !x.read).length);
          return next;
        });
      } catch {
        /* navigation même en cas d’échec */
      }
    }
    navigate(getNotificationLocation(n));
  };

  const markAll = async () => {
    setFeedback("");
    try {
      await apiFetch("/api/notifications/read-all", { method: "POST", token });
      setItems((prev) => prev.map((x) => ({ ...x, read: 1 })));
      syncUnread(0);
    } catch (e) {
      setFeedback(e.message || "Action impossible.");
    }
  };

  return (
    <div className="w-full min-w-0">
      <section className="dash-section mb-8 md:mb-10">
        <div className="flex w-full min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 flex-1">
            <h2 className="logo-text m-0 text-xl font-bold text-[var(--text-main)] sm:text-2xl md:text-3xl">
              Notifications
            </h2>
            <p className="mb-0 mt-2 max-w-prose text-sm leading-relaxed text-[var(--text-muted)]">
              Activités et alertes uniquement — pas de messagerie ici. Le chat est dans Messages, les demandes dans
              Échanges.
            </p>
          </div>
          {items.some((n) => !n.read) ? (
            <button
              type="button"
              className="btn btn-ghost-light w-full min-h-11 shrink-0 box-border sm:mt-0 sm:w-auto"
              onClick={() => void markAll()}
            >
              Tout marquer comme lu
            </button>
          ) : null}
        </div>
      </section>

      {feedback ? (
        <p className="message mb-6 rounded-[var(--radius-md)] px-3 py-2" role="status">
          {feedback}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Chargement…</p>
      ) : items.length === 0 ? (
        <section className="dash-section flex min-h-[12rem] flex-col items-center justify-center px-4 py-10 text-center">
          <p className="m-0 max-w-sm text-sm text-[var(--text-muted)]">
            Aucune notification pour le moment.
          </p>
        </section>
      ) : (
        <ul className="m-0 flex w-full min-w-0 list-none flex-col gap-4 p-0 md:gap-5">
          {items.map((n) => {
            const to = getNotificationLocation(n);
            const unread = !n.read;
            return (
              <li key={n.id} className="min-w-0">
                <Link
                  to={to}
                  onClick={(e) => void markAndGo(e, n)}
                  className={`notification-card flex max-w-full min-w-0 flex-col gap-2 rounded-xl border border-[var(--dash-card-border)] bg-[var(--dash-card-bg)] px-4 py-3 text-left no-underline shadow-[var(--shadow-soft)] transition sm:px-5 sm:py-4 ${
                    unread ? "ring-1 ring-[var(--accent)]/35" : ""
                  }`}
                  style={{ color: "inherit" }}
                >
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="flex min-w-0 flex-1 gap-3 sm:items-start">
                      <Avatar
                        nom={n.related_user_nom}
                        avatarUrl={n.related_user_avatar_url}
                        size="md"
                        className="mt-0.5 shrink-0"
                      />
                      <p className="m-0 min-w-0 flex-1 break-words text-sm font-semibold leading-snug text-[var(--text-main)]">
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
    </div>
  );
}
