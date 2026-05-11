/** Base URL vide = requêtes relatives vers le même origine (proxy Vite en dev, ou CDN + API derrière même domaine). */
export const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

/** Message utilisateur lorsque rien ne répond sur le backend (502, hors-ligne, mauvais proxy). */
export const SERVER_UNAVAILABLE =
  "Le serveur SkillSwap est indisponible (vérifiez que le backend tourne et que VITE_DEV_PROXY_TARGET pointe sur le bon port).";

function humanStatusMessage(status, dataMessage) {
  if (status === 502 || status === 503 || status === 504) return SERVER_UNAVAILABLE;
  if (!status) return SERVER_UNAVAILABLE;
  return dataMessage || `Erreur ${status}`;
}

/**
 * Client API JSON (JWT optionnel depuis localStorage ou option `token`).
 * @param {string} path ex: "/api/login"
 */
export async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const { token, body, method = "GET", headers: extraHeaders, ...rest } = options;

  const stored =
    typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
  const bearer = token !== undefined ? token : stored;

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        ...extraHeaders,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...rest,
    });
  } catch (cause) {
    const err = new Error(SERVER_UNAVAILABLE);
    err.status = 0;
    err.cause = cause;
    throw err;
  }

  const rawText = await response.text();
  let data = {};
  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      /* Gateway HTML / texte brute */
      data = {
        message:
          response.status >= 502
            ? SERVER_UNAVAILABLE
            : `Réponse non JSON (${response.status}). Le proxy ou le serveur a peut‑être renvoyé une page d’erreur.`,
      };
    }
  }

  if (!response.ok) {
    const err = new Error(humanStatusMessage(response.status, data.message));
    err.status = response.status;
    err.data = data;
    throw err;
  }
  return data;
}

/**
 * Envoi multipart (ex. avatar) : ne pas forcer Content-Type JSON.
 * @param {string} path
 * @param {{ method?: string, body: FormData, token?: string|null }} options
 */
export async function apiFetchForm(path, options = {}) {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const { body, method = "POST", token } = options;
  const stored =
    typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
  const bearer = token !== undefined ? token : stored;

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      },
      body,
    });
  } catch (cause) {
    const err = new Error(SERVER_UNAVAILABLE);
    err.status = 0;
    err.cause = cause;
    throw err;
  }

  const rawText = await response.text();
  let data = {};
  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = {
        message:
          response.status >= 502
            ? SERVER_UNAVAILABLE
            : `Réponse non JSON (${response.status}).`,
      };
    }
  }

  if (!response.ok) {
    const err = new Error(humanStatusMessage(response.status, data.message));
    err.status = response.status;
    err.data = data;
    throw err;
  }
  return data;
}
