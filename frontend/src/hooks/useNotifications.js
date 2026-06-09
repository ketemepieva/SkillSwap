import { useContext } from "react";
import { NotificationsContext } from "../context/notifications-context.js";

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications doit être utilisé sous NotificationsProvider");
  return ctx;
}
