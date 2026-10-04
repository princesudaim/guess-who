/* NIGHTFALL avatar system
   - Preset SVG crew avatars
   - Optional uploaded photo avatars (cropped client-side, stored offline)
   - A chosen avatar NEVER changes while typing; it only changes on explicit pick/randomize
*/

export type AccessoryId =
  | "none"
  | "antenna"
  | "cap"
  | "crown"
  | "horns"
  | "halo"
  | "leaf"
  | "flame"
  | "bolt"
  | "visorshade"
  | "bandage"
  | "headphones";

export interface AvatarDef {
  id: number;
  name: string;
  body: string;
  shade: string;
  accessory: AccessoryId;
  accent: string;
}

export type AvatarChoice =
  | { kind: "preset"; id: number }
  | { kind: "custom"; dataUrl: string };

export const AVATARS: AvatarDef[] = [
  { id: 0, name: "Scarlet", body: "#ff3b5c", shade: "#c01c3a", accessory: "none", accent: "#ffd1da" },
  { id: 1, name: "Cyanide", body: "#22d3ee", shade: "#0e8ca6", accessory: "antenna", accent: "#c8f6ff" },
  { id: 2, name: "Bumble", body: "#fbbf24", shade: "#c08706", accessory: "cap", accent: "#fff0c2" },
  { id: 3, name: "Mint", body: "#34d399", shade: "#12876a", accessory: "leaf", accent: "#ccfbe9" },
  { id: 4, name: "Royal", body: "#a78bfa", shade: "#6d4fd1", accessory: "crown", accent: "#e6ddff" },
  { id: 5, name: "Ember", body: "#fb7185", shade: "#c03a52", accessory: "flame", accent: "#ffdbe2" },
  { id: 6, name: "Abyss", body: "#3b4a7a", shade: "#1e2647", accessory: "horns", accent: "#c3cdf0" },
  { id: 7, name: "Frost", body: "#e2e8f0", shade: "#a3adbd", accessory: "halo", accent: "#ffffff" },
  { id: 8, name: "Volt", body: "#a3e635", shade: "#6ba013", accessory: "bolt", accent: "#eaffc4" },
  { id: 9, name: "Dusk", body: "#f472b6", shade: "#b83e84", accessory: "headphones", accent: "#ffd9ee" },
  { id: 10, name: "Rust", body: "#fb923c", shade: "#c05e12", accessory: "bandage", accent: "#ffe2c7" },
  { id: 11, name: "Shadow", body: "#4b5563", shade: "#242a34", accessory: "visorshade", accent: "#cbd2dd" },
];

export function avatarById(id: number): AvatarDef {
  return AVATARS[((id % AVATARS.length) + AVATARS.length) % AVATARS.length];
}

/** Stable fallback before a player explicitly picks. */
export function hashToAvatar(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h % AVATARS.length;
}

const PRESET_KEY = "nightfall.avatars.v2";
const CUSTOM_KEY = "nightfall.avatar-images.v1";
const GALLERY_KEY = "nightfall.avatar-gallery.v1";

export function loadPresetAvatarMap(): Record<string, number> {
  try {
    const raw = localStorage.getItem(PRESET_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export function savePresetAvatarMap(map: Record<string, number>) {
  try {
    localStorage.setItem(PRESET_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function loadCustomAvatarMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function saveCustomAvatarMap(map: Record<string, string>) {
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function keyOf(name: string) {
  return name.trim().toLowerCase();
}

/** Compatibility export for older callers that only care about preset ids. */
export function loadAvatarMap(): Record<string, number> {
  return loadPresetAvatarMap();
}

/** Resolve the stored avatar for a final player name. */
export function avatarChoiceFor(
  name: string,
  presetMap = loadPresetAvatarMap(),
  customMap = loadCustomAvatarMap()
): AvatarChoice {
  const key = keyOf(name);
  if (customMap[key]) return { kind: "custom", dataUrl: customMap[key] };
  return { kind: "preset", id: presetMap[key] ?? hashToAvatar(key) };
}

/** Compatibility export for old code that still expects a number. */
export function avatarFor(name: string, map: Record<string, number>): number {
  const key = keyOf(name);
  return map[key] ?? hashToAvatar(key);
}

/** Persist a final chosen avatar for a final player name. */
export function saveNamedAvatarChoice(
  name: string,
  choice: AvatarChoice,
  presetMap = loadPresetAvatarMap(),
  customMap = loadCustomAvatarMap()
): { presetMap: Record<string, number>; customMap: Record<string, string> } {
  const key = keyOf(name);
  const nextPreset = { ...presetMap };
  const nextCustom = { ...customMap };

  if (choice.kind === "custom") {
    nextCustom[key] = choice.dataUrl;
    delete nextPreset[key];
  } else {
    nextPreset[key] = choice.id;
    delete nextCustom[key];
  }

  savePresetAvatarMap(nextPreset);
  saveCustomAvatarMap(nextCustom);
  return { presetMap: nextPreset, customMap: nextCustom };
}

export function deleteNamedCustomAvatar(
  name: string,
  customMap = loadCustomAvatarMap()
): Record<string, string> {
  const key = keyOf(name);
  const next = { ...customMap };
  delete next[key];
  saveCustomAvatarMap(next);
  return next;
}

export function loadCustomAvatarGallery(): string[] {
  try {
    const raw = localStorage.getItem(GALLERY_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveCustomAvatarGallery(items: string[]) {
  try {
    localStorage.setItem(GALLERY_KEY, JSON.stringify(items.slice(0, 24)));
  } catch {
    /* ignore */
  }
}

export function addToCustomAvatarGallery(dataUrl: string, items = loadCustomAvatarGallery()): string[] {
  const deduped = [dataUrl, ...items.filter((x) => x !== dataUrl)].slice(0, 24);
  saveCustomAvatarGallery(deduped);
  return deduped;
}
