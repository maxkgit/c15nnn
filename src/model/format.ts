export type Point = { x: number; y: number };
export type BloodKind = "NORMAL" | "SPARKS" | "COMBINE";
export type WeaponMode = "v2" | "v1" | "builtin" | "none";
export type AnimGroup = "base" | "extra";

export interface SoundSlot {
  key: string;
  level: number;
}

export interface AnimDef {
  section: string;
  resource: string;
  group: AnimGroup;
  aliases: string[];
}

export interface WeaponDef {
  key: string;
  base: Point;
}

export interface AnimData {
  resource: string;
  mask: string;
  resource2: string;
  mask2: string;
  frames: number;
  waitcount: number;
  backanim: boolean;
  points: Record<string, Point[]>;
  pointsLeft: Record<string, Point[]>;
}

export interface PlayerModel {
  name: string;
  author: string;
  description: string;
  version: string;
  weaponMode: WeaponMode;
  overlayMelee: boolean;
  flagPoint: Point;
  flagAngle: number;
  blood: { r: number; g: number; b: number; kind: BloodKind };
  pain: SoundSlot[];
  die: SoundSlot[];
  slop: number;
  gibs: { resource: string; mask: string; count: number; once: number };
  anims: Record<string, AnimData>;
}

export const FRAME = 64;
export const GIB_FRAME = 32;
export const PLAYER_RECT = { x: 15, y: 12, w: 34, h: 52 };
export const PLAYER_HEAD = { x: 24, y: 12, w: 20, h: 12 };
export const FLAG_BASE = { x: 16, y: 43 };
export const FLAG_DEFAULT = { x: 32, y: 16 };
export const FLAG_ANGLE_DEFAULT = -20;

export const ANIM_DEFS: AnimDef[] = [
  { section: "StandAnim", resource: "STAND", group: "base", aliases: ["STAND"] },
  { section: "WalkAnim", resource: "WALK", group: "base", aliases: ["WALK", "RUN"] },
  { section: "Die1Anim", resource: "DIE1", group: "base", aliases: ["DIE1", "DIE"] },
  { section: "Die2Anim", resource: "DIE2", group: "base", aliases: ["DIE2"] },
  { section: "AttackAnim", resource: "ATTACK", group: "base", aliases: ["ATTACK"] },
  { section: "SeeUpAnim", resource: "SEEUP", group: "base", aliases: ["SEEUP", "SEEP"] },
  { section: "SeeDownAnim", resource: "SEEDOWN", group: "base", aliases: ["SEEDOWN", "SITDOWN"] },
  { section: "AttackUpAnim", resource: "ATTACKUP", group: "base", aliases: ["ATTACKUP"] },
  { section: "AttackDownAnim", resource: "ATTACKDOWN", group: "base", aliases: ["ATTACKDOWN"] },
  { section: "PainAnim", resource: "PAIN", group: "base", aliases: ["PAIN", "OBS"] },
  // Нет графики у стандартного Doomer — временно скрыты из интерфейса
  // { section: "WalkAttackAnim", resource: "WALKATTACK", group: "extra", aliases: ["WALKATTACK"] },
  // { section: "WalkSeeUpAnim", resource: "WALKSEEUP", group: "extra", aliases: ["WALKSEEUP"] },
  // { section: "WalkSeeDownAnim", resource: "WALKSEEDOWN", group: "extra", aliases: ["WALKSEEDOWN"] },
  // { section: "WalkAttackUpAnim", resource: "WALKATTACKUP", group: "extra", aliases: ["WALKATTACKUP"] },
  // { section: "WalkAttackDownAnim", resource: "WALKATTACKDOWN", group: "extra", aliases: ["WALKATTACKDOWN"] },
  // { section: "MeleeStandAnim", resource: "FISTSTAND", group: "extra", aliases: ["FISTSTAND", "FIST"] },
  // { section: "MeleeWalkAnim", resource: "FISTWALK", group: "extra", aliases: ["FISTWALK"] },
  // { section: "MeleeAttackAnim", resource: "FISTATTACK", group: "extra", aliases: ["FISTATTACK"] },
  // { section: "MeleeWalkAttackAnim", resource: "FISTWALKATTACK", group: "extra", aliases: ["FISTWALKATTACK"] },
  // { section: "MeleeSeeUpAnim", resource: "FISTSEEUP", group: "extra", aliases: ["FISTSEEUP"] },
  // { section: "MeleeSeeDownAnim", resource: "FISTSEEDOWN", group: "extra", aliases: ["FISTSEEDOWN"] },
  // { section: "MeleeAttackUpAnim", resource: "FISTATTACKUP", group: "extra", aliases: ["FISTATTACKUP"] },
  // { section: "MeleeAttackDownAnim", resource: "FISTATTACKDOWN", group: "extra", aliases: ["FISTATTACKDOWN"] },
];

export const WEAPON_DEFS: WeaponDef[] = [
  { key: "csaw", base: { x: 8, y: 4 } },
  { key: "hgun", base: { x: 8, y: 8 } },
  { key: "sg", base: { x: 16, y: 16 } },
  { key: "ssg", base: { x: 16, y: 24 } },
  { key: "mgun", base: { x: 16, y: 16 } },
  { key: "rkt", base: { x: 24, y: 24 } },
  { key: "plz", base: { x: 16, y: 16 } },
  { key: "bfg", base: { x: 24, y: 24 } },
  { key: "spl", base: { x: 16, y: 16 } },
  { key: "flm", base: { x: 8, y: 8 } },
];

/** Offset of `to` relative to `from`. Fire sprites reuse the unfired pose. */
export const WEAPON_ALIGN: Record<string, Record<string, Point>> = {
  csaw: { hgun: { x: 11, y: -2 }, sg: { x: -8, y: -2 }, ssg: { x: -7, y: -1 }, mgun: { x: -7, y: -2 }, rkt: { x: -14, y: -2 }, plz: { x: -4, y: -1 }, bfg: { x: -7, y: -1 }, spl: { x: -8, y: -2 }, flm: { x: -4, y: -1 } },
  hgun: { csaw: { x: -11, y: 2 }, sg: { x: -19, y: 0 }, ssg: { x: -18, y: 1 }, mgun: { x: -18, y: 0 }, rkt: { x: -25, y: 0 }, plz: { x: -15, y: 1 }, bfg: { x: -18, y: 1 }, spl: { x: -19, y: 0 }, flm: { x: -15, y: 1 } },
  sg: { csaw: { x: 8, y: 2 }, hgun: { x: 19, y: 0 }, ssg: { x: 1, y: 1 }, mgun: { x: 1, y: 0 }, rkt: { x: -6, y: 0 }, plz: { x: 4, y: 1 }, bfg: { x: 1, y: 1 }, spl: { x: 0, y: 0 }, flm: { x: 4, y: 1 } },
  ssg: { csaw: { x: 7, y: 1 }, hgun: { x: 18, y: -1 }, sg: { x: -1, y: -1 }, mgun: { x: 0, y: -1 }, rkt: { x: -7, y: -1 }, plz: { x: 3, y: 0 }, bfg: { x: 0, y: 0 }, spl: { x: -1, y: -1 }, flm: { x: 3, y: 0 } },
  mgun: { csaw: { x: 7, y: 2 }, hgun: { x: 18, y: 0 }, sg: { x: -1, y: 0 }, ssg: { x: 0, y: 1 }, rkt: { x: -7, y: 0 }, plz: { x: 3, y: 1 }, bfg: { x: 0, y: 1 }, spl: { x: -1, y: 0 }, flm: { x: 3, y: 1 } },
  rkt: { csaw: { x: 14, y: 2 }, hgun: { x: 25, y: 0 }, sg: { x: 6, y: 0 }, ssg: { x: 7, y: 1 }, mgun: { x: 7, y: 0 }, plz: { x: 10, y: 1 }, bfg: { x: 7, y: 1 }, spl: { x: 6, y: 0 }, flm: { x: 10, y: 1 } },
  plz: { csaw: { x: 4, y: 1 }, hgun: { x: 15, y: -1 }, sg: { x: -4, y: -1 }, ssg: { x: -3, y: 0 }, mgun: { x: -3, y: -1 }, rkt: { x: -10, y: -1 }, bfg: { x: -3, y: 0 }, spl: { x: -4, y: -1 }, flm: { x: 0, y: 0 } },
  bfg: { csaw: { x: 7, y: 1 }, hgun: { x: 18, y: -1 }, sg: { x: -1, y: -1 }, ssg: { x: 0, y: 0 }, mgun: { x: 0, y: -1 }, rkt: { x: -7, y: -1 }, plz: { x: 3, y: 0 }, spl: { x: -1, y: -1 }, flm: { x: 3, y: 0 } },
  spl: { csaw: { x: 8, y: 2 }, hgun: { x: 19, y: 0 }, sg: { x: 0, y: 0 }, ssg: { x: 1, y: 1 }, mgun: { x: 1, y: 0 }, rkt: { x: -6, y: 0 }, plz: { x: 4, y: 1 }, bfg: { x: 1, y: 1 }, flm: { x: 4, y: 1 } },
  flm: { csaw: { x: 4, y: 1 }, hgun: { x: 15, y: -1 }, sg: { x: -4, y: -1 }, ssg: { x: -3, y: 0 }, mgun: { x: -3, y: -1 }, rkt: { x: -10, y: -1 }, plz: { x: 0, y: 0 }, bfg: { x: -3, y: 0 }, spl: { x: -4, y: -1 } },
};

export const NO_WEAPON_ANIMS = new Set(["Die1Anim", "Die2Anim", "PainAnim"]);

const DEFAULT_POINT: Point = { x: 48, y: 40 };

export function emptyAnim(resource: string, frames = 1): AnimData {
  const points: Record<string, Point[]> = {};
  const pointsLeft: Record<string, Point[]> = {};
  for (const w of WEAPON_DEFS) {
    points[w.key] = Array.from({ length: frames }, () => ({ ...DEFAULT_POINT }));
    pointsLeft[w.key] = [];
  }
  return {
    resource,
    mask: `${resource}MASK`,
    resource2: "",
    mask2: "",
    frames,
    waitcount: 3,
    backanim: false,
    points,
    pointsLeft,
  };
}

export function createEmptyModel(): PlayerModel {
  const anims: Record<string, AnimData> = {};
  for (const def of ANIM_DEFS) {
    const frames = def.resource === "WALK" || def.resource === "FISTWALK" ? 4 : 1;
    anims[def.section] = emptyAnim(def.resource, frames);
  }
  return {
    name: "Doomer",
    author: "",
    description: "",
    version: "1.0",
    weaponMode: "v2",
    overlayMelee: true,
    flagPoint: { ...FLAG_DEFAULT },
    flagAngle: FLAG_ANGLE_DEFAULT,
    blood: { r: 150, g: 0, b: 0, kind: "NORMAL" },
    pain: [
      { key: "PAIN1", level: 1 },
      { key: "PAIN2", level: 2 },
      { key: "PAIN3", level: 2 },
      { key: "PAIN4", level: 2 },
      { key: "PAIN5", level: 3 },
      { key: "PAIN6", level: 3 },
      { key: "MEGAPAIN", level: 4 },
    ],
    die: [
      { key: "DIE1", level: 1 },
      { key: "DIE2", level: 1 },
      { key: "FALL1", level: 4 },
    ],
    slop: 2,
    gibs: { resource: "GIBS", mask: "GIBSMASK", count: 0, once: -1 },
    anims,
  };
}

export function parseIni(text: string): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  let section = "";
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith(";") || line.startsWith("#")) continue;
    const sec = line.match(/^\[(.+)\]$/);
    if (sec) {
      section = sec[1].trim();
      if (!out[section]) out[section] = {};
      continue;
    }
    const eq = line.indexOf("=");
    if (eq < 0 || !section) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    out[section][key] = value;
  }
  return out;
}

function sectionOf(ini: Record<string, Record<string, string>>, name: string): Record<string, string> {
  const exact = ini[name];
  if (exact) return exact;
  const found = Object.keys(ini).find((k) => k.toLowerCase() === name.toLowerCase());
  return found ? ini[found] : {};
}

function read(sec: Record<string, string>, key: string, fallback = ""): string {
  if (sec[key] != null) return sec[key];
  const found = Object.keys(sec).find((k) => k.toLowerCase() === key.toLowerCase());
  return found ? sec[found] : fallback;
}

export function parsePoints(raw: string): Point[] {
  if (!raw.trim()) return [];
  return raw
    .split(",")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [xs, ys] = chunk.split(":");
      const x = Number(xs);
      const y = Number(ys);
      return { x: Number.isFinite(x) ? x : 0, y: Number.isFinite(y) ? y : 0 };
    });
}

export function formatPoints(points: Point[]): string {
  return points.map((p) => `${p.x}:${p.y}`).join(",");
}

function ensurePoints(anim: AnimData, frames: number): void {
  for (const w of WEAPON_DEFS) {
    const cur = anim.points[w.key] ?? [];
    while (cur.length < frames) cur.push({ ...DEFAULT_POINT });
    anim.points[w.key] = cur.slice(0, Math.max(frames, cur.length));
    anim.pointsLeft[w.key] = anim.pointsLeft[w.key] ?? [];
  }
}

export function parseModelTxt(text: string): PlayerModel {
  const ini = parseIni(text);
  const model = createEmptyModel();
  const m = sectionOf(ini, "Model");
  model.name = read(m, "name", model.name);
  model.author = read(m, "author");
  model.description = read(m, "description");
  model.version = read(m, "version", model.version);
  const feat = read(m, "features").toLowerCase();
  model.weaponMode = /(^|[\s,])guns2($|[\s,])/.test(feat) ? "v2" : "v1";
  const fp = parsePoints(read(m, "flag_point"));
  if (fp[0]) model.flagPoint = fp[0];
  const fa = Number(read(m, "flag_angle", String(FLAG_ANGLE_DEFAULT)));
  if (Number.isFinite(fa)) model.flagAngle = fa;

  const blood = sectionOf(ini, "Blood");
  model.blood.r = clampByte(read(blood, "R", "150"));
  model.blood.g = clampByte(read(blood, "G", "0"));
  model.blood.b = clampByte(read(blood, "B", "0"));
  const kind = read(blood, "Kind", "NORMAL").toUpperCase();
  model.blood.kind = kind === "SPARKS" || kind === "COMBINE" ? kind : "NORMAL";

  const sound = sectionOf(ini, "Sound");
  model.pain = [];
  model.die = [];
  for (let i = 1; i <= 16; i++) {
    const pain = read(sound, `pain${i}`);
    if (pain) model.pain.push({ key: pain, level: Number(read(sound, `painlevel${i}`, "1")) || 1 });
    const die = read(sound, `die${i}`);
    if (die) model.die.push({ key: die, level: Number(read(sound, `dielevel${i}`, "1")) || 1 });
  }
  if (!model.pain.length) model.pain = createEmptyModel().pain;
  if (!model.die.length) model.die = createEmptyModel().die;
  model.slop = Math.min(2, Math.max(0, Number(read(sound, "slop", "0")) || 0));

  const gibs = sectionOf(ini, "Gibs");
  model.gibs.resource = read(gibs, "resource", "GIBS");
  model.gibs.mask = read(gibs, "mask", "GIBSMASK");
  model.gibs.count = Number(read(gibs, "count", "0")) || 0;
  model.gibs.once = Number(read(gibs, "once", "-1"));
  if (!Number.isFinite(model.gibs.once)) model.gibs.once = -1;

  for (const def of ANIM_DEFS) {
    const sec = sectionOf(ini, def.section);
    const anim = emptyAnim(def.resource, 1);
    anim.resource = read(sec, "resource", def.resource);
    anim.mask = read(sec, "mask", `${anim.resource}MASK`);
    anim.resource2 = read(sec, "resource2");
    anim.mask2 = read(sec, "mask2");
    anim.frames = Math.max(1, Number(read(sec, "frames", "1")) || 1);
    anim.waitcount = Math.max(1, Number(read(sec, "waitcount", "3")) || 3);
    anim.backanim = ["1", "true", "yes"].includes(read(sec, "backanim", "0").toLowerCase());
    for (const w of WEAPON_DEFS) {
      anim.points[w.key] = parsePoints(read(sec, `${w.key}_points`));
      anim.pointsLeft[w.key] = parsePoints(read(sec, `${w.key}2_points`));
    }
    ensurePoints(anim, anim.frames);
    model.anims[def.section] = anim;
  }
  return model;
}

export function serializeModelTxt(model: PlayerModel): string {
  const lines: string[] = [];
  const push = (k: string, v: string | number | boolean) => {
    lines.push(`${k}=${v}`);
  };

  lines.push("[Model]");
  push("name", model.name);
  push("author", model.author);
  push("description", model.description);
  push("version", model.version);
  if (model.weaponMode === "v2") push("features", "guns2");
  push("flag_point", formatPoints([model.flagPoint]));
  push("flag_angle", model.flagAngle);
  lines.push("");

  lines.push("[Blood]");
  push("R", model.blood.r);
  push("G", model.blood.g);
  push("B", model.blood.b);
  push("Kind", model.blood.kind);
  lines.push("");

  lines.push("[Sound]");
  model.pain.forEach((s, i) => {
    if (!s.key) return;
    push(`pain${i + 1}`, s.key);
    push(`painlevel${i + 1}`, s.level);
  });
  model.die.forEach((s, i) => {
    if (!s.key) return;
    push(`die${i + 1}`, s.key);
    push(`dielevel${i + 1}`, s.level);
  });
  push("slop", model.slop);
  lines.push("");

  lines.push("[Gibs]");
  push("resource", model.gibs.resource);
  push("mask", model.gibs.mask);
  push("count", model.gibs.count);
  push("once", model.gibs.once);
  lines.push("");

  for (const def of ANIM_DEFS) {
    const anim = model.anims[def.section];
    if (!anim) continue;
    const used = def.group === "base" || Boolean(anim.resource);
    if (!used && def.group === "extra") continue;
    lines.push(`[${def.section}]`);
    push("resource", anim.resource);
    push("mask", anim.mask);
    if (anim.resource2) push("resource2", anim.resource2);
    if (anim.mask2) push("mask2", anim.mask2);
    push("frames", anim.frames);
    push("waitcount", anim.waitcount);
    push("backanim", anim.backanim ? 1 : 0);
    if (model.weaponMode !== "none" && !NO_WEAPON_ANIMS.has(def.section)) {
      for (const w of WEAPON_DEFS) {
        const pts = (anim.points[w.key] ?? []).slice(0, anim.frames);
        if (pts.length) push(`${w.key}_points`, formatPoints(pts));
        const left = anim.pointsLeft[w.key] ?? [];
        if (left.length) push(`${w.key}2_points`, formatPoints(left));
      }
    }
    lines.push("");
  }
  return lines.join("\n");
}

export function stem(name: string): string {
  return name.replace(/\.[^.]+$/, "").toUpperCase();
}

export function matchResourceName(fileStem: string): { kind: "sprite" | "mask" | "left" | "leftmask"; resource: string } | null {
  const s = fileStem.toUpperCase();
  const leftMask = s.match(/^(.+?)(?:_?LEFT(?:ANIM)?MASK|MASK_?LEFT(?:ANIM)?)$/);
  if (leftMask) return { kind: "leftmask", resource: leftMask[1] };
  const left = s.match(/^(.+?)(?:_?LEFT(?:ANIM)?|_?LEFT)$/);
  if (left && !s.endsWith("MASK")) return { kind: "left", resource: left[1] };
  if (s.endsWith("MASK")) return { kind: "mask", resource: s.replace(/_?MASK$/, "") };
  return { kind: "sprite", resource: s };
}

export function findAnimByResource(resource: string): AnimDef | undefined {
  const up = resource.toUpperCase();
  return ANIM_DEFS.find((d) => d.resource === up || d.aliases.includes(up));
}

function clampByte(raw: string): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.min(255, Math.max(0, Math.round(n)));
}

export function playbackLength(anim: AnimData): number {
  if (anim.backanim && anim.frames > 2) return 2 * anim.frames - 2;
  return Math.max(1, anim.frames);
}

export function logicalFrame(anim: AnimData, playFrame: number): number {
  const n = Math.max(1, anim.frames);
  if (!(anim.backanim && n > 2)) return playFrame % n;
  const span = 2 * n - 2;
  const i = playFrame % span;
  return i < n ? i : span - i;
}
