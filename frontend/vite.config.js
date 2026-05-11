import { cwd } from "node:process";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, cwd(), "");
  /** Backend à proxifier depuis le navigateur en dev/preview ; doit correspondre au PORT du serveur Express */
  const proxyTarget = env.VITE_DEV_PROXY_TARGET?.trim() || "http://127.0.0.1:5000";

  /* Important : ne pas proxifier `/login` — c’est aussi la route SPA (GET). Sinon un rafraîchissement GET /login va vers Express → 404. */
  const proxy = {
    "/api": {
      target: proxyTarget,
      changeOrigin: true,
      secure: false,
    },
    "/uploads": {
      target: proxyTarget,
      changeOrigin: true,
      secure: false,
    },
  };

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy,
    },
    preview: {
      proxy,
    },
  };
});
