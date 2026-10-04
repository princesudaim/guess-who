import { Eye, EyeOff, Flame } from "lucide-react";
import { useState } from "react";
import { sfx, unlockAudio } from "../lib/audio";
import { shake, vibrate } from "../lib/fx";
import { MAFIA_ROLES, ROLE_META } from "../lib/engine";
import type { Player, Settings } from "../lib/types";
import { Btn, Card, PassScreen, RoleIcon, TopBar } from "./ui";
import { cn } from "../utils/cn";

export default function RevealScreen({
  players, settings, onDone, onQuit,
}: {
  players: Player[]; settings: Settings; onDone: () => void; onQuit: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [stage, setStage] = useState<"pass" | "card">("pass");
  const [flipped, setFlipped] = useState(false);
  const p = players[idx];
  const meta = ROLE_META[p.role];

  // All mafia team members see ALL their partners (with their specific role names)
  const isMafia = MAFIA_ROLES.includes(p.role);
  const mafiaPartners = isMafia && settings.imposterSeesPartner
    ? players.filter((x) => MAFIA_ROLES.includes(x.role) && x.id !== p.id).map((x) => ({ name: x.name, role: x.role }))
    : [];

  // Executioner sees their target
  const execTarget = p.role === "executioner" && p.execTarget !== undefined
    ? players.find((x) => x.id === p.execTarget)
    : null;

  const flip = () => {
    unlockAudio();
    if (flipped) { sfx.flip(); setFlipped(false); return; }
    setFlipped(true);
    sfx.reveal(); shake(7, 320); vibrate(35, settings.haptics);
  };

  const next = () => {
    sfx.confirm();
    if (idx + 1 >= players.length) onDone();
    else { setFlipped(false); setStage("pass"); setIdx(idx + 1); }
  };

  return (
    <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col pb-8">
      <TopBar title="SEALED FILES" onBack={onQuit} />
      <div className="px-6 pt-1">
        <div className="flex gap-1.5">
          {players.map((_, i) => (
            <div key={i} className={cn("h-1 flex-1 rounded-full transition-all duration-500", i < idx ? "bg-blood" : i === idx ? "bg-blood/50" : "bg-white/[0.08]")}
              style={i === idx ? { boxShadow: "0 0 10px rgba(255,45,85,0.7)" } : undefined} />
          ))}
        </div>
        <div className="mt-2 text-center text-[10px] font-bold tracking-[0.3em] text-dim">FILE {idx + 1} OF {players.length}</div>
      </div>

      {stage === "pass" ? (
        <PassScreen eyebrow="HAND THE DEVICE TO" name={p.name} sub="Your sealed role file is waiting. Open it alone." actionLabel="OPEN MY FILE" onReady={() => setStage("card")} />
      ) : (
        <div className="anim-card-in flex flex-1 flex-col items-center justify-center px-6 pt-4">
          <div className="flip-scene w-full max-w-[188px]" onClick={flip}>
            <div className={cn("flip-inner relative aspect-[3/3.7] w-full cursor-pointer", flipped && "flipped")}>
              <div className="flip-face absolute inset-0">
                <Card className="relative flex h-full flex-col items-center justify-center overflow-hidden p-4 text-center">
                  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl"><div className="anim-shimmer absolute top-0 bottom-0 w-12 bg-white/[0.06] blur-md" /></div>
                  <div className="font-display text-[8px] font-bold tracking-[0.42em] text-dim">CLASSIFIED</div>
                  <div className="my-4 grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.05] text-dim"><Eye size={22} /></div>
                  <div className="font-display text-base font-black tracking-[0.24em] text-dim">* * * *</div>
                  <div className="absolute bottom-4 left-0 right-0 text-[9px] font-semibold tracking-[0.2em] text-dim">TAP TO REVEAL</div>
                </Card>
              </div>
              <div className="flip-face flip-back absolute inset-0">
                <div className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-3xl bg-[#14111f] p-4 text-center hairline">
                  <div className="font-display text-[8px] font-bold tracking-[0.42em] text-dim">YOU ARE</div>
                  <div className="my-3 grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.06]"><RoleIcon role={p.role} size={20} /></div>
                  <h2 className="font-display text-base leading-tight font-black tracking-wide text-ink">{meta.name.toUpperCase()}</h2>
                  <div className="mt-1 text-[8px] font-bold tracking-[0.2em] text-dim">{meta.team}</div>

                  {/* Mafia partners with role names */}
                  {mafiaPartners.length > 0 && (
                    <div className="mt-2 w-full rounded-xl bg-white/[0.05] px-2 py-1.5">
                      <div className="text-[7px] font-black tracking-[0.2em] text-dim">YOUR TEAM</div>
                      {mafiaPartners.map((mp, i) => (
                        <div key={i} className="mt-0.5 flex items-center justify-center gap-1 text-[10px] font-bold text-ink">
                          <span>{mp.name}</span>
                          <span className="text-[8px] font-black tracking-wider" style={{ color: ROLE_META[mp.role].color }}>
                            ({ROLE_META[mp.role].name})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Executioner target */}
                  {execTarget && (
                    <div className="mt-2 w-full rounded-xl bg-violet-neon/10 px-2 py-1.5 border border-violet-neon/30">
                      <div className="text-[7px] font-black tracking-[0.2em] text-violet-neon">YOUR TARGET</div>
                      <div className="mt-0.5 text-[11px] font-bold text-ink">{execTarget.name}</div>
                      <div className="text-[8px] text-dim">Get them ejected by day vote to win.</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {flipped && (
            <p className="anim-fade-up mt-4 max-w-[270px] text-center text-[11px] leading-relaxed text-dim">{meta.desc}</p>
          )}

          <div className="mt-7 w-full max-w-[300px]">
            {flipped ? (
              <Btn block size="lg" data-primary onClick={next} className="anim-fade-up">
                <Flame size={17} />
                {idx + 1 >= players.length ? "MEMORIZED — START NIGHT 1" : "MEMORIZED — BURN IT"}
              </Btn>
            ) : (
              <Btn block variant="ghost" onClick={flip}><EyeOff size={16} /> TAP CARD TO OPEN YOUR FILE</Btn>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
