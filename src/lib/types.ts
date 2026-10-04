export type RoleId =
  | "imposter" | "undercover" | "conspirator" | "framer" | "saboteur"
  | "doctor" | "detective" | "sheriff" | "bodyguard" | "roleblocker" | "mayor" | "crew"
  | "jester" | "serialkiller" | "executioner";

export type Team = "MAFIA" | "TOWN" | "NEUTRAL";

export type Phase =
  | "start" | "lobby" | "settings" | "roles" | "reveal"
  | "night" | "report" | "day" | "voting" | "eject" | "over";

export interface Player {
  id: number;
  name: string;
  role: RoleId;
  alive: boolean;
  execTarget?: number;
  /** how many detective scans this undercover has survived (tracked in game state) */
  ucScans?: number;
}

export interface RoleCfg { count: number; chance: number; }

export interface RoleOptions {
  sheriffShots: "one" | "night";
  doctorSelfHeal: boolean;
  doctorSelfHealOnce: boolean;
  bodyguardSelfProtect: boolean;
  roleblockerUses: number;
  roleblockerCanBlockImposters: boolean;
  roleblockerNotifyBlocked: boolean;
  /** how many times detective reads INNOCENT on undercover: 1, 2, or 999 (always) */
  undercoverInnocentScans: number;
  undercoverImmuneToSheriff: boolean;
  undercoverImmuneToDoctor: boolean;
  undercoverImmuneToRoleblocker: boolean;
  undercoverImmuneToSK: boolean;
  mayorAbility: "doublevote" | "veto";
  conspiratorCountsForParity: boolean;
  frameLastsOneNight: boolean;
  saboteurNotifyBlocked: boolean;
  jesterWinsAlone: boolean;
  serialKillerDoctorBlocks: boolean;
  executionerTransformsToJester: boolean;
}

export interface Settings {
  roles: Partial<Record<RoleId, RoleCfg>>;
  imposterCount: number;
  doctorCount: number; detectiveCount: number; sheriffCount: number;
  doctorChance: number; detectiveChance: number; sheriffChance: number;
  roleOptions: RoleOptions;
  imposterSeesPartner: boolean;
  revealPartnerChoice: boolean;
  stealthTurns: boolean;
  publishInvestigation: boolean;
  /** show "was / was not an Imposter" text on ejection */
  revealRoleOnEject: boolean;
  /** show the exact true role card (e.g. Doctor, Framer) on ejection */
  revealTrueRoleOnEject: boolean;
  revealRoleOnDeath: boolean;
  daySeconds: number;
  voteSeconds: number;
  holdToContinueSeconds: number;
  realVoting: boolean;
  /** Faction draft limits — how many of each faction can appear */
  maxMafiaRoles: number;
  maxNeutralRoles: number;
  maxTownPowerRoles: number;
  /** Safety: guarantee at least 1 mafia killer (Imposter/Undercover) if any mafia is dealt */
  guaranteeMafiaKiller: boolean;
  sound: boolean;
  volume: number;
  haptics: boolean;
}

export type DeathCause = "mafia" | "sheriff" | "guilt" | "ejected" | "sk" | "bodyguard";
export interface DeathInfo { playerId: number; cause: DeathCause; }

export type GameEventType =
  | "mafia-kill" | "save" | "bodyguard-sacrifice" | "fiftyfifty"
  | "check-imposter" | "check-innocent" | "shot-imposter" | "guilt" | "shot"
  | "good-read" | "sk-kill" | "exec-target-died"
  | "eject-imposter" | "eject-town" | "skip" | "action-blocked";

export interface GameEvent {
  round: number; type: GameEventType;
  actor?: number; target?: number;
  data?: Record<string, unknown>;
}

export interface NightState {
  impVotes: { actorId: number; targetId: number }[];
  doctorSaves: { actorId: number; targetId: number }[];
  bodyguardProtects: { actorId: number; targetId: number }[];
  detectiveChecks: { actorId: number; targetId: number; result: "IMPOSTER" | "INNOCENT" }[];
  sheriffShots: { actorId: number; targetId: number | null }[];
  roleblockerTargets: { actorId: number; targetId: number }[];
  saboteurTargets: { actorId: number; targetId: number }[];
  framerTargets: { actorId: number; targetId: number }[];
  skTargets: { actorId: number; targetId: number }[];
  suspicions: { actorId: number; targetId: number }[];
}

export const EMPTY_NIGHT: NightState = {
  impVotes: [], doctorSaves: [], bodyguardProtects: [],
  detectiveChecks: [], sheriffShots: [], roleblockerTargets: [],
  saboteurTargets: [], framerTargets: [], skTargets: [], suspicions: [],
};

export interface VoteBallot { voterId: number; targetId: number | null; }
export interface ScoreRow { player: Player; score: number; badges: string[]; }
export interface HighScore { name: string; role: RoleId; result: "WIN" | "LOSS"; score: number; date: string; }

export interface LegendProfile {
  name: string;
  totalPoints: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  currentWinStreak: number;
  currentLoseStreak: number;
  bestWinStreak: number;
  bestLoseStreak: number;
  lastTitle: string;
  lastRole: RoleId;
  lastResult: "WIN" | "LOSS";
}

export type NightMode =
  | "kill" | "heal" | "bg-protect" | "inspect" | "shoot"
  | "block" | "frame" | "sk-kill" | "suspect" | "sabotage";

export interface QueueActor {
  playerId: number; role: RoleId; mode: NightMode;
  label: string; roleIndex: number; roleTotal: number;
}

export type WinResult =
  | { winner: "town" }
  | { winner: "imposters" }
  | { winner: "jester"; playerId: number }
  | { winner: "serialkiller"; playerId: number }
  | { winner: "executioner"; playerId: number }
  | null;
