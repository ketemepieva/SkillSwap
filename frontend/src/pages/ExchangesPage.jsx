import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import { useAuth } from "../hooks/useAuth.js";
import { formatRelativeTimeFr } from "../utils/time.js";

function statusLabel(s) {
  switch (String(s || "").toLowerCase()) {
    case "pending":
      return "En attente";
    case "accepted":
      return "Accepté";
    case "rejected":
      return "Refusé";
    case "completed":
      return "Terminé";
    default:
      return s || "—";
  }
}

export function ExchangesPage() {
  const { token } = useAuth();
  const location = useLocation();
  const highlightId = location.state?.highlightExchangeId != null ? String(location.state.highlightExchangeId) : null;
  const highlightRef = useRef(null);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setFeedback("");
    try {
      const data = await apiFetch("/api/exchanges/mine", { token });
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setFeedback(e.message || "Impossible de charger vos échanges.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const tid = window.setTimeout(() => void load(), 0);
    return () => clearTimeout(tid);
  }, [load]);

  useEffect(() => {
    if (highlightId && highlightRef.current && !loading) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId, loading, rows]);

  return (
    <div className="w-full min-w-0">
      <section className="dash-section mb-8 md:mb-10">
        <h2 className="logo-text m-0 text-xl font-bold text-[var(--text-main)] sm:text-2xl md:text-3xl">Échanges</h2>
        <p className="mb-0 mt-2 max-w-prose text-sm leading-relaxed text-[var(--text-muted)]">
          Demandes persistées — grille 1 puis 2 colonnes à partir du grand écran type laptop.
        </p>
      </section>

      {feedback ? (
        <p className="message mb-6" role="status">
          {feedback}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Chargement…</p>
      ) : rows.length === 0 ? (
        <section className="dash-section flex flex-col items-center px-4 py-10 text-center">
          <p className="mb-0 max-w-sm text-sm text-[var(--text-muted)]">
            Aucune demande d&apos;échange enregistrée pour le moment.
          </p>
          <Link
            to="/app/notifications"
            className="btn btn-ghost-light mt-5 inline-block w-full max-w-xs text-center no-underline sm:w-auto"
          >
            Retour aux notifications
          </Link>
        </section>
      ) : (
        <ul className="m-0 grid w-full min-w-0 list-none grid-cols-1 gap-4 p-0 sm:gap-5 md:grid-cols-2">
          {rows.map((ex) => {
            const id = String(ex.id);
            const hilite = highlightId && highlightId === id;
            return (
              <li key={id} ref={hilite ? highlightRef : undefined} className="min-w-0">
                <article
                  className={`flex h-full min-w-0 flex-col gap-3 rounded-xl border border-[var(--dash-card-border)] bg-[color-mix(in_srgb,var(--grid-input-bg)_92%,transparent)] p-4 shadow-[var(--shadow-soft)] sm:p-5 ${
                    hilite ? "ring-2 ring-[var(--accent)]/45" : ""
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full border border-[var(--dash-card-border)] bg-[var(--pill-bg)] px-3 py-1 text-xs font-semibold text-[var(--text-muted)]">
                      #{id}
                    </span>
                    <span className="text-xs font-medium text-[var(--accent)]">{statusLabel(ex.status)}</span>
                  </div>
                  <p className="m-0 text-sm text-[var(--text-muted)]">{formatRelativeTimeFr(ex.created_at)}</p>
                  <dl className="m-0 grid gap-1 text-sm">
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                      <dt className="font-medium text-[var(--text-main)]">Proposant</dt>
                      <dd className="m-0 min-w-0 text-[var(--text-muted)]">{ex.proposer_nom ?? "—"}</dd>
                    </div>
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                      <dt className="font-medium text-[var(--text-main)]">Récepteur</dt>
                      <dd className="m-0 min-w-0 text-[var(--text-muted)]">{ex.receiver_nom ?? "—"}</dd>
                    </div>
                  </dl>
                  {ex.learning_objective ? (
                    <p className="mb-0 mt-1 border-t border-[var(--dash-card-border)] pt-2 text-sm text-[var(--text-muted)]">
                      <span className="font-semibold text-[var(--text-main)]">Objectif : </span>
                      {ex.learning_objective}
                    </p>
                  ) : null}
                </article>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        to="/app/notifications"
        className="btn btn-ghost-light mt-8 inline-block w-full max-w-full text-center no-underline box-border sm:mt-10 sm:w-auto"
      >
        Retour aux notifications
      </Link>
    </div>
  );
}
