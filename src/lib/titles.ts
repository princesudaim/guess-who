import type { LegendProfile, RoleId, ScoreRow } from "./types";

/* Full title pools — referenced by pickByRole below */

const WIN_STREAK_TITLES = [
  "Killing Spree",    // 2
  "On a Tear",        // 3
  "Dominating",       // 4
  "Rampage",          // 5
  "Unstoppable",      // 6
  "Bloodbath",        // 7
  "Slaughter",        // 8
  "Relentless",       // 9
  "Warlord",          // 10
  "Annihilator",      // 11+
];

const LOSE_STREAK_TITLES = [
  "Getting Farmed",   // 2
  "Respawn Main",     // 3
  "Free Kill",        // 4
  "Target Dummy",     // 5
  "Bottom Frag",      // 6
  "Walking L",        // 7
  "Cannon Fodder",    // 8
  "Death Magnet",     // 9
  "Perma Dead",       // 10
  "Lobby Victim",     // 11+
];

/**
 * Pick a title based on performance, result, streak, and role.
 * This is deterministic for the same inputs — not random.
 */
export function pickTitle(
  row: ScoreRow,
  isWinner: boolean,
  profile: LegendProfile,
  allRows: ScoreRow[],
): string {
  const winStreak = isWinner ? profile.currentWinStreak + 1 : 0;
  const loseStreak = !isWinner ? profile.currentLoseStreak + 1 : 0;

  // Streak titles take priority when streak >= 2
  if (winStreak >= 2) {
    const idx = Math.min(winStreak - 2, WIN_STREAK_TITLES.length - 1);
    return WIN_STREAK_TITLES[idx];
  }
  if (loseStreak >= 2) {
    const idx = Math.min(loseStreak - 2, LOSE_STREAK_TITLES.length - 1);
    return LOSE_STREAK_TITLES[idx];
  }

  // Performance-based title
  const rank = allRows.indexOf(row); // 0 = best
  const total = allRows.length;
  const topHalf = rank < total / 2;
  const isTop1 = rank === 0;
  const isBottom1 = rank === total - 1;
  const pct = total > 1 ? rank / (total - 1) : 0; // 0 = best, 1 = worst

  if (isWinner) {
    if (isTop1 && row.score >= 400) return "MVP";
    if (isTop1) return "Main Character";
    if (pct <= 0.2) return pickByRole(row.player.role, true, "high");
    if (pct <= 0.5) return pickByRole(row.player.role, true, "mid");
    // Winner but low performance
    return pickByRole(row.player.role, true, "low");
  } else {
    if (isBottom1 && row.score <= 50) return pickByRole(row.player.role, false, "worst");
    if (isBottom1) return "Bottom Frag";
    if (!topHalf) return pickByRole(row.player.role, false, "low");
    // Loser but decent performance
    return pickByRole(row.player.role, false, "mid");
  }
}

function pickByRole(role: RoleId, won: boolean, tier: "high" | "mid" | "low" | "worst"): string {
  // Role-flavored title selection
  const mafia = ["imposter", "undercover", "conspirator", "framer", "saboteur"];
  const isMafia = mafia.includes(role);

  if (won) {
    switch (tier) {
      case "high":
        if (isMafia) return "Lobby Boss";
        if (role === "detective") return "Clean Hands";
        if (role === "sheriff") return "Certified Clutch";
        if (role === "doctor") return "Diff Maker";
        if (role === "bodyguard") return "Built Different";
        return "Aura+";
      case "mid":
        if (isMafia) return "Ranked Menace";
        if (role === "detective") return "Locked In";
        if (role === "sheriff") return "Final Boss";
        return "Legend";
      case "low":
        if (isMafia) return "Accidental Kill";
        return "VIP";
      default:
        return "Legend";
    }
  } else {
    switch (tier) {
      case "worst":
        if (isMafia) return "Skill Issue";
        if (role === "sheriff") return "Aim Debt";
        if (role === "doctor") return "Team Liability";
        return "Professional Noob";
      case "low":
        if (isMafia) return "Free XP";
        if (role === "sheriff") return "Bot Behavior";
        return "Ranked Food";
      case "mid":
        if (isMafia) return "Washed Already";
        return "Aura Minus";
      default:
        return "Spectator Main";
    }
  }
}

/**
 * Compute the streak display string for a profile.
 */
export function streakDisplay(p: LegendProfile): { text: string; color: string; icon: string } | null {
  if (p.currentWinStreak >= 2) {
    const idx = Math.min(p.currentWinStreak - 2, WIN_STREAK_TITLES.length - 1);
    return { text: `🔥 ${p.currentWinStreak}W — ${WIN_STREAK_TITLES[idx]}`, color: "#34d399", icon: "🔥" };
  }
  if (p.currentLoseStreak >= 2) {
    const idx = Math.min(p.currentLoseStreak - 2, LOSE_STREAK_TITLES.length - 1);
    return { text: `💀 ${p.currentLoseStreak}L — ${LOSE_STREAK_TITLES[idx]}`, color: "#ff2d55", icon: "💀" };
  }
  return null;
}
