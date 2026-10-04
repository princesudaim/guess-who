import type {
  DeathInfo, GameEvent, NightState, Player, QueueActor, RoleId, RoleCfg,
  RoleOptions, ScoreRow, Settings, Team, VoteBallot, WinResult,
} from "./types";

export const MAFIA_ROLES: RoleId[] = ["imposter", "undercover", "conspirator", "framer", "saboteur"];
export const TOWN_ROLES: RoleId[] = ["doctor", "detective", "sheriff", "bodyguard", "roleblocker", "mayor", "crew"];
export const NEUTRAL_ROLES: RoleId[] = ["jester", "serialkiller", "executioner"];
export const MAFIA_KILLERS: RoleId[] = ["imposter", "undercover"];

export const ALL_CONFIGURABLE_ROLES: RoleId[] = [
  "imposter", "undercover", "conspirator", "framer", "saboteur",
  "doctor", "detective", "sheriff", "bodyguard", "roleblocker", "mayor",
  "jester", "serialkiller", "executioner", "crew",
];

export const ROLE_META: Record<RoleId, { name: string; plural: string; tagline: string; desc: string; color: string; team: Team }> = {
  imposter:     { name: "Imposter",      plural: "Imposters",      tagline: "KILL. DECEIVE. SURVIVE.",            desc: "Each night mark a townie for elimination. Win when mafia equals the town.", color: "#ff2d55", team: "MAFIA" },
  undercover:   { name: "Undercover",    plural: "Undercovers",    tagline: "THE ULTIMATE MAFIA AGENT.",          desc: "Joins the kill vote. Detective scans read INNOCENT (configurable). Special immunities to town powers.", color: "#dc2626", team: "MAFIA" },
  conspirator:  { name: "Conspirator",   plural: "Conspirators",   tagline: "BLEND IN. COUNT FOR PARITY.",        desc: "You know the mafia and they know you. No kill — just survive and count toward the win.", color: "#f43f5e", team: "MAFIA" },
  framer:       { name: "Framer",        plural: "Framers",        tagline: "MAKE INNOCENTS LOOK GUILTY.",        desc: "Each night frame one town player. The next detective check reads IMPOSTER.", color: "#fb923c", team: "MAFIA" },
  saboteur:     { name: "Saboteur",      plural: "Saboteurs",      tagline: "SILENTLY BREAK TOWN TOOLS.",         desc: "Block one town power role each night. They think everything worked.", color: "#f97316", team: "MAFIA" },
  doctor:       { name: "Doctor",        plural: "Doctors",        tagline: "ONE ANTIDOTE A NIGHT.",              desc: "Protect one player. If mafia marks them, they survive.", color: "#34d399", team: "TOWN" },
  detective:    { name: "Detective",     plural: "Detectives",     tagline: "READ THEM FILTHY.",                  desc: "Inspect one player. IMPOSTER or INNOCENT — results in the morning report.", color: "#22d3ee", team: "TOWN" },
  sheriff:      { name: "Sheriff",       plural: "Sheriffs",       tagline: "ONE SHOT. MAKE IT COUNT.",           desc: "Fire one bullet. Hit mafia — they die. Hit innocent — you die of guilt.", color: "#fbbf24", team: "TOWN" },
  bodyguard:    { name: "Bodyguard",     plural: "Bodyguards",     tagline: "TAKE THE BULLET.",                   desc: "Protect one other player. If mafia attacks them, you die instead.", color: "#60a5fa", team: "TOWN" },
  roleblocker:  { name: "Roleblocker",   plural: "Roleblockers",   tagline: "SHUT DOWN ONE PLAYER.",              desc: "Block one player's night ability.", color: "#818cf8", team: "TOWN" },
  mayor:        { name: "Mayor",         plural: "Mayors",         tagline: "YOUR VOTE IS POWER.",                desc: "No night action. Your vote secretly counts double (or you can veto an ejection).", color: "#fde68a", team: "TOWN" },
  crew:         { name: "Crewmate",      plural: "Crewmates",      tagline: "TRUST NO ONE.",                      desc: "No powers — just instinct and your vote.", color: "#a78bfa", team: "TOWN" },
  jester:       { name: "Jester",        plural: "Jesters",        tagline: "GET YOURSELF EJECTED. WIN.",         desc: "Get voted out during the day to win. Die at night = you lose.", color: "#e879f9", team: "NEUTRAL" },
  serialkiller: { name: "Serial Killer", plural: "Serial Killers", tagline: "BE THE LAST ONE STANDING.",          desc: "Kill one player every night independently. Win by being the last alive.", color: "#94a3b8", team: "NEUTRAL" },
  executioner:  { name: "Executioner",   plural: "Executioners",   tagline: "GET YOUR TARGET EJECTED.",           desc: "One town player is your secret target. Get them voted out to win.", color: "#c084fc", team: "NEUTRAL" },
};

export function defaultRoleOptions(): RoleOptions {
  return {
    sheriffShots: "one", doctorSelfHeal: true, doctorSelfHealOnce: true,
    bodyguardSelfProtect: false, roleblockerUses: 2,
    roleblockerCanBlockImposters: true, roleblockerNotifyBlocked: false,
    undercoverInnocentScans: 1,
    undercoverImmuneToSheriff: false, undercoverImmuneToDoctor: false,
    undercoverImmuneToRoleblocker: false, undercoverImmuneToSK: false,
    mayorAbility: "doublevote", conspiratorCountsForParity: true,
    frameLastsOneNight: true, saboteurNotifyBlocked: false,
    jesterWinsAlone: true, serialKillerDoctorBlocks: false,
    executionerTransformsToJester: true,
  };
}

export function defaultSettings(): Settings {
  return {
    roles: { imposter: { count: 2, chance: 100 }, doctor: { count: 1, chance: 100 }, detective: { count: 1, chance: 100 }, sheriff: { count: 1, chance: 100 } },
    imposterCount: 2, doctorCount: 1, detectiveCount: 1, sheriffCount: 1,
    doctorChance: 100, detectiveChance: 100, sheriffChance: 100,
    roleOptions: defaultRoleOptions(),
    imposterSeesPartner: true, revealPartnerChoice: false,
    stealthTurns: true, publishInvestigation: true,
    revealRoleOnEject: false, revealTrueRoleOnEject: false, revealRoleOnDeath: true,
    daySeconds: 120, voteSeconds: 15, holdToContinueSeconds: 3, realVoting: true,
    maxMafiaRoles: 2, maxNeutralRoles: 1, maxTownPowerRoles: 6,
    guaranteeMafiaKiller: true,
    sound: true, volume: 1, haptics: true,
  };
}

export const MIN_PLAYERS = 4; export const MAX_PLAYERS = 12; export const MAX_ROLE_COUNT = 4;
export function maxImposters(n: number) { return Math.max(1, Math.min(3, Math.floor((n - 1) / 2))); }
export function recommendedImposters(n: number) { return n <= 5 ? 1 : n <= 8 ? 2 : 3; }

function shuffle<T>(arr: T[]): T[] { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function rollCount(count: number, pct: number) { let c = 0; for (let i = 0; i < count; i++) if (Math.random() * 100 < pct) c++; return c; }
export function townSlots(n: number, s: Settings) { return Math.max(0, n - Math.min(getRoleCfg(s, "imposter").count, maxImposters(n))); }
function getRoleCfg(s: Settings, r: RoleId): RoleCfg {
  if (s.roles[r]) return s.roles[r]!;
  if (r === "doctor") return { count: s.doctorCount, chance: s.doctorChance };
  if (r === "detective") return { count: s.detectiveCount, chance: s.detectiveChance };
  if (r === "sheriff") return { count: s.sheriffCount, chance: s.sheriffChance };
  return { count: 0, chance: 100 };
}

export function assignRoles(names: string[], s: Settings): Player[] {
  const n = names.length;

  // ── STEP 1: Roll all configured roles into faction pools ──
  const mafiaPool: RoleId[] = [];
  const neutralPool: RoleId[] = [];
  const townPool: RoleId[] = [];

  const allMafia: RoleId[] = ["imposter", "undercover", "conspirator", "framer", "saboteur"];
  const allNeutral: RoleId[] = ["jester", "serialkiller", "executioner"];
  const allTownPower: RoleId[] = ["doctor", "detective", "sheriff", "bodyguard", "roleblocker", "mayor"];

  for (const r of allMafia) {
    const cfg = getRoleCfg(s, r);
    const cnt = rollCount(cfg.count, cfg.chance);
    for (let i = 0; i < cnt; i++) mafiaPool.push(r);
  }
  for (const r of allNeutral) {
    const cfg = getRoleCfg(s, r);
    const cnt = rollCount(cfg.count, cfg.chance);
    for (let i = 0; i < cnt; i++) neutralPool.push(r);
  }
  for (const r of allTownPower) {
    const cfg = getRoleCfg(s, r);
    const cnt = rollCount(cfg.count, cfg.chance);
    for (let i = 0; i < cnt; i++) townPool.push(r);
  }

  // ── STEP 2: Trim each pool to the faction draft limit ──
  let draftedMafia = shuffle(mafiaPool).slice(0, s.maxMafiaRoles);
  let draftedNeutral = shuffle(neutralPool).slice(0, s.maxNeutralRoles);
  let draftedTown = shuffle(townPool).slice(0, s.maxTownPowerRoles);

  // ── STEP 3: Safety — guarantee at least 1 mafia killer if toggle is ON ──
  if (s.guaranteeMafiaKiller && draftedMafia.length > 0) {
    const hasKiller = draftedMafia.some(r => r === "imposter" || r === "undercover");
    if (!hasKiller) {
      // Replace the last non-killer with a random killer type
      const killerType: RoleId = mafiaPool.includes("undercover") ? "undercover" : "imposter";
      draftedMafia[draftedMafia.length - 1] = killerType;
    }
  }

  // ── STEP 4: Combine and trim to player count ──
  let combined: RoleId[] = [...draftedMafia, ...draftedNeutral, ...draftedTown];
  
  // If combined exceeds player count, randomly trim the excess
  if (combined.length > n) {
    combined = shuffle(combined).slice(0, n);
    // Re-check killer guarantee after global trim
    if (s.guaranteeMafiaKiller) {
      const mafiaInCombined = combined.filter(r => MAFIA_ROLES.includes(r));
      if (mafiaInCombined.length > 0 && !mafiaInCombined.some(r => r === "imposter" || r === "undercover")) {
        const lastNonKillerIdx = combined.findIndex(r => MAFIA_ROLES.includes(r) && r !== "imposter" && r !== "undercover");
        if (lastNonKillerIdx >= 0) combined[lastNonKillerIdx] = "imposter";
      }
    }
  }

  // ── STEP 5: Fill remaining seats with Crewmates ──
  while (combined.length < n) combined.push("crew");

  const dealt = shuffle(combined);
  const players: Player[] = names.map((name, i) => ({ id: i, name, role: dealt[i], alive: true, ucScans: 0 }));

  // ── STEP 6: Assign executioner targets ──
  const townIds = players.filter((p) => TOWN_ROLES.includes(p.role)).map((p) => p.id);
  players.forEach((p) => {
    if (p.role === "executioner") {
      const pool = townIds.filter((id) => id !== p.id);
      if (pool.length > 0) p.execTarget = pool[Math.floor(Math.random() * pool.length)];
      else p.role = "crew";
    }
  });
  return players;
}

const ROLE_TO_MODE: Partial<Record<RoleId, QueueActor["mode"]>> = {
  imposter: "kill", undercover: "kill", framer: "frame", saboteur: "sabotage",
  doctor: "heal", bodyguard: "bg-protect", detective: "inspect", sheriff: "shoot",
  roleblocker: "block", serialkiller: "sk-kill",
};

export function nightTurnOrder(players: Player[], s: Settings, shotsUsed: Record<number, number>, rbUsed: Record<number, number>): QueueActor[] {
  const alive = shuffle(players.filter((p) => p.alive));
  const counters: Record<string, number> = {}; const totals: Record<string, number> = {};
  for (const p of alive) totals[p.role] = (totals[p.role] ?? 0) + 1;
  const order = alive.map((p, i) => {
    const idx = counters[p.role] ?? 0; counters[p.role] = idx + 1;
    let mode: QueueActor["mode"] = "suspect";
    const base = ROLE_TO_MODE[p.role]; if (base) mode = base;
    if (p.role === "sheriff" && !(s.roleOptions.sheriffShots === "night" || (shotsUsed[p.id] ?? 0) < 1)) mode = "suspect";
    if (p.role === "roleblocker" && (rbUsed[p.id] ?? 0) >= s.roleOptions.roleblockerUses) mode = "suspect";
    return { playerId: p.id, role: p.role, mode, label: `NIGHT TURN ${i + 1} OF ${alive.length}`, roleIndex: idx, roleTotal: totals[p.role] ?? 1 } satisfies QueueActor;
  });
  const killerSeats = order.map((a, i) => (MAFIA_KILLERS.includes(a.role) ? i : -1)).filter((i) => i >= 0);
  killerSeats.forEach((seat, n) => { order[seat] = { ...order[seat], roleIndex: n }; });
  return order;
}

export function canTarget(actor: { playerId: number; role: RoleId; mode: string }, target: Player, _players: Player[], opts: { doctorSelfBlocked?: boolean } = {}): boolean {
  if (!target.alive) return false;
  const self = target.id === actor.playerId;
  switch (actor.mode) {
    case "kill": return !self && !MAFIA_ROLES.includes(target.role);
    case "frame": case "sabotage": return !self && !MAFIA_ROLES.includes(target.role);
    case "inspect": case "shoot": case "block": case "sk-kill": return !self;
    case "heal": return self ? !opts.doctorSelfBlocked : true;
    case "bg-protect": return !self;
    case "suspect": return true;
    default: return true;
  }
}

export function checkWin(players: Player[], s: Settings, lastEjected?: Player): WinResult {
  const alive = players.filter((p) => p.alive);
  if (lastEjected?.role === "jester") return { winner: "jester", playerId: lastEjected.id };
  if (lastEjected) {
    const exec = players.find((p) => p.role === "executioner" && p.alive && p.execTarget === lastEjected.id);
    if (exec) return { winner: "executioner", playerId: exec.id };
  }
  const skAlive = alive.filter((p) => p.role === "serialkiller");
  if (skAlive.length > 0 && alive.every((p) => p.role === "serialkiller")) return { winner: "serialkiller", playerId: skAlive[0].id };
  const mafiaAlive = alive.filter((p) => MAFIA_ROLES.includes(p.role) && (p.role !== "conspirator" || s.roleOptions.conspiratorCountsForParity)).length;
  const nonMafiaAlive = alive.filter((p) => !MAFIA_ROLES.includes(p.role)).length;
  if (mafiaAlive === 0 && skAlive.length === 0) return { winner: "town" };
  if (mafiaAlive === 0 && skAlive.length > 0) return null;
  if (mafiaAlive >= nonMafiaAlive && skAlive.length === 0) return { winner: "imposters" };
  if (mafiaAlive >= nonMafiaAlive && skAlive.length > 0) return null;
  return null;
}

export function resolveNight(
  players: Player[], night: NightState, selfHealUsed: number[],
  round: number, s: Settings, framedPlayers: Record<number, number>
): { players: Player[]; deaths: DeathInfo[]; events: GameEvent[]; selfHealUsed: number[];
     winner: WinResult; newFramed: Record<number, number>;
     newDetectiveResults: { actorId: number; targetId: number; result: "IMPOSTER" | "INNOCENT" }[];
} {
  const events: GameEvent[] = []; const deaths: DeathInfo[] = [];
  const killedIds = new Map<number, DeathCause>(); const newSelfHealUsed = [...selfHealUsed];
  const newFramed = { ...framedPlayers }; const opts = s.roleOptions;

  for (const f of night.framerTargets) newFramed[f.targetId] = opts.frameLastsOneNight ? 1 : 999;
  const blockedIds = new Set<number>();
  // Town roleblocker — respects roleblockerCanBlockImposters setting
  for (const rb of night.roleblockerTargets) {
    const p = players.find(pp => pp.id === rb.targetId);
    if (p?.role === "undercover" && opts.undercoverImmuneToRoleblocker) continue;
    if (p && MAFIA_ROLES.includes(p.role) && !opts.roleblockerCanBlockImposters) continue;
    if (!blockedIds.has(rb.targetId)) {
      blockedIds.add(rb.targetId);
      if (opts.roleblockerNotifyBlocked) events.push({ round, type: "action-blocked" });
    }
  }
  // Saboteur — mafia power, always blocks town roles regardless of roleblocker settings
  for (const sb of night.saboteurTargets) {
    const p = players.find(pp => pp.id === sb.targetId);
    if (p?.role === "undercover" && opts.undercoverImmuneToRoleblocker) continue;
    // Saboteur can only target town roles (framer/saboteur targeting logic already prevents self/mafia)
    if (p && TOWN_ROLES.includes(p.role)) {
      if (!blockedIds.has(sb.targetId)) {
        blockedIds.add(sb.targetId);
        if (opts.saboteurNotifyBlocked) events.push({ round, type: "action-blocked" });
      }
    }
  }

  const validVotes = night.impVotes.filter((v) => !blockedIds.has(v.actorId));
  let finalMark: number | undefined;
  if (validVotes.length === 1) finalMark = validVotes[0].targetId;
  else if (validVotes.length >= 2) {
    const [a, b] = validVotes;
    if (a.targetId === b.targetId) finalMark = a.targetId;
    else { finalMark = Math.random() < 0.5 ? a.targetId : b.targetId; events.push({ round, type: "fiftyfifty", data: { options: [a.targetId, b.targetId], winner: finalMark } }); }
  }

  for (const save of night.doctorSaves) {
    if (blockedIds.has(save.actorId)) continue;
    if (save.targetId === save.actorId && !newSelfHealUsed.includes(save.actorId)) newSelfHealUsed.push(save.actorId);
  }
  const unblockedSaves = night.doctorSaves.filter((sv) => !blockedIds.has(sv.actorId));
  const savedByDoctor = finalMark !== undefined ? unblockedSaves.find((sv) => {
    if (sv.targetId !== finalMark) return false;
    // Undercover immune to doctor = if undercover helped make the kill, the doctor's save fails
    if (opts.undercoverImmuneToDoctor) {
      const ucInvolved = validVotes.some((v) => {
        const p = players.find((pp) => pp.id === v.actorId);
        return p?.role === "undercover" && v.targetId === finalMark;
      });
      if (ucInvolved) return false;
    }
    return true;
  }) : undefined;

  const bgProtect = night.bodyguardProtects.filter((bg) => !blockedIds.has(bg.actorId));
  const bgCover = finalMark !== undefined ? bgProtect.find((bg) => bg.targetId === finalMark) : undefined;

  if (finalMark !== undefined) {
    if (savedByDoctor) { events.push({ round, type: "save", actor: savedByDoctor.actorId, target: finalMark }); }
    else if (bgCover) { killedIds.set(bgCover.actorId, "bodyguard"); events.push({ round, type: "bodyguard-sacrifice", actor: bgCover.actorId, target: finalMark }); }
    else { killedIds.set(finalMark, "mafia"); events.push({ round, type: "mafia-kill", target: finalMark, data: { voters: validVotes.map((v) => v.actorId) } }); }
  }

  const newDetResults: { actorId: number; targetId: number; result: "IMPOSTER" | "INNOCENT" }[] = [];
  for (const check of night.detectiveChecks) {
    if (blockedIds.has(check.actorId)) continue;
    const target = players.find((p) => p.id === check.targetId); if (!target) continue;
    let result: "IMPOSTER" | "INNOCENT" = "INNOCENT";
    if (target.role === "undercover") {
      const scans = target.ucScans ?? 0;
      result = scans < opts.undercoverInnocentScans ? "INNOCENT" : "IMPOSTER";
    } else if (newFramed[target.id] && newFramed[target.id] > 0) { result = "IMPOSTER"; }
    else if (MAFIA_ROLES.includes(target.role)) { result = "IMPOSTER"; }
    newDetResults.push({ actorId: check.actorId, targetId: check.targetId, result });
    events.push({ round, type: result === "IMPOSTER" ? "check-imposter" : "check-innocent", actor: check.actorId, target: check.targetId });
  }

  for (const h of night.suspicions) {
    const t = players.find((p) => p.id === h.targetId);
    if (t && MAFIA_ROLES.includes(t.role)) events.push({ round, type: "good-read", actor: h.actorId, target: h.targetId });
  }

  for (const shot of night.sheriffShots) {
    if (shot.targetId === null || blockedIds.has(shot.actorId)) continue;
    const target = players.find((p) => p.id === shot.targetId);
    events.push({ round, type: "shot", actor: shot.actorId });
    // Undercover immune to sheriff: bullet bounces, but sheriff still dies of guilt if target is town.
    // If target is Undercover, sheriff DOES die of guilt because Undercover is "Innocent-looking" or bullet bounces.
    if (target?.role === "undercover" && opts.undercoverImmuneToSheriff) {
       killedIds.set(shot.actorId, "guilt"); events.push({ round, type: "guilt", actor: shot.actorId, target: target.id });
       continue;
    }
    if (target && MAFIA_ROLES.includes(target.role)) {
      killedIds.set(target.id, "sheriff"); events.push({ round, type: "shot-imposter", actor: shot.actorId, target: target.id });
    } else if (target) {
      killedIds.set(shot.actorId, "guilt"); events.push({ round, type: "guilt", actor: shot.actorId, target: target.id });
    }
  }

  for (const sk of night.skTargets) {
    const skTarget = players.find((p) => p.id === sk.targetId);
    if (skTarget?.role === "undercover" && opts.undercoverImmuneToSK) continue;
    const skSaved = opts.serialKillerDoctorBlocks ? unblockedSaves.some((sv) => sv.targetId === sk.targetId) : false;
    if (skTarget && !skSaved && !killedIds.has(sk.targetId)) {
      killedIds.set(sk.targetId, "sk"); events.push({ round, type: "sk-kill", actor: sk.actorId, target: sk.targetId });
    }
  }

  for (const id in newFramed) { newFramed[id]--; if (newFramed[id] <= 0) delete newFramed[id]; }

  const newPlayers = players.map((p) => {
    const np = killedIds.has(p.id) ? { ...p, alive: false } : { ...p };
    if (np.role === "undercover" && newDetResults.some((dr) => dr.targetId === np.id)) {
      np.ucScans = (np.ucScans ?? 0) + 1;
    }
    return np;
  });
  for (const [pid, cause] of killedIds) deaths.push({ playerId: pid, cause });

  if (opts.executionerTransformsToJester) {
    for (const d of deaths) {
      newPlayers.forEach((p) => {
        if (p.role === "executioner" && p.alive && p.execTarget === d.playerId) {
          p.role = "jester"; events.push({ round, type: "exec-target-died", actor: p.id, target: d.playerId });
        }
      });
    }
  }

  return { players: newPlayers, deaths, events, selfHealUsed: newSelfHealUsed, winner: checkWin(newPlayers, s), newFramed, newDetectiveResults: newDetResults };
}

export function resolveEject(players: Player[], ejectId: number, round: number, s: Settings) {
  const target = players.find((p) => p.id === ejectId);
  const events: GameEvent[] = [];
  const newPlayers = players.map((p) => (p.id === ejectId ? { ...p, alive: false } : p));
  events.push({ round, type: target?.role && MAFIA_ROLES.includes(target.role) ? "eject-imposter" : "eject-town", target: ejectId });
  return { players: newPlayers, events, winner: checkWin(newPlayers, s, target), ejectedPlayer: target };
}

export function tallyVotes(ballots: VoteBallot[], _players: Player[], mayorId: number | null, mayorAbility: "doublevote" | "veto") {
  const tally = new Map<number, number>();
  for (const b of ballots) { 
    if (b.targetId === null) continue; 
    const w = (b.voterId === mayorId && mayorAbility === "doublevote") ? 2 : 1; 
    tally.set(b.targetId, (tally.get(b.targetId) ?? 0) + w); 
  }
  if (tally.size === 0) return { ejectId: null as number | null, tally };
  const maxV = Math.max(...tally.values());
  const top = [...tally.entries()].filter(([, v]) => v === maxV).map(([id]) => id);
  return { ejectId: top.length === 1 ? top[0] : null, tally };
}

const BADGE: Record<string, string> = {
  "mafia-kill": "Hit Confirmed", save: "Lifeline", "bodyguard-sacrifice": "Ultimate Shield",
  "check-imposter": "Sleuth", "shot-imposter": "Deadeye", "good-read": "Good Read",
  "jester-win": "Trickster", "sk-win": "Last Standing", "exec-win": "Framed",
  survivor: "Last Breath", winner: "Champion",
};

export function computeScores(players: Player[], events: GameEvent[], winResult: WinResult): ScoreRow[] {
  if (!winResult) return players.map((p) => ({ player: p, score: 0, badges: [] }));
  const rows = new Map<number, ScoreRow>();
  players.forEach((p) => rows.set(p.id, { player: p, score: 0, badges: [] }));
  const add = (id: number, pts: number, badge?: string) => { const r = rows.get(id); if (!r) return; r.score += pts; if (badge && !r.badges.includes(badge)) r.badges.push(badge); };
  for (const ev of events) {
    switch (ev.type) {
      case "mafia-kill": ((ev.data?.voters as number[]) ?? []).forEach((id) => add(id, 100, BADGE["mafia-kill"])); break;
      case "save": if (ev.actor !== undefined) add(ev.actor, 150, BADGE.save); break;
      case "bodyguard-sacrifice": if (ev.actor !== undefined) add(ev.actor, 250, BADGE["bodyguard-sacrifice"]); break;
      case "check-imposter": if (ev.actor !== undefined) add(ev.actor, 120, BADGE["check-imposter"]); break;
      case "shot-imposter": if (ev.actor !== undefined) add(ev.actor, 200, BADGE["shot-imposter"]); break;
      case "good-read": if (ev.actor !== undefined) add(ev.actor, 60, BADGE["good-read"]); break;
      case "guilt": if (ev.actor !== undefined) add(ev.actor, -100); break;
    }
  }
  players.forEach((p) => {
    const al = p.alive ? 100 : 50;
    const w = winResult.winner;
    if (w === "town" && TOWN_ROLES.includes(p.role)) add(p.id, 300 + al, BADGE.winner);
    else if (w === "imposters" && MAFIA_ROLES.includes(p.role)) add(p.id, 300 + al, BADGE.winner);
    else if (w === "jester" && "playerId" in winResult && p.id === winResult.playerId) add(p.id, 500, BADGE["jester-win"]);
    else if (w === "serialkiller" && "playerId" in winResult && p.id === winResult.playerId) add(p.id, 500, BADGE["sk-win"]);
    else if (w === "executioner" && "playerId" in winResult && p.id === winResult.playerId) add(p.id, 500, BADGE["exec-win"]);
    if (p.alive) add(p.id, 100, BADGE.survivor);
  });
  return [...rows.values()].sort((a, b) => b.score - a.score);
}

type DeathCause = DeathInfo["cause"];
