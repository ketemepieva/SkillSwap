import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { AppShellLayout } from "./components/AppShellLayout.jsx";
import { NotificationsProvider } from "./context/NotificationsContext.jsx";
import { useAuth } from "./hooks/useAuth.js";
import { AuthPage } from "./pages/AuthPage.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { PlatformHomePage } from "./pages/PlatformHomePage.jsx";
import { MyProfilePage } from "./pages/MyProfilePage.jsx";
import { LandingPage } from "./pages/LandingPage.jsx";
import { MessagesPage } from "./pages/MessagesPage.jsx";
import { NotificationsPage } from "./pages/NotificationsPage.jsx";
import { UserProfilePage } from "./pages/UserProfilePage.jsx";
import { ExchangesPage } from "./pages/ExchangesPage.jsx";
import { SettingsPage } from "./pages/SettingsPage.jsx";

function RedirectToAppProfile() {
  const { userId } = useParams();
  return <Navigate to={`/app/profile/${userId ?? ""}`} replace />;
}

function RedirectToAppMessages() {
  const { id } = useParams();
  return <Navigate to={`/app/messages/${id ?? ""}`} replace />;
}

function RedirectToAppEchanges() {
  return <Navigate to="/app/echanges" replace />;
}

function AuthRoute({ initialMode }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="auth-page auth-page--dark" style={{ minHeight: "100vh", placeContent: "center", display: "grid" }}>
        <p style={{ color: "#94a3b8" }}>Chargement…</p>
      </div>
    );
  }

  if (user) {
    const from = location.state?.from;
    const target = typeof from === "string" && from.startsWith("/app") ? from : "/app/dashboard";
    return <Navigate to={target} replace />;
  }

  return <AuthPage initialMode={initialMode} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthRoute initialMode="login" />} />
      <Route path="/inscription" element={<AuthRoute initialMode="register" />} />
      {/* Alias hors /app — même écran une fois connecté */}
      <Route path="/profile/:userId" element={<RedirectToAppProfile />} />
      <Route path="/echanges" element={<RedirectToAppEchanges />} />
      <Route path="/messages/:id" element={<RedirectToAppMessages />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <NotificationsProvider>
              <AppShellLayout />
            </NotificationsProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<PlatformHomePage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="profil" element={<MyProfilePage />} />
        <Route path="messages/:conversationId" element={<MessagesPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="profile/:userId" element={<UserProfilePage />} />
        <Route path="echanges" element={<ExchangesPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="parametres" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
