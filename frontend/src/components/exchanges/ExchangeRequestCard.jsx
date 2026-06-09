import { Link } from "react-router-dom";
import { Avatar } from "../Avatar.jsx";
import { formatRelativeTimeFr } from "../../utils/time.js";
import { exchangeStatusLabel, exchangeStatusTone } from "../../utils/exchangeStatus.js";

const toneClasses = {
  pending: "border-amber-400/40 bg-amber-500/10 text-amber-800 dark:text-amber-200",
  accepted: "border-emerald-400/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  rejected: "border-rose-400/40 bg-rose-500/10 text-rose-800 dark:text-rose-200",
  completed: "border-slate-400/40 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  neutral: "border-[var(--dash-card-border)] bg-[var(--pill-bg)] text-[var(--text-muted)]",
};

/**
 * Carte « mise en relation » — compétences proposées / demandées (pas un fil de chat).
 */
export function ExchangeRequestCard({
  exchange,
  currentUserId,
  variant,
  onAccept,
  onReject,
  busy = false,
  highlighted = false,
}) {
  const uid = Number(currentUserId);
  const isReceiver = Number(exchange.receiver_id) === uid;
  const isProposer = Number(exchange.proposer_id) === uid;
  const status = String(exchange.status || "").toLowerCase();
  const pending = status === "pending";

  const partnerId = isReceiver ? exchange.proposer_id : exchange.receiver_id;
  const partnerName = isReceiver ? exchange.proposer_nom : exchange.receiver_nom;
  const partnerAvatar = isReceiver ? exchange.proposer_avatar_url : exchange.receiver_avatar_url;

  const tone = exchangeStatusTone(status);

  return (
    <article
      className={`flex min-w-0 flex-col gap-4 rounded-2xl border-2 border-amber-500/20 bg-[color-mix(in_srgb,var(--grid-input-bg)_94%,#f59e0b_6%)] p-4 shadow-[var(--shadow-soft)] sm:p-5 ${
        highlighted ? "ring-2 ring-amber-500/50" : ""
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-lg text-white shadow-sm"
            aria-hidden
          >
            ⇄
          </span>
          <div className="min-w-0 flex-1">
            <p className="m-0 text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
              {variant === "received"
                ? "Demande reçue"
                : variant === "sent"
                  ? "Demande envoyée"
                  : variant === "accepted"
                    ? "Échange accepté"
                    : "Historique"}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Avatar nom={partnerName} avatarUrl={partnerAvatar} size="sm" />
              <Link
                to={`/app/profile/${encodeURIComponent(String(partnerId))}`}
                className="truncate text-sm font-semibold text-[var(--text-main)] no-underline hover:underline"
              >
                {partnerName || `Membre #${partnerId}`}
              </Link>
            </div>
            <p className="mb-0 mt-1 text-xs text-[var(--text-muted)]">{formatRelativeTimeFr(exchange.created_at)}</p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${toneClasses[tone] ?? toneClasses.neutral}`}
        >
          {exchangeStatusLabel(status)}
        </span>
      </div>

      <div className="grid gap-3 rounded-xl border border-amber-500/15 bg-[color-mix(in_srgb,var(--dash-card-bg)_88%,transparent)] p-3 sm:grid-cols-2 sm:gap-4 sm:p-4">
        <div className="min-w-0">
          <p className="m-0 text-[10px] font-bold uppercase tracking-wide text-amber-800/80 dark:text-amber-200/80">
            {isProposer ? "Vous proposez" : "Proposition reçue"}
          </p>
          <p className="mb-0 mt-1 text-sm font-semibold text-[var(--text-main)]">
            {exchange.offered_skill_name || "Compétence offerte"}
          </p>
        </div>
        <div className="min-w-0">
          <p className="m-0 text-[10px] font-bold uppercase tracking-wide text-amber-800/80 dark:text-amber-200/80">
            {isProposer ? "Vous souhaitez apprendre" : "Compétence demandée"}
          </p>
          <p className="mb-0 mt-1 text-sm font-semibold text-[var(--text-main)]">
            {exchange.requested_skill_name || "Compétence recherchée"}
          </p>
        </div>
      </div>

      {exchange.learning_objective ? (
        <p className="mb-0 rounded-xl border border-dashed border-amber-500/25 bg-amber-500/5 px-3 py-2 text-sm text-[var(--text-muted)]">
          <span className="font-semibold text-[var(--text-main)]">Objectif d&apos;apprentissage : </span>
          {exchange.learning_objective}
        </p>
      ) : null}

      {variant === "received" && pending && isReceiver ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            className="btn btn-primary min-h-11 flex-1 border-emerald-600 bg-emerald-600 hover:opacity-95 sm:flex-none sm:px-6"
            disabled={busy}
            onClick={() => onAccept?.(exchange)}
          >
            Accepter
          </button>
          <button
            type="button"
            className="btn min-h-11 flex-1 border border-rose-400/50 bg-rose-500/10 font-semibold text-rose-700 hover:bg-rose-500/20 dark:text-rose-200 sm:flex-none sm:px-6"
            disabled={busy}
            onClick={() => onReject?.(exchange)}
          >
            Refuser
          </button>
        </div>
      ) : null}

      {variant === "sent" && pending ? (
        <p className="mb-0 text-sm font-medium text-amber-800/90 dark:text-amber-200/90">
          En attente de réponse du membre contacté.
        </p>
      ) : null}

      {variant === "active" || status === "accepted" ? (
        <div className="flex flex-col gap-2 border-t border-amber-500/15 pt-3 sm:flex-row sm:flex-wrap">
          <Link
            to={`/app/messages/${encodeURIComponent(String(partnerId))}`}
            state={{ peerName: partnerName ?? null, peerAvatarUrl: partnerAvatar ?? null }}
            className="btn btn-ghost-light min-h-10 w-full text-center text-sm no-underline sm:w-auto"
          >
            Discuter en privé
          </Link>
          <span className="self-center text-xs text-[var(--text-muted)]">
            La messagerie sert au chat — pas aux demandes d&apos;échange.
          </span>
        </div>
      ) : null}
    </article>
  );
}
