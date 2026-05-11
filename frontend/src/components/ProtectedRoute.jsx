import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

/**
 * Accessible uniquement si une session JWT valide est disponible (localStorage validé au chargement via /api/auth/me).
 */
export function ProtectedRoute({ children }) {
  const { user, token, ready } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="app-shell" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
        Vérification de la session…
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
