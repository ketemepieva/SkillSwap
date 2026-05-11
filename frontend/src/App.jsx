import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { AppShellLayout } from "./components/AppShellLayout.jsx";
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
import { MessageThreadPage } from "./pages/MessageThreadPage.jsx";
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

function LoginRoute() {
  const { user, ready } = useAuth();

  if (!ready) {
    return (
      <div className="auth-page auth-page--dark" style={{ minHeight: "100vh", placeContent: "center", display: "grid" }}>
        <p style={{ color: "#94a3b8" }}>Chargement…</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return <AuthPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginRoute />} />
      {/* Alias hors /app — même écran une fois connecté */}
      <Route path="/profile/:userId" element={<RedirectToAppProfile />} />
      <Route path="/echanges" element={<RedirectToAppEchanges />} />
      <Route path="/messages/:id" element={<RedirectToAppMessages />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppShellLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<PlatformHomePage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="profil" element={<MyProfilePage />} />
        <Route path="messages/:conversationId" element={<MessageThreadPage />} />
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
