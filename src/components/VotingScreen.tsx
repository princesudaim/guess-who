import { CheckCheck, RotateCcw, SkipForward } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { sfx } from "../lib/audio";
import { vibrate } from "../lib/fx";
import { tallyVotes } from "../lib/engine";
import type { Player, Settings, VoteBallot } from "../lib/types";
import { Avatar, Btn, Card, PlayerTile, TimerRing, TopBar } from "./ui";
import { cn } from "../utils/cn";

export default function VotingScreen({
  players,
  settings,
  round,
  onComplete,
}: {
  players: Player[];
  settings: Settings;
  round: number;
  onComplete: (
    ballots: VoteBallot[],
    mayorDouble: number | null,
    mayorVeto: boolean,
    vetoId: number | null
  ) => void;
}) {
  const alive = players.filter((p) => p.alive);
  const mayor = alive.find((p) => p.role === "mayor");
  // Mayor double vote is always silently applied when the ability is "doublevote".
  // No public announcement. Mayor votes like everyone else — but their vote weighs 2.
  const mayorDoubleId: number | null = mayor && settings.roleOptions.mayorAbility === "doublevote" ? mayor.id : null;

  const [stage, setStage] = useState<"intro" | "vote" | "tally">("intro");
  const [voterIdx, setVoterIdx] = useState(0);
  const [ballots, setBallots] = useState<VoteBallot[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [left, setLeft] = useState(settings.voteSeconds);
  const [timerRunning, setTimerRunning] = useState(false);
  const [preLeft, setPreLeft] = useState(settings.daySeconds);
  const [preRunning, setPreRunning] = useState(true);
  const lastTick = useRef(-1);

  const currentVoter = alive[voterIdx];

  // Pre-voting / meeting timer
  useEffect(() => {
    if (!preRunning || stage !== "intro") return;
    const iv = setInterval(() => setPreLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(iv);
  }, [preRunning, stage]);

  // Per-player voting timer
  useEffect(() => {
    if (!timerRunning) return;
    const iv = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(iv);
  }, [timerRunning]);

  useEffect(() => {
    if (stage === "vote") {
      setLeft(settings.voteSeconds);
      setTimerRunning(true);
      lastTick.current = -1;
    } else {
      setTimerRunning(false);
    }
  }, [stage, voterIdx, settings.voteSeconds]);

  // When the pre-voting timer ends, start actual voting automatically
  useEffect(() => {
    if (stage !== "intro" || !preRunning) return;
    if (preLeft <= 10 && preLeft > 0 && lastTick.current !== preLeft) {
      lastTick.current = preLeft;
      sfx.tick();
    }
    if (preLeft === 0) {
      sfx.alarm();
      vibrate([100, 60, 100], settings.haptics);
      setPreRunning(false);
      setStage("vote");
      lastTick.current = -1;
    }
  }, [preLeft, stage, preRunning, settings.haptics]);

  useEffect(() => {
    if (stage !== "vote" || !timerRunning) return;

    if (left <= 10 && left > 0 && lastTick.current !== left) {
      lastTick.current = left;
      sfx.tick();
    }

    if (left === 0) {
      sfx.alarm();
      vibrate(60, settings.haptics);
      // Timeout: auto-skip for current player ONLY, then move to next
      setBallots((prev) => [...prev, { voterId: currentVoter.id, targetId: null }]);
      setSelected(null);
      if (voterIdx + 1 >= alive.length) {
        setStage("tally");
      } else {
        setVoterIdx(voterIdx + 1);
      }
    }
  }, [left, stage, timerRunning, currentVoter.id, voterIdx, alive.length, settings.haptics]);

  const submitVote = () => {
    sfx.confirm();
    setBallots([...ballots, { voterId: currentVoter.id, targetId: selected }]);
    setSelected(null);
    if (voterIdx + 1 >= alive.length) {
      setStage("tally");
    } else {
      setVoterIdx(voterIdx + 1);
    }
  };

  const { ejectId, tally } = tallyVotes(ballots, players, mayorDoubleId, settings.roleOptions.mayorAbility);
  const maxV = Math.max(0, ...tally.values());
  const [showResult, setShowResult] = useState(false);
  const [resultText, setResultText] = useState("");

  const handleFinish = () => {
    if (mayorVetoTriggers) {
      setResultText(`Mayor Veto Activated. ${mayor?.name} survives.`);
      setShowResult(true);
      setTimeout(() => {
        onComplete(ballots, null, true, null);
      }, 4000);
      return;
    }

    if (ejectId === null) {
      const isSkip = ballots.every(b => b.targetId === null) || maxV === 0;
      setResultText(isSkip ? "No one was ejected. (Skipped)" : "No one was ejected. (Tie)");
      setShowResult(true);
      setTimeout(() => {
        onComplete(ballots, mayorDoubleId, false, null);
      }, 4000);
    } else {
      // Pass mayorDoubleId so App.tsx re-tallies with the correct double vote applied
      onComplete(ballots, mayorDoubleId, false, ejectId);
    }
  };

  if (showResult) {
    return (
      <div className="fixed inset-0 z-[500] flex flex-col items-center justify-center bg-black overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden">
          <div className="absolute top-0 left-0 w-[200%] h-full anim-star-bg flex">
            <div className="w-1/2 h-full flex flex-wrap gap-20 p-20 content-start">
              {Array.from({ length: 50 }).map((_, i) => (
                <div key={i} className="w-1 h-1 bg-white rounded-full" style={{ opacity: Math.random() }} />
              ))}
            </div>
            <div className="w-1/2 h-full flex flex-wrap gap-20 p-20 content-start">
              {Array.from({ length: 50 }).map((_, i) => (
                <div key={i} className="w-1 h-1 bg-white rounded-full" style={{ opacity: Math.random() }} />
              ))}
            </div>
          </div>
        </div>
        <div className="font-display text-xl sm:text-2xl font-black text-white text-center tracking-tight leading-tight px-6">
          <span className="inline-block anim-among-type">
            {resultText}
          </span>
        </div>
      </div>
    );
  }

  if (stage === "intro") {
    return (
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="anim-card-in flex flex-col items-center">
          <div className="font-display text-[10px] font-bold tracking-[0.5em] text-dim">DAY {round}</div>
          <h2 className="font-display mt-2 text-4xl font-black tracking-tight">DISCUSSION TIME</h2>
          <p className="mt-4 max-w-[270px] mx-auto text-sm leading-relaxed text-dim">
            Players talk now. Secret voting begins automatically when the timer ends.
          </p>

          <div className="mt-8">
            <TimerRing
              seconds={preLeft}
              total={settings.daySeconds}
              size={190}
              danger={preLeft <= 20 && preLeft > 0}
            />
          </div>

          {/* Timer controls — same pattern as DayScreen */}
          <div className="mt-5 flex items-center gap-2.5 flex-wrap justify-center">
            <Btn
              variant="ghost"
              size="sm"
              onClick={() => {
                sfx.pop();
                setPreLeft((l) => Math.max(0, l - 30));
              }}
            >
              −0:30
            </Btn>
            <Btn
              variant="ghost"
              size="sm"
              onClick={() => {
                sfx.flip();
                setPreLeft(settings.daySeconds);
                setPreRunning(true);
              }}
            >
              <RotateCcw size={14} /> RESTORE
            </Btn>
            <Btn
              variant="ghost"
              size="sm"
              onClick={() => {
                sfx.pop();
                setPreLeft((l) => Math.min(settings.daySeconds, l + 30));
              }}
            >
              +0:30
            </Btn>
            <Btn
              variant="ghost"
              size="sm"
              onClick={() => {
                sfx.confirm();
                setPreRunning(false);
                setStage("vote");
                lastTick.current = -1;
              }}
            >
              <SkipForward size={14} /> SKIP
            </Btn>
          </div>

          <div className="mt-5 text-[10px] font-bold tracking-[0.26em] text-dim">
            VOTING STARTS AUTOMATICALLY
          </div>
        </div>
      </div>
    );
  }

  if (stage === "vote") {
    return (
      <div key={`voter-${voterIdx}`} className="anim-card-in relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col pb-6">
        <TopBar title={`VOTING · ${voterIdx + 1}/${alive.length}`} right={<TimerRing seconds={left} total={settings.voteSeconds} size={60} danger={left <= Math.min(10, settings.voteSeconds / 2)} />} />
        <div className="flex-1 overflow-y-auto px-5 pt-2">
          <div className="anim-fade-up text-center">
            <Avatar name={currentVoter.name} size={64} className="mx-auto" />
            <div className="font-display mt-3 text-lg font-black">{currentVoter.name}</div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {alive.filter((p) => p.id !== currentVoter.id).map((p) => (
              <PlayerTile key={p.id} name={p.name} selected={selected === p.id} onClick={() => setSelected(p.id)} accent="#fbbf24" />
            ))}
          </div>
        </div>
        <div className="space-y-2.5 px-5 pt-4">
          <Btn size="lg" block data-primary disabled={selected === null} onClick={submitVote}>
            <CheckCheck size={17} /> CONFIRM VOTE
          </Btn>
          <Btn variant="ghost" block onClick={() => { setSelected(null); setBallots([...ballots, { voterId: currentVoter.id, targetId: null }]); if (voterIdx + 1 >= alive.length) { setStage("tally"); } else { setVoterIdx(voterIdx + 1); } }}>
            <SkipForward size={15} /> SKIP VOTE
          </Btn>
        </div>
      </div>
    );
  }

  const mayorTargeted = mayor?.alive && ejectId === mayor.id;
  const mayorVetoTriggers = Boolean(mayorTargeted && settings.roleOptions.mayorAbility === "veto");

  return (
    <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col items-center px-5 pt-8 pb-8">
      <div className="anim-card-in w-full">
        <div className="text-center mb-6">
          <div className="font-display text-[10px] font-bold tracking-[0.5em] text-dim">DAY {round} · TALLY</div>
          <h2 className="font-display mt-2 text-3xl font-black">THE VERDICT</h2>
        </div>
        <Card className="p-4 space-y-2">
          {alive.map((p) => {
            const v = tally.get(p.id) ?? 0;
            const pct = maxV > 0 ? (v / maxV) * 100 : 0;
            const isTop = v === maxV && v > 0;
            return (
              <div key={p.id} className={cn("rounded-2xl px-3 py-2.5 bg-white/[0.03]", isTop && ejectId === p.id && !mayorVetoTriggers && "bg-blood/10 border border-blood/40", isTop && ejectId === p.id && mayorVetoTriggers && "bg-amber-neon/10 border border-amber-neon/40")}>
                <div className="flex items-center gap-3">
                  <Avatar name={p.name} size={32} />
                  <span className="flex-1 text-sm font-bold truncate">{p.name}</span>
                  <span className="font-display text-lg font-black tabular-nums">{v}</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full bg-dim" style={{ width: `${pct}%`, transition: 'width 0.6s' }} />
                </div>
              </div>
            );
          })}
        </Card>

        {mayorVetoTriggers && (
          <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-amber-neon/[0.08] px-4 py-3 border border-amber-neon/30 text-center">
            <span className="text-xs font-bold text-amber-neon">👑 MAYOR VETO AUTOMATICALLY ACTIVATED! {mayor?.name} survives.</span>
          </div>
        )}

        <div className="mt-5 space-y-2.5">
          <Btn size="lg" block data-primary onClick={() => { sfx.confirm(); handleFinish(); }}>
             {mayorVetoTriggers ? "NEXT ROUND (VETOED)" : ejectId ? "CONFIRM EJECTION" : "NEXT ROUND"}
          </Btn>
        </div>
      </div>
    </div>
  );
}
