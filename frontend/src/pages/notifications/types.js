/** @typedef {"profile_view" | "exchange_request" | "message" | "system"} NotificationType */

/**
 * Élément renvoyé par `GET /api/notifications`.
 * @typedef {Object} ApiNotification
 * @property {number} id
 * @property {NotificationType} type
 * @property {string|null} related_user_nom
 * @property {number|null} related_user_id
 * @property {string|null} target_id
 * @property {number} read
 * @property {string} created_at
 */

/**
 * Texte affiché pour l’utilisateur (données API).
 * @param {ApiNotification} n
 */
export function getNotificationMessage(n) {
  const name = n.related_user_nom || "Un membre";
  switch (n.type) {
    case "profile_view":
      return `${name} a consulté votre profil`;
    case "exchange_request":
      return `${name} souhaite échanger avec vous`;
    case "message":
      return `${name} vous a envoyé un message`;
    case "system":
      return typeof n.title === "string" && n.title ? n.title : "Actualité plateforme";
    default:
      return "Notification";
  }
}

/**
 * Cible react-router (chemins sous `/app`).
 * @param {ApiNotification} n
 */
export function getNotificationLocation(n) {
  switch (n.type) {
    case "profile_view": {
      const uid = n.related_user_id;
      return uid != null ? { pathname: `/app/profile/${encodeURIComponent(String(uid))}` } : { pathname: "/app/notifications" };
    }
    case "exchange_request":
      return {
        pathname: "/app/echanges",
        state: { highlightExchangeId: n.target_id ?? null },
      };
    case "message": {
      const peer =
        n.target_id ??
        (n.related_user_id != null ? String(n.related_user_id) : "");
      return peer !== ""
        ? { pathname: `/app/messages/${encodeURIComponent(peer)}` }
        : { pathname: "/app/messages" };
    }
    case "system": {
      // Notifications de tutorat : retour vers le chat avec l'interlocuteur concerné
      if (typeof n.target_id === "string" && n.target_id.startsWith("tutoring:") && n.related_user_id != null) {
        return { pathname: `/app/messages/${encodeURIComponent(String(n.related_user_id))}` };
      }
      return { pathname: "/app/notifications" };
    }
    default:
      return { pathname: "/app/notifications" };
  }
}
