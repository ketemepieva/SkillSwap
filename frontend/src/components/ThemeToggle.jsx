/**
 * Persiste skillswap-theme (auto | light | dark) sur <html data-theme="">
 * - auto : <768px → palette claire, ≥768px → palette sombre (dashboard + auth harmonisés)
 * - prefers-color-scheme : renforce légèrement le rendu lorsque theme=auto (mobile + OS clair)
 */
import { useEffect, useState } from "react";

const STORAGE_KEY = "skillswap-theme";

function readStored() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "auto") return v;
  } catch {
    /* ignore */
  }
  return "auto";
}

export function ThemeToggle({ className = "" }) {
  const [mode, setMode] = useState(readStored);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, [mode]);

  return (
    <label className={`theme-toggle ${className}`.trim()} title="Thème d'affichage">
      <span className="theme-toggle-label">Thème</span>
      <select
        className="theme-toggle-select"
        value={mode}
        onChange={(e) => setMode(e.target.value)}
        aria-label="Choisir le thème"
      >
        <option value="auto">Automatique (clair mobile / sombre desktop)</option>
        <option value="light">Toujours clair</option>
        <option value="dark">Toujours sombre</option>
      </select>
    </label>
  );
}
