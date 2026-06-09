import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import { isAuthPath, resolvePostAuthPath } from "../utils/authRedirect.js";
import { AuthContext } from "./auth-context.js";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const clearSession = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  const applySession = useCallback((jwt, nextUser) => {
    localStorage.setItem("token", jwt);
    localStorage.setItem("user", JSON.stringify(nextUser));
    setToken(jwt);
    setUser(nextUser);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("auth-screen-dark", isAuthPath(location.pathname));
    return () => document.body.classList.remove("auth-screen-dark");
  }, [location.pathname]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const storedToken = localStorage.getItem("token");

      if (!storedToken) {
        if (!cancelled) setReady(true);
        return;
      }

      try {
        const data = await apiFetch("/api/auth/me", { token: storedToken });
        if (cancelled) return;
        localStorage.setItem("user", JSON.stringify(data.user));
        setToken(storedToken);
        setUser(data.user);
      } catch {
        if (!cancelled) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (credentials) => {
      const payload = await apiFetch("/api/login", { method: "POST", body: { email: credentials.email, password: credentials.password } });
      applySession(payload.token, payload.user);
      navigate(resolvePostAuthPath(location.state?.from), { replace: true });
      return payload;
    },
    [applySession, location.state, navigate]
  );

  const register = useCallback(
    async (payload) => {
      const result = await apiFetch("/api/register", {
        method: "POST",
        body: { nom: payload.nom, email: payload.email, password: payload.password },
      });
      applySession(result.token, result.user);
      navigate(resolvePostAuthPath(location.state?.from), { replace: true });
      return result;
    },
    [applySession, location.state, navigate]
  );

  const logout = useCallback(async () => {
    const t =
      typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
    if (t) {
      try {
        await apiFetch("/api/auth/logout", { method: "POST", token: t });
      } catch {
        /* on force la fermeture locale même si le serveur ne répond pas */
      }
    }
    clearSession();
    navigate("/login", { replace: true });
  }, [clearSession, navigate]);

  /** Recharge l’utilisateur depuis le backend (après PATCH profil, etc.). */
  const refreshUser = useCallback(async () => {
    const t = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
    if (!t) return null;
    const data = await apiFetch("/api/auth/me", { token: t });
    if (data?.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
      setToken(t);
      setUser(data.user);
      return data.user;
    }
    return null;
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      ready,
      login,
      register,
      logout,
      refreshUser,
    }),
    [logout, login, ready, refreshUser, register, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
