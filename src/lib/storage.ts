import { defaultSettings } from "./engine";
import type { HighScore, LegendProfile, RoleId, ScoreRow, Settings } from "./types";
import { pickTitle } from "./titles";

const SKEY = "guess-who.settings.v1";
const HKEY = "guess-who.highscores.v1";
const NKEY = "guess-who.names.v1";
const LKEY = "guess-who.legends.v1";

function migrateLegacyStorage() {
  try {
    const marker = "guess-who.storage-migration.v1";
    if (localStorage.getItem(marker) === "done") return;

    const keys = [
      ["nightfall.settings.v1", SKEY],
      ["nightfall.highscores.v1", HKEY],
      ["nightfall.names.v1", NKEY],
      ["nightfall.legends.v1", LKEY],
    ];
    for (const [legacyKey, currentKey] of keys) {
      const legacyValue = localStorage.getItem(legacyKey);
      if (localStorage.getItem(currentKey) === null && legacyValue !== null) {
        localStorage.setItem(currentKey, legacyValue);
      }
    }
    localStorage.setItem(marker, "done");
  } catch {
    // Retry migration on a later load if storage is temporarily unavailable.
  }
}

migrateLegacyStorage();

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SKEY);
    if (!raw) return defaultSettings();
    const saved = JSON.parse(raw) as Partial<Settings>;
    const base = defaultSettings();
    return { ...base, ...saved, voteSeconds: saved.voteSeconds ?? base.voteSeconds, roleOptions: { ...base.roleOptions, ...(saved.roleOptions ?? {}) } };
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(SKEY, JSON.stringify(s));
  } catch {
    /* private mode — ignore */
  }
}

export function loadHighs(): HighScore[] {
  try {
    const raw = localStorage.getItem(HKEY);
    return raw ? (JSON.parse(raw) as HighScore[]) : [];
  } catch {
    return [];
  }
}

export function pushHighs(
  entries: { name: string; role: RoleId; result: "WIN" | "LOSS"; score: number }[]
): HighScore[] {
  const stamped: HighScore[] = entries.map((e) => ({
    ...e,
    date: new Date().toISOString().slice(0, 10),
  }));
  const merged = [...loadHighs(), ...stamped]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  try {
    localStorage.setItem(HKEY, JSON.stringify(merged));
  } catch {
    /* ignore */
  }
  return merged;
}

export function loadNames(): string[] {
  try {
    const raw = localStorage.getItem(NKEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveNames(names: string[]) {
  try {
    localStorage.setItem(NKEY, JSON.stringify(names.slice(0, 12)));
  } catch {
    /* ignore */
  }
}

// ── LEGEND PROFILES (cumulative per-player stats) ──

export function loadLegends(): LegendProfile[] {
  try {
    const raw = localStorage.getItem(LKEY);
    return raw ? (JSON.parse(raw) as LegendProfile[]) : [];
  } catch {
    return [];
  }
}

export function saveLegends(legends: LegendProfile[]) {
  try {
    localStorage.setItem(LKEY, JSON.stringify(legends));
  } catch { /* ignore */ }
}

export function clearLegends() {
  try {
    localStorage.removeItem(LKEY);
    localStorage.removeItem(HKEY);
  } catch { /* ignore */ }
}

/**
 * After a match ends, update every player's cumulative legend profile.
 * Returns the updated legends array AND the per-player titles for display.
 */
export function updateLegends(
  rows: ScoreRow[],
  isWinnerFn: (playerId: number) => boolean,
): { legends: LegendProfile[]; titles: Map<number, string> } {
  const existing = loadLegends();
  const profileMap = new Map<string, LegendProfile>();
  existing.forEach((p) => profileMap.set(p.name.toLowerCase(), p));

  const titles = new Map<number, string>();

  for (const row of rows) {
    const key = row.player.name.toLowerCase();
    const won = isWinnerFn(row.player.id);

    let prof = profileMap.get(key) ?? {
      name: row.player.name,
      totalPoints: 0,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      currentWinStreak: 0,
      currentLoseStreak: 0,
      bestWinStreak: 0,
      bestLoseStreak: 0,
      lastTitle: "",
      lastRole: row.player.role,
      lastResult: won ? "WIN" as const : "LOSS" as const,
    };

    // Pick title BEFORE updating streaks so pickTitle can calculate new streak
    const title = pickTitle(row, won, prof, rows);
    titles.set(row.player.id, title);

    // Update cumulative stats
    prof.name = row.player.name; // keep latest casing
    prof.totalPoints += row.score;
    prof.matchesPlayed += 1;
    prof.lastRole = row.player.role;
    prof.lastResult = won ? "WIN" : "LOSS";
    prof.lastTitle = title;

    if (won) {
      prof.wins += 1;
      prof.currentWinStreak += 1;
      prof.currentLoseStreak = 0;
      if (prof.currentWinStreak > prof.bestWinStreak) prof.bestWinStreak = prof.currentWinStreak;
    } else {
      prof.losses += 1;
      prof.currentLoseStreak += 1;
      prof.currentWinStreak = 0;
      if (prof.currentLoseStreak > prof.bestLoseStreak) prof.bestLoseStreak = prof.currentLoseStreak;
    }

    profileMap.set(key, prof);
  }

  const legends = [...profileMap.values()].sort((a, b) => b.totalPoints - a.totalPoints);
  saveLegends(legends);
  return { legends, titles };
}
