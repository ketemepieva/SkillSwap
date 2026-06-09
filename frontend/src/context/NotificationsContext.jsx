import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../api/client.js";
import { useAuth } from "../hooks/useAuth.js";
import { armNotificationSound, playNotificationSound } from "../utils/notificationSound.js";
import { NotificationsContext } from "./notifications-context.js";

/** Intervalle de rafraîchissement du compteur de non-lues. */
const POLL_INTERVAL_MS = 25_000;

/**
 * Fournit le nombre de notifications non lues à toute l'app connectée.
 * Sonde le backend périodiquement et joue un petit son quand de
 * nouvelles notifications arrivent.
 */
export function NotificationsProvider({ children }) {
  const { token } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  // Référence du dernier comptage, liée au token : pas de son au premier
  // fetch d'un compte, ni en cas de changement d'utilisateur.
  const baselineRef = useRef({ token: null, count: null });

  // Remise à zéro de l'affichage au changement de compte (adjust state during render)
  const [lastToken, setLastToken] = useState(token);
  if (token !== lastToken) {
    setLastToken(token);
    setUnreadCount(0);
  }

  useEffect(() => {
    armNotificationSound();
  }, []);

  const refreshUnread = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiFetch("/api/notifications/unread-count", { token });
      const count = Number(data?.count) || 0;
      const prev = baselineRef.current;
      const baseline = prev.token === token ? prev.count : null;
      baselineRef.current = { token, count };
      setUnreadCount(count);
      if (baseline !== null && count > baseline) {
        playNotificationSound();
      }
    } catch {
      /* réseau indisponible : on garde l'ancien compteur */
    }
  }, [token]);

  /** Met à jour le compteur localement (lecture sur la page Notifications) sans jouer de son. */
  const syncUnread = useCallback(
    (count) => {
      const safe = Math.max(0, Number(count) || 0);
      baselineRef.current = { token, count: safe };
      setUnreadCount(safe);
    },
    [token]
  );

  useEffect(() => {
    if (!token) return;

    const tid = window.setTimeout(() => void refreshUnread(), 0);
    const intervalId = window.setInterval(() => void refreshUnread(), POLL_INTERVAL_MS);
    const onVisible = () => {
      if (!document.hidden) void refreshUnread();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearTimeout(tid);
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [token, refreshUnread]);

  const value = useMemo(
    () => ({ unreadCount, refreshUnread, syncUnread }),
    [unreadCount, refreshUnread, syncUnread]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}
