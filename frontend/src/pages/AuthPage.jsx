import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthHeroIllustration } from "../AuthHeroIllustration.jsx";
import { Logo, LogoLockup } from "../components/Logo.jsx";
import { ThemeToggle } from "../components/ThemeToggle.jsx";
import { useAuth } from "../hooks/useAuth.js";

export function AuthPage({ initialMode = "login" }) {
  const { login, register } = useAuth();
  const location = useLocation();
  const [authForm, setAuthForm] = useState({
    nom: "",
    email: "",
    password: "",
    mode: initialMode,
  });
  const [message, setMessage] = useState("");

  // Resynchronise le mode quand la route change (pattern « adjust state during render »)
  const routeKey = `${initialMode}|${location.pathname}`;
  const [lastRouteKey, setLastRouteKey] = useState(routeKey);
  if (routeKey !== lastRouteKey) {
    setLastRouteKey(routeKey);
    setAuthForm((f) => ({ ...f, mode: initialMode }));
    setMessage("");
  }

  const modeRegister = authForm.mode === "register";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      if (modeRegister) {
        await register({
          nom: authForm.nom.trim(),
          email: authForm.email.trim(),
          password: authForm.password,
        });
      } else {
        await login({
          email: authForm.email.trim(),
          password: authForm.password,
        });
      }
    } catch (err) {
      setMessage(err.message || "Une erreur est survenue.");
    }
  };

  return (
    <div className="auth-page auth-page--dark">
      <aside className="auth-hero">
        <div className="auth-hero-inner">
          <p className="auth-badge">
            <span>◇</span> Apprentissage pair à pair
          </p>
          <div className="auth-hero-brand">
            <Logo size="xl" tone="auth" showSlogan sloganClassName="auth-hero-slogan" />
          </div>
          <p className="tagline">
            Une plateforme pour partager vos compétences et apprendre celles des autres — sans mise en commun
            d&apos;argent, juste d&apos;énergie et de temps.
          </p>
          <ul className="auth-points">
            <li>Échange équitable : votre savoir contre celui qui vous motive.</li>
            <li>Réputation et suivis pensés pour des rencontres fiables.</li>
            <li>Explorez les domaines : tech, créativité, langues et plus encore.</li>
          </ul>
        </div>
        <div className="auth-hero-visual">
          <AuthHeroIllustration />
        </div>
      </aside>
      <div className="auth-aside">
        <main className="auth-card">
          <div className="auth-card-brand">
            <LogoLockup size="lg" tone="app" sloganClassName="auth-card-slogan" />
            <p className="auth-card-welcome">
              {modeRegister
                ? "Créez votre espace et commencez à échanger vos compétences en toute confiance."
                : "Connectez-vous pour retrouver votre réseau et vos conversations."}
            </p>
          </div>
          <h2>{modeRegister ? "Créer un compte" : "Bon retour"}</h2>
          <p className="auth-subtitle">
            {modeRegister ? "Complétez les champs pour rejoindre la communauté." : "Entrez vos identifiants pour continuer."}
          </p>
          <form className="auth-form-fields" onSubmit={handleSubmit}>
            {modeRegister && (
              <div className="field">
                <label htmlFor="auth-nom">Nom</label>
                <input
                  id="auth-nom"
                  autoComplete="name"
                  placeholder="Sophie Dupont"
                  value={authForm.nom}
                  onChange={(e) => setAuthForm((f) => ({ ...f, nom: e.target.value }))}
                  required={modeRegister}
                />
              </div>
            )}
            <div className="field">
              <label htmlFor="auth-email">E-mail</label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                placeholder="vous@exemple.fr"
                value={authForm.email}
                onChange={(e) => setAuthForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="auth-password">Mot de passe</label>
              <input
                id="auth-password"
                type="password"
                autoComplete={modeRegister ? "new-password" : "current-password"}
                placeholder="••••••••"
                value={authForm.password}
                onChange={(e) => setAuthForm((f) => ({ ...f, password: e.target.value }))}
                required
              />
            </div>
            <div className="auth-actions">
              <button className="btn btn-primary" type="submit">
                {modeRegister ? "Créer mon compte" : "Se connecter"}
              </button>
              {modeRegister ? (
                <Link to="/login" state={location.state} className="btn btn-ghost-light text-center no-underline">
                  Déjà inscrit ? Se connecter
                </Link>
              ) : (
                <Link to="/inscription" state={location.state} className="btn btn-ghost-light text-center no-underline">
                  Pas encore de compte ? S&apos;inscrire
                </Link>
              )}
            </div>
          </form>
          {message ? <p className="message">{message}</p> : null}
          <div className="auth-theme-footer">
            <ThemeToggle />
          </div>
        </main>
      </div>
    </div>
  );
}
