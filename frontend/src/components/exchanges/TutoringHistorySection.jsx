import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../api/client.js";
import { useAuth } from "../../hooks/useAuth.js";

const STATUS_LABELS = {
  pending: { label: "En attente", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  accepted: { label: "Acceptée", cls: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30" },
  active: { label: "En cours", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
  completed: { label: "Terminée", cls: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30" },
  declined: { label: "Refusée", cls: "bg-red-500/10 text-red-600 dark:text-red-300 border-red-500/25" },
};

function dateFr(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

/** Historique des sessions de tutorat du membre connecté. */
export function TutoringHistorySection() {
  const { token, user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await apiFetch("/api/tutoring/mine", { token });
        if (!cancelled) setSessions(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setSessions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading || sessions.length === 0) return null;

  const uid = Number(user?.id);

  return (
    <section className="mt-10 overflow-hidden rounded-2xl border-2 border-violet-500/20 bg-violet-500/5 p-5 sm:p-6">
      <h3 className="logo-text m-0 text-base font-bold text-[var(--text-main)] sm:text-lg">
        Sessions de tutorat
      </h3>
      <p className="mb-0 mt-1 text-xs text-[var(--text-muted)]">
        Historique de vos tutorats — démarrez une session depuis le chat avec un membre.
      </p>
      <ul className="m-0 mt-4 flex list-none flex-col gap-2.5 p-0">
        {sessions.map((s) => {
          const tutor = Number(s.tutor_id) === uid;
          const peerId = tutor ? s.learner_id : s.tutor_id;
          const peerNom = tutor ? s.learner_nom : s.tutor_nom;
          const st = STATUS_LABELS[s.status] ?? STATUS_LABELS.pending;
          return (
            <li key={s.id} className="min-w-0">
              <Link
                to={`/app/messages/${encodeURIComponent(String(peerId))}`}
                state={{ peerName: peerNom ?? null }}
                className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-violet-500/20 bg-[var(--dash-card-bg)] px-3 py-2.5 no-underline shadow-[var(--shadow-soft)] transition hover:border-violet-500/45"
              >
                <span
                  className={`inline-flex flex-none items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${st.cls}`}
                >
                  {st.label}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-[var(--text-main)]">
                  {tutor ? "Vous tutorez" : "Vous apprenez avec"} <strong>{peerNom}</strong>
                  {s.duration_value ? (
                    <span className="text-[var(--text-muted)]">
                      {" "}
                      · {s.duration_value} {s.duration_unit}
                    </span>
                  ) : null}
                </span>
                <span className="flex-none text-xs text-[var(--text-muted)] tabular-nums">
                  {s.status === "active" && s.end_at
                    ? `fin le ${dateFr(s.end_at)}`
                    : s.status === "completed" && s.review_id
                      ? `évaluée ${"★".repeat(Number(s.review_rating) || 0)}`
                      : dateFr(s.end_at || s.created_at)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
