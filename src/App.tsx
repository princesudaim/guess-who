import { Pause } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import DayScreen, { EjectScreen } from "./components/DayScreen";
import GameOverScreen from "./components/GameOverScreen";
import LobbyScreen from "./components/LobbyScreen";
import NightScreen, { ReportScreen } from "./components/NightScreen";
import RevealScreen from "./components/RevealScreen";
import RolesMenu from "./components/RolesMenu";
import SettingsScreen from "./components/SettingsScreen";
import StartScreen from "./components/StartScreen";
import VotingScreen from "./components/VotingScreen";
import { Backdrop, PauseOverlay, PoweredBy } from "./components/ui";
import { sfx, setSound, setVolume, unlockAudio } from "./lib/audio";
import {
  assignRoles,
  computeScores,
  resolveEject,
  resolveNight,
  tallyVotes,
} from "./lib/engine";
import { burstAt, confetti, initFx, shake } from "./lib/fx";
import { loadHighs, loadSettings, pushHighs, saveSettings, updateLegends, loadLegends, clearLegends } from "./lib/storage";
import type {
  DeathInfo,
  GameEvent,
  HighScore,
  LegendProfile,
  NightState,
  Phase,
  Player,
  Settings,
  VoteBallot,
  WinResult,
} from "./lib/types";


const IN_GAME: Phase[] = ["night", "report", "day", "voting", "eject"];

export default function App() {
  const [settings, setSettingsState] = useState<Settings>(loadSettings);
  const [phase, setPhase] = useState<Phase>("start");
  const [returnTo, setReturnTo] = useState<Phase>("start");

  const [players, setPlayers] = useState<Player[]>([]);
  const [round, setRound] = useState(1);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [deaths, setDeaths] = useState<DeathInfo[]>([]);
  const [selfHealUsed, setSelfHealUsed] = useState<number[]>([]);
  const [framedPlayers, setFramedPlayers] = useState<Record<number, number>>({});
  const [pendingWinner, setPendingWinner] = useState<WinResult>(null);
  const [winResult, setWinResult] = useState<WinResult>(null);
  const [ejected, setEjected] = useState<Player | null>(null);
  const [hadFiftyFifty, setHadFiftyFifty] = useState(false);
  const [verdicts, setVerdicts] = useState<{ actorId: number; targetId: number; result: "IMPOSTER" | "INNOCENT" }[]>([]);
  const [, setHighs] = useState<HighScore[]>(loadHighs);
  const [legends, setLegends] = useState<LegendProfile[]>(loadLegends);
  const [matchTitles, setMatchTitles] = useState<Map<number, string>>(new Map());
  const [paused, setPaused] = useState(false);
  const [rbUsed, setRbUsed] = useState<Record<number, number>>({});

  useEffect(() => { initFx(); }, []);
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  useEffect(() => {
    saveSettings(settings);
    setSound(settings.sound);
    setVolume(settings.volume);
  }, [settings]);

  const setSettings = (s: Settings) => {
    setSettingsState(s);
    saveSettings(s);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA";
      if (e.key === "Escape" && IN_GAME.includes(phase)) {
        sfx.flip(); setPaused((p) => !p); return;
      }
      if (typing || paused) return;
      if (e.key === "Enter" || e.key === " ") {
        const btn = document.querySelector<HTMLButtonElement>("[data-primary]");
        if (btn && !btn.disabled) { e.preventDefault(); btn.click(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, paused]);

  const shotsUsed = useMemo(() => {
    const map: Record<number, number> = {};
    events.forEach((ev) => { if (ev.type === "shot" && ev.actor !== undefined) map[ev.actor] = (map[ev.actor] ?? 0) + 1; });
    return map;
  }, [events]);

  const beginMatch = (names: string[]) => {
    const newPlayers = assignRoles(names, settings);
    setPlayers(newPlayers);
    setRound(1);
    setEvents([]);
    setDeaths([]);
    setSelfHealUsed([]);
    setFramedPlayers({});
    setPendingWinner(null);
    setWinResult(null);
    setEjected(null);
    setHadFiftyFifty(false);
    setVerdicts([]);
    setPaused(false);
    setRbUsed({});
    sfx.gameStart();
    setPhase("reveal");
  };

  const nightComplete = (night: NightState) => {
    const res = resolveNight(players, night, selfHealUsed, round, settings, framedPlayers);
    setPlayers(res.players);
    setDeaths(res.deaths);
    setEvents((ev) => [...ev, ...res.events]);
    setSelfHealUsed(res.selfHealUsed);
    setFramedPlayers(res.newFramed);
    setVerdicts(res.newDetectiveResults);
    setPendingWinner(res.winner);
    setHadFiftyFifty(res.events.some((e) => e.type === "fiftyfifty"));

    // update roleblocker uses
    const newRbUsed = { ...rbUsed };
    night.roleblockerTargets.forEach((rb) => {
      newRbUsed[rb.actorId] = (newRbUsed[rb.actorId] ?? 0) + 1;
    });
    setRbUsed(newRbUsed);

    if (res.deaths.length > 0) {
      sfx.kill(); shake(10, 400);
      burstAt(window.innerWidth / 2, window.innerHeight * 0.32, { colors: ["#ff2d55", "#f4f1ff"], count: 30, power: 400 });
    } else if (res.events.some((e) => e.type === "save")) { sfx.save(); }
    setPhase("report");
  };

  const endGame = (w: WinResult, finalPlayers: Player[], finalEvents: GameEvent[]) => {
    if (!w) return;
    const rows = computeScores(finalPlayers, finalEvents, w);
    const updated = pushHighs(rows.map((r) => ({
      name: r.player.name, role: r.player.role,
      result: isWinner(r.player, w) ? ("WIN" as const) : ("LOSS" as const),
      score: r.score,
    })));
    setHighs(updated);

    // Update cumulative legend profiles + assign titles
    const { legends: newLegends, titles } = updateLegends(rows, (pid) => {
      const p = finalPlayers.find((pp) => pp.id === pid);
      return p ? isWinner(p, w) : false;
    });
    setLegends(newLegends);
    setMatchTitles(titles);

    setWinResult(w);
    setPaused(false);

    if (w.winner === "jester" || w.winner === "executioner") {
      confetti(2000, ["#e879f9", "#fbbf24", "#f4f1ff"]);
    } else if (w.winner === "town") {
      confetti(3200, ["#34d399", "#22d3ee", "#fbbf24", "#f4f1ff"]);
    } else if (w.winner === "imposters") {
      confetti(2000, ["#ff2d55", "#a78bfa", "#f4f1ff"]);
    }

    setPhase("over");
  };

  const isWinner = (player: Player, w: WinResult): boolean => {
    if (!w) return false;
    if (w.winner === "town") return ["TOWN"].includes(player.role === "crew" ? "TOWN" : "") ||
      (["doctor","detective","sheriff","bodyguard","roleblocker","mayor","crew"].includes(player.role));
    if (w.winner === "imposters") return ["imposter","conspirator","framer","saboteur","godfather","undercover"].includes(player.role);
    if (w.winner === "jester") return player.id === (w as {winner:"jester";playerId:number}).playerId;
    if (w.winner === "serialkiller") return player.id === (w as {winner:"serialkiller";playerId:number}).playerId;
    if (w.winner === "executioner") return player.id === (w as {winner:"executioner";playerId:number}).playerId;
    return false;
  };

  const reportContinue = () => {
    sfx.flip();
    if (pendingWinner) { endGame(pendingWinner, players, events); return; }
    if (settings.realVoting) setPhase("voting");
    else setPhase("day");
  };

  const dayVerdict = (ejectId: number | null) => {
    if (ejectId === null) {
      setEvents((ev) => [...ev, { round, type: "skip" }]);
      setRound((r) => r + 1);
      setPhase("night");
      return;
    }
    doEject(ejectId);
  };

  const doEject = (ejectId: number) => {
    const res = resolveEject(players, ejectId, round, settings);
    setPlayers(res.players);
    setEvents((ev) => [...ev, ...res.events]);
    setEjected(res.ejectedPlayer ?? null);
    setPendingWinner(res.winner);
    sfx.eject(); shake(11, 420);
    setPhase("eject");
  };

  const votingComplete = (ballots: VoteBallot[], mayorDouble: number | null, mayorVeto: boolean, vetoId: number | null) => {
    if (mayorVeto && vetoId === null) {
      // Veto: skip ejection
      setEvents((ev) => [...ev, { round, type: "skip" }]);
      setRound((r) => r + 1);
      setPhase("night");
      return;
    }
    const { ejectId } = tallyVotes(ballots, players, mayorDouble, settings.roleOptions.mayorAbility);
    if (ejectId === null) {
      setEvents((ev) => [...ev, { round, type: "skip" }]);
      setRound((r) => r + 1);
      setPhase("night");
    } else {
      doEject(ejectId);
    }
  };

  const ejectContinue = () => {
    sfx.flip();
    if (pendingWinner) { endGame(pendingWinner, players, events); return; }
    setRound((r) => r + 1);
    setPhase("night");
  };

  const openSettings = (from: Phase) => { setReturnTo(from); setPaused(false); setPhase("settings"); };
  const openRoles = (from: Phase) => { setReturnTo(from); setPaused(false); setPhase("roles"); };

  const handleClearLegends = () => {
    clearLegends();
    setLegends([]);
    setHighs([]);
  };

  return (
    <div id="app-shell" className="relative min-h-dvh">
      <Backdrop />

      {phase === "start" && (
        <StartScreen
          onStart={() => setPhase("lobby")}
          onSettings={() => openSettings("start")}
        />
      )}
      {phase === "lobby" && (
        <LobbyScreen
          settings={settings}
          onSettings={setSettings}
          onRoles={() => openRoles("lobby")}
          onBack={() => setPhase("start")}
          onBegin={beginMatch}
        />
      )}
      {phase === "settings" && (
        <SettingsScreen settings={settings} onSettings={setSettings} onClearLegends={handleClearLegends} onBack={() => setPhase(returnTo)} />
      )}
      {phase === "roles" && (
        <RolesMenu settings={settings} onSettings={setSettings} onBack={() => setPhase(returnTo)} />
      )}
      {phase === "reveal" && (
        <RevealScreen players={players} settings={settings} onDone={() => setPhase("night")} onQuit={() => setPhase("lobby")} />
      )}
      {phase === "night" && (
        <NightScreen
          key={`night-${round}`}
          players={players} settings={settings} round={round}
          selfHealUsed={selfHealUsed} shotsUsed={shotsUsed} rbUsed={rbUsed}
          onComplete={nightComplete}
        />
      )}
      {phase === "report" && (
        <ReportScreen
          players={players} deaths={deaths} round={round} settings={settings}
          hadFiftyFifty={hadFiftyFifty} verdicts={verdicts}
          blockedCount={events.filter(e => e.round === round && e.type === "action-blocked").length}
          onContinue={reportContinue}
        />
      )}
      {phase === "day" && (
        <DayScreen players={players} settings={settings} round={round} paused={paused} onVerdict={dayVerdict} />
      )}
      {phase === "voting" && (
        <VotingScreen players={players} settings={settings} round={round} onComplete={votingComplete} />
      )}
      {phase === "eject" && ejected && (
        <EjectScreen player={ejected} reveal={settings.revealRoleOnEject} revealTrueRole={settings.revealTrueRoleOnEject} round={round} onContinue={ejectContinue} />
      )}
      {phase === "over" && winResult && (
        <GameOverScreen
          players={players} events={events} winResult={winResult} rounds={round}
          legends={legends} matchTitles={matchTitles} settings={settings}
          onRematch={() => beginMatch(players.map((p) => p.name))}
          onLobby={() => setPhase("lobby")}
          onMenu={() => setPhase("start")}
        />
      )}

      {IN_GAME.includes(phase) && !paused && (
        <button
          onClick={() => { sfx.flip(); setPaused(true); }}
          aria-label="Pause"
          className="btn-press fixed top-4 right-4 z-[240] grid h-10 w-10 place-items-center rounded-xl bg-white/[0.05] text-dim backdrop-blur-md transition-colors hover:text-ink hairline"
        >
          <Pause size={17} />
        </button>
      )}

      <PoweredBy />

      {paused && (
        <PauseOverlay
          onResume={() => setPaused(false)}
          onSettings={() => openSettings(phase)}
          onRoles={() => openRoles(phase)}
          onRestart={() => beginMatch(players.map((p) => p.name))}
          onQuit={() => { setPaused(false); setPhase("start"); }}
        />
      )}
    </div>
  );
}
