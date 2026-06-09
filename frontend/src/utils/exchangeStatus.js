export function exchangeStatusLabel(status) {
  switch (String(status || "").toLowerCase()) {
    case "pending":
      return "En attente";
    case "accepted":
      return "Acceptée";
    case "rejected":
      return "Refusée";
    case "completed":
      return "Terminée";
    default:
      return status || "—";
  }
}

export function exchangeStatusTone(status) {
  switch (String(status || "").toLowerCase()) {
    case "pending":
      return "pending";
    case "accepted":
      return "accepted";
    case "rejected":
      return "rejected";
    case "completed":
      return "completed";
    default:
      return "neutral";
  }
}
