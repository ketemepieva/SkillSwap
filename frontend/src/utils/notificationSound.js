/**
 * Petit carillon de notification généré via Web Audio API
 * (aucun fichier audio à charger).
 *
 * Les navigateurs bloquent l'audio tant que l'utilisateur n'a pas
 * interagi avec la page : `armNotificationSound()` débloque le
 * contexte audio à la première interaction (clic / touche).
 */

let audioCtx = null;
let armed = false;

function getCtx() {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  return audioCtx;
}

function unlock() {
  const ctx = getCtx();
  if (ctx && ctx.state === "suspended") {
    void ctx.resume().catch(() => {});
  }
}

/** À appeler une fois au montage de l'app : débloque l'audio dès la première interaction. */
export function armNotificationSound() {
  if (armed || typeof window === "undefined") return;
  armed = true;
  window.addEventListener("pointerdown", unlock, { once: true, passive: true });
  window.addEventListener("keydown", unlock, { once: true });
}

function tone(ctx, { freq, start, duration, peak = 0.12 }) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;

  const t0 = ctx.currentTime + start;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

/** Joue un « ding-ding » bref et discret. Sans effet si l'audio est bloqué. */
export function playNotificationSound() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      void ctx.resume().catch(() => {});
      if (ctx.state === "suspended") return;
    }
    tone(ctx, { freq: 880, start: 0, duration: 0.18 });
    tone(ctx, { freq: 1318.5, start: 0.12, duration: 0.28 });
  } catch {
    /* l'absence de son ne doit jamais casser l'app */
  }
}
