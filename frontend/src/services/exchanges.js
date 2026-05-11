import { apiFetch } from "../api/client.js";

/** Données de secours lorsque le backend n’expose pas encore l’endpoint. */
export const MOCK_AVAILABLE_EXCHANGES = [
  {
    id: "1",
    name: "Camille Leroy",
    location: "Lyon · France",
    avatarUrl: null,
    offeredSkill: "Design UI / Figma",
    offeredDesc: "Maquettes SaaS, design system léger et prototypage rapide.",
    wantedSkill: "Marketing de contenu",
  },
  {
    id: "2",
    name: "Hugo Martins",
    location: "Bruxelles · Belgique",
    avatarUrl: null,
    offeredSkill: "Photographie produit",
    offeredDesc: "Prises de vue e-commerce et retouches lumière naturelle.",
    wantedSkill: "Montage vidéo",
  },
  {
    id: "3",
    name: "Sofia Nguyen",
    location: "Montréal · Canada",
    avatarUrl: null,
    offeredSkill: "Introduction au Python",
    offeredDesc: "Bases pour automatiser des tâches et lire des données.",
    wantedSkill: "Anglais conversationnel",
  },
];

/**
 * Liste les échanges disponibles côté API. Tombe en repli mock si l’endpoint est absent ou en erreur.
 * Endpoint attendu (à brancher backend) : GET /api/exchanges/available
 * @param {{ token?: string | null }} [opts]
 */
export async function fetchAvailableExchanges(opts = {}) {
  const { token } = opts;
  try {
    const data = await apiFetch("/api/exchanges/available", {
      token: token ?? undefined,
    });
    if (Array.isArray(data)) return normalizeList(data);
    if (Array.isArray(data?.items)) return normalizeList(data.items);
    return MOCK_AVAILABLE_EXCHANGES;
  } catch {
    return MOCK_AVAILABLE_EXCHANGES;
  }
}

function normalizeList(rows) {
  return rows.map((row, i) => ({
    id: String(row.id ?? i),
    name: row.name ?? row.owner_name ?? row.user_name ?? "Membre Swap",
    location: row.location ?? row.city ?? "",
    avatarUrl: row.avatarUrl ?? row.avatar_url ?? null,
    offeredSkill: row.offeredSkill ?? row.offered_skill ?? row.skill_offer ?? "",
    offeredDesc:
      row.offeredDesc ??
      row.description ??
      row.bio_offer ??
      "Échange proposé sur la plateforme.",
    wantedSkill: row.wantedSkill ?? row.requested_skill ?? row.skill_seek ?? "",
  }));
}
