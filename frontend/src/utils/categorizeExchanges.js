/**
 * Répartit les échanges pour l’écran dédié (pas la messagerie).
 */
export function categorizeExchanges(rows, userId) {
  const uid = Number(userId);
  const received = [];
  const sent = [];
  const accepted = [];
  const history = [];

  for (const ex of rows) {
    const isReceiver = Number(ex.receiver_id) === uid;
    const isProposer = Number(ex.proposer_id) === uid;
    const status = String(ex.status || "").toLowerCase();

    if (status === "accepted") {
      accepted.push(ex);
    } else if (status === "completed" || status === "rejected") {
      history.push(ex);
    } else if (isReceiver) {
      received.push(ex);
    } else if (isProposer) {
      sent.push(ex);
    }
  }

  const sortByDate = (a, b) => String(b.created_at || "").localeCompare(String(a.created_at || ""));
  const sortPendingFirst = (a, b) => {
    const pa = String(a.status).toLowerCase() === "pending" ? 0 : 1;
    const pb = String(b.status).toLowerCase() === "pending" ? 0 : 1;
    if (pa !== pb) return pa - pb;
    return sortByDate(a, b);
  };

  received.sort(sortPendingFirst);
  sent.sort(sortPendingFirst);
  accepted.sort(sortByDate);
  history.sort(sortByDate);

  return { received, sent, accepted, history };
}
