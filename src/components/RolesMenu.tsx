import {
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { sfx } from "../lib/audio";
import {
  defaultSettings,
  MAFIA_ROLES,
  MAX_ROLE_COUNT,
  NEUTRAL_ROLES,
  ROLE_META,
  TOWN_ROLES,
} from "../lib/engine";
import type { RoleId, Settings } from "../lib/types";
import { Btn, Card, ChancePicker, RoleIcon, SectionLabel, Stepper, Switch, SettingRow, TopBar } from "./ui";
import { cn } from "../utils/cn";

const TEAM_ORDER = [
  { label: "SYNDICATE", roles: MAFIA_ROLES },
  { label: "TOWN", roles: TOWN_ROLES.filter((r) => r !== "crew") },
  { label: "NEUTRAL", roles: NEUTRAL_ROLES },
  { label: "EXTRAS", roles: ["crew"] as RoleId[] },
];

function getRoleCfg(s: Settings, role: RoleId) {
  if (s.roles[role]) return s.roles[role]!;
  if (role === "doctor") return { count: s.doctorCount, chance: s.doctorChance };
  if (role === "detective") return { count: s.detectiveCount, chance: s.detectiveChance };
  if (role === "sheriff") return { count: s.sheriffCount, chance: s.sheriffChance };
  return { count: 0, chance: 100 };
}

function setRoleCfg(s: Settings, role: RoleId, cfg: { count?: number; chance?: number }): Settings {
  const cur = getRoleCfg(s, role);
  const next = { ...cur, ...cfg };
  const newRoles = { ...s.roles, [role]: next };
  // keep back-compat shortcuts in sync
  return {
    ...s,
    roles: newRoles,
    doctorCount: newRoles.doctor?.count ?? s.doctorCount,
    detectiveCount: newRoles.detective?.count ?? s.detectiveCount,
    sheriffCount: newRoles.sheriff?.count ?? s.sheriffCount,
    doctorChance: newRoles.doctor?.chance ?? s.doctorChance,
    detectiveChance: newRoles.detective?.chance ?? s.detectiveChance,
    sheriffChance: newRoles.sheriff?.chance ?? s.sheriffChance,
    imposterCount: role === "imposter" ? (cfg.count ?? cur.count) : s.imposterCount,
  };
}

function RoleCard({ role, s, onSettings }: { role: RoleId; s: Settings; onSettings: (s: Settings) => void }) {
  const [open, setOpen] = useState(false);
  const meta = ROLE_META[role];
  const cfg = getRoleCfg(s, role);
  const opts = s.roleOptions;

  const toggle = (e: React.MouseEvent) => { 
    // Ignore if clicking a button inside the card header (stepper)
    if ((e.target as HTMLElement).closest('button')) return;
    sfx.pop(); 
    setOpen((o) => !o); 
  };

  const roleOptions = () => {
    const rows: { title: string; desc: string; control: React.ReactNode }[] = [];
    if (role === "sheriff") {
      rows.push({
        title: "Bullet count",
        desc: "One per game or one per night.",
        control: (
          <div className="flex gap-1.5">
            {(["one", "night"] as const).map((v) => (
              <button key={v} onClick={() => { sfx.pop(); onSettings({ ...s, roleOptions: { ...opts, sheriffShots: v } }); }}
                className={cn("btn-press rounded-lg px-2.5 py-1.5 text-[10px] font-black tracking-widest", opts.sheriffShots === v ? "bg-amber-neon text-night" : "bg-white/[0.05] text-dim")}>
                {v.toUpperCase()}
              </button>
            ))}
          </div>
        ),
      });
    }
    if (role === "doctor") {
      rows.push({ title: "Self-heal allowed", desc: "Can the doctor protect themselves?", control: <Switch on={opts.doctorSelfHeal} onChange={(v) => onSettings({ ...s, roleOptions: { ...opts, doctorSelfHeal: v } })} /> });
      rows.push({ title: "Self-heal once per game", desc: "Limits to one self-protection all game.", control: <Switch on={opts.doctorSelfHealOnce} disabled={!opts.doctorSelfHeal} onChange={(v) => onSettings({ ...s, roleOptions: { ...opts, doctorSelfHealOnce: v } })} /> });
    }
    if (role === "bodyguard") {
      rows.push({ title: "Can protect themselves", desc: "OFF = bodyguard must protect others.", control: <Switch on={opts.bodyguardSelfProtect} onChange={(v) => onSettings({ ...s, roleOptions: { ...opts, bodyguardSelfProtect: v } })} /> });
    }
    if (role === "roleblocker") {
      rows.push({ title: "Block imposters", desc: "Removes their kill vote if blocked.", control: <Switch on={opts.roleblockerCanBlockImposters} onChange={(v) => onSettings({ ...s, roleOptions: { ...opts, roleblockerCanBlockImposters: v } })} /> });
      rows.push({ title: "Notify blocked players", desc: "Blocked player sees a warning.", control: <Switch on={opts.roleblockerNotifyBlocked} onChange={(v) => onSettings({ ...s, roleOptions: { ...opts, roleblockerNotifyBlocked: v } })} /> });
      rows.push({ title: "Uses per game", desc: "How many times this roleblocker can act.", control: (
        <div className="flex gap-1.5">
          {[1,2,3].map((v) => (
            <button key={v} onClick={() => { sfx.pop(); onSettings({ ...s, roleOptions: { ...opts, roleblockerUses: v } }); }}
              className={cn("btn-press h-8 w-8 rounded-lg font-black text-sm", opts.roleblockerUses === v ? "bg-violet-neon text-night" : "bg-white/[0.05] text-dim")}>
              {v}
            </button>
          ))}
        </div>
      )});
    }
    if (role === "mayor") {
      rows.push({ title: "Mayor ability", desc: "Double vote OR veto ejection.", control: (
        <div className="flex gap-1.5">
          {(["doublevote","veto"] as const).map((v) => (
            <button key={v} onClick={() => { sfx.pop(); onSettings({ ...s, roleOptions: { ...opts, mayorAbility: v } }); }}
              className={cn("btn-press rounded-lg px-2.5 py-1.5 text-[9px] font-black tracking-widest", opts.mayorAbility === v ? "bg-amber-neon text-night" : "bg-white/[0.05] text-dim")}>
              {v === "doublevote" ? "×2 VOTE" : "VETO"}
            </button>
          ))}
        </div>
      )});
    }
    if (role === "conspirator") {
      rows.push({ title: "Counts toward parity", desc: "If ON, conspirator + imposter can win together.", control: <Switch on={opts.conspiratorCountsForParity} onChange={(v) => onSettings({ ...s, roleOptions: { ...opts, conspiratorCountsForParity: v } })} /> });
    }
    if (role === "framer") {
      rows.push({ title: "Frame lasts 1 night only", desc: "OFF = frame persists until detected.", control: <Switch on={opts.frameLastsOneNight} onChange={(v) => onSettings({ ...s, roleOptions: { ...opts, frameLastsOneNight: v } })} /> });
    }
    if (role === "saboteur") {
      rows.push({ title: "Notify blocked players", desc: "Blocked players see a warning (reduces surprise).", control: <Switch on={opts.saboteurNotifyBlocked} onChange={(v) => onSettings({ ...s, roleOptions: { ...opts, saboteurNotifyBlocked: v } })} /> });
    }

    if (role === "undercover") {
      rows.push({ title: "Innocent scans", desc: "How many detective scans read INNOCENT (1, 2, or ∞).", control: (
        <div className="flex gap-1.5">
          {[1,2,999].map((v) => (
            <button key={v} onClick={() => { sfx.pop(); onSettings({ ...s, roleOptions: { ...opts, undercoverInnocentScans: v } }); }}
              className={cn("btn-press h-8 rounded-lg px-2.5 font-black text-sm", opts.undercoverInnocentScans === v ? "bg-blood text-white" : "bg-white/[0.05] text-dim")}>
              {v === 999 ? "∞" : v}
            </button>
          ))}
        </div>
      )});
      rows.push({ title: "Immune to Sheriff", desc: "Sheriff bullet bounces off — no guilt either.", control: <Switch on={opts.undercoverImmuneToSheriff} onChange={(v) => onSettings({ ...s, roleOptions: { ...opts, undercoverImmuneToSheriff: v } })} /> });
      rows.push({ title: "Immune to Doctor shields", desc: "Undercover's kills pierce Doctor shields.", control: <Switch on={opts.undercoverImmuneToDoctor} onChange={(v) => onSettings({ ...s, roleOptions: { ...opts, undercoverImmuneToDoctor: v } })} /> });
      rows.push({ title: "Immune to Roleblocker", desc: "Roleblocker cannot block this player.", control: <Switch on={opts.undercoverImmuneToRoleblocker} onChange={(v) => onSettings({ ...s, roleOptions: { ...opts, undercoverImmuneToRoleblocker: v } })} /> });
      rows.push({ title: "Immune to Serial Killer", desc: "SK cannot kill this player.", control: <Switch on={opts.undercoverImmuneToSK} onChange={(v) => onSettings({ ...s, roleOptions: { ...opts, undercoverImmuneToSK: v } })} /> });
    }
    if (role === "jester") {
      rows.push({ title: "Jester wins alone", desc: "OFF = jester win counts as a town win.", control: <Switch on={opts.jesterWinsAlone} onChange={(v) => onSettings({ ...s, roleOptions: { ...opts, jesterWinsAlone: v } })} /> });
    }
    if (role === "serialkiller") {
      rows.push({ title: "Doctor can block SK", desc: "Doctor save neutralizes serial killer's kill.", control: <Switch on={opts.serialKillerDoctorBlocks} onChange={(v) => onSettings({ ...s, roleOptions: { ...opts, serialKillerDoctorBlocks: v } })} /> });
    }
    if (role === "executioner") {
      rows.push({ title: "Transforms to Jester", desc: "If target dies at night, executioner becomes jester.", control: <Switch on={opts.executionerTransformsToJester} onChange={(v) => onSettings({ ...s, roleOptions: { ...opts, executionerTransformsToJester: v } })} /> });
    }
    return rows;
  };

  const extraRows = roleOptions();

  return (
    <div className={cn("overflow-hidden rounded-2xl transition-all hairline", cfg.count > 0 && "shadow-[0_0_24px_-8px]")}
      style={{ boxShadow: cfg.count > 0 ? `0 0 24px -8px ${meta.color}66` : undefined }}>
      {/* header row */}
      <div onClick={toggle} className="btn-press flex w-full items-center gap-3 px-4 py-3.5 text-left bg-white/[0.03] hover:bg-white/[0.06] cursor-pointer">
        <RoleIcon role={role} size={18} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold">{meta.name}</div>
          <div className="text-[10px] text-dim truncate">{meta.tagline}</div>
        </div>
        <div className="flex items-center gap-2">
          <Stepper 
            value={cfg.count} 
            min={0} 
            max={MAX_ROLE_COUNT} 
            onChange={(v) => onSettings(setRoleCfg(s, role, { count: v }))} 
            accent={meta.color} 
          />
          {open ? <ChevronDown size={15} className="shrink-0 text-dim" /> : <ChevronRight size={15} className="shrink-0 text-dim" />}
        </div>
      </div>

      {/* expanded config */}
      {open && (
        <div className="border-t border-white/[0.05] bg-white/[0.02] px-4 py-3 space-y-4">
          <p className="text-xs leading-relaxed text-dim">{meta.desc}</p>

          <div>
            <div className="mb-1.5 text-[10px] font-black tracking-[0.2em] text-dim">SPAWN CHANCE PER SLOT</div>
            <ChancePicker value={cfg.chance} onChange={(v) => onSettings(setRoleCfg(s, role, { chance: v }))} accent={meta.color} disabled={cfg.count === 0} />
            {cfg.count > 0 && cfg.chance < 100 && (
              <p className="mt-1.5 text-[10px] text-dim/70">
                Each of the {cfg.count} slot{cfg.count > 1 ? "s" : ""} rolls independently at {cfg.chance}%.
              </p>
            )}
          </div>

          {extraRows.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-white/[0.05]">
              <div className="text-[10px] font-black tracking-[0.2em] text-dim pt-1">ROLE OPTIONS</div>
              {extraRows.map((row, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-xs font-bold">{row.title}</div>
                    <div className="text-[10px] text-dim">{row.desc}</div>
                  </div>
                  {row.control}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RolesMenu({ settings, onSettings, onBack }: {
  settings: Settings;
  onSettings: (s: Settings) => void;
  onBack: () => void;
}) {
  return (
    <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col pb-8">
      <TopBar title="ROLES CONFIG" onBack={onBack} />
      <div className="flex-1 space-y-6 overflow-y-auto px-5 pt-2">
        {TEAM_ORDER.map(({ label, roles }) => (
          <section key={label}>
            <SectionLabel>{label}</SectionLabel>
            <div className="mt-3 space-y-2">
              {roles.map((role) => (
                <RoleCard key={role} role={role} s={settings} onSettings={onSettings} />
              ))}
            </div>
          </section>
        ))}

        <div>
          <SectionLabel>FACTION DRAFT LIMITS</SectionLabel>
          <Card className="mt-3 divide-y divide-white/[0.05]">
            <div className="px-4 py-3.5">
              <p className="text-[11px] leading-relaxed text-dim mb-3">
                Set how many roles from each faction can appear this match. The game will randomly pick from your enabled roles up to these limits. Leftover seats become Crewmates.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ background: "#ff2d551a" }}>
                    <span className="text-sm">🔴</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold">Max Mafia Roles</div>
                    <div className="text-[10px] text-dim">Imposter, Undercover, Framer, etc.</div>
                  </div>
                  <Stepper value={settings.maxMafiaRoles} min={0} max={6} onChange={(v) => onSettings({ ...settings, maxMafiaRoles: v })} accent="#ff2d55" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ background: "#c084fc1a" }}>
                    <span className="text-sm">🟣</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold">Max Neutral Roles</div>
                    <div className="text-[10px] text-dim">Jester, Serial Killer, Executioner.</div>
                  </div>
                  <Stepper value={settings.maxNeutralRoles} min={0} max={4} onChange={(v) => onSettings({ ...settings, maxNeutralRoles: v })} accent="#c084fc" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ background: "#34d3991a" }}>
                    <span className="text-sm">🟢</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold">Max Town Power Roles</div>
                    <div className="text-[10px] text-dim">Doctor, Detective, Sheriff, etc. (not Crewmates)</div>
                  </div>
                  <Stepper value={settings.maxTownPowerRoles} min={0} max={8} onChange={(v) => onSettings({ ...settings, maxTownPowerRoles: v })} accent="#34d399" />
                </div>
              </div>
            </div>
            <SettingRow
              title="Guarantee mafia killer"
              desc="If any mafia role is dealt, at least 1 must be a killer (Imposter or Undercover). Turn OFF to allow pure-support mafia teams."
              control={<Switch on={settings.guaranteeMafiaKiller} onChange={(v) => onSettings({ ...settings, guaranteeMafiaKiller: v })} />}
            />
          </Card>
        </div>

        <div>
          <SectionLabel>GLOBAL OPTIONS</SectionLabel>
          <Card className="mt-3 divide-y divide-white/[0.05]">
            <SettingRow
              title="Imposters see each other"
              desc="Partner names appear on the role card."
              control={<Switch on={settings.imposterSeesPartner} onChange={(v) => onSettings({ ...settings, imposterSeesPartner: v })} />}
            />
            <SettingRow
              title="Expose partner's mark"
              desc="Agent 2 sees Agent 1's target. OFF = pure luck."
              control={<Switch on={settings.revealPartnerChoice} onChange={(v) => onSettings({ ...settings, revealPartnerChoice: v })} />}
            />
          </Card>
        </div>

        <Btn block variant="ghost" onClick={() => { sfx.deny(); onSettings({ ...defaultSettings(), sound: settings.sound, volume: settings.volume, haptics: settings.haptics }); }}>
          RESET ALL ROLES TO DEFAULTS
        </Btn>
      </div>
    </div>
  );
}
