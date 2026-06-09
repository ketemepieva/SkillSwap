/**
 * Configuration des sessions de tutorat.
 *
 * Délais de rappel avant la fin d'une session, en minutes.
 * Configurable par l'administrateur via la variable d'environnement
 * TUTORING_REMINDERS (liste séparée par des virgules, en minutes).
 *   Exemple : TUTORING_REMINDERS=10080,1440,60
 *   → rappels à 7 jours, 24 heures et 1 heure de la fin.
 */
const DEFAULT_REMINDER_MINUTES = [7 * 24 * 60, 24 * 60, 60];

function parseReminders(raw) {
  if (!raw) return DEFAULT_REMINDER_MINUTES;
  const values = String(raw)
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((v) => Number.isFinite(v) && v > 0);
  return values.length ? [...new Set(values)].sort((a, b) => b - a) : DEFAULT_REMINDER_MINUTES;
}

const REMINDER_MINUTES = parseReminders(process.env.TUTORING_REMINDERS);

/** Libellé humain d'un délai en minutes : « 7 jours », « 24 heures », « 45 minutes ». */
function reminderLabel(minutes) {
  if (minutes % (24 * 60) === 0) {
    const days = minutes / (24 * 60);
    return `${days} jour${days > 1 ? "s" : ""}`;
  }
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} heure${hours > 1 ? "s" : ""}`;
  }
  return `${minutes} minute${minutes > 1 ? "s" : ""}`;
}

/** Fréquence de passage du planificateur (ms). */
const SWEEP_INTERVAL_MS = Number(process.env.TUTORING_SWEEP_INTERVAL_MS || 60_000);

module.exports = { REMINDER_MINUTES, reminderLabel, SWEEP_INTERVAL_MS };
