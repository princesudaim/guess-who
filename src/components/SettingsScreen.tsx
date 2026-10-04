import {
  Eye,
  EyeOff,
  Fingerprint,
  Ghost,
  Hourglass,
  RotateCcw,
  Skull,
  Trash2,
  Users,
  VenetianMask,
  Vibrate,
  Volume2,
  Vote,
  Timer,
} from "lucide-react";
import { useState } from "react";
import { sfx } from "../lib/audio";
import { defaultSettings } from "../lib/engine";
import type { Settings } from "../lib/types";
import { Btn, Card, SectionLabel, SettingRow, Switch, TopBar } from "./ui";
import { cn } from "../utils/cn";

export default function SettingsScreen({
  settings,
  onSettings,
  onClearLegends,
  onBack,
}: {
  settings: Settings;
  onSettings: (s: Settings) => void;
  onClearLegends: () => void;
  onBack: () => void;
}) {
  const [confirmWipe, setConfirmWipe] = useState(false);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => onSettings({ ...settings, [k]: v });
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col pb-8">
      <TopBar title="SETTINGS" onBack={onBack} />
      <div className="flex-1 space-y-7 overflow-y-auto px-5 pt-2">

        {/* syndicate */}
        <section>
          <SectionLabel>SYNDICATE PROTOCOL</SectionLabel>
          <Card className="mt-3 divide-y divide-white/[0.05]">
            <SettingRow icon={<Users size={17} className="text-blood" />} title="Imposters know each other" desc="Partner names appear on the role card." control={<Switch on={settings.imposterSeesPartner} onChange={(v) => set("imposterSeesPartner", v)} />} />
            <SettingRow icon={<VenetianMask size={17} className="text-blood" />} title="Expose partner's mark" desc="OFF = imposters pick blind. ON = 2nd sees 1st's mark." control={<Switch on={settings.revealPartnerChoice} onChange={(v) => set("revealPartnerChoice", v)} />} />
          </Card>
        </section>

        {/* intel & reveals */}
        <section>
          <SectionLabel>INTEL & REVEALS</SectionLabel>
          <Card className="mt-3 divide-y divide-white/[0.05]">
            <SettingRow icon={<Ghost size={17} className="text-violet-neon" />} title="Stealth night turns" desc="Every player's turn looks 100% identical — no role hints." control={<Switch on={settings.stealthTurns} onChange={(v) => set("stealthTurns", v)} />} />
            <SettingRow icon={<Fingerprint size={17} className="text-cyan-neon" />} title="Publish investigation verdict" desc="Morning report announces CLEAN or DIRTY — no names." control={<Switch on={settings.publishInvestigation} onChange={(v) => set("publishInvestigation", v)} />} />
            <SettingRow icon={settings.revealRoleOnEject ? <Eye size={17} className="text-violet-neon" /> : <EyeOff size={17} className="text-dim" />} title="Reveal imposter on ejection" desc='Shows "was / was not an Imposter" after ejection. OFF = just says "was ejected."' control={<Switch on={settings.revealRoleOnEject} onChange={(v) => set("revealRoleOnEject", v)} />} />
            <SettingRow icon={settings.revealTrueRoleOnEject ? <Eye size={17} className="text-violet-neon" /> : <EyeOff size={17} className="text-dim" />} title="Reveal true role on ejection" desc="Shows the exact role card (Doctor, Framer, etc.) after ejection." control={<Switch on={settings.revealTrueRoleOnEject} onChange={(v) => set("revealTrueRoleOnEject", v)} />} />
            <SettingRow icon={settings.revealRoleOnDeath ? <Eye size={17} className="text-violet-neon" /> : <EyeOff size={17} className="text-dim" />} title="Reveal role on night death" desc="Show true identity in the morning report." control={<Switch on={settings.revealRoleOnDeath} onChange={(v) => set("revealRoleOnDeath", v)} />} />
          </Card>
        </section>

        {/* day phase */}
        <section>
          <SectionLabel>DAY PHASE</SectionLabel>
          <Card className="mt-3 divide-y divide-white/[0.05]">
            <div className="px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.05]"><Hourglass size={17} className="text-cyan-neon" /></div>
                <div className="flex-1">
                  <div className="text-sm font-bold">Pre-Voting (Deliberation)</div>
                  <div className="text-[11px] text-dim">Wait time before voting begins.</div>
                </div>
                <span className="font-display text-xl font-black text-cyan-neon tabular-nums" style={{ textShadow: "0 0 18px rgba(34,211,238,0.5)" }}>{fmt(settings.daySeconds)}</span>
              </div>
              <input type="range" min={60} max={300} step={30} value={settings.daySeconds} onChange={(e) => set("daySeconds", Number(e.target.value))} className="mt-4 w-full accent-[#22d3ee]" />
            </div>
            <SettingRow icon={<Vote size={17} className="text-amber-neon" />} title="Real player voting" desc="Every player votes secretly. OFF = host decides alone." control={<Switch on={settings.realVoting} onChange={(v) => set("realVoting", v)} />} />
            <div className={cn("px-4 py-3.5", !settings.realVoting && "opacity-30")}>
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.05]"><Hourglass size={17} className="text-amber-neon" /></div>
                <div className="flex-1">
                  <div className="text-sm font-bold">Per-Player Voting Timer</div>
                  <div className="text-[11px] text-dim">Time per player to cast their vote.</div>
                </div>
                <span className="font-display text-lg font-black text-amber-neon tabular-nums">{settings.voteSeconds}s</span>
              </div>
              <input type="range" min={10} max={60} step={5} disabled={!settings.realVoting} value={settings.voteSeconds} onChange={(e) => set("voteSeconds", Number(e.target.value))} className="mt-3 w-full accent-[#fbbf24]" />
            </div>
            <div className="px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.05]"><Timer size={17} className="text-amber-neon" /></div>
                <div className="flex-1">
                  <div className="text-sm font-bold">Hold-to-continue (morning)</div>
                  <div className="text-[11px] text-dim">Seconds to hold the button after seeing the report. 0 = tap.</div>
                </div>
                <span className="font-display text-lg font-black text-amber-neon tabular-nums">{settings.holdToContinueSeconds}s</span>
              </div>
              <input type="range" min={0} max={5} step={1} value={settings.holdToContinueSeconds} onChange={(e) => set("holdToContinueSeconds", Number(e.target.value))} className="mt-3 w-full accent-[#fbbf24]" />
            </div>
          </Card>
        </section>

        {/* experience */}
        <section>
          <SectionLabel>EXPERIENCE</SectionLabel>
          <Card className="mt-3 divide-y divide-white/[0.05]">
            <SettingRow icon={<Volume2 size={17} className="text-violet-neon" />} title="Synth sound FX" desc="Generated live — zero audio files." control={<Switch on={settings.sound} onChange={(v) => set("sound", v)} />} />
            <div className={cn("px-4 py-3.5", !settings.sound && "opacity-30")}>
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.05]"><Volume2 size={17} className="text-violet-neon" /></div>
                <div className="flex-1"><div className="text-sm font-bold">Master volume</div></div>
                <span className="font-display text-lg font-black text-violet-neon tabular-nums">{Math.round(settings.volume * 100)}</span>
              </div>
              <input type="range" min={0} max={100} step={5} disabled={!settings.sound} value={Math.round(settings.volume * 100)} onChange={(e) => set("volume", Number(e.target.value) / 100)} onPointerUp={() => sfx.pop()} className="mt-3 w-full accent-[#a78bfa]" />
            </div>
            <SettingRow icon={<Vibrate size={17} className="text-violet-neon" />} title="Haptics" desc="Vibration on reveals and eliminations (mobile)." control={<Switch on={settings.haptics} onChange={(v) => set("haptics", v)} />} />
          </Card>
        </section>

        <Btn variant="ghost" block onClick={() => { sfx.deny(); onSettings(defaultSettings()); }}><RotateCcw size={15} /> RESET TO DEFAULTS</Btn>
        
        <Btn 
          variant={confirmWipe ? "danger" : "ghost"} 
          block 
          onClick={() => {
            if (!confirmWipe) {
              sfx.click();
              setConfirmWipe(true);
              setTimeout(() => setConfirmWipe(false), 3000);
            } else {
              sfx.eject();
              onClearLegends();
              setConfirmWipe(false);
            }
          }}
          className={confirmWipe ? "text-blood" : ""}
        >
          <Trash2 size={15} /> {confirmWipe ? "TAP AGAIN TO WIPE HISTORY" : "WIPE HALL OF LEGENDS"}
        </Btn>

        <div className="flex items-center justify-center gap-2 pb-2 text-[10px] tracking-[0.24em] text-dim/50"><Skull size={11} /> SAVES INSTANTLY TO THIS DEVICE</div>
      </div>
    </div>
  );
}
