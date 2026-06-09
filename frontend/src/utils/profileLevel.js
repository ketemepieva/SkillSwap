const LEVEL_ORDER = { expert: 0, intermediate: 1, beginner: 2 };

export function normalizedLevel(rawLevel) {
  const v = String(rawLevel || "")
    .trim()
    .toLowerCase();
  if (["expert"].includes(v)) return "expert";
  if (["intermediaire", "intermédiaire", "intermediate"].includes(v)) return "intermediate";
  if (["debutant", "débutant", "beginner"].includes(v)) return "beginner";
  return null;
}

export function levelFromCredibility(scoreRaw) {
  const score = Number(scoreRaw || 0);
  if (score >= 4) return "expert";
  if (score >= 2) return "intermediate";
  return "beginner";
}

export function profileLevel(profile) {
  return normalizedLevel(profile?.expertise_level) || levelFromCredibility(profile?.credibility_score);
}

export function levelMeta(level) {
  if (level === "expert") {
    return {
      label: "Expert",
      icon: "★",
      badgeClass:
        "border-amber-200/55 bg-[color-mix(in_srgb,#f59e0b_12%,transparent)] text-amber-800 dark:text-amber-200",
      cardClass: "border-amber-500/20",
    };
  }
  if (level === "intermediate") {
    return {
      label: "Intermédiaire",
      icon: "◆",
      badgeClass:
        "border-sky-200/55 bg-[color-mix(in_srgb,#0ea5e9_12%,transparent)] text-sky-800 dark:text-sky-200",
      cardClass: "border-sky-500/20",
    };
  }
  return {
    label: "Débutant",
    icon: "○",
    badgeClass:
      "border-[var(--dash-card-border)] bg-[color-mix(in_srgb,var(--grid-input-bg)_88%,transparent)] text-[var(--text-muted)]",
    cardClass: "border-[var(--dash-card-border)]",
  };
}

export function compareMembersByLevel(a, b) {
  const aLevel = profileLevel(a?.profile ?? a);
  const bLevel = profileLevel(b?.profile ?? b);
  const byLevel = LEVEL_ORDER[aLevel] - LEVEL_ORDER[bLevel];
  if (byLevel !== 0) return byLevel;
  const aScore = Number(a?.profile?.credibility_score ?? a?.credibility_score ?? 0);
  const bScore = Number(b?.profile?.credibility_score ?? b?.credibility_score ?? 0);
  return bScore - aScore;
}
