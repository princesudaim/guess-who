import { AlertTriangle, Dices, Play, Plus, Trash2, UserRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { sfx } from "../lib/audio";
import { MAX_PLAYERS, MIN_PLAYERS, ROLE_META, ALL_CONFIGURABLE_ROLES } from "../lib/engine";
import { loadNames, saveNames } from "../lib/storage";
import {
  addToCustomAvatarGallery,
  avatarChoiceFor,
  hashToAvatar,
  loadCustomAvatarGallery,
  loadCustomAvatarMap,
  loadPresetAvatarMap,
  saveNamedAvatarChoice,
  type AvatarChoice,
} from "../lib/avatars";
import { AvatarFace, AvatarPicker } from "./Avatar";
import type { RoleId, Settings } from "../lib/types";
import { Btn, RoleIcon, SectionLabel, TopBar } from "./ui";
import { cn } from "../utils/cn";

const RANDOM_NAMES = [
  "Nova","Ghost","Vex","Echo","Riot","Jinx","Onyx","Blaze",
  "Moxie","Zero","Sage","Rogue","Pixel","Wolf","Ivy","Dash",
  "Raven","Frost","Kit","Neo","Lux","Ash","Storm","Jet",
];

function randomName(taken: string[]): string {
  const pool = RANDOM_NAMES.filter((n) => !taken.some((t) => t.toLowerCase() === n.toLowerCase()));
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : `Player ${taken.length + 1}`;
}

function getRoleCfg(s: Settings, role: RoleId) {
  if (s.roles[role]) return s.roles[role]!;
  if (role === "doctor") return { count: s.doctorCount, chance: s.doctorChance };
  if (role === "detective") return { count: s.detectiveCount, chance: s.detectiveChance };
  if (role === "sheriff") return { count: s.sheriffCount, chance: s.sheriffChance };
  return { count: 0, chance: 100 };
}

export default function LobbyScreen({
  settings,
  onSettings: _onSettings,
  onRoles,
  onBack,
  onBegin,
}: {
  settings: Settings;
  onSettings: (s: Settings) => void; // available for future inline edits
  onRoles?: () => void;
  onBack: () => void;
  onBegin: (names: string[]) => void;
}) {
  const initialNames = (() => {
    const saved = loadNames();
    return saved.length >= MIN_PLAYERS ? saved : ["", "", "", "", "", ""];
  })();
  const [names, setNames] = useState<string[]>(initialNames);
  const [touched, setTouched] = useState(false);
  const [presetMap, setPresetMap] = useState<Record<string, number>>(loadPresetAvatarMap);
  const [customMap, setCustomMap] = useState<Record<string, string>>(loadCustomAvatarMap);
  const [customGallery, setCustomGallery] = useState<string[]>(loadCustomAvatarGallery);
  const [slotAvatars, setSlotAvatars] = useState<AvatarChoice[]>(() =>
    initialNames.map((n, i) =>
      n.trim()
        ? avatarChoiceFor(n.trim(), loadPresetAvatarMap(), loadCustomAvatarMap())
        : { kind: "preset", id: hashToAvatar(`slot-${i}`) }
    )
  );
  const [picking, setPicking] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const clean = useMemo(() => names.map((n) => n.trim()).filter(Boolean), [names]);
  const dupes = useMemo(() => {
    const seen = new Set<string>();
    const d = new Set<string>();
    clean.forEach((n) => { const k = n.toLowerCase(); if (seen.has(k)) d.add(k); seen.add(k); });
    return d;
  }, [clean]);

  const count = clean.length;
  const valid = count >= MIN_PLAYERS && count <= MAX_PLAYERS && dupes.size === 0;

  const randomPresetFor = (selfIndex: number) => {
    const used = slotAvatars.map((a, i) => (i === selfIndex || a.kind !== "preset" ? -1 : a.id)).filter((v) => v >= 0);
    const pool = Array.from({ length: 12 }, (_, i) => i).filter((id) => !used.includes(id));
    return { kind: "preset" as const, id: pool[Math.floor(Math.random() * pool.length)] ?? hashToAvatar(`slot-${selfIndex}`) };
  };

  const persistChoices = (draftNames: string[], draftAvatars: AvatarChoice[]) => {
    let nextPreset = { ...presetMap };
    let nextCustom = { ...customMap };
    draftNames.forEach((name, i) => {
      const cleanName = name.trim();
      if (!cleanName) return;
      const saved = saveNamedAvatarChoice(cleanName, draftAvatars[i], nextPreset, nextCustom);
      nextPreset = saved.presetMap;
      nextCustom = saved.customMap;
    });
    setPresetMap(nextPreset);
    setCustomMap(nextCustom);
  };

  const setName = (i: number, v: string) => { setTouched(true); setNames((prev) => prev.map((n, j) => (j === i ? v : n))); };
  const addPlayer = () => {
    if (names.length >= MAX_PLAYERS) return;
    sfx.pop();
    const next = [...names, ""];
    setNames(next);
    setSlotAvatars((prev) => [...prev, randomPresetFor(prev.length)]);
    requestAnimationFrame(() => inputRefs.current[next.length - 1]?.focus());
  };
  const removePlayer = (i: number) => {
    sfx.deny();
    setNames((prev) => prev.filter((_, j) => j !== i));
    setSlotAvatars((prev) => prev.filter((_, j) => j !== i));
  };
  const autofill = () => {
    sfx.coin();
    setNames((prev) => {
      const kept = prev.map((n) => n.trim()).filter(Boolean);
      const out = [...kept];
      while (out.length < Math.max(6, kept.length)) out.push(randomName(out));
      return out.slice(0, MAX_PLAYERS);
    });
  };

  useEffect(() => {
    const t = window.setTimeout(() => { if (valid) { saveNames(clean); persistChoices(names, slotAvatars); } }, 280);
    return () => window.clearTimeout(t);
  }, [valid, clean, names, slotAvatars]);

  // Faction draft info for the lobby warning
  const totalSeats = Math.max(count, MIN_PLAYERS);
  const draftTotal = settings.maxMafiaRoles + settings.maxNeutralRoles + settings.maxTownPowerRoles;
  const overbooked = draftTotal > totalSeats;
  const overbookAmount = Math.max(0, draftTotal - totalSeats);

  // Build roster preview from settings.roles
  const roster = useMemo(() => {
    const r: { role: string; chance: number }[] = [];
    const impCfg = getRoleCfg(settings, "imposter");
    for (let i = 0; i < impCfg.count; i++) r.push({ role: "imposter", chance: impCfg.chance });
    const ucCfg = getRoleCfg(settings, "undercover");
    for (let i = 0; i < ucCfg.count; i++) r.push({ role: "undercover", chance: ucCfg.chance });
    // all configurable roles except imposter, undercover & crew
    const otherRoles = ALL_CONFIGURABLE_ROLES.filter((rid) => rid !== "imposter" && rid !== "undercover" && rid !== "crew");
    let left = Math.max(count, MIN_PLAYERS) - impCfg.count - ucCfg.count;
    for (const rid of otherRoles) {
      const cfg = getRoleCfg(settings, rid);
      const n = Math.min(cfg.count, Math.max(0, left));
      for (let i = 0; i < n; i++) r.push({ role: rid, chance: cfg.chance });
      left -= n;
    }
    for (let i = 0; i < Math.max(0, left); i++) r.push({ role: "crew", chance: 100 });
    return r;
  }, [settings, count]);

  return (
    <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col pb-8">
      <TopBar title="THE LOBBY" onBack={onBack} />
      <div className="flex-1 space-y-6 overflow-y-auto px-5 pt-2">
        {/* player name entries */}
        <section>
          <div className="mb-3 flex items-end justify-between px-1">
            <div>
              <h2 className="font-display text-lg font-black tracking-wide">
                PLAYERS{" "}
                <span className={cn("tabular-nums", valid ? "text-emerald-neon" : "text-blood")}>{count}</span>
                <span className="text-dim">/{MAX_PLAYERS}</span>
              </h2>
              <p className="text-xs text-dim">{count < MIN_PLAYERS ? `need ${MIN_PLAYERS - count} more` : "looking dangerous. good."}</p>
            </div>
            <div className="flex gap-2">
              <Btn variant="ghost" size="sm" onClick={autofill}><Dices size={15} /></Btn>
              <Btn variant="ghost" size="sm" onClick={addPlayer} disabled={names.length >= MAX_PLAYERS}><Plus size={15} /> ADD</Btn>
            </div>
          </div>
          <div className="space-y-2">
            {names.map((n, i) => {
              const dup = n.trim() && dupes.has(n.trim().toLowerCase());
              return (
                <div key={i} className="anim-fade-up flex items-center gap-2.5" style={{ animationDelay: `${i * 40}ms` }}>
                  <button onClick={() => { sfx.pop(); setPicking(i); }} className="btn-press relative shrink-0">
                    <AvatarFace choice={slotAvatars[i] ?? randomPresetFor(i)} size={42} ring />
                    <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-night text-[8px] font-black text-dim hairline">✎</span>
                  </button>
                  <div className={cn("flex flex-1 items-center rounded-2xl bg-white/[0.03] transition-colors focus-within:bg-white/[0.07]", dup ? "border border-blood/70" : "hairline")}>
                    <UserRound size={15} className="ml-3.5 shrink-0 text-dim/70" />
                    <input
                      ref={(el) => { inputRefs.current[i] = el; }}
                      value={n} maxLength={16} placeholder={`Player ${i + 1}`}
                      onChange={(e) => setName(i, e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { if (i === names.length - 1 && names.length < MAX_PLAYERS) addPlayer(); else inputRefs.current[i + 1]?.focus(); } }}
                      className="w-full bg-transparent px-2.5 py-3 text-sm font-bold placeholder:font-normal placeholder:text-dim/50"
                    />
                    {dup && <span className="pr-3 text-[9px] font-black tracking-widest text-blood">DUPE</span>}
                  </div>
                  {names.length > 1 && (
                    <button onClick={() => removePlayer(i)} className="btn-press grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.03] text-dim hover:bg-blood/15 hover:text-blood"><Trash2 size={15} /></button>
                  )}
                </div>
              );
            })}
          </div>
          {touched && dupes.size > 0 && <p className="mt-2 px-1 text-[11px] font-semibold text-blood">No clones allowed — every name must be unique.</p>}
        </section>

        {/* roles config shortcut */}
        {onRoles && (
          <button onClick={() => { sfx.pop(); onRoles(); }} className="btn-press w-full flex items-center justify-center gap-2 rounded-2xl bg-blood/10 border border-blood/30 py-3.5 text-sm font-bold text-blood hover:bg-blood/15 transition-all">
            🎭 CONFIGURE ROLES & RULES
          </button>
        )}

        {/* overbooking warning — shown only when more roles configured than seats allow */}
        {overbooked && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-neon/40 bg-amber-neon/[0.07] px-4 py-3">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-neon" />
            <div>
              <div className="text-xs font-black tracking-[0.18em] text-amber-neon">OVERBOOKED — RANDOM TRIM</div>
              <p className="mt-1 text-[11px] leading-snug text-dim">
                Your faction draft limits total{" "}
                <span className="font-bold text-ink">{draftTotal} roles</span> but only{" "}
                <span className="font-bold text-ink">{totalSeats} players</span> exist.{" "}
                <span className="font-bold text-amber-neon">{overbookAmount} role{overbookAmount > 1 ? "s" : ""} will be randomly dropped</span> this match.
                Adjust limits in <span className="font-bold text-ink">🎭 Faction Draft Limits</span>.
              </p>
            </div>
          </div>
        )}

        {/* roster preview */}
        <section>
          <SectionLabel>TONIGHT'S ROSTER</SectionLabel>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5 px-2">
            {roster.map((slot, i) => {
              const role = slot.role as RoleId;
              const meta = ROLE_META[role];
              if (!meta) return null;
              return (
                <span key={i} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold tracking-wider"
                  style={{ color: meta.color, background: `${meta.color}14`, border: `1px solid ${meta.color}44`, opacity: slot.chance < 100 ? 0.75 : 1 }}>
                  <RoleIcon role={role} size={12} />
                  {meta.name.toUpperCase()}
                  {slot.chance < 100 && <span className="rounded bg-black/30 px-1 text-[9px] tabular-nums">{slot.chance}%</span>}
                </span>
              );
            })}
          </div>
          <p className="mt-2 text-center text-[10px] text-dim/70">slots with % may not spawn — rolled fresh each match</p>
        </section>
      </div>

      {picking !== null && (
        <AvatarPicker
          name={names[picking]?.trim() || `Player ${picking + 1}`}
          current={slotAvatars[picking] ?? randomPresetFor(picking)}
          gallery={customGallery}
          takenPresetIds={slotAvatars.map((a, j) => (j === picking || a?.kind !== "preset" ? -1 : a.id)).filter((v) => v >= 0)}
          onPick={(choice) => setSlotAvatars((prev) => prev.map((a, j) => (j === picking ? choice : a)))}
          onUploadCustom={(dataUrl) => setCustomGallery((prev) => addToCustomAvatarGallery(dataUrl, prev))}
          onClose={() => setPicking(null)}
        />
      )}

      <div className="px-5 pt-5">
        <Btn size="lg" block data-primary disabled={!valid} onClick={() => { sfx.confirm(); persistChoices(names, slotAvatars); onBegin(clean); }}>
          <Play size={19} /> DEAL THE ROLES
        </Btn>
        {!valid && count >= MIN_PLAYERS && <p className="mt-2 text-center text-[11px] font-semibold text-blood">fix the dupes first</p>}
      </div>
    </div>
  );
}
