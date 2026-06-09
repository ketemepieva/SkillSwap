import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../api/client.js";
import { useAuth } from "../../hooks/useAuth.js";

function dateFr(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

function remainingFr(endIso) {
  const ms = new Date(endIso).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return "imminent";
  const min = ms / 60000;
  if (min >= 36 * 60) {
    const d = Math.round(min / (24 * 60));
    return `${d} jour${d > 1 ? "s" : ""}`;
  }
  if (min >= 50) {
    const h = Math.round(min / 60);
    return `${h} heure${h > 1 ? "s" : ""}`;
  }
  const m = Math.max(1, Math.round(min));
  return `${m} minute${m > 1 ? "s" : ""}`;
}

function CapIcon({ className }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="m12 4 10 5-10 5L2 9l10-5Z" strokeLinejoin="round" />
      <path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" strokeLinecap="round" />
    </svg>
  );
}

function StarRating({ value, onChange }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Note du tuteur">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
          onClick={() => onChange(n)}
          className={`text-xl leading-none transition ${
            n <= value ? "text-amber-400" : "text-[var(--text-muted)] opacity-40 hover:opacity-80"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

/**
 * Panneau « Session de tutorat » affiché dans le fil de discussion.
 * Pilote tout le cycle : proposition → acceptation → durée → suivi → évaluation.
 */
export function TutoringSessionPanel({ peerId, peerName }) {
  const { token, user } = useAuth();
  const [current, setCurrent] = useState(null);
  const [lastCompleted, setLastCompleted] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  const [durValue, setDurValue] = useState(1);
  const [durUnit, setDurUnit] = useState("semaines");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await apiFetch(`/api/tutoring/with/${encodeURIComponent(peerId)}`, { token });
      setCurrent(data?.current ?? null);
      setLastCompleted(data?.lastCompleted ?? null);
    } catch {
      setCurrent(null);
      setLastCompleted(null);
    } finally {
      setLoading(false);
    }
  }, [token, peerId]);

  useEffect(() => {
    const tid = window.setTimeout(() => void load(), 0);
    return () => clearTimeout(tid);
  }, [load]);

  const act = async (path, body) => {
    setBusy(true);
    setFeedback("");
    try {
      await apiFetch(path, { method: "POST", token, body });
      await load();
      return true;
    } catch (e) {
      setFeedback(e.message || "Action impossible.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (loading) return null;

  const uid = Number(user?.id);
  const iAmTutor = current ? Number(current.tutor_id) === uid : false;
  const iAmLearnerOfCompleted = lastCompleted ? Number(lastCompleted.learner_id) === uid : false;
  const completedNeedsMyReview = Boolean(lastCompleted && !lastCompleted.review_id && iAmLearnerOfCompleted);
  const completedAwaitsPeerReview = Boolean(lastCompleted && !lastCompleted.review_id && !iAmLearnerOfCompleted);

  const shell = "shrink-0 border-b border-violet-500/20 bg-violet-500/8 px-3 py-2.5 sm:px-4";
  const title = (
    <p className="m-0 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-violet-700 dark:text-violet-300">
      <CapIcon className="flex-none" />
      Session de tutorat
    </p>
  );

  let content = null;

  if (!current) {
    content = (
      <div className="mt-2 flex flex-col gap-3">
        {completedNeedsMyReview ? (
          <form
            className="flex flex-col gap-2 rounded-xl border border-violet-500/25 bg-[var(--dash-card-bg)] p-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (rating < 1) {
                setFeedback("Choisissez une note de 1 à 5 étoiles.");
                return;
              }
              void act(`/api/tutoring/${lastCompleted.id}/review`, { rating, comment }).then((ok) => {
                if (ok) {
                  setRating(0);
                  setComment("");
                }
              });
            }}
          >
            <p className="m-0 text-sm font-semibold text-[var(--text-main)]">
              Votre session avec {lastCompleted.tutor_nom} est terminée — évaluez votre tuteur.
            </p>
            <StarRating value={rating} onChange={setRating} />
            <textarea
              className="simple-input min-h-16 w-full resize-y text-sm"
              placeholder="Commentaire sur votre expérience d'apprentissage (optionnel)…"
              value={comment}
              maxLength={2000}
              onChange={(e) => setComment(e.target.value)}
            />
            <button type="submit" className="btn btn-primary self-start bg-violet-600 text-sm" disabled={busy}>
              Envoyer l&apos;évaluation
            </button>
          </form>
        ) : null}
        {completedAwaitsPeerReview ? (
          <p className="m-0 text-xs text-[var(--text-muted)]">
            Session terminée le {dateFr(lastCompleted.end_at)} — en attente de l&apos;évaluation de l&apos;apprenant.
          </p>
        ) : null}
        <button
          type="button"
          className="btn btn-primary self-start bg-violet-600 text-sm"
          disabled={busy}
          onClick={() => void act("/api/tutoring/start", { learner_id: Number(peerId) })}
        >
          Démarrer une session
        </button>
        <p className="m-0 -mt-1 text-[11px] text-[var(--text-muted)]">
          Vous serez le tuteur : {peerName || "votre interlocuteur"} recevra une demande à accepter.
        </p>
      </div>
    );
  } else if (current.status === "pending") {
    content = iAmTutor ? (
      <p className="m-0 mt-2 text-sm text-[var(--text-main)]">
        Demande envoyée à <strong>{current.learner_nom}</strong> — en attente de son acceptation.
      </p>
    ) : (
      <div className="mt-2 flex flex-col gap-2">
        <p className="m-0 text-sm text-[var(--text-main)]">
          <strong>{current.tutor_nom}</strong> vous propose une session de tutorat.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-primary bg-violet-600 text-sm"
            disabled={busy}
            onClick={() => void act(`/api/tutoring/${current.id}/accept`)}
          >
            Accepter
          </button>
          <button
            type="button"
            className="btn btn-ghost-light text-sm"
            disabled={busy}
            onClick={() => void act(`/api/tutoring/${current.id}/decline`)}
          >
            Refuser
          </button>
        </div>
      </div>
    );
  } else if (current.status === "accepted") {
    content = iAmTutor ? (
      <form
        className="mt-2 flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void act(`/api/tutoring/${current.id}/duration`, {
            duration_value: Number(durValue),
            duration_unit: durUnit,
          });
        }}
      >
        <label className="flex flex-col gap-1 text-[11px] font-semibold text-[var(--text-muted)]">
          Durée
          <input
            type="number"
            min={1}
            max={365}
            className="simple-input w-20 text-sm"
            value={durValue}
            onChange={(e) => setDurValue(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold text-[var(--text-muted)]">
          Unité
          <select className="simple-input text-sm" value={durUnit} onChange={(e) => setDurUnit(e.target.value)}>
            <option value="jours">jours</option>
            <option value="semaines">semaines</option>
            <option value="mois">mois</option>
          </select>
        </label>
        <button type="submit" className="btn btn-primary bg-violet-600 text-sm" disabled={busy}>
          Lancer la session
        </button>
      </form>
    ) : (
      <p className="m-0 mt-2 text-sm text-[var(--text-main)]">
        Session acceptée — <strong>{current.tutor_nom}</strong> définit la durée du tutorat.
      </p>
    );
  } else if (current.status === "active") {
    content = (
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-main)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex size-2 flex-none rounded-full bg-emerald-500" aria-hidden />
          <strong>En cours</strong>
        </span>
        <span>
          Tuteur : <strong>{current.tutor_nom}</strong> · Apprenant : <strong>{current.learner_nom}</strong>
        </span>
        <span className="text-[var(--text-muted)]">
          Fin le {dateFr(current.end_at)} (dans {remainingFr(current.end_at)})
        </span>
      </div>
    );
  }

  return (
    <div className={shell}>
      {title}
      {content}
      {feedback ? (
        <p className="m-0 mt-2 text-xs font-medium text-red-500" role="status">
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
