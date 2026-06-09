import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import { ExchangeRequestCard } from "../components/exchanges/ExchangeRequestCard.jsx";
import { TutoringHistorySection } from "../components/exchanges/TutoringHistorySection.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { categorizeExchanges } from "../utils/categorizeExchanges.js";

const TABS = [
  { id: "received", label: "Demandes reçues", hint: "À accepter ou refuser" },
  { id: "sent", label: "Demandes envoyées", hint: "En attente de réponse" },
  { id: "accepted", label: "Échanges acceptés", hint: "Apprentissages en cours" },
  { id: "history", label: "Historique", hint: "Terminés et refusés" },
];

export function ExchangesPage() {
  const { token, user } = useAuth();
  const location = useLocation();
  const highlightId = location.state?.highlightExchangeId != null ? String(location.state.highlightExchangeId) : null;
  const highlightRef = useRef(null);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [tab, setTab] = useState("received");
  const [busyId, setBusyId] = useState(null);

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

  // Ouvre l'onglet « reçues » quand on arrive via une notification (adjust state during render)
  const [lastHighlightId, setLastHighlightId] = useState(null);
  if (highlightId && highlightId !== lastHighlightId) {
    setLastHighlightId(highlightId);
    setTab("received");
  }

  useEffect(() => {
    if (highlightId && highlightRef.current && !loading) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId, loading, rows]);

  const { received, sent, accepted, history } = useMemo(
    () => categorizeExchanges(rows, user?.id),
    [rows, user?.id]
  );

  const counts = { received: received.length, sent: sent.length, accepted: accepted.length, history: history.length };

  const lists = { received, sent, accepted, history };
  const currentList = lists[tab] ?? received;
  const currentVariant = tab === "history" ? "active" : tab;

  const updateStatus = async (exchange, status) => {
    const id = exchange.id;
    setBusyId(id);
    setFeedback("");
    try {
      await apiFetch(`/api/exchanges/${encodeURIComponent(String(id))}/status`, {
        method: "PATCH",
        token,
        body: { status },
      });
      await load();
      if (status === "accepted") setTab("accepted");
    } catch (e) {
      setFeedback(e.message || "Action impossible.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="w-full min-w-0">
      <section className="mb-8 overflow-hidden rounded-2xl border-2 border-amber-500/25 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-[color-mix(in_srgb,var(--dash-card-bg)_92%,transparent)] p-5 shadow-[var(--shadow-soft)] sm:p-6 md:mb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="m-0 flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              <span
                className="inline-flex flex-none items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm"
                style={{ width: "2rem", height: "2rem" }}
                aria-hidden
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              Mise en relation
            </p>
            <h2 className="logo-text m-0 mt-2 text-xl font-bold text-[var(--text-main)] sm:text-2xl md:text-3xl">
              Échanges de compétences
            </h2>
            <p className="mb-0 mt-2 max-w-prose text-sm leading-relaxed text-[var(--text-muted)]">
              Demandes, propositions et acceptations entre membres — distinct de la messagerie privée.
              Utilisez <strong className="font-semibold text-[var(--text-main)]">Messages</strong> uniquement pour le chat.
            </p>
          </div>
          <Link
            to="/app/messages"
            className="btn btn-ghost-light shrink-0 self-start text-center text-sm no-underline sm:self-center"
          >
            Aller aux conversations →
          </Link>
        </div>
      </section>

      {feedback ? (
        <p className="message mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2" role="status">
          {feedback}
        </p>
      ) : null}

      <div
        className="mb-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap"
        role="tablist"
        aria-label="Sections des échanges"
      >
        {TABS.map((t) => {
          const selected = tab === t.id;
          const count = counts[t.id];
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`flex min-h-11 flex-1 flex-col items-start rounded-xl border-2 px-4 py-3 text-left transition sm:min-w-[10rem] sm:flex-none ${
                selected
                  ? "border-amber-500 bg-amber-500/15 shadow-[var(--shadow-soft)]"
                  : "border-[var(--dash-card-border)] bg-[color-mix(in_srgb,var(--grid-input-bg)_90%,transparent)] hover:border-amber-500/35"
              }`}
              onClick={() => setTab(t.id)}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="text-sm font-bold text-[var(--text-main)]">{t.label}</span>
                <span
                  className={`inline-flex min-h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold tabular-nums ${
                    selected ? "bg-amber-500 text-white" : "bg-[var(--pill-bg)] text-[var(--text-muted)]"
                  }`}
                >
                  {count}
                </span>
              </span>
              <span className="mt-0.5 text-xs text-[var(--text-muted)]">{t.hint}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Chargement des demandes…</p>
      ) : currentList.length === 0 ? (
        <section className="flex flex-col items-center rounded-2xl border-2 border-dashed border-amber-500/30 bg-amber-500/5 px-4 py-12 text-center">
          <p className="m-0 max-w-md text-sm text-[var(--text-muted)]">
            {tab === "received"
              ? "Aucune demande reçue. Explorez Accueil pour trouver des membres."
              : tab === "sent"
                ? "Vous n'avez pas encore envoyé de demande."
                : tab === "accepted"
                  ? "Aucun échange accepté pour le moment."
                  : "Aucun échange terminé ou refusé dans l'historique."}
          </p>
          <Link to="/app" className="btn btn-primary mt-6 inline-block no-underline">
            Explorer la communauté
          </Link>
        </section>
      ) : (
        <ul className="m-0 flex w-full min-w-0 list-none flex-col gap-5 p-0">
          {currentList.map((ex) => {
            const id = String(ex.id);
            const hilite = highlightId && highlightId === id;
            return (
              <li key={id} ref={hilite ? highlightRef : undefined} className="min-w-0">
                <ExchangeRequestCard
                  exchange={ex}
                  currentUserId={user?.id}
                  variant={currentVariant}
                  highlighted={hilite}
                  busy={busyId === ex.id}
                  onAccept={(item) => void updateStatus(item, "accepted")}
                  onReject={(item) => void updateStatus(item, "rejected")}
                />
              </li>
            );
          })}
        </ul>
      )}

      <TutoringHistorySection />
    </div>
  );
}
