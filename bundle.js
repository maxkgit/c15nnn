"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res, err2) => function __init() {
    if (err2) throw err2[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err2 = [e], e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // src/tga.ts
  var tga_exports = {};
  __export(tga_exports, {
    decodeTga: () => decodeTga,
    isTga: () => isTga
  });
  function isTga(bytes) {
    if (bytes.length < 18) return false;
    const imageType = bytes[2];
    const bpp = bytes[16];
    return (imageType === 2 || imageType === 10) && (bpp === 24 || bpp === 32);
  }
  function decodeTga(bytes) {
    const idLength = bytes[0];
    const imageType = bytes[2];
    const width = bytes[12] | bytes[13] << 8;
    const height = bytes[14] | bytes[15] << 8;
    const bpp = bytes[16];
    const desc = bytes[17];
    const originTop = (desc & 32) !== 0;
    const bytesPerPixel = bpp / 8;
    let offset = 18 + idLength;
    const pixels = new Uint8Array(width * height * 4);
    const write = (i, b, g, r, a) => {
      const o = i * 4;
      pixels[o] = r;
      pixels[o + 1] = g;
      pixels[o + 2] = b;
      pixels[o + 3] = a;
    };
    const readPixel = () => {
      const b = bytes[offset++];
      const g = bytes[offset++];
      const r = bytes[offset++];
      const a = bytesPerPixel === 4 ? bytes[offset++] : 255;
      return [b, g, r, a];
    };
    const count = width * height;
    if (imageType === 2) {
      for (let i = 0; i < count; i++) {
        const [b, g, r, a] = readPixel();
        write(i, b, g, r, a);
      }
    } else {
      let i = 0;
      while (i < count) {
        const packet = bytes[offset++];
        const run = (packet & 127) + 1;
        if (packet & 128) {
          const [b, g, r, a] = readPixel();
          for (let n = 0; n < run; n++) write(i++, b, g, r, a);
        } else {
          for (let n = 0; n < run; n++) {
            const [b, g, r, a] = readPixel();
            write(i++, b, g, r, a);
          }
        }
      }
    }
    const data = new ImageData(width, height);
    for (let y = 0; y < height; y++) {
      const srcY = originTop ? y : height - 1 - y;
      const src = srcY * width * 4;
      data.data.set(pixels.subarray(src, src + width * 4), y * width * 4);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").putImageData(data, 0, 0);
    return canvas;
  }
  var init_tga = __esm({
    "src/tga.ts"() {
      "use strict";
    }
  });

  // src/model/format.ts
  var FRAME = 64;
  var GIB_FRAME = 32;
  var PLAYER_RECT = { x: 15, y: 12, w: 34, h: 52 };
  var PLAYER_HEAD = { x: 24, y: 12, w: 20, h: 12 };
  var FLAG_DEFAULT = { x: 32, y: 16 };
  var FLAG_ANGLE_DEFAULT = -20;
  var ANIM_DEFS = [
    { section: "StandAnim", resource: "STAND", group: "base", aliases: ["STAND"] },
    { section: "WalkAnim", resource: "WALK", group: "base", aliases: ["WALK", "RUN"] },
    { section: "Die1Anim", resource: "DIE1", group: "base", aliases: ["DIE1", "DIE"] },
    { section: "Die2Anim", resource: "DIE2", group: "base", aliases: ["DIE2"] },
    { section: "AttackAnim", resource: "ATTACK", group: "base", aliases: ["ATTACK"] },
    { section: "SeeUpAnim", resource: "SEEUP", group: "base", aliases: ["SEEUP", "SEEP"] },
    { section: "SeeDownAnim", resource: "SEEDOWN", group: "base", aliases: ["SEEDOWN", "SITDOWN"] },
    { section: "AttackUpAnim", resource: "ATTACKUP", group: "base", aliases: ["ATTACKUP"] },
    { section: "AttackDownAnim", resource: "ATTACKDOWN", group: "base", aliases: ["ATTACKDOWN"] },
    { section: "PainAnim", resource: "PAIN", group: "base", aliases: ["PAIN", "OBS"] }
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
  var WEAPON_DEFS = [
    { key: "csaw", base: { x: 8, y: 4 } },
    { key: "hgun", base: { x: 8, y: 8 } },
    { key: "sg", base: { x: 16, y: 16 } },
    { key: "ssg", base: { x: 16, y: 24 } },
    { key: "mgun", base: { x: 16, y: 16 } },
    { key: "rkt", base: { x: 24, y: 24 } },
    { key: "plz", base: { x: 16, y: 16 } },
    { key: "bfg", base: { x: 24, y: 24 } },
    { key: "spl", base: { x: 16, y: 16 } },
    { key: "flm", base: { x: 8, y: 8 } }
  ];
  var WEAPON_ALIGN = {
    csaw: { hgun: { x: 11, y: -2 }, sg: { x: -8, y: -2 }, ssg: { x: -7, y: -1 }, mgun: { x: -7, y: -2 }, rkt: { x: -14, y: -2 }, plz: { x: -4, y: -1 }, bfg: { x: -7, y: -1 }, spl: { x: -8, y: -2 }, flm: { x: -4, y: -1 } },
    hgun: { csaw: { x: -11, y: 2 }, sg: { x: -19, y: 0 }, ssg: { x: -18, y: 1 }, mgun: { x: -18, y: 0 }, rkt: { x: -25, y: 0 }, plz: { x: -15, y: 1 }, bfg: { x: -18, y: 1 }, spl: { x: -19, y: 0 }, flm: { x: -15, y: 1 } },
    sg: { csaw: { x: 8, y: 2 }, hgun: { x: 19, y: 0 }, ssg: { x: 1, y: 1 }, mgun: { x: 1, y: 0 }, rkt: { x: -6, y: 0 }, plz: { x: 4, y: 1 }, bfg: { x: 1, y: 1 }, spl: { x: 0, y: 0 }, flm: { x: 4, y: 1 } },
    ssg: { csaw: { x: 7, y: 1 }, hgun: { x: 18, y: -1 }, sg: { x: -1, y: -1 }, mgun: { x: 0, y: -1 }, rkt: { x: -7, y: -1 }, plz: { x: 3, y: 0 }, bfg: { x: 0, y: 0 }, spl: { x: -1, y: -1 }, flm: { x: 3, y: 0 } },
    mgun: { csaw: { x: 7, y: 2 }, hgun: { x: 18, y: 0 }, sg: { x: -1, y: 0 }, ssg: { x: 0, y: 1 }, rkt: { x: -7, y: 0 }, plz: { x: 3, y: 1 }, bfg: { x: 0, y: 1 }, spl: { x: -1, y: 0 }, flm: { x: 3, y: 1 } },
    rkt: { csaw: { x: 14, y: 2 }, hgun: { x: 25, y: 0 }, sg: { x: 6, y: 0 }, ssg: { x: 7, y: 1 }, mgun: { x: 7, y: 0 }, plz: { x: 10, y: 1 }, bfg: { x: 7, y: 1 }, spl: { x: 6, y: 0 }, flm: { x: 10, y: 1 } },
    plz: { csaw: { x: 4, y: 1 }, hgun: { x: 15, y: -1 }, sg: { x: -4, y: -1 }, ssg: { x: -3, y: 0 }, mgun: { x: -3, y: -1 }, rkt: { x: -10, y: -1 }, bfg: { x: -3, y: 0 }, spl: { x: -4, y: -1 }, flm: { x: 0, y: 0 } },
    bfg: { csaw: { x: 7, y: 1 }, hgun: { x: 18, y: -1 }, sg: { x: -1, y: -1 }, ssg: { x: 0, y: 0 }, mgun: { x: 0, y: -1 }, rkt: { x: -7, y: -1 }, plz: { x: 3, y: 0 }, spl: { x: -1, y: -1 }, flm: { x: 3, y: 0 } },
    spl: { csaw: { x: 8, y: 2 }, hgun: { x: 19, y: 0 }, sg: { x: 0, y: 0 }, ssg: { x: 1, y: 1 }, mgun: { x: 1, y: 0 }, rkt: { x: -6, y: 0 }, plz: { x: 4, y: 1 }, bfg: { x: 1, y: 1 }, flm: { x: 4, y: 1 } },
    flm: { csaw: { x: 4, y: 1 }, hgun: { x: 15, y: -1 }, sg: { x: -4, y: -1 }, ssg: { x: -3, y: 0 }, mgun: { x: -3, y: -1 }, rkt: { x: -10, y: -1 }, plz: { x: 0, y: 0 }, bfg: { x: -3, y: 0 }, spl: { x: -4, y: -1 } }
  };
  var NO_WEAPON_ANIMS = /* @__PURE__ */ new Set(["Die1Anim", "Die2Anim", "PainAnim"]);
  var DEFAULT_POINT = { x: 48, y: 40 };
  function emptyAnim(resource, frames = 1) {
    const points = {};
    const pointsLeft = {};
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
      pointsLeft
    };
  }
  function createEmptyModel() {
    const anims = {};
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
        { key: "MEGAPAIN", level: 4 }
      ],
      die: [
        { key: "DIE1", level: 1 },
        { key: "DIE2", level: 1 },
        { key: "FALL1", level: 4 }
      ],
      slop: 2,
      gibs: { resource: "GIBS", mask: "GIBSMASK", count: 0, once: -1 },
      anims
    };
  }
  function parseIni(text) {
    const out = {};
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
  function sectionOf(ini, name) {
    const exact = ini[name];
    if (exact) return exact;
    const found = Object.keys(ini).find((k) => k.toLowerCase() === name.toLowerCase());
    return found ? ini[found] : {};
  }
  function read(sec, key, fallback = "") {
    if (sec[key] != null) return sec[key];
    const found = Object.keys(sec).find((k) => k.toLowerCase() === key.toLowerCase());
    return found ? sec[found] : fallback;
  }
  function parsePoints(raw) {
    if (!raw.trim()) return [];
    return raw.split(",").map((chunk) => chunk.trim()).filter(Boolean).map((chunk) => {
      const [xs, ys] = chunk.split(":");
      const x = Number(xs);
      const y = Number(ys);
      return { x: Number.isFinite(x) ? x : 0, y: Number.isFinite(y) ? y : 0 };
    });
  }
  function formatPoints(points) {
    return points.map((p) => `${p.x}:${p.y}`).join(",");
  }
  function ensurePoints(anim, frames) {
    for (const w of WEAPON_DEFS) {
      const cur = anim.points[w.key] ?? [];
      while (cur.length < frames) cur.push({ ...DEFAULT_POINT });
      anim.points[w.key] = cur.slice(0, Math.max(frames, cur.length));
      anim.pointsLeft[w.key] = anim.pointsLeft[w.key] ?? [];
    }
  }
  function parseModelTxt(text) {
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
  function serializeModelTxt(model) {
    const lines = [];
    const push = (k, v) => {
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
  function stem(name) {
    return name.replace(/\.[^.]+$/, "").toUpperCase();
  }
  function matchResourceName(fileStem) {
    const s = fileStem.toUpperCase();
    const leftMask = s.match(/^(.+?)(?:_?LEFT(?:ANIM)?MASK|MASK_?LEFT(?:ANIM)?)$/);
    if (leftMask) return { kind: "leftmask", resource: leftMask[1] };
    const left = s.match(/^(.+?)(?:_?LEFT(?:ANIM)?|_?LEFT)$/);
    if (left && !s.endsWith("MASK")) return { kind: "left", resource: left[1] };
    if (s.endsWith("MASK")) return { kind: "mask", resource: s.replace(/_?MASK$/, "") };
    return { kind: "sprite", resource: s };
  }
  function findAnimByResource(resource) {
    const up = resource.toUpperCase();
    return ANIM_DEFS.find((d) => d.resource === up || d.aliases.includes(up));
  }
  function clampByte(raw) {
    const n = Number(raw);
    if (!Number.isFinite(n)) return 0;
    return Math.min(255, Math.max(0, Math.round(n)));
  }
  function playbackLength(anim) {
    if (anim.backanim && anim.frames > 2) return 2 * anim.frames - 2;
    return Math.max(1, anim.frames);
  }
  function logicalFrame(anim, playFrame) {
    const n = Math.max(1, anim.frames);
    if (!(anim.backanim && n > 2)) return playFrame % n;
    const span = 2 * n - 2;
    const i = playFrame % span;
    return i < n ? i : span - i;
  }

  // node_modules/pako/dist/pako.esm.mjs
  var Z_FIXED$1 = 4;
  var Z_BINARY = 0;
  var Z_TEXT = 1;
  var Z_UNKNOWN$1 = 2;
  function zero$1(buf) {
    let len = buf.length;
    while (--len >= 0) {
      buf[len] = 0;
    }
  }
  var STORED_BLOCK = 0;
  var STATIC_TREES = 1;
  var DYN_TREES = 2;
  var MIN_MATCH$1 = 3;
  var MAX_MATCH$1 = 258;
  var LENGTH_CODES$1 = 29;
  var LITERALS$1 = 256;
  var L_CODES$1 = LITERALS$1 + 1 + LENGTH_CODES$1;
  var D_CODES$1 = 30;
  var BL_CODES$1 = 19;
  var HEAP_SIZE$1 = 2 * L_CODES$1 + 1;
  var MAX_BITS$1 = 15;
  var Buf_size = 16;
  var MAX_BL_BITS = 7;
  var END_BLOCK = 256;
  var REP_3_6 = 16;
  var REPZ_3_10 = 17;
  var REPZ_11_138 = 18;
  var extra_lbits = (
    /* extra bits for each length code */
    new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0])
  );
  var extra_dbits = (
    /* extra bits for each distance code */
    new Uint8Array([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13])
  );
  var extra_blbits = (
    /* extra bits for each bit length code */
    new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7])
  );
  var bl_order = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
  var DIST_CODE_LEN = 512;
  var static_ltree = new Array((L_CODES$1 + 2) * 2);
  zero$1(static_ltree);
  var static_dtree = new Array(D_CODES$1 * 2);
  zero$1(static_dtree);
  var _dist_code = new Array(DIST_CODE_LEN);
  zero$1(_dist_code);
  var _length_code = new Array(MAX_MATCH$1 - MIN_MATCH$1 + 1);
  zero$1(_length_code);
  var base_length = new Array(LENGTH_CODES$1);
  zero$1(base_length);
  var base_dist = new Array(D_CODES$1);
  zero$1(base_dist);
  function StaticTreeDesc(static_tree, extra_bits, extra_base, elems, max_length) {
    this.static_tree = static_tree;
    this.extra_bits = extra_bits;
    this.extra_base = extra_base;
    this.elems = elems;
    this.max_length = max_length;
    this.has_stree = static_tree && static_tree.length;
  }
  var static_l_desc;
  var static_d_desc;
  var static_bl_desc;
  function TreeDesc(dyn_tree, stat_desc) {
    this.dyn_tree = dyn_tree;
    this.max_code = 0;
    this.stat_desc = stat_desc;
  }
  var d_code = (dist) => {
    return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
  };
  var put_short = (s, w) => {
    s.pending_buf[s.pending++] = w & 255;
    s.pending_buf[s.pending++] = w >>> 8 & 255;
  };
  var send_bits = (s, value, length) => {
    if (s.bi_valid > Buf_size - length) {
      s.bi_buf |= value << s.bi_valid & 65535;
      put_short(s, s.bi_buf);
      s.bi_buf = value >> Buf_size - s.bi_valid;
      s.bi_valid += length - Buf_size;
    } else {
      s.bi_buf |= value << s.bi_valid & 65535;
      s.bi_valid += length;
    }
  };
  var send_code = (s, c, tree) => {
    send_bits(
      s,
      tree[c * 2],
      tree[c * 2 + 1]
      /*.Len*/
    );
  };
  var bi_reverse = (code, len) => {
    let res = 0;
    do {
      res |= code & 1;
      code >>>= 1;
      res <<= 1;
    } while (--len > 0);
    return res >>> 1;
  };
  var bi_flush = (s) => {
    if (s.bi_valid === 16) {
      put_short(s, s.bi_buf);
      s.bi_buf = 0;
      s.bi_valid = 0;
    } else if (s.bi_valid >= 8) {
      s.pending_buf[s.pending++] = s.bi_buf & 255;
      s.bi_buf >>= 8;
      s.bi_valid -= 8;
    }
  };
  var gen_bitlen = (s, desc) => {
    const tree = desc.dyn_tree;
    const max_code = desc.max_code;
    const stree = desc.stat_desc.static_tree;
    const has_stree = desc.stat_desc.has_stree;
    const extra = desc.stat_desc.extra_bits;
    const base = desc.stat_desc.extra_base;
    const max_length = desc.stat_desc.max_length;
    let h;
    let n, m;
    let bits;
    let xbits;
    let f;
    let overflow = 0;
    for (bits = 0; bits <= MAX_BITS$1; bits++) {
      s.bl_count[bits] = 0;
    }
    tree[s.heap[s.heap_max] * 2 + 1] = 0;
    for (h = s.heap_max + 1; h < HEAP_SIZE$1; h++) {
      n = s.heap[h];
      bits = tree[tree[n * 2 + 1] * 2 + 1] + 1;
      if (bits > max_length) {
        bits = max_length;
        overflow++;
      }
      tree[n * 2 + 1] = bits;
      if (n > max_code) {
        continue;
      }
      s.bl_count[bits]++;
      xbits = 0;
      if (n >= base) {
        xbits = extra[n - base];
      }
      f = tree[n * 2];
      s.opt_len += f * (bits + xbits);
      if (has_stree) {
        s.static_len += f * (stree[n * 2 + 1] + xbits);
      }
    }
    if (overflow === 0) {
      return;
    }
    do {
      bits = max_length - 1;
      while (s.bl_count[bits] === 0) {
        bits--;
      }
      s.bl_count[bits]--;
      s.bl_count[bits + 1] += 2;
      s.bl_count[max_length]--;
      overflow -= 2;
    } while (overflow > 0);
    for (bits = max_length; bits !== 0; bits--) {
      n = s.bl_count[bits];
      while (n !== 0) {
        m = s.heap[--h];
        if (m > max_code) {
          continue;
        }
        if (tree[m * 2 + 1] !== bits) {
          s.opt_len += (bits - tree[m * 2 + 1]) * tree[m * 2];
          tree[m * 2 + 1] = bits;
        }
        n--;
      }
    }
  };
  var gen_codes = (tree, max_code, bl_count) => {
    const next_code = new Array(MAX_BITS$1 + 1);
    let code = 0;
    let bits;
    let n;
    for (bits = 1; bits <= MAX_BITS$1; bits++) {
      code = code + bl_count[bits - 1] << 1;
      next_code[bits] = code;
    }
    for (n = 0; n <= max_code; n++) {
      let len = tree[n * 2 + 1];
      if (len === 0) {
        continue;
      }
      tree[n * 2] = bi_reverse(next_code[len]++, len);
    }
  };
  var tr_static_init = () => {
    let n;
    let bits;
    let length;
    let code;
    let dist;
    const bl_count = new Array(MAX_BITS$1 + 1);
    length = 0;
    for (code = 0; code < LENGTH_CODES$1 - 1; code++) {
      base_length[code] = length;
      for (n = 0; n < 1 << extra_lbits[code]; n++) {
        _length_code[length++] = code;
      }
    }
    _length_code[length - 1] = code;
    dist = 0;
    for (code = 0; code < 16; code++) {
      base_dist[code] = dist;
      for (n = 0; n < 1 << extra_dbits[code]; n++) {
        _dist_code[dist++] = code;
      }
    }
    dist >>= 7;
    for (; code < D_CODES$1; code++) {
      base_dist[code] = dist << 7;
      for (n = 0; n < 1 << extra_dbits[code] - 7; n++) {
        _dist_code[256 + dist++] = code;
      }
    }
    for (bits = 0; bits <= MAX_BITS$1; bits++) {
      bl_count[bits] = 0;
    }
    n = 0;
    while (n <= 143) {
      static_ltree[n * 2 + 1] = 8;
      n++;
      bl_count[8]++;
    }
    while (n <= 255) {
      static_ltree[n * 2 + 1] = 9;
      n++;
      bl_count[9]++;
    }
    while (n <= 279) {
      static_ltree[n * 2 + 1] = 7;
      n++;
      bl_count[7]++;
    }
    while (n <= 287) {
      static_ltree[n * 2 + 1] = 8;
      n++;
      bl_count[8]++;
    }
    gen_codes(static_ltree, L_CODES$1 + 1, bl_count);
    for (n = 0; n < D_CODES$1; n++) {
      static_dtree[n * 2 + 1] = 5;
      static_dtree[n * 2] = bi_reverse(n, 5);
    }
    static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS$1 + 1, L_CODES$1, MAX_BITS$1);
    static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0, D_CODES$1, MAX_BITS$1);
    static_bl_desc = new StaticTreeDesc(new Array(0), extra_blbits, 0, BL_CODES$1, MAX_BL_BITS);
  };
  var init_block = (s) => {
    let n;
    for (n = 0; n < L_CODES$1; n++) {
      s.dyn_ltree[n * 2] = 0;
    }
    for (n = 0; n < D_CODES$1; n++) {
      s.dyn_dtree[n * 2] = 0;
    }
    for (n = 0; n < BL_CODES$1; n++) {
      s.bl_tree[n * 2] = 0;
    }
    s.dyn_ltree[END_BLOCK * 2] = 1;
    s.opt_len = s.static_len = 0;
    s.sym_next = s.matches = 0;
  };
  var bi_windup = (s) => {
    if (s.bi_valid > 8) {
      put_short(s, s.bi_buf);
    } else if (s.bi_valid > 0) {
      s.pending_buf[s.pending++] = s.bi_buf;
    }
    s.bi_buf = 0;
    s.bi_valid = 0;
  };
  var smaller = (tree, n, m, depth) => {
    const _n2 = n * 2;
    const _m2 = m * 2;
    return tree[_n2] < tree[_m2] || tree[_n2] === tree[_m2] && depth[n] <= depth[m];
  };
  var pqdownheap = (s, tree, k) => {
    const v = s.heap[k];
    let j = k << 1;
    while (j <= s.heap_len) {
      if (j < s.heap_len && smaller(tree, s.heap[j + 1], s.heap[j], s.depth)) {
        j++;
      }
      if (smaller(tree, v, s.heap[j], s.depth)) {
        break;
      }
      s.heap[k] = s.heap[j];
      k = j;
      j <<= 1;
    }
    s.heap[k] = v;
  };
  var compress_block = (s, ltree, dtree) => {
    let dist;
    let lc;
    let sx = 0;
    let code;
    let extra;
    if (s.sym_next !== 0) {
      do {
        dist = s.pending_buf[s.sym_buf + sx++] & 255;
        dist += (s.pending_buf[s.sym_buf + sx++] & 255) << 8;
        lc = s.pending_buf[s.sym_buf + sx++];
        if (dist === 0) {
          send_code(s, lc, ltree);
        } else {
          code = _length_code[lc];
          send_code(s, code + LITERALS$1 + 1, ltree);
          extra = extra_lbits[code];
          if (extra !== 0) {
            lc -= base_length[code];
            send_bits(s, lc, extra);
          }
          dist--;
          code = d_code(dist);
          send_code(s, code, dtree);
          extra = extra_dbits[code];
          if (extra !== 0) {
            dist -= base_dist[code];
            send_bits(s, dist, extra);
          }
        }
      } while (sx < s.sym_next);
    }
    send_code(s, END_BLOCK, ltree);
  };
  var build_tree = (s, desc) => {
    const tree = desc.dyn_tree;
    const stree = desc.stat_desc.static_tree;
    const has_stree = desc.stat_desc.has_stree;
    const elems = desc.stat_desc.elems;
    let n, m;
    let max_code = -1;
    let node;
    s.heap_len = 0;
    s.heap_max = HEAP_SIZE$1;
    for (n = 0; n < elems; n++) {
      if (tree[n * 2] !== 0) {
        s.heap[++s.heap_len] = max_code = n;
        s.depth[n] = 0;
      } else {
        tree[n * 2 + 1] = 0;
      }
    }
    while (s.heap_len < 2) {
      node = s.heap[++s.heap_len] = max_code < 2 ? ++max_code : 0;
      tree[node * 2] = 1;
      s.depth[node] = 0;
      s.opt_len--;
      if (has_stree) {
        s.static_len -= stree[node * 2 + 1];
      }
    }
    desc.max_code = max_code;
    for (n = s.heap_len >> 1; n >= 1; n--) {
      pqdownheap(s, tree, n);
    }
    node = elems;
    do {
      n = s.heap[
        1
        /*SMALLEST*/
      ];
      s.heap[
        1
        /*SMALLEST*/
      ] = s.heap[s.heap_len--];
      pqdownheap(
        s,
        tree,
        1
        /*SMALLEST*/
      );
      m = s.heap[
        1
        /*SMALLEST*/
      ];
      s.heap[--s.heap_max] = n;
      s.heap[--s.heap_max] = m;
      tree[node * 2] = tree[n * 2] + tree[m * 2];
      s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
      tree[n * 2 + 1] = tree[m * 2 + 1] = node;
      s.heap[
        1
        /*SMALLEST*/
      ] = node++;
      pqdownheap(
        s,
        tree,
        1
        /*SMALLEST*/
      );
    } while (s.heap_len >= 2);
    s.heap[--s.heap_max] = s.heap[
      1
      /*SMALLEST*/
    ];
    gen_bitlen(s, desc);
    gen_codes(tree, max_code, s.bl_count);
  };
  var scan_tree = (s, tree, max_code) => {
    let n;
    let prevlen = -1;
    let curlen;
    let nextlen = tree[0 * 2 + 1];
    let count = 0;
    let max_count = 7;
    let min_count = 4;
    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;
    }
    tree[(max_code + 1) * 2 + 1] = 65535;
    for (n = 0; n <= max_code; n++) {
      curlen = nextlen;
      nextlen = tree[(n + 1) * 2 + 1];
      if (++count < max_count && curlen === nextlen) {
        continue;
      } else if (count < min_count) {
        s.bl_tree[curlen * 2] += count;
      } else if (curlen !== 0) {
        if (curlen !== prevlen) {
          s.bl_tree[curlen * 2]++;
        }
        s.bl_tree[REP_3_6 * 2]++;
      } else if (count <= 10) {
        s.bl_tree[REPZ_3_10 * 2]++;
      } else {
        s.bl_tree[REPZ_11_138 * 2]++;
      }
      count = 0;
      prevlen = curlen;
      if (nextlen === 0) {
        max_count = 138;
        min_count = 3;
      } else if (curlen === nextlen) {
        max_count = 6;
        min_count = 3;
      } else {
        max_count = 7;
        min_count = 4;
      }
    }
  };
  var send_tree = (s, tree, max_code) => {
    let n;
    let prevlen = -1;
    let curlen;
    let nextlen = tree[0 * 2 + 1];
    let count = 0;
    let max_count = 7;
    let min_count = 4;
    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;
    }
    for (n = 0; n <= max_code; n++) {
      curlen = nextlen;
      nextlen = tree[(n + 1) * 2 + 1];
      if (++count < max_count && curlen === nextlen) {
        continue;
      } else if (count < min_count) {
        do {
          send_code(s, curlen, s.bl_tree);
        } while (--count !== 0);
      } else if (curlen !== 0) {
        if (curlen !== prevlen) {
          send_code(s, curlen, s.bl_tree);
          count--;
        }
        send_code(s, REP_3_6, s.bl_tree);
        send_bits(s, count - 3, 2);
      } else if (count <= 10) {
        send_code(s, REPZ_3_10, s.bl_tree);
        send_bits(s, count - 3, 3);
      } else {
        send_code(s, REPZ_11_138, s.bl_tree);
        send_bits(s, count - 11, 7);
      }
      count = 0;
      prevlen = curlen;
      if (nextlen === 0) {
        max_count = 138;
        min_count = 3;
      } else if (curlen === nextlen) {
        max_count = 6;
        min_count = 3;
      } else {
        max_count = 7;
        min_count = 4;
      }
    }
  };
  var build_bl_tree = (s) => {
    let max_blindex;
    scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
    scan_tree(s, s.dyn_dtree, s.d_desc.max_code);
    build_tree(s, s.bl_desc);
    for (max_blindex = BL_CODES$1 - 1; max_blindex >= 3; max_blindex--) {
      if (s.bl_tree[bl_order[max_blindex] * 2 + 1] !== 0) {
        break;
      }
    }
    s.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
    return max_blindex;
  };
  var send_all_trees = (s, lcodes, dcodes, blcodes) => {
    let rank2;
    send_bits(s, lcodes - 257, 5);
    send_bits(s, dcodes - 1, 5);
    send_bits(s, blcodes - 4, 4);
    for (rank2 = 0; rank2 < blcodes; rank2++) {
      send_bits(s, s.bl_tree[bl_order[rank2] * 2 + 1], 3);
    }
    send_tree(s, s.dyn_ltree, lcodes - 1);
    send_tree(s, s.dyn_dtree, dcodes - 1);
  };
  var detect_data_type = (s) => {
    let block_mask = 4093624447;
    let n;
    for (n = 0; n <= 31; n++, block_mask >>>= 1) {
      if (block_mask & 1 && s.dyn_ltree[n * 2] !== 0) {
        return Z_BINARY;
      }
    }
    if (s.dyn_ltree[9 * 2] !== 0 || s.dyn_ltree[10 * 2] !== 0 || s.dyn_ltree[13 * 2] !== 0) {
      return Z_TEXT;
    }
    for (n = 32; n < LITERALS$1; n++) {
      if (s.dyn_ltree[n * 2] !== 0) {
        return Z_TEXT;
      }
    }
    return Z_BINARY;
  };
  var static_init_done = false;
  var _tr_init$1 = (s) => {
    if (!static_init_done) {
      tr_static_init();
      static_init_done = true;
    }
    s.l_desc = new TreeDesc(s.dyn_ltree, static_l_desc);
    s.d_desc = new TreeDesc(s.dyn_dtree, static_d_desc);
    s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);
    s.bi_buf = 0;
    s.bi_valid = 0;
    init_block(s);
  };
  var _tr_stored_block$1 = (s, buf, stored_len, last) => {
    send_bits(s, (STORED_BLOCK << 1) + (last ? 1 : 0), 3);
    bi_windup(s);
    put_short(s, stored_len);
    put_short(s, ~stored_len);
    if (stored_len) {
      s.pending_buf.set(s.window.subarray(buf, buf + stored_len), s.pending);
    }
    s.pending += stored_len;
  };
  var _tr_align$1 = (s) => {
    send_bits(s, STATIC_TREES << 1, 3);
    send_code(s, END_BLOCK, static_ltree);
    bi_flush(s);
  };
  var _tr_flush_block$1 = (s, buf, stored_len, last) => {
    let opt_lenb, static_lenb;
    let max_blindex = 0;
    if (s.level > 0) {
      if (s.strm.data_type === Z_UNKNOWN$1) {
        s.strm.data_type = detect_data_type(s);
      }
      build_tree(s, s.l_desc);
      build_tree(s, s.d_desc);
      max_blindex = build_bl_tree(s);
      opt_lenb = s.opt_len + 3 + 7 >>> 3;
      static_lenb = s.static_len + 3 + 7 >>> 3;
      if (static_lenb <= opt_lenb) {
        opt_lenb = static_lenb;
      }
    } else {
      opt_lenb = static_lenb = stored_len + 5;
    }
    if (stored_len + 4 <= opt_lenb && buf !== -1) {
      _tr_stored_block$1(s, buf, stored_len, last);
    } else if (s.strategy === Z_FIXED$1 || static_lenb === opt_lenb) {
      send_bits(s, (STATIC_TREES << 1) + (last ? 1 : 0), 3);
      compress_block(s, static_ltree, static_dtree);
    } else {
      send_bits(s, (DYN_TREES << 1) + (last ? 1 : 0), 3);
      send_all_trees(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, max_blindex + 1);
      compress_block(s, s.dyn_ltree, s.dyn_dtree);
    }
    init_block(s);
    if (last) {
      bi_windup(s);
    }
  };
  var _tr_tally$1 = (s, dist, lc) => {
    s.pending_buf[s.sym_buf + s.sym_next++] = dist;
    s.pending_buf[s.sym_buf + s.sym_next++] = dist >> 8;
    s.pending_buf[s.sym_buf + s.sym_next++] = lc;
    if (dist === 0) {
      s.dyn_ltree[lc * 2]++;
    } else {
      s.matches++;
      dist--;
      s.dyn_ltree[(_length_code[lc] + LITERALS$1 + 1) * 2]++;
      s.dyn_dtree[d_code(dist) * 2]++;
    }
    return s.sym_next === s.sym_end;
  };
  var _tr_init_1 = _tr_init$1;
  var _tr_stored_block_1 = _tr_stored_block$1;
  var _tr_flush_block_1 = _tr_flush_block$1;
  var _tr_tally_1 = _tr_tally$1;
  var _tr_align_1 = _tr_align$1;
  var trees = {
    _tr_init: _tr_init_1,
    _tr_stored_block: _tr_stored_block_1,
    _tr_flush_block: _tr_flush_block_1,
    _tr_tally: _tr_tally_1,
    _tr_align: _tr_align_1
  };
  var adler32 = (adler, buf, len, pos) => {
    let s1 = adler & 65535 | 0, s2 = adler >>> 16 & 65535 | 0, n = 0;
    while (len !== 0) {
      n = len > 2e3 ? 2e3 : len;
      len -= n;
      do {
        s1 = s1 + buf[pos++] | 0;
        s2 = s2 + s1 | 0;
      } while (--n);
      s1 %= 65521;
      s2 %= 65521;
    }
    return s1 | s2 << 16 | 0;
  };
  var adler32_1 = adler32;
  var makeTable = () => {
    let c, table = [];
    for (var n = 0; n < 256; n++) {
      c = n;
      for (var k = 0; k < 8; k++) {
        c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
      }
      table[n] = c;
    }
    return table;
  };
  var crcTable = new Uint32Array(makeTable());
  var crc32 = (crc, buf, len, pos) => {
    const t2 = crcTable;
    const end = pos + len;
    crc ^= -1;
    for (let i = pos; i < end; i++) {
      crc = crc >>> 8 ^ t2[(crc ^ buf[i]) & 255];
    }
    return crc ^ -1;
  };
  var crc32_1 = crc32;
  var messages = {
    2: "need dictionary",
    /* Z_NEED_DICT       2  */
    1: "stream end",
    /* Z_STREAM_END      1  */
    0: "",
    /* Z_OK              0  */
    "-1": "file error",
    /* Z_ERRNO         (-1) */
    "-2": "stream error",
    /* Z_STREAM_ERROR  (-2) */
    "-3": "data error",
    /* Z_DATA_ERROR    (-3) */
    "-4": "insufficient memory",
    /* Z_MEM_ERROR     (-4) */
    "-5": "buffer error",
    /* Z_BUF_ERROR     (-5) */
    "-6": "incompatible version"
    /* Z_VERSION_ERROR (-6) */
  };
  var constants$2 = {
    /* Allowed flush values; see deflate() and inflate() below for details */
    Z_NO_FLUSH: 0,
    Z_PARTIAL_FLUSH: 1,
    Z_SYNC_FLUSH: 2,
    Z_FULL_FLUSH: 3,
    Z_FINISH: 4,
    Z_BLOCK: 5,
    Z_TREES: 6,
    /* Return codes for the compression/decompression functions. Negative values
    * are errors, positive values are used for special but normal events.
    */
    Z_OK: 0,
    Z_STREAM_END: 1,
    Z_NEED_DICT: 2,
    Z_ERRNO: -1,
    Z_STREAM_ERROR: -2,
    Z_DATA_ERROR: -3,
    Z_MEM_ERROR: -4,
    Z_BUF_ERROR: -5,
    //Z_VERSION_ERROR: -6,
    /* compression levels */
    Z_NO_COMPRESSION: 0,
    Z_BEST_SPEED: 1,
    Z_BEST_COMPRESSION: 9,
    Z_DEFAULT_COMPRESSION: -1,
    Z_FILTERED: 1,
    Z_HUFFMAN_ONLY: 2,
    Z_RLE: 3,
    Z_FIXED: 4,
    Z_DEFAULT_STRATEGY: 0,
    /* Possible values of the data_type field (though see inflate()) */
    Z_BINARY: 0,
    Z_TEXT: 1,
    //Z_ASCII:                1, // = Z_TEXT (deprecated)
    Z_UNKNOWN: 2,
    /* The deflate compression method */
    Z_DEFLATED: 8
    //Z_NULL:                 null // Use -1 or null inline, depending on var type
  };
  var { _tr_init, _tr_stored_block, _tr_flush_block, _tr_tally, _tr_align } = trees;
  var {
    Z_NO_FLUSH: Z_NO_FLUSH$2,
    Z_PARTIAL_FLUSH,
    Z_FULL_FLUSH: Z_FULL_FLUSH$1,
    Z_FINISH: Z_FINISH$3,
    Z_BLOCK: Z_BLOCK$1,
    Z_OK: Z_OK$3,
    Z_STREAM_END: Z_STREAM_END$3,
    Z_STREAM_ERROR: Z_STREAM_ERROR$2,
    Z_DATA_ERROR: Z_DATA_ERROR$2,
    Z_BUF_ERROR: Z_BUF_ERROR$2,
    Z_DEFAULT_COMPRESSION: Z_DEFAULT_COMPRESSION$1,
    Z_FILTERED,
    Z_HUFFMAN_ONLY,
    Z_RLE,
    Z_FIXED,
    Z_DEFAULT_STRATEGY: Z_DEFAULT_STRATEGY$1,
    Z_UNKNOWN,
    Z_DEFLATED: Z_DEFLATED$2
  } = constants$2;
  var MAX_MEM_LEVEL = 9;
  var MAX_WBITS$1 = 15;
  var DEF_MEM_LEVEL = 8;
  var LENGTH_CODES = 29;
  var LITERALS = 256;
  var L_CODES = LITERALS + 1 + LENGTH_CODES;
  var D_CODES = 30;
  var BL_CODES = 19;
  var HEAP_SIZE = 2 * L_CODES + 1;
  var MAX_BITS = 15;
  var MIN_MATCH = 3;
  var MAX_MATCH = 258;
  var MIN_LOOKAHEAD = MAX_MATCH + MIN_MATCH + 1;
  var PRESET_DICT = 32;
  var INIT_STATE = 42;
  var GZIP_STATE = 57;
  var EXTRA_STATE = 69;
  var NAME_STATE = 73;
  var COMMENT_STATE = 91;
  var HCRC_STATE = 103;
  var BUSY_STATE = 113;
  var FINISH_STATE = 666;
  var BS_NEED_MORE = 1;
  var BS_BLOCK_DONE = 2;
  var BS_FINISH_STARTED = 3;
  var BS_FINISH_DONE = 4;
  var OS_CODE = 3;
  var err = (strm, errorCode) => {
    strm.msg = messages[errorCode];
    return errorCode;
  };
  var rank = (f) => {
    return f * 2 - (f > 4 ? 9 : 0);
  };
  var zero = (buf) => {
    let len = buf.length;
    while (--len >= 0) {
      buf[len] = 0;
    }
  };
  var slide_hash = (s) => {
    let n, m;
    let p;
    let wsize = s.w_size;
    n = s.hash_size;
    p = n;
    do {
      m = s.head[--p];
      s.head[p] = m >= wsize ? m - wsize : 0;
    } while (--n);
    n = wsize;
    p = n;
    do {
      m = s.prev[--p];
      s.prev[p] = m >= wsize ? m - wsize : 0;
    } while (--n);
  };
  var HASH = (s, prev, data) => (prev << s.hash_shift ^ data) & s.hash_mask;
  var INSERT_STRING = (s, str) => {
    let h;
    if (s.legacy_hash) {
      h = s.ins_h = HASH(s, s.ins_h, s.window[str + MIN_MATCH - 1]);
    } else {
      const w = s.window;
      const value = w[str] | w[str + 1] << 8 | w[str + 2] << 16 | w[str + 3] << 24;
      h = s.ins_h = Math.imul(value, 66521) + 66521 >>> 16 & s.hash_mask;
    }
    const hash_head = s.prev[str & s.w_mask] = s.head[h];
    s.head[h] = str;
    return hash_head;
  };
  var flush_pending = (strm) => {
    const s = strm.state;
    let len = s.pending;
    if (len > strm.avail_out) {
      len = strm.avail_out;
    }
    if (len === 0) {
      return;
    }
    strm.output.set(s.pending_buf.subarray(s.pending_out, s.pending_out + len), strm.next_out);
    strm.next_out += len;
    s.pending_out += len;
    strm.total_out += len;
    strm.avail_out -= len;
    s.pending -= len;
    if (s.pending === 0) {
      s.pending_out = 0;
    }
  };
  var flush_block_only = (s, last) => {
    _tr_flush_block(s, s.block_start >= 0 ? s.block_start : -1, s.strstart - s.block_start, last);
    s.block_start = s.strstart;
    flush_pending(s.strm);
  };
  var put_byte = (s, b) => {
    s.pending_buf[s.pending++] = b;
  };
  var putShortMSB = (s, b) => {
    s.pending_buf[s.pending++] = b >>> 8 & 255;
    s.pending_buf[s.pending++] = b & 255;
  };
  var read_buf = (strm, buf, start, size) => {
    let len = strm.avail_in;
    if (len > size) {
      len = size;
    }
    if (len === 0) {
      return 0;
    }
    strm.avail_in -= len;
    buf.set(strm.input.subarray(strm.next_in, strm.next_in + len), start);
    if (strm.state.wrap === 1) {
      strm.adler = adler32_1(strm.adler, buf, len, start);
    } else if (strm.state.wrap === 2) {
      strm.adler = crc32_1(strm.adler, buf, len, start);
    }
    strm.next_in += len;
    strm.total_in += len;
    return len;
  };
  var longest_match = (s, cur_match) => {
    let chain_length = s.max_chain_length;
    let scan = s.strstart;
    let match;
    let len;
    let best_len = s.prev_length;
    let nice_match = s.nice_match;
    const limit = s.strstart > s.w_size - MIN_LOOKAHEAD ? s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0;
    const _win = s.window;
    const wmask = s.w_mask;
    const prev = s.prev;
    const strend = s.strstart + MAX_MATCH;
    let scan_end1 = _win[scan + best_len - 1];
    let scan_end = _win[scan + best_len];
    if (s.prev_length >= s.good_match) {
      chain_length >>= 2;
    }
    if (nice_match > s.lookahead) {
      nice_match = s.lookahead;
    }
    do {
      match = cur_match;
      if (_win[match + best_len] !== scan_end || _win[match + best_len - 1] !== scan_end1 || _win[match] !== _win[scan] || _win[++match] !== _win[scan + 1]) {
        continue;
      }
      scan += 2;
      match++;
      do {
      } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && scan < strend);
      len = MAX_MATCH - (strend - scan);
      scan = strend - MAX_MATCH;
      if (len > best_len) {
        s.match_start = cur_match;
        best_len = len;
        if (len >= nice_match) {
          break;
        }
        scan_end1 = _win[scan + best_len - 1];
        scan_end = _win[scan + best_len];
      }
    } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);
    if (best_len <= s.lookahead) {
      return best_len;
    }
    return s.lookahead;
  };
  var fill_window = (s) => {
    const _w_size = s.w_size;
    let n, more, str;
    do {
      more = s.window_size - s.lookahead - s.strstart;
      if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {
        s.window.set(s.window.subarray(_w_size, _w_size + _w_size - more), 0);
        s.match_start -= _w_size;
        s.strstart -= _w_size;
        s.block_start -= _w_size;
        if (s.insert > s.strstart) {
          s.insert = s.strstart;
        }
        slide_hash(s);
        more += _w_size;
      }
      if (s.strm.avail_in === 0) {
        break;
      }
      n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
      s.lookahead += n;
      if (!s.legacy_hash) {
        if (s.lookahead + s.insert > MIN_MATCH) {
          str = s.strstart - s.insert;
          while (s.insert) {
            INSERT_STRING(s, str);
            str++;
            s.insert--;
            if (s.lookahead + s.insert <= MIN_MATCH) {
              break;
            }
          }
        }
      } else if (s.lookahead + s.insert >= MIN_MATCH) {
        str = s.strstart - s.insert;
        s.ins_h = s.window[str];
        s.ins_h = HASH(s, s.ins_h, s.window[str + 1]);
        while (s.insert) {
          INSERT_STRING(s, str);
          str++;
          s.insert--;
          if (s.lookahead + s.insert < MIN_MATCH) {
            break;
          }
        }
      }
    } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);
  };
  var deflate_stored = (s, flush) => {
    let min_block = s.pending_buf_size - 5 > s.w_size ? s.w_size : s.pending_buf_size - 5;
    let len, left, have, last = 0;
    let used = s.strm.avail_in;
    do {
      len = 65535;
      have = s.bi_valid + 42 >> 3;
      if (s.strm.avail_out < have) {
        break;
      }
      have = s.strm.avail_out - have;
      left = s.strstart - s.block_start;
      if (len > left + s.strm.avail_in) {
        len = left + s.strm.avail_in;
      }
      if (len > have) {
        len = have;
      }
      if (len < min_block && (len === 0 && flush !== Z_FINISH$3 || flush === Z_NO_FLUSH$2 || len !== left + s.strm.avail_in)) {
        break;
      }
      last = flush === Z_FINISH$3 && len === left + s.strm.avail_in ? 1 : 0;
      _tr_stored_block(s, 0, 0, last);
      s.pending_buf[s.pending - 4] = len;
      s.pending_buf[s.pending - 3] = len >> 8;
      s.pending_buf[s.pending - 2] = ~len;
      s.pending_buf[s.pending - 1] = ~len >> 8;
      flush_pending(s.strm);
      if (left) {
        if (left > len) {
          left = len;
        }
        s.strm.output.set(s.window.subarray(s.block_start, s.block_start + left), s.strm.next_out);
        s.strm.next_out += left;
        s.strm.avail_out -= left;
        s.strm.total_out += left;
        s.block_start += left;
        len -= left;
      }
      if (len) {
        read_buf(s.strm, s.strm.output, s.strm.next_out, len);
        s.strm.next_out += len;
        s.strm.avail_out -= len;
        s.strm.total_out += len;
      }
    } while (last === 0);
    used -= s.strm.avail_in;
    if (used) {
      if (used >= s.w_size) {
        s.matches = 2;
        s.window.set(s.strm.input.subarray(s.strm.next_in - s.w_size, s.strm.next_in), 0);
        s.strstart = s.w_size;
        s.insert = s.strstart;
      } else {
        if (s.window_size - s.strstart <= used) {
          s.strstart -= s.w_size;
          s.window.set(s.window.subarray(s.w_size, s.w_size + s.strstart), 0);
          if (s.matches < 2) {
            s.matches++;
          }
          if (s.insert > s.strstart) {
            s.insert = s.strstart;
          }
        }
        s.window.set(s.strm.input.subarray(s.strm.next_in - used, s.strm.next_in), s.strstart);
        s.strstart += used;
        s.insert += used > s.w_size - s.insert ? s.w_size - s.insert : used;
      }
      s.block_start = s.strstart;
    }
    if (s.high_water < s.strstart) {
      s.high_water = s.strstart;
    }
    if (last) {
      return BS_FINISH_DONE;
    }
    if (flush !== Z_NO_FLUSH$2 && flush !== Z_FINISH$3 && s.strm.avail_in === 0 && s.strstart === s.block_start) {
      return BS_BLOCK_DONE;
    }
    have = s.window_size - s.strstart;
    if (s.strm.avail_in > have && s.block_start >= s.w_size) {
      s.block_start -= s.w_size;
      s.strstart -= s.w_size;
      s.window.set(s.window.subarray(s.w_size, s.w_size + s.strstart), 0);
      if (s.matches < 2) {
        s.matches++;
      }
      have += s.w_size;
      if (s.insert > s.strstart) {
        s.insert = s.strstart;
      }
    }
    if (have > s.strm.avail_in) {
      have = s.strm.avail_in;
    }
    if (have) {
      read_buf(s.strm, s.window, s.strstart, have);
      s.strstart += have;
      s.insert += have > s.w_size - s.insert ? s.w_size - s.insert : have;
    }
    if (s.high_water < s.strstart) {
      s.high_water = s.strstart;
    }
    have = s.bi_valid + 42 >> 3;
    have = s.pending_buf_size - have > 65535 ? 65535 : s.pending_buf_size - have;
    min_block = have > s.w_size ? s.w_size : have;
    left = s.strstart - s.block_start;
    if (left >= min_block || (left || flush === Z_FINISH$3) && flush !== Z_NO_FLUSH$2 && s.strm.avail_in === 0 && left <= have) {
      len = left > have ? have : left;
      last = flush === Z_FINISH$3 && s.strm.avail_in === 0 && len === left ? 1 : 0;
      _tr_stored_block(s, s.block_start, len, last);
      s.block_start += len;
      flush_pending(s.strm);
    }
    return last ? BS_FINISH_STARTED : BS_NEED_MORE;
  };
  var deflate_fast = (s, flush) => {
    let hash_head;
    let bflush;
    for (; ; ) {
      if (s.lookahead < MIN_LOOKAHEAD) {
        fill_window(s);
        if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH$2) {
          return BS_NEED_MORE;
        }
        if (s.lookahead === 0) {
          break;
        }
      }
      hash_head = 0;
      if (s.lookahead >= MIN_MATCH) {
        hash_head = INSERT_STRING(s, s.strstart);
      }
      if (hash_head !== 0 && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
        s.match_length = longest_match(s, hash_head);
      }
      if (s.match_length >= MIN_MATCH) {
        bflush = _tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);
        s.lookahead -= s.match_length;
        if (s.match_length <= s.max_lazy_match && s.lookahead >= MIN_MATCH) {
          s.match_length--;
          do {
            s.strstart++;
            hash_head = INSERT_STRING(s, s.strstart);
          } while (--s.match_length !== 0);
          s.strstart++;
        } else {
          s.strstart += s.match_length;
          s.match_length = 0;
          if (s.legacy_hash) {
            s.ins_h = s.window[s.strstart];
            s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + 1]);
          }
        }
      } else {
        bflush = _tr_tally(s, 0, s.window[s.strstart]);
        s.lookahead--;
        s.strstart++;
      }
      if (bflush) {
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
    }
    s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
    if (flush === Z_FINISH$3) {
      flush_block_only(s, true);
      if (s.strm.avail_out === 0) {
        return BS_FINISH_STARTED;
      }
      return BS_FINISH_DONE;
    }
    if (s.sym_next) {
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    }
    return BS_BLOCK_DONE;
  };
  var deflate_slow = (s, flush) => {
    let hash_head;
    let bflush;
    let max_insert;
    for (; ; ) {
      if (s.lookahead < MIN_LOOKAHEAD) {
        fill_window(s);
        if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH$2) {
          return BS_NEED_MORE;
        }
        if (s.lookahead === 0) {
          break;
        }
      }
      hash_head = 0;
      if (s.lookahead >= MIN_MATCH) {
        hash_head = INSERT_STRING(s, s.strstart);
      }
      s.prev_length = s.match_length;
      s.prev_match = s.match_start;
      s.match_length = MIN_MATCH - 1;
      if (hash_head !== 0 && s.prev_length < s.max_lazy_match && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
        s.match_length = longest_match(s, hash_head);
        if (s.match_length <= 5 && (s.strategy === Z_FILTERED || s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096)) {
          s.match_length = MIN_MATCH - 1;
        }
      }
      if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
        max_insert = s.strstart + s.lookahead - MIN_MATCH;
        bflush = _tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH);
        s.lookahead -= s.prev_length - 1;
        s.prev_length -= 2;
        do {
          if (++s.strstart <= max_insert) {
            hash_head = INSERT_STRING(s, s.strstart);
          }
        } while (--s.prev_length !== 0);
        s.match_available = 0;
        s.match_length = MIN_MATCH - 1;
        s.strstart++;
        if (bflush) {
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
      } else if (s.match_available) {
        bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);
        if (bflush) {
          flush_block_only(s, false);
        }
        s.strstart++;
        s.lookahead--;
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      } else {
        s.match_available = 1;
        s.strstart++;
        s.lookahead--;
      }
    }
    if (s.match_available) {
      bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);
      s.match_available = 0;
    }
    s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
    if (flush === Z_FINISH$3) {
      flush_block_only(s, true);
      if (s.strm.avail_out === 0) {
        return BS_FINISH_STARTED;
      }
      return BS_FINISH_DONE;
    }
    if (s.sym_next) {
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    }
    return BS_BLOCK_DONE;
  };
  var deflate_rle = (s, flush) => {
    let bflush;
    let prev;
    let scan, strend;
    const _win = s.window;
    for (; ; ) {
      if (s.lookahead <= MAX_MATCH) {
        fill_window(s);
        if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH$2) {
          return BS_NEED_MORE;
        }
        if (s.lookahead === 0) {
          break;
        }
      }
      s.match_length = 0;
      if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
        scan = s.strstart - 1;
        prev = _win[scan];
        if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
          strend = s.strstart + MAX_MATCH;
          do {
          } while (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && scan < strend);
          s.match_length = MAX_MATCH - (strend - scan);
          if (s.match_length > s.lookahead) {
            s.match_length = s.lookahead;
          }
        }
      }
      if (s.match_length >= MIN_MATCH) {
        bflush = _tr_tally(s, 1, s.match_length - MIN_MATCH);
        s.lookahead -= s.match_length;
        s.strstart += s.match_length;
        s.match_length = 0;
      } else {
        bflush = _tr_tally(s, 0, s.window[s.strstart]);
        s.lookahead--;
        s.strstart++;
      }
      if (bflush) {
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
    }
    s.insert = 0;
    if (flush === Z_FINISH$3) {
      flush_block_only(s, true);
      if (s.strm.avail_out === 0) {
        return BS_FINISH_STARTED;
      }
      return BS_FINISH_DONE;
    }
    if (s.sym_next) {
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    }
    return BS_BLOCK_DONE;
  };
  var deflate_huff = (s, flush) => {
    let bflush;
    for (; ; ) {
      if (s.lookahead === 0) {
        fill_window(s);
        if (s.lookahead === 0) {
          if (flush === Z_NO_FLUSH$2) {
            return BS_NEED_MORE;
          }
          break;
        }
      }
      s.match_length = 0;
      bflush = _tr_tally(s, 0, s.window[s.strstart]);
      s.lookahead--;
      s.strstart++;
      if (bflush) {
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
    }
    s.insert = 0;
    if (flush === Z_FINISH$3) {
      flush_block_only(s, true);
      if (s.strm.avail_out === 0) {
        return BS_FINISH_STARTED;
      }
      return BS_FINISH_DONE;
    }
    if (s.sym_next) {
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    }
    return BS_BLOCK_DONE;
  };
  function Config(good_length, max_lazy, nice_length, max_chain, func) {
    this.good_length = good_length;
    this.max_lazy = max_lazy;
    this.nice_length = nice_length;
    this.max_chain = max_chain;
    this.func = func;
  }
  var configuration_table = [
    /*      good lazy nice chain */
    new Config(0, 0, 0, 0, deflate_stored),
    /* 0 store only */
    new Config(4, 4, 8, 4, deflate_fast),
    /* 1 max speed, no lazy matches */
    new Config(4, 5, 16, 8, deflate_fast),
    /* 2 */
    new Config(4, 6, 32, 32, deflate_fast),
    /* 3 */
    new Config(4, 4, 16, 16, deflate_slow),
    /* 4 lazy matches */
    new Config(8, 16, 32, 32, deflate_slow),
    /* 5 */
    new Config(8, 16, 128, 128, deflate_slow),
    /* 6 */
    new Config(8, 32, 128, 256, deflate_slow),
    /* 7 */
    new Config(32, 128, 258, 1024, deflate_slow),
    /* 8 */
    new Config(32, 258, 258, 4096, deflate_slow)
    /* 9 max compression */
  ];
  var lm_init = (s) => {
    s.window_size = 2 * s.w_size;
    zero(s.head);
    s.max_lazy_match = configuration_table[s.level].max_lazy;
    s.good_match = configuration_table[s.level].good_length;
    s.nice_match = configuration_table[s.level].nice_length;
    s.max_chain_length = configuration_table[s.level].max_chain;
    s.strstart = 0;
    s.block_start = 0;
    s.lookahead = 0;
    s.insert = 0;
    s.match_length = s.prev_length = MIN_MATCH - 1;
    s.match_available = 0;
    s.ins_h = 0;
  };
  function DeflateState() {
    this.strm = null;
    this.status = 0;
    this.pending_buf = null;
    this.pending_buf_size = 0;
    this.pending_out = 0;
    this.pending = 0;
    this.wrap = 0;
    this.gzhead = null;
    this.gzindex = 0;
    this.method = Z_DEFLATED$2;
    this.last_flush = -1;
    this.w_size = 0;
    this.w_bits = 0;
    this.w_mask = 0;
    this.window = null;
    this.window_size = 0;
    this.prev = null;
    this.head = null;
    this.ins_h = 0;
    this.legacy_hash = 0;
    this.hash_size = 0;
    this.hash_bits = 0;
    this.hash_mask = 0;
    this.hash_shift = 0;
    this.block_start = 0;
    this.match_length = 0;
    this.prev_match = 0;
    this.match_available = 0;
    this.strstart = 0;
    this.match_start = 0;
    this.lookahead = 0;
    this.prev_length = 0;
    this.max_chain_length = 0;
    this.max_lazy_match = 0;
    this.level = 0;
    this.strategy = 0;
    this.good_match = 0;
    this.nice_match = 0;
    this.dyn_ltree = new Uint16Array(HEAP_SIZE * 2);
    this.dyn_dtree = new Uint16Array((2 * D_CODES + 1) * 2);
    this.bl_tree = new Uint16Array((2 * BL_CODES + 1) * 2);
    zero(this.dyn_ltree);
    zero(this.dyn_dtree);
    zero(this.bl_tree);
    this.l_desc = null;
    this.d_desc = null;
    this.bl_desc = null;
    this.bl_count = new Uint16Array(MAX_BITS + 1);
    this.heap = new Uint16Array(2 * L_CODES + 1);
    zero(this.heap);
    this.heap_len = 0;
    this.heap_max = 0;
    this.depth = new Uint16Array(2 * L_CODES + 1);
    zero(this.depth);
    this.sym_buf = 0;
    this.lit_bufsize = 0;
    this.sym_next = 0;
    this.sym_end = 0;
    this.opt_len = 0;
    this.static_len = 0;
    this.matches = 0;
    this.insert = 0;
    this.bi_buf = 0;
    this.bi_valid = 0;
  }
  var deflateStateCheck = (strm) => {
    if (!strm) {
      return 1;
    }
    const s = strm.state;
    if (!s || s.strm !== strm || s.status !== INIT_STATE && //#ifdef GZIP
    s.status !== GZIP_STATE && //#endif
    s.status !== EXTRA_STATE && s.status !== NAME_STATE && s.status !== COMMENT_STATE && s.status !== HCRC_STATE && s.status !== BUSY_STATE && s.status !== FINISH_STATE) {
      return 1;
    }
    return 0;
  };
  var deflateResetKeep = (strm) => {
    if (deflateStateCheck(strm)) {
      return err(strm, Z_STREAM_ERROR$2);
    }
    strm.total_in = strm.total_out = 0;
    strm.data_type = Z_UNKNOWN;
    const s = strm.state;
    s.pending = 0;
    s.pending_out = 0;
    if (s.wrap < 0) {
      s.wrap = -s.wrap;
    }
    s.status = //#ifdef GZIP
    s.wrap === 2 ? GZIP_STATE : (
      //#endif
      s.wrap ? INIT_STATE : BUSY_STATE
    );
    strm.adler = s.wrap === 2 ? 0 : 1;
    s.last_flush = -2;
    _tr_init(s);
    return Z_OK$3;
  };
  var deflateReset = (strm) => {
    const ret = deflateResetKeep(strm);
    if (ret === Z_OK$3) {
      lm_init(strm.state);
    }
    return ret;
  };
  var deflateSetHeader = (strm, head) => {
    if (deflateStateCheck(strm) || strm.state.wrap !== 2) {
      return Z_STREAM_ERROR$2;
    }
    strm.state.gzhead = head;
    return Z_OK$3;
  };
  var deflateInit2 = (strm, level, method, windowBits, memLevel, strategy, legacyHash) => {
    if (!strm) {
      return Z_STREAM_ERROR$2;
    }
    let wrap = 1;
    if (level === Z_DEFAULT_COMPRESSION$1) {
      level = 6;
    }
    if (windowBits < 0) {
      wrap = 0;
      windowBits = -windowBits;
    } else if (windowBits > 15) {
      wrap = 2;
      windowBits -= 16;
    }
    if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED$2 || windowBits < 8 || windowBits > 15 || level < 0 || level > 9 || strategy < 0 || strategy > Z_FIXED || windowBits === 8 && wrap !== 1) {
      return err(strm, Z_STREAM_ERROR$2);
    }
    if (windowBits === 8) {
      windowBits = 9;
    }
    const s = new DeflateState();
    strm.state = s;
    s.strm = strm;
    s.status = INIT_STATE;
    s.wrap = wrap;
    s.gzhead = null;
    s.w_bits = windowBits;
    s.w_size = 1 << s.w_bits;
    s.w_mask = s.w_size - 1;
    s.legacy_hash = legacyHash ? 1 : 0;
    s.hash_bits = memLevel + 7;
    if (!s.legacy_hash && s.hash_bits < 15) {
      s.hash_bits = 15;
    }
    s.hash_size = 1 << s.hash_bits;
    s.hash_mask = s.hash_size - 1;
    s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);
    s.window = new Uint8Array(s.w_size * 2);
    s.head = new Uint16Array(s.hash_size);
    s.prev = new Uint16Array(s.w_size);
    s.lit_bufsize = 1 << memLevel + 6;
    s.pending_buf_size = s.lit_bufsize * 4;
    s.pending_buf = new Uint8Array(s.pending_buf_size);
    s.sym_buf = s.lit_bufsize;
    s.sym_end = (s.lit_bufsize - 1) * 3;
    s.level = level;
    s.strategy = strategy;
    s.method = method;
    return deflateReset(strm);
  };
  var deflateInit = (strm, level) => {
    return deflateInit2(strm, level, Z_DEFLATED$2, MAX_WBITS$1, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY$1);
  };
  var deflate$2 = (strm, flush) => {
    if (deflateStateCheck(strm) || flush > Z_BLOCK$1 || flush < 0) {
      return strm ? err(strm, Z_STREAM_ERROR$2) : Z_STREAM_ERROR$2;
    }
    const s = strm.state;
    if (!strm.output || strm.avail_in !== 0 && !strm.input || s.status === FINISH_STATE && flush !== Z_FINISH$3) {
      return err(strm, strm.avail_out === 0 ? Z_BUF_ERROR$2 : Z_STREAM_ERROR$2);
    }
    const old_flush = s.last_flush;
    s.last_flush = flush;
    if (s.pending !== 0) {
      flush_pending(strm);
      if (strm.avail_out === 0) {
        s.last_flush = -1;
        return Z_OK$3;
      }
    } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) && flush !== Z_FINISH$3) {
      return err(strm, Z_BUF_ERROR$2);
    }
    if (s.status === FINISH_STATE && strm.avail_in !== 0) {
      return err(strm, Z_BUF_ERROR$2);
    }
    if (s.status === INIT_STATE && s.wrap === 0) {
      s.status = BUSY_STATE;
    }
    if (s.status === INIT_STATE) {
      let header = Z_DEFLATED$2 + (s.w_bits - 8 << 4) << 8;
      let level_flags = -1;
      if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
        level_flags = 0;
      } else if (s.level < 6) {
        level_flags = 1;
      } else if (s.level === 6) {
        level_flags = 2;
      } else {
        level_flags = 3;
      }
      header |= level_flags << 6;
      if (s.strstart !== 0) {
        header |= PRESET_DICT;
      }
      header += 31 - header % 31;
      putShortMSB(s, header);
      if (s.strstart !== 0) {
        putShortMSB(s, strm.adler >>> 16);
        putShortMSB(s, strm.adler & 65535);
      }
      strm.adler = 1;
      s.status = BUSY_STATE;
      flush_pending(strm);
      if (s.pending !== 0) {
        s.last_flush = -1;
        return Z_OK$3;
      }
    }
    if (s.status === GZIP_STATE) {
      strm.adler = 0;
      put_byte(s, 31);
      put_byte(s, 139);
      put_byte(s, 8);
      if (!s.gzhead) {
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
        put_byte(s, OS_CODE);
        s.status = BUSY_STATE;
        flush_pending(strm);
        if (s.pending !== 0) {
          s.last_flush = -1;
          return Z_OK$3;
        }
      } else {
        put_byte(
          s,
          (s.gzhead.text ? 1 : 0) + (s.gzhead.hcrc ? 2 : 0) + (!s.gzhead.extra ? 0 : 4) + (!s.gzhead.name ? 0 : 8) + (!s.gzhead.comment ? 0 : 16)
        );
        put_byte(s, s.gzhead.time & 255);
        put_byte(s, s.gzhead.time >> 8 & 255);
        put_byte(s, s.gzhead.time >> 16 & 255);
        put_byte(s, s.gzhead.time >> 24 & 255);
        put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
        put_byte(s, s.gzhead.os & 255);
        if (s.gzhead.extra && s.gzhead.extra.length) {
          put_byte(s, s.gzhead.extra.length & 255);
          put_byte(s, s.gzhead.extra.length >> 8 & 255);
        }
        if (s.gzhead.hcrc) {
          strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending, 0);
        }
        s.gzindex = 0;
        s.status = EXTRA_STATE;
      }
    }
    if (s.status === EXTRA_STATE) {
      if (s.gzhead.extra) {
        let beg = s.pending;
        let left = (s.gzhead.extra.length & 65535) - s.gzindex;
        while (s.pending + left > s.pending_buf_size) {
          let copy = s.pending_buf_size - s.pending;
          s.pending_buf.set(s.gzhead.extra.subarray(s.gzindex, s.gzindex + copy), s.pending);
          s.pending = s.pending_buf_size;
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          s.gzindex += copy;
          flush_pending(strm);
          if (s.pending !== 0) {
            s.last_flush = -1;
            return Z_OK$3;
          }
          beg = 0;
          left -= copy;
        }
        let gzhead_extra = new Uint8Array(s.gzhead.extra);
        s.pending_buf.set(gzhead_extra.subarray(s.gzindex, s.gzindex + left), s.pending);
        s.pending += left;
        if (s.gzhead.hcrc && s.pending > beg) {
          strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
        }
        s.gzindex = 0;
      }
      s.status = NAME_STATE;
    }
    if (s.status === NAME_STATE) {
      if (s.gzhead.name) {
        let beg = s.pending;
        let val;
        do {
          if (s.pending === s.pending_buf_size) {
            if (s.gzhead.hcrc && s.pending > beg) {
              strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
            }
            flush_pending(strm);
            if (s.pending !== 0) {
              s.last_flush = -1;
              return Z_OK$3;
            }
            beg = 0;
          }
          if (s.gzindex < s.gzhead.name.length) {
            val = s.gzhead.name.charCodeAt(s.gzindex++) & 255;
          } else {
            val = 0;
          }
          put_byte(s, val);
        } while (val !== 0);
        if (s.gzhead.hcrc && s.pending > beg) {
          strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
        }
        s.gzindex = 0;
      }
      s.status = COMMENT_STATE;
    }
    if (s.status === COMMENT_STATE) {
      if (s.gzhead.comment) {
        let beg = s.pending;
        let val;
        do {
          if (s.pending === s.pending_buf_size) {
            if (s.gzhead.hcrc && s.pending > beg) {
              strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
            }
            flush_pending(strm);
            if (s.pending !== 0) {
              s.last_flush = -1;
              return Z_OK$3;
            }
            beg = 0;
          }
          if (s.gzindex < s.gzhead.comment.length) {
            val = s.gzhead.comment.charCodeAt(s.gzindex++) & 255;
          } else {
            val = 0;
          }
          put_byte(s, val);
        } while (val !== 0);
        if (s.gzhead.hcrc && s.pending > beg) {
          strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
        }
      }
      s.status = HCRC_STATE;
    }
    if (s.status === HCRC_STATE) {
      if (s.gzhead.hcrc) {
        if (s.pending + 2 > s.pending_buf_size) {
          flush_pending(strm);
          if (s.pending !== 0) {
            s.last_flush = -1;
            return Z_OK$3;
          }
        }
        put_byte(s, strm.adler & 255);
        put_byte(s, strm.adler >> 8 & 255);
        strm.adler = 0;
      }
      s.status = BUSY_STATE;
      flush_pending(strm);
      if (s.pending !== 0) {
        s.last_flush = -1;
        return Z_OK$3;
      }
    }
    if (strm.avail_in !== 0 || s.lookahead !== 0 || flush !== Z_NO_FLUSH$2 && s.status !== FINISH_STATE) {
      let bstate = s.level === 0 ? deflate_stored(s, flush) : s.strategy === Z_HUFFMAN_ONLY ? deflate_huff(s, flush) : s.strategy === Z_RLE ? deflate_rle(s, flush) : configuration_table[s.level].func(s, flush);
      if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
        s.status = FINISH_STATE;
      }
      if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
        if (strm.avail_out === 0) {
          s.last_flush = -1;
        }
        return Z_OK$3;
      }
      if (bstate === BS_BLOCK_DONE) {
        if (flush === Z_PARTIAL_FLUSH) {
          _tr_align(s);
        } else if (flush !== Z_BLOCK$1) {
          _tr_stored_block(s, 0, 0, false);
          if (flush === Z_FULL_FLUSH$1) {
            zero(s.head);
            if (s.lookahead === 0) {
              s.strstart = 0;
              s.block_start = 0;
              s.insert = 0;
            }
          }
        }
        flush_pending(strm);
        if (strm.avail_out === 0) {
          s.last_flush = -1;
          return Z_OK$3;
        }
      }
    }
    if (flush !== Z_FINISH$3) {
      return Z_OK$3;
    }
    if (s.wrap <= 0) {
      return Z_STREAM_END$3;
    }
    if (s.wrap === 2) {
      put_byte(s, strm.adler & 255);
      put_byte(s, strm.adler >> 8 & 255);
      put_byte(s, strm.adler >> 16 & 255);
      put_byte(s, strm.adler >> 24 & 255);
      put_byte(s, strm.total_in & 255);
      put_byte(s, strm.total_in >> 8 & 255);
      put_byte(s, strm.total_in >> 16 & 255);
      put_byte(s, strm.total_in >> 24 & 255);
    } else {
      putShortMSB(s, strm.adler >>> 16);
      putShortMSB(s, strm.adler & 65535);
    }
    flush_pending(strm);
    if (s.wrap > 0) {
      s.wrap = -s.wrap;
    }
    return s.pending !== 0 ? Z_OK$3 : Z_STREAM_END$3;
  };
  var deflateEnd = (strm) => {
    if (deflateStateCheck(strm)) {
      return Z_STREAM_ERROR$2;
    }
    const status = strm.state.status;
    strm.state = null;
    return status === BUSY_STATE ? err(strm, Z_DATA_ERROR$2) : Z_OK$3;
  };
  var deflateSetDictionary = (strm, dictionary) => {
    let dictLength = dictionary.length;
    if (deflateStateCheck(strm)) {
      return Z_STREAM_ERROR$2;
    }
    const s = strm.state;
    const wrap = s.wrap;
    if (wrap === 2 || wrap === 1 && s.status !== INIT_STATE || s.lookahead) {
      return Z_STREAM_ERROR$2;
    }
    if (wrap === 1) {
      strm.adler = adler32_1(strm.adler, dictionary, dictLength, 0);
    }
    s.wrap = 0;
    if (dictLength >= s.w_size) {
      if (wrap === 0) {
        zero(s.head);
        s.strstart = 0;
        s.block_start = 0;
        s.insert = 0;
      }
      let tmpDict = new Uint8Array(s.w_size);
      tmpDict.set(dictionary.subarray(dictLength - s.w_size, dictLength), 0);
      dictionary = tmpDict;
      dictLength = s.w_size;
    }
    const avail = strm.avail_in;
    const next = strm.next_in;
    const input = strm.input;
    strm.avail_in = dictLength;
    strm.next_in = 0;
    strm.input = dictionary;
    fill_window(s);
    while (s.lookahead >= MIN_MATCH) {
      let str = s.strstart;
      let n = s.lookahead - (MIN_MATCH - 1);
      do {
        INSERT_STRING(s, str);
        str++;
      } while (--n);
      s.strstart = str;
      s.lookahead = MIN_MATCH - 1;
      fill_window(s);
    }
    s.strstart += s.lookahead;
    s.block_start = s.strstart;
    s.insert = s.lookahead;
    s.lookahead = 0;
    s.match_length = s.prev_length = MIN_MATCH - 1;
    s.match_available = 0;
    strm.next_in = next;
    strm.input = input;
    strm.avail_in = avail;
    s.wrap = wrap;
    return Z_OK$3;
  };
  var deflateInit_1 = deflateInit;
  var deflateInit2_1 = deflateInit2;
  var deflateReset_1 = deflateReset;
  var deflateResetKeep_1 = deflateResetKeep;
  var deflateSetHeader_1 = deflateSetHeader;
  var deflate_2$1 = deflate$2;
  var deflateEnd_1 = deflateEnd;
  var deflateSetDictionary_1 = deflateSetDictionary;
  var deflateInfo = "pako deflate (from Nodeca project)";
  var deflate_1$2 = {
    deflateInit: deflateInit_1,
    deflateInit2: deflateInit2_1,
    deflateReset: deflateReset_1,
    deflateResetKeep: deflateResetKeep_1,
    deflateSetHeader: deflateSetHeader_1,
    deflate: deflate_2$1,
    deflateEnd: deflateEnd_1,
    deflateSetDictionary: deflateSetDictionary_1,
    deflateInfo
  };
  var _has = (obj, key) => {
    return Object.prototype.hasOwnProperty.call(obj, key);
  };
  var assign = function(obj) {
    const sources = Array.prototype.slice.call(arguments, 1);
    while (sources.length) {
      const source = sources.shift();
      if (!source) {
        continue;
      }
      if (typeof source !== "object") {
        throw new TypeError(source + "must be non-object");
      }
      for (const p in source) {
        if (_has(source, p)) {
          obj[p] = source[p];
        }
      }
    }
    return obj;
  };
  var flattenChunks = (chunks) => {
    let len = 0;
    for (let i = 0, l = chunks.length; i < l; i++) {
      len += chunks[i].length;
    }
    const result = new Uint8Array(len);
    for (let i = 0, pos = 0, l = chunks.length; i < l; i++) {
      let chunk = chunks[i];
      result.set(chunk, pos);
      pos += chunk.length;
    }
    return result;
  };
  var common = {
    assign,
    flattenChunks
  };
  var STR_APPLY_UIA_OK = true;
  try {
    String.fromCharCode.apply(null, new Uint8Array(1));
  } catch (__) {
    STR_APPLY_UIA_OK = false;
  }
  var _utf8len = new Uint8Array(256);
  for (let q = 0; q < 256; q++) {
    _utf8len[q] = q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1;
  }
  _utf8len[254] = _utf8len[255] = 1;
  var string2buf = (str) => {
    if (typeof TextEncoder === "function" && TextEncoder.prototype.encode) {
      return new TextEncoder().encode(str);
    }
    let buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;
    for (m_pos = 0; m_pos < str_len; m_pos++) {
      c = str.charCodeAt(m_pos);
      if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
        c2 = str.charCodeAt(m_pos + 1);
        if ((c2 & 64512) === 56320) {
          c = 65536 + (c - 55296 << 10) + (c2 - 56320);
          m_pos++;
        }
      }
      buf_len += c < 128 ? 1 : c < 2048 ? 2 : c < 65536 ? 3 : 4;
    }
    buf = new Uint8Array(buf_len);
    for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
      c = str.charCodeAt(m_pos);
      if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
        c2 = str.charCodeAt(m_pos + 1);
        if ((c2 & 64512) === 56320) {
          c = 65536 + (c - 55296 << 10) + (c2 - 56320);
          m_pos++;
        }
      }
      if (c < 128) {
        buf[i++] = c;
      } else if (c < 2048) {
        buf[i++] = 192 | c >>> 6;
        buf[i++] = 128 | c & 63;
      } else if (c < 65536) {
        buf[i++] = 224 | c >>> 12;
        buf[i++] = 128 | c >>> 6 & 63;
        buf[i++] = 128 | c & 63;
      } else {
        buf[i++] = 240 | c >>> 18;
        buf[i++] = 128 | c >>> 12 & 63;
        buf[i++] = 128 | c >>> 6 & 63;
        buf[i++] = 128 | c & 63;
      }
    }
    return buf;
  };
  var buf2binstring = (buf, len) => {
    if (len < 65534) {
      if (buf.subarray && STR_APPLY_UIA_OK) {
        return String.fromCharCode.apply(null, buf.length === len ? buf : buf.subarray(0, len));
      }
    }
    let result = "";
    for (let i = 0; i < len; i++) {
      result += String.fromCharCode(buf[i]);
    }
    return result;
  };
  var buf2string = (buf, max) => {
    const len = max || buf.length;
    if (typeof TextDecoder === "function" && TextDecoder.prototype.decode) {
      return new TextDecoder().decode(buf.subarray(0, max));
    }
    let i, out;
    const utf16buf = new Array(len * 2);
    for (out = 0, i = 0; i < len; ) {
      let c = buf[i++];
      if (c < 128) {
        utf16buf[out++] = c;
        continue;
      }
      let c_len = _utf8len[c];
      if (c_len > 4) {
        utf16buf[out++] = 65533;
        i += c_len - 1;
        continue;
      }
      c &= c_len === 2 ? 31 : c_len === 3 ? 15 : 7;
      while (c_len > 1 && i < len) {
        c = c << 6 | buf[i++] & 63;
        c_len--;
      }
      if (c_len > 1) {
        utf16buf[out++] = 65533;
        continue;
      }
      if (c < 65536) {
        utf16buf[out++] = c;
      } else {
        c -= 65536;
        utf16buf[out++] = 55296 | c >> 10 & 1023;
        utf16buf[out++] = 56320 | c & 1023;
      }
    }
    return buf2binstring(utf16buf, out);
  };
  var utf8border = (buf, max) => {
    max = max || buf.length;
    if (max > buf.length) {
      max = buf.length;
    }
    let pos = max - 1;
    while (pos >= 0 && (buf[pos] & 192) === 128) {
      pos--;
    }
    if (pos < 0) {
      return max;
    }
    if (pos === 0) {
      return max;
    }
    return pos + _utf8len[buf[pos]] > max ? pos : max;
  };
  var strings = {
    string2buf,
    buf2string,
    utf8border
  };
  function ZStream() {
    this.input = null;
    this.next_in = 0;
    this.avail_in = 0;
    this.total_in = 0;
    this.output = null;
    this.next_out = 0;
    this.avail_out = 0;
    this.total_out = 0;
    this.msg = "";
    this.state = null;
    this.data_type = 2;
    this.adler = 0;
  }
  var zstream = ZStream;
  var toString$1 = Object.prototype.toString;
  var {
    Z_NO_FLUSH: Z_NO_FLUSH$1,
    Z_SYNC_FLUSH,
    Z_FULL_FLUSH,
    Z_FINISH: Z_FINISH$2,
    Z_OK: Z_OK$2,
    Z_STREAM_END: Z_STREAM_END$2,
    Z_DEFAULT_COMPRESSION,
    Z_DEFAULT_STRATEGY,
    Z_DEFLATED: Z_DEFLATED$1
  } = constants$2;
  var defaultOptions$1 = {
    level: Z_DEFAULT_COMPRESSION,
    method: Z_DEFLATED$1,
    chunkSize: 16384,
    windowBits: 15,
    memLevel: 8,
    strategy: Z_DEFAULT_STRATEGY,
    legacyHash: true
  };
  function Deflate$1(options) {
    this.options = common.assign({}, defaultOptions$1, options || {});
    let opt = this.options;
    if (opt.raw && opt.windowBits > 0) {
      opt.windowBits = -opt.windowBits;
    } else if (opt.gzip && opt.windowBits > 0 && opt.windowBits < 16) {
      opt.windowBits += 16;
    }
    this.err = 0;
    this.msg = "";
    this.ended = false;
    this.chunks = [];
    this.strm = new zstream();
    this.strm.avail_out = 0;
    let status = deflate_1$2.deflateInit2(
      this.strm,
      opt.level,
      opt.method,
      opt.windowBits,
      opt.memLevel,
      opt.strategy,
      opt.legacyHash
    );
    if (status !== Z_OK$2) {
      throw new Error(messages[status]);
    }
    if (opt.header) {
      deflate_1$2.deflateSetHeader(this.strm, opt.header);
    }
    if (opt.dictionary) {
      let dict2;
      if (typeof opt.dictionary === "string") {
        dict2 = strings.string2buf(opt.dictionary);
      } else if (toString$1.call(opt.dictionary) === "[object ArrayBuffer]") {
        dict2 = new Uint8Array(opt.dictionary);
      } else {
        dict2 = opt.dictionary;
      }
      status = deflate_1$2.deflateSetDictionary(this.strm, dict2);
      if (status !== Z_OK$2) {
        throw new Error(messages[status]);
      }
      this._dict_set = true;
    }
  }
  Deflate$1.prototype.push = function(data, flush_mode) {
    const strm = this.strm;
    const chunkSize = this.options.chunkSize;
    let status, _flush_mode;
    if (this.ended) {
      return false;
    }
    if (flush_mode === ~~flush_mode) _flush_mode = flush_mode;
    else _flush_mode = flush_mode === true ? Z_FINISH$2 : Z_NO_FLUSH$1;
    if (typeof data === "string") {
      strm.input = strings.string2buf(data);
    } else if (toString$1.call(data) === "[object ArrayBuffer]") {
      strm.input = new Uint8Array(data);
    } else {
      strm.input = data;
    }
    strm.next_in = 0;
    strm.avail_in = strm.input.length;
    for (; ; ) {
      if (strm.avail_out === 0) {
        strm.output = new Uint8Array(chunkSize);
        strm.next_out = 0;
        strm.avail_out = chunkSize;
      }
      if ((_flush_mode === Z_SYNC_FLUSH || _flush_mode === Z_FULL_FLUSH) && strm.avail_out <= 6) {
        this.onData(strm.output.subarray(0, strm.next_out));
        strm.avail_out = 0;
        continue;
      }
      status = deflate_1$2.deflate(strm, _flush_mode);
      if (status === Z_STREAM_END$2) {
        if (strm.next_out > 0) {
          this.onData(strm.output.subarray(0, strm.next_out));
        }
        status = deflate_1$2.deflateEnd(this.strm);
        this.onEnd(status);
        this.ended = true;
        return status === Z_OK$2;
      }
      if (strm.avail_out === 0) {
        this.onData(strm.output);
        continue;
      }
      if (_flush_mode > 0 && strm.next_out > 0) {
        this.onData(strm.output.subarray(0, strm.next_out));
        strm.avail_out = 0;
        continue;
      }
      if (strm.avail_in === 0) break;
    }
    return true;
  };
  Deflate$1.prototype.onData = function(chunk) {
    this.chunks.push(chunk);
  };
  Deflate$1.prototype.onEnd = function(status) {
    if (status === Z_OK$2) {
      this.result = common.flattenChunks(this.chunks);
    }
    this.chunks = [];
    this.err = status;
    this.msg = this.strm.msg;
  };
  function deflate$1(input, options) {
    const deflator = new Deflate$1(options);
    deflator.push(input, true);
    if (deflator.err) {
      throw deflator.msg || messages[deflator.err];
    }
    return deflator.result;
  }
  function deflateRaw$1(input, options) {
    options = options || {};
    options.raw = true;
    return deflate$1(input, options);
  }
  function gzip$1(input, options) {
    options = options || {};
    options.gzip = true;
    return deflate$1(input, options);
  }
  var Deflate_1$1 = Deflate$1;
  var deflate_2 = deflate$1;
  var deflateRaw_1$1 = deflateRaw$1;
  var gzip_1$1 = gzip$1;
  var constants$1 = constants$2;
  var deflate_1$1 = {
    Deflate: Deflate_1$1,
    deflate: deflate_2,
    deflateRaw: deflateRaw_1$1,
    gzip: gzip_1$1,
    constants: constants$1
  };
  var BAD$1 = 16209;
  var TYPE$1 = 16191;
  var inffast = function inflate_fast(strm, start) {
    let _in;
    let last;
    let _out;
    let beg;
    let end;
    let dmax;
    let wsize;
    let whave;
    let wnext;
    let s_window;
    let hold;
    let bits;
    let lcode;
    let dcode;
    let lmask;
    let dmask;
    let here;
    let op;
    let len;
    let dist;
    let from;
    let from_source;
    let input, output;
    const state = strm.state;
    _in = strm.next_in;
    input = strm.input;
    last = _in + (strm.avail_in - 5);
    _out = strm.next_out;
    output = strm.output;
    beg = _out - (start - strm.avail_out);
    end = _out + (strm.avail_out - 257);
    dmax = state.dmax;
    wsize = state.wsize;
    whave = state.whave;
    wnext = state.wnext;
    s_window = state.window;
    hold = state.hold;
    bits = state.bits;
    lcode = state.lencode;
    dcode = state.distcode;
    lmask = (1 << state.lenbits) - 1;
    dmask = (1 << state.distbits) - 1;
    top:
      do {
        if (bits < 15) {
          hold += input[_in++] << bits;
          bits += 8;
          hold += input[_in++] << bits;
          bits += 8;
        }
        here = lcode[hold & lmask];
        dolen:
          for (; ; ) {
            op = here >>> 24;
            hold >>>= op;
            bits -= op;
            op = here >>> 16 & 255;
            if (op === 0) {
              output[_out++] = here & 65535;
            } else if (op & 16) {
              len = here & 65535;
              op &= 15;
              if (op) {
                if (bits < op) {
                  hold += input[_in++] << bits;
                  bits += 8;
                }
                len += hold & (1 << op) - 1;
                hold >>>= op;
                bits -= op;
              }
              if (bits < 15) {
                hold += input[_in++] << bits;
                bits += 8;
                hold += input[_in++] << bits;
                bits += 8;
              }
              here = dcode[hold & dmask];
              dodist:
                for (; ; ) {
                  op = here >>> 24;
                  hold >>>= op;
                  bits -= op;
                  op = here >>> 16 & 255;
                  if (op & 16) {
                    dist = here & 65535;
                    op &= 15;
                    if (bits < op) {
                      hold += input[_in++] << bits;
                      bits += 8;
                      if (bits < op) {
                        hold += input[_in++] << bits;
                        bits += 8;
                      }
                    }
                    dist += hold & (1 << op) - 1;
                    if (dist > dmax) {
                      strm.msg = "invalid distance too far back";
                      state.mode = BAD$1;
                      break top;
                    }
                    hold >>>= op;
                    bits -= op;
                    op = _out - beg;
                    if (dist > op) {
                      op = dist - op;
                      if (op > whave) {
                        if (state.sane) {
                          strm.msg = "invalid distance too far back";
                          state.mode = BAD$1;
                          break top;
                        }
                      }
                      from = 0;
                      from_source = s_window;
                      if (wnext === 0) {
                        from += wsize - op;
                        if (op < len) {
                          len -= op;
                          do {
                            output[_out++] = s_window[from++];
                          } while (--op);
                          from = _out - dist;
                          from_source = output;
                        }
                      } else if (wnext < op) {
                        from += wsize + wnext - op;
                        op -= wnext;
                        if (op < len) {
                          len -= op;
                          do {
                            output[_out++] = s_window[from++];
                          } while (--op);
                          from = 0;
                          if (wnext < len) {
                            op = wnext;
                            len -= op;
                            do {
                              output[_out++] = s_window[from++];
                            } while (--op);
                            from = _out - dist;
                            from_source = output;
                          }
                        }
                      } else {
                        from += wnext - op;
                        if (op < len) {
                          len -= op;
                          do {
                            output[_out++] = s_window[from++];
                          } while (--op);
                          from = _out - dist;
                          from_source = output;
                        }
                      }
                      while (len > 2) {
                        output[_out++] = from_source[from++];
                        output[_out++] = from_source[from++];
                        output[_out++] = from_source[from++];
                        len -= 3;
                      }
                      if (len) {
                        output[_out++] = from_source[from++];
                        if (len > 1) {
                          output[_out++] = from_source[from++];
                        }
                      }
                    } else {
                      from = _out - dist;
                      do {
                        output[_out++] = output[from++];
                        output[_out++] = output[from++];
                        output[_out++] = output[from++];
                        len -= 3;
                      } while (len > 2);
                      if (len) {
                        output[_out++] = output[from++];
                        if (len > 1) {
                          output[_out++] = output[from++];
                        }
                      }
                    }
                  } else if ((op & 64) === 0) {
                    here = dcode[(here & 65535) + (hold & (1 << op) - 1)];
                    continue dodist;
                  } else {
                    strm.msg = "invalid distance code";
                    state.mode = BAD$1;
                    break top;
                  }
                  break;
                }
            } else if ((op & 64) === 0) {
              here = lcode[(here & 65535) + (hold & (1 << op) - 1)];
              continue dolen;
            } else if (op & 32) {
              state.mode = TYPE$1;
              break top;
            } else {
              strm.msg = "invalid literal/length code";
              state.mode = BAD$1;
              break top;
            }
            break;
          }
      } while (_in < last && _out < end);
    len = bits >> 3;
    _in -= len;
    bits -= len << 3;
    hold &= (1 << bits) - 1;
    strm.next_in = _in;
    strm.next_out = _out;
    strm.avail_in = _in < last ? 5 + (last - _in) : 5 - (_in - last);
    strm.avail_out = _out < end ? 257 + (end - _out) : 257 - (_out - end);
    state.hold = hold;
    state.bits = bits;
    return;
  };
  var MAXBITS = 15;
  var ENOUGH_LENS$1 = 852;
  var ENOUGH_DISTS$1 = 592;
  var CODES$1 = 0;
  var LENS$1 = 1;
  var DISTS$1 = 2;
  var lbase = new Uint16Array([
    /* Length codes 257..285 base */
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    13,
    15,
    17,
    19,
    23,
    27,
    31,
    35,
    43,
    51,
    59,
    67,
    83,
    99,
    115,
    131,
    163,
    195,
    227,
    258,
    0,
    0
  ]);
  var lext = new Uint8Array([
    /* Length codes 257..285 extra */
    16,
    16,
    16,
    16,
    16,
    16,
    16,
    16,
    17,
    17,
    17,
    17,
    18,
    18,
    18,
    18,
    19,
    19,
    19,
    19,
    20,
    20,
    20,
    20,
    21,
    21,
    21,
    21,
    16,
    199,
    75
  ]);
  var dbase = new Uint16Array([
    /* Distance codes 0..29 base */
    1,
    2,
    3,
    4,
    5,
    7,
    9,
    13,
    17,
    25,
    33,
    49,
    65,
    97,
    129,
    193,
    257,
    385,
    513,
    769,
    1025,
    1537,
    2049,
    3073,
    4097,
    6145,
    8193,
    12289,
    16385,
    24577,
    0,
    0
  ]);
  var dext = new Uint8Array([
    /* Distance codes 0..29 extra */
    16,
    16,
    16,
    16,
    17,
    17,
    18,
    18,
    19,
    19,
    20,
    20,
    21,
    21,
    22,
    22,
    23,
    23,
    24,
    24,
    25,
    25,
    26,
    26,
    27,
    27,
    28,
    28,
    29,
    29,
    64,
    64
  ]);
  var inflate_table = (type, lens, lens_index, codes, table, table_index, work, opts) => {
    const bits = opts.bits;
    let len = 0;
    let sym = 0;
    let min = 0, max = 0;
    let root = 0;
    let curr = 0;
    let drop = 0;
    let left = 0;
    let used = 0;
    let huff = 0;
    let incr;
    let fill;
    let low;
    let mask;
    let next;
    let base = null;
    let match;
    const count = new Uint16Array(MAXBITS + 1);
    const offs = new Uint16Array(MAXBITS + 1);
    let extra = null;
    let here_bits, here_op, here_val;
    for (len = 0; len <= MAXBITS; len++) {
      count[len] = 0;
    }
    for (sym = 0; sym < codes; sym++) {
      count[lens[lens_index + sym]]++;
    }
    root = bits;
    for (max = MAXBITS; max >= 1; max--) {
      if (count[max] !== 0) {
        break;
      }
    }
    if (root > max) {
      root = max;
    }
    if (max === 0) {
      table[table_index++] = 1 << 24 | 64 << 16 | 0;
      table[table_index++] = 1 << 24 | 64 << 16 | 0;
      opts.bits = 1;
      return 0;
    }
    for (min = 1; min < max; min++) {
      if (count[min] !== 0) {
        break;
      }
    }
    if (root < min) {
      root = min;
    }
    left = 1;
    for (len = 1; len <= MAXBITS; len++) {
      left <<= 1;
      left -= count[len];
      if (left < 0) {
        return -1;
      }
    }
    if (left > 0 && (type === CODES$1 || max !== 1)) {
      return -1;
    }
    offs[1] = 0;
    for (len = 1; len < MAXBITS; len++) {
      offs[len + 1] = offs[len] + count[len];
    }
    for (sym = 0; sym < codes; sym++) {
      if (lens[lens_index + sym] !== 0) {
        work[offs[lens[lens_index + sym]]++] = sym;
      }
    }
    if (type === CODES$1) {
      base = extra = work;
      match = 20;
    } else if (type === LENS$1) {
      base = lbase;
      extra = lext;
      match = 257;
    } else {
      base = dbase;
      extra = dext;
      match = 0;
    }
    huff = 0;
    sym = 0;
    len = min;
    next = table_index;
    curr = root;
    drop = 0;
    low = -1;
    used = 1 << root;
    mask = used - 1;
    if (type === LENS$1 && used > ENOUGH_LENS$1 || type === DISTS$1 && used > ENOUGH_DISTS$1) {
      return 1;
    }
    for (; ; ) {
      here_bits = len - drop;
      if (work[sym] + 1 < match) {
        here_op = 0;
        here_val = work[sym];
      } else if (work[sym] >= match) {
        here_op = extra[work[sym] - match];
        here_val = base[work[sym] - match];
      } else {
        here_op = 32 + 64;
        here_val = 0;
      }
      incr = 1 << len - drop;
      fill = 1 << curr;
      min = fill;
      do {
        fill -= incr;
        table[next + (huff >> drop) + fill] = here_bits << 24 | here_op << 16 | here_val | 0;
      } while (fill !== 0);
      incr = 1 << len - 1;
      while (huff & incr) {
        incr >>= 1;
      }
      if (incr !== 0) {
        huff &= incr - 1;
        huff += incr;
      } else {
        huff = 0;
      }
      sym++;
      if (--count[len] === 0) {
        if (len === max) {
          break;
        }
        len = lens[lens_index + work[sym]];
      }
      if (len > root && (huff & mask) !== low) {
        if (drop === 0) {
          drop = root;
        }
        next += min;
        curr = len - drop;
        left = 1 << curr;
        while (curr + drop < max) {
          left -= count[curr + drop];
          if (left <= 0) {
            break;
          }
          curr++;
          left <<= 1;
        }
        used += 1 << curr;
        if (type === LENS$1 && used > ENOUGH_LENS$1 || type === DISTS$1 && used > ENOUGH_DISTS$1) {
          return 1;
        }
        low = huff & mask;
        table[low] = root << 24 | curr << 16 | next - table_index | 0;
      }
    }
    if (huff !== 0) {
      table[next + huff] = len - drop << 24 | 64 << 16 | 0;
    }
    opts.bits = root;
    return 0;
  };
  var inftrees = inflate_table;
  var CODES = 0;
  var LENS = 1;
  var DISTS = 2;
  var {
    Z_FINISH: Z_FINISH$1,
    Z_BLOCK,
    Z_TREES,
    Z_OK: Z_OK$1,
    Z_STREAM_END: Z_STREAM_END$1,
    Z_NEED_DICT: Z_NEED_DICT$1,
    Z_STREAM_ERROR: Z_STREAM_ERROR$1,
    Z_DATA_ERROR: Z_DATA_ERROR$1,
    Z_MEM_ERROR: Z_MEM_ERROR$1,
    Z_BUF_ERROR: Z_BUF_ERROR$1,
    Z_DEFLATED
  } = constants$2;
  var HEAD = 16180;
  var FLAGS = 16181;
  var TIME = 16182;
  var OS = 16183;
  var EXLEN = 16184;
  var EXTRA = 16185;
  var NAME = 16186;
  var COMMENT = 16187;
  var HCRC = 16188;
  var DICTID = 16189;
  var DICT = 16190;
  var TYPE = 16191;
  var TYPEDO = 16192;
  var STORED = 16193;
  var COPY_ = 16194;
  var COPY = 16195;
  var TABLE = 16196;
  var LENLENS = 16197;
  var CODELENS = 16198;
  var LEN_ = 16199;
  var LEN = 16200;
  var LENEXT = 16201;
  var DIST = 16202;
  var DISTEXT = 16203;
  var MATCH = 16204;
  var LIT = 16205;
  var CHECK = 16206;
  var LENGTH = 16207;
  var DONE = 16208;
  var BAD = 16209;
  var MEM = 16210;
  var SYNC = 16211;
  var ENOUGH_LENS = 852;
  var ENOUGH_DISTS = 592;
  var MAX_WBITS = 15;
  var DEF_WBITS = MAX_WBITS;
  var zswap32 = (q) => {
    return (q >>> 24 & 255) + (q >>> 8 & 65280) + ((q & 65280) << 8) + ((q & 255) << 24);
  };
  function InflateState() {
    this.strm = null;
    this.mode = 0;
    this.last = false;
    this.wrap = 0;
    this.havedict = false;
    this.flags = 0;
    this.dmax = 0;
    this.check = 0;
    this.total = 0;
    this.head = null;
    this.wbits = 0;
    this.wsize = 0;
    this.whave = 0;
    this.wnext = 0;
    this.window = null;
    this.hold = 0;
    this.bits = 0;
    this.length = 0;
    this.offset = 0;
    this.extra = 0;
    this.lencode = null;
    this.distcode = null;
    this.lenbits = 0;
    this.distbits = 0;
    this.ncode = 0;
    this.nlen = 0;
    this.ndist = 0;
    this.have = 0;
    this.next = null;
    this.lens = new Uint16Array(320);
    this.work = new Uint16Array(288);
    this.lendyn = null;
    this.distdyn = null;
    this.sane = 0;
    this.back = 0;
    this.was = 0;
  }
  var inflateStateCheck = (strm) => {
    if (!strm) {
      return 1;
    }
    const state = strm.state;
    if (!state || state.strm !== strm || state.mode < HEAD || state.mode > SYNC) {
      return 1;
    }
    return 0;
  };
  var inflateResetKeep = (strm) => {
    if (inflateStateCheck(strm)) {
      return Z_STREAM_ERROR$1;
    }
    const state = strm.state;
    strm.total_in = strm.total_out = state.total = 0;
    strm.msg = "";
    if (state.wrap) {
      strm.adler = state.wrap & 1;
    }
    state.mode = HEAD;
    state.last = 0;
    state.havedict = 0;
    state.flags = -1;
    state.dmax = 32768;
    state.head = null;
    state.hold = 0;
    state.bits = 0;
    state.lencode = state.lendyn = new Int32Array(ENOUGH_LENS);
    state.distcode = state.distdyn = new Int32Array(ENOUGH_DISTS);
    state.sane = 1;
    state.back = -1;
    return Z_OK$1;
  };
  var inflateReset = (strm) => {
    if (inflateStateCheck(strm)) {
      return Z_STREAM_ERROR$1;
    }
    const state = strm.state;
    state.wsize = 0;
    state.whave = 0;
    state.wnext = 0;
    return inflateResetKeep(strm);
  };
  var inflateReset2 = (strm, windowBits) => {
    let wrap;
    if (inflateStateCheck(strm)) {
      return Z_STREAM_ERROR$1;
    }
    const state = strm.state;
    if (windowBits < 0) {
      wrap = 0;
      windowBits = -windowBits;
    } else {
      wrap = (windowBits >> 4) + 5;
      if (windowBits < 48) {
        windowBits &= 15;
      }
    }
    if (windowBits && (windowBits < 8 || windowBits > 15)) {
      return Z_STREAM_ERROR$1;
    }
    if (state.window !== null && state.wbits !== windowBits) {
      state.window = null;
    }
    state.wrap = wrap;
    state.wbits = windowBits;
    return inflateReset(strm);
  };
  var inflateInit2 = (strm, windowBits) => {
    if (!strm) {
      return Z_STREAM_ERROR$1;
    }
    const state = new InflateState();
    strm.state = state;
    state.strm = strm;
    state.window = null;
    state.mode = HEAD;
    const ret = inflateReset2(strm, windowBits);
    if (ret !== Z_OK$1) {
      strm.state = null;
    }
    return ret;
  };
  var inflateInit = (strm) => {
    return inflateInit2(strm, DEF_WBITS);
  };
  var virgin = true;
  var lenfix;
  var distfix;
  var fixedtables = (state) => {
    if (virgin) {
      lenfix = new Int32Array(512);
      distfix = new Int32Array(32);
      let sym = 0;
      while (sym < 144) {
        state.lens[sym++] = 8;
      }
      while (sym < 256) {
        state.lens[sym++] = 9;
      }
      while (sym < 280) {
        state.lens[sym++] = 7;
      }
      while (sym < 288) {
        state.lens[sym++] = 8;
      }
      inftrees(LENS, state.lens, 0, 288, lenfix, 0, state.work, { bits: 9 });
      sym = 0;
      while (sym < 32) {
        state.lens[sym++] = 5;
      }
      inftrees(DISTS, state.lens, 0, 32, distfix, 0, state.work, { bits: 5 });
      virgin = false;
    }
    state.lencode = lenfix;
    state.lenbits = 9;
    state.distcode = distfix;
    state.distbits = 5;
  };
  var updatewindow = (strm, src, end, copy) => {
    let dist;
    const state = strm.state;
    if (state.window === null) {
      state.window = new Uint8Array(1 << state.wbits);
    }
    if (state.wsize === 0) {
      state.wsize = 1 << state.wbits;
      state.wnext = 0;
      state.whave = 0;
    }
    if (copy >= state.wsize) {
      state.window.set(src.subarray(end - state.wsize, end), 0);
      state.wnext = 0;
      state.whave = state.wsize;
    } else {
      dist = state.wsize - state.wnext;
      if (dist > copy) {
        dist = copy;
      }
      state.window.set(src.subarray(end - copy, end - copy + dist), state.wnext);
      copy -= dist;
      if (copy) {
        state.window.set(src.subarray(end - copy, end), 0);
        state.wnext = copy;
        state.whave = state.wsize;
      } else {
        state.wnext += dist;
        if (state.wnext === state.wsize) {
          state.wnext = 0;
        }
        if (state.whave < state.wsize) {
          state.whave += dist;
        }
      }
    }
    return 0;
  };
  var inflate$2 = (strm, flush) => {
    let state;
    let input, output;
    let next;
    let put;
    let have, left;
    let hold;
    let bits;
    let _in, _out;
    let copy;
    let from;
    let from_source;
    let here = 0;
    let here_bits, here_op, here_val;
    let last_bits, last_op, last_val;
    let len;
    let ret;
    const hbuf = new Uint8Array(4);
    let opts;
    let n;
    const order = (
      /* permutation of code lengths */
      new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15])
    );
    if (inflateStateCheck(strm) || !strm.output || !strm.input && strm.avail_in !== 0) {
      return Z_STREAM_ERROR$1;
    }
    state = strm.state;
    if (state.mode === TYPE) {
      state.mode = TYPEDO;
    }
    put = strm.next_out;
    output = strm.output;
    left = strm.avail_out;
    next = strm.next_in;
    input = strm.input;
    have = strm.avail_in;
    hold = state.hold;
    bits = state.bits;
    _in = have;
    _out = left;
    ret = Z_OK$1;
    inf_leave:
      for (; ; ) {
        switch (state.mode) {
          case HEAD:
            if (state.wrap === 0) {
              state.mode = TYPEDO;
              break;
            }
            while (bits < 16) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if (state.wrap & 2 && hold === 35615) {
              if (state.wbits === 0) {
                state.wbits = 15;
              }
              state.check = 0;
              hbuf[0] = hold & 255;
              hbuf[1] = hold >>> 8 & 255;
              state.check = crc32_1(state.check, hbuf, 2, 0);
              hold = 0;
              bits = 0;
              state.mode = FLAGS;
              break;
            }
            if (state.head) {
              state.head.done = false;
            }
            if (!(state.wrap & 1) || /* check if zlib header allowed */
            (((hold & 255) << 8) + (hold >> 8)) % 31) {
              strm.msg = "incorrect header check";
              state.mode = BAD;
              break;
            }
            if ((hold & 15) !== Z_DEFLATED) {
              strm.msg = "unknown compression method";
              state.mode = BAD;
              break;
            }
            hold >>>= 4;
            bits -= 4;
            len = (hold & 15) + 8;
            if (state.wbits === 0) {
              state.wbits = len;
            }
            if (len > 15 || len > state.wbits) {
              strm.msg = "invalid window size";
              state.mode = BAD;
              break;
            }
            state.dmax = 1 << state.wbits;
            state.flags = 0;
            strm.adler = state.check = 1;
            state.mode = hold & 512 ? DICTID : TYPE;
            hold = 0;
            bits = 0;
            break;
          case FLAGS:
            while (bits < 16) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            state.flags = hold;
            if ((state.flags & 255) !== Z_DEFLATED) {
              strm.msg = "unknown compression method";
              state.mode = BAD;
              break;
            }
            if (state.flags & 57344) {
              strm.msg = "unknown header flags set";
              state.mode = BAD;
              break;
            }
            if (state.head) {
              state.head.text = hold >> 8 & 1;
            }
            if (state.flags & 512 && state.wrap & 4) {
              hbuf[0] = hold & 255;
              hbuf[1] = hold >>> 8 & 255;
              state.check = crc32_1(state.check, hbuf, 2, 0);
            }
            hold = 0;
            bits = 0;
            state.mode = TIME;
          /* falls through */
          case TIME:
            while (bits < 32) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if (state.head) {
              state.head.time = hold;
            }
            if (state.flags & 512 && state.wrap & 4) {
              hbuf[0] = hold & 255;
              hbuf[1] = hold >>> 8 & 255;
              hbuf[2] = hold >>> 16 & 255;
              hbuf[3] = hold >>> 24 & 255;
              state.check = crc32_1(state.check, hbuf, 4, 0);
            }
            hold = 0;
            bits = 0;
            state.mode = OS;
          /* falls through */
          case OS:
            while (bits < 16) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if (state.head) {
              state.head.xflags = hold & 255;
              state.head.os = hold >> 8;
            }
            if (state.flags & 512 && state.wrap & 4) {
              hbuf[0] = hold & 255;
              hbuf[1] = hold >>> 8 & 255;
              state.check = crc32_1(state.check, hbuf, 2, 0);
            }
            hold = 0;
            bits = 0;
            state.mode = EXLEN;
          /* falls through */
          case EXLEN:
            if (state.flags & 1024) {
              while (bits < 16) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              state.length = hold;
              if (state.head) {
                state.head.extra_len = hold;
              }
              if (state.flags & 512 && state.wrap & 4) {
                hbuf[0] = hold & 255;
                hbuf[1] = hold >>> 8 & 255;
                state.check = crc32_1(state.check, hbuf, 2, 0);
              }
              hold = 0;
              bits = 0;
            } else if (state.head) {
              state.head.extra = null;
            }
            state.mode = EXTRA;
          /* falls through */
          case EXTRA:
            if (state.flags & 1024) {
              copy = state.length;
              if (copy > have) {
                copy = have;
              }
              if (copy) {
                if (state.head) {
                  len = state.head.extra_len - state.length;
                  if (!state.head.extra) {
                    state.head.extra = new Uint8Array(state.head.extra_len);
                  }
                  state.head.extra.set(
                    input.subarray(
                      next,
                      // extra field is limited to 65536 bytes
                      // - no need for additional size check
                      next + copy
                    ),
                    /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
                    len
                  );
                }
                if (state.flags & 512 && state.wrap & 4) {
                  state.check = crc32_1(state.check, input, copy, next);
                }
                have -= copy;
                next += copy;
                state.length -= copy;
              }
              if (state.length) {
                break inf_leave;
              }
            }
            state.length = 0;
            state.mode = NAME;
          /* falls through */
          case NAME:
            if (state.flags & 2048) {
              if (have === 0) {
                break inf_leave;
              }
              copy = 0;
              do {
                len = input[next + copy++];
                if (state.head && len && state.length < 65536) {
                  state.head.name += String.fromCharCode(len);
                }
              } while (len && copy < have);
              if (state.flags & 512 && state.wrap & 4) {
                state.check = crc32_1(state.check, input, copy, next);
              }
              have -= copy;
              next += copy;
              if (len) {
                break inf_leave;
              }
            } else if (state.head) {
              state.head.name = null;
            }
            state.length = 0;
            state.mode = COMMENT;
          /* falls through */
          case COMMENT:
            if (state.flags & 4096) {
              if (have === 0) {
                break inf_leave;
              }
              copy = 0;
              do {
                len = input[next + copy++];
                if (state.head && len && state.length < 65536) {
                  state.head.comment += String.fromCharCode(len);
                }
              } while (len && copy < have);
              if (state.flags & 512 && state.wrap & 4) {
                state.check = crc32_1(state.check, input, copy, next);
              }
              have -= copy;
              next += copy;
              if (len) {
                break inf_leave;
              }
            } else if (state.head) {
              state.head.comment = null;
            }
            state.mode = HCRC;
          /* falls through */
          case HCRC:
            if (state.flags & 512) {
              while (bits < 16) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if (state.wrap & 4 && hold !== (state.check & 65535)) {
                strm.msg = "header crc mismatch";
                state.mode = BAD;
                break;
              }
              hold = 0;
              bits = 0;
            }
            if (state.head) {
              state.head.hcrc = state.flags >> 9 & 1;
              state.head.done = true;
            }
            strm.adler = state.check = 0;
            state.mode = TYPE;
            break;
          case DICTID:
            while (bits < 32) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            strm.adler = state.check = zswap32(hold);
            hold = 0;
            bits = 0;
            state.mode = DICT;
          /* falls through */
          case DICT:
            if (state.havedict === 0) {
              strm.next_out = put;
              strm.avail_out = left;
              strm.next_in = next;
              strm.avail_in = have;
              state.hold = hold;
              state.bits = bits;
              return Z_NEED_DICT$1;
            }
            strm.adler = state.check = 1;
            state.mode = TYPE;
          /* falls through */
          case TYPE:
            if (flush === Z_BLOCK || flush === Z_TREES) {
              break inf_leave;
            }
          /* falls through */
          case TYPEDO:
            if (state.last) {
              hold >>>= bits & 7;
              bits -= bits & 7;
              state.mode = CHECK;
              break;
            }
            while (bits < 3) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            state.last = hold & 1;
            hold >>>= 1;
            bits -= 1;
            switch (hold & 3) {
              case 0:
                state.mode = STORED;
                break;
              case 1:
                fixedtables(state);
                state.mode = LEN_;
                if (flush === Z_TREES) {
                  hold >>>= 2;
                  bits -= 2;
                  break inf_leave;
                }
                break;
              case 2:
                state.mode = TABLE;
                break;
              case 3:
                strm.msg = "invalid block type";
                state.mode = BAD;
            }
            hold >>>= 2;
            bits -= 2;
            break;
          case STORED:
            hold >>>= bits & 7;
            bits -= bits & 7;
            while (bits < 32) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if ((hold & 65535) !== (hold >>> 16 ^ 65535)) {
              strm.msg = "invalid stored block lengths";
              state.mode = BAD;
              break;
            }
            state.length = hold & 65535;
            hold = 0;
            bits = 0;
            state.mode = COPY_;
            if (flush === Z_TREES) {
              break inf_leave;
            }
          /* falls through */
          case COPY_:
            state.mode = COPY;
          /* falls through */
          case COPY:
            copy = state.length;
            if (copy) {
              if (copy > have) {
                copy = have;
              }
              if (copy > left) {
                copy = left;
              }
              if (copy === 0) {
                break inf_leave;
              }
              output.set(input.subarray(next, next + copy), put);
              have -= copy;
              next += copy;
              left -= copy;
              put += copy;
              state.length -= copy;
              break;
            }
            state.mode = TYPE;
            break;
          case TABLE:
            while (bits < 14) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            state.nlen = (hold & 31) + 257;
            hold >>>= 5;
            bits -= 5;
            state.ndist = (hold & 31) + 1;
            hold >>>= 5;
            bits -= 5;
            state.ncode = (hold & 15) + 4;
            hold >>>= 4;
            bits -= 4;
            if (state.nlen > 286 || state.ndist > 30) {
              strm.msg = "too many length or distance symbols";
              state.mode = BAD;
              break;
            }
            state.have = 0;
            state.mode = LENLENS;
          /* falls through */
          case LENLENS:
            while (state.have < state.ncode) {
              while (bits < 3) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              state.lens[order[state.have++]] = hold & 7;
              hold >>>= 3;
              bits -= 3;
            }
            while (state.have < 19) {
              state.lens[order[state.have++]] = 0;
            }
            state.lencode = state.lendyn;
            state.lenbits = 7;
            opts = { bits: state.lenbits };
            ret = inftrees(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
            state.lenbits = opts.bits;
            if (ret) {
              strm.msg = "invalid code lengths set";
              state.mode = BAD;
              break;
            }
            state.have = 0;
            state.mode = CODELENS;
          /* falls through */
          case CODELENS:
            while (state.have < state.nlen + state.ndist) {
              for (; ; ) {
                here = state.lencode[hold & (1 << state.lenbits) - 1];
                here_bits = here >>> 24;
                here_op = here >>> 16 & 255;
                here_val = here & 65535;
                if (here_bits <= bits) {
                  break;
                }
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if (here_val < 16) {
                hold >>>= here_bits;
                bits -= here_bits;
                state.lens[state.have++] = here_val;
              } else {
                if (here_val === 16) {
                  n = here_bits + 2;
                  while (bits < n) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  hold >>>= here_bits;
                  bits -= here_bits;
                  if (state.have === 0) {
                    strm.msg = "invalid bit length repeat";
                    state.mode = BAD;
                    break;
                  }
                  len = state.lens[state.have - 1];
                  copy = 3 + (hold & 3);
                  hold >>>= 2;
                  bits -= 2;
                } else if (here_val === 17) {
                  n = here_bits + 3;
                  while (bits < n) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  hold >>>= here_bits;
                  bits -= here_bits;
                  len = 0;
                  copy = 3 + (hold & 7);
                  hold >>>= 3;
                  bits -= 3;
                } else {
                  n = here_bits + 7;
                  while (bits < n) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  hold >>>= here_bits;
                  bits -= here_bits;
                  len = 0;
                  copy = 11 + (hold & 127);
                  hold >>>= 7;
                  bits -= 7;
                }
                if (state.have + copy > state.nlen + state.ndist) {
                  strm.msg = "invalid bit length repeat";
                  state.mode = BAD;
                  break;
                }
                while (copy--) {
                  state.lens[state.have++] = len;
                }
              }
            }
            if (state.mode === BAD) {
              break;
            }
            if (state.lens[256] === 0) {
              strm.msg = "invalid code -- missing end-of-block";
              state.mode = BAD;
              break;
            }
            state.lenbits = 9;
            opts = { bits: state.lenbits };
            ret = inftrees(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
            state.lenbits = opts.bits;
            if (ret) {
              strm.msg = "invalid literal/lengths set";
              state.mode = BAD;
              break;
            }
            state.distbits = 6;
            state.distcode = state.distdyn;
            opts = { bits: state.distbits };
            ret = inftrees(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
            state.distbits = opts.bits;
            if (ret) {
              strm.msg = "invalid distances set";
              state.mode = BAD;
              break;
            }
            state.mode = LEN_;
            if (flush === Z_TREES) {
              break inf_leave;
            }
          /* falls through */
          case LEN_:
            state.mode = LEN;
          /* falls through */
          case LEN:
            if (have >= 6 && left >= 258) {
              strm.next_out = put;
              strm.avail_out = left;
              strm.next_in = next;
              strm.avail_in = have;
              state.hold = hold;
              state.bits = bits;
              inffast(strm, _out);
              put = strm.next_out;
              output = strm.output;
              left = strm.avail_out;
              next = strm.next_in;
              input = strm.input;
              have = strm.avail_in;
              hold = state.hold;
              bits = state.bits;
              if (state.mode === TYPE) {
                state.back = -1;
              }
              break;
            }
            state.back = 0;
            for (; ; ) {
              here = state.lencode[hold & (1 << state.lenbits) - 1];
              here_bits = here >>> 24;
              here_op = here >>> 16 & 255;
              here_val = here & 65535;
              if (here_bits <= bits) {
                break;
              }
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if (here_op && (here_op & 240) === 0) {
              last_bits = here_bits;
              last_op = here_op;
              last_val = here_val;
              for (; ; ) {
                here = state.lencode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                here_bits = here >>> 24;
                here_op = here >>> 16 & 255;
                here_val = here & 65535;
                if (last_bits + here_bits <= bits) {
                  break;
                }
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              hold >>>= last_bits;
              bits -= last_bits;
              state.back += last_bits;
            }
            hold >>>= here_bits;
            bits -= here_bits;
            state.back += here_bits;
            state.length = here_val;
            if (here_op === 0) {
              state.mode = LIT;
              break;
            }
            if (here_op & 32) {
              state.back = -1;
              state.mode = TYPE;
              break;
            }
            if (here_op & 64) {
              strm.msg = "invalid literal/length code";
              state.mode = BAD;
              break;
            }
            state.extra = here_op & 15;
            state.mode = LENEXT;
          /* falls through */
          case LENEXT:
            if (state.extra) {
              n = state.extra;
              while (bits < n) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              state.length += hold & (1 << state.extra) - 1;
              hold >>>= state.extra;
              bits -= state.extra;
              state.back += state.extra;
            }
            state.was = state.length;
            state.mode = DIST;
          /* falls through */
          case DIST:
            for (; ; ) {
              here = state.distcode[hold & (1 << state.distbits) - 1];
              here_bits = here >>> 24;
              here_op = here >>> 16 & 255;
              here_val = here & 65535;
              if (here_bits <= bits) {
                break;
              }
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if ((here_op & 240) === 0) {
              last_bits = here_bits;
              last_op = here_op;
              last_val = here_val;
              for (; ; ) {
                here = state.distcode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                here_bits = here >>> 24;
                here_op = here >>> 16 & 255;
                here_val = here & 65535;
                if (last_bits + here_bits <= bits) {
                  break;
                }
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              hold >>>= last_bits;
              bits -= last_bits;
              state.back += last_bits;
            }
            hold >>>= here_bits;
            bits -= here_bits;
            state.back += here_bits;
            if (here_op & 64) {
              strm.msg = "invalid distance code";
              state.mode = BAD;
              break;
            }
            state.offset = here_val;
            state.extra = here_op & 15;
            state.mode = DISTEXT;
          /* falls through */
          case DISTEXT:
            if (state.extra) {
              n = state.extra;
              while (bits < n) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              state.offset += hold & (1 << state.extra) - 1;
              hold >>>= state.extra;
              bits -= state.extra;
              state.back += state.extra;
            }
            if (state.offset > state.dmax) {
              strm.msg = "invalid distance too far back";
              state.mode = BAD;
              break;
            }
            state.mode = MATCH;
          /* falls through */
          case MATCH:
            if (left === 0) {
              break inf_leave;
            }
            copy = _out - left;
            if (state.offset > copy) {
              copy = state.offset - copy;
              if (copy > state.whave) {
                if (state.sane) {
                  strm.msg = "invalid distance too far back";
                  state.mode = BAD;
                  break;
                }
              }
              if (copy > state.wnext) {
                copy -= state.wnext;
                from = state.wsize - copy;
              } else {
                from = state.wnext - copy;
              }
              if (copy > state.length) {
                copy = state.length;
              }
              from_source = state.window;
            } else {
              from_source = output;
              from = put - state.offset;
              copy = state.length;
            }
            if (copy > left) {
              copy = left;
            }
            left -= copy;
            state.length -= copy;
            do {
              output[put++] = from_source[from++];
            } while (--copy);
            if (state.length === 0) {
              state.mode = LEN;
            }
            break;
          case LIT:
            if (left === 0) {
              break inf_leave;
            }
            output[put++] = state.length;
            left--;
            state.mode = LEN;
            break;
          case CHECK:
            if (state.wrap) {
              while (bits < 32) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold |= input[next++] << bits;
                bits += 8;
              }
              _out -= left;
              strm.total_out += _out;
              state.total += _out;
              if (state.wrap & 4 && _out) {
                strm.adler = state.check = /*UPDATE_CHECK(state.check, put - _out, _out);*/
                state.flags ? crc32_1(state.check, output, _out, put - _out) : adler32_1(state.check, output, _out, put - _out);
              }
              _out = left;
              if (state.wrap & 4 && (state.flags ? hold : zswap32(hold)) !== state.check) {
                strm.msg = "incorrect data check";
                state.mode = BAD;
                break;
              }
              hold = 0;
              bits = 0;
            }
            state.mode = LENGTH;
          /* falls through */
          case LENGTH:
            if (state.wrap && state.flags) {
              while (bits < 32) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if (state.wrap & 4 && hold !== (state.total & 4294967295)) {
                strm.msg = "incorrect length check";
                state.mode = BAD;
                break;
              }
              hold = 0;
              bits = 0;
            }
            state.mode = DONE;
          /* falls through */
          case DONE:
            ret = Z_STREAM_END$1;
            break inf_leave;
          case BAD:
            ret = Z_DATA_ERROR$1;
            break inf_leave;
          case MEM:
            return Z_MEM_ERROR$1;
          case SYNC:
          /* falls through */
          default:
            return Z_STREAM_ERROR$1;
        }
      }
    strm.next_out = put;
    strm.avail_out = left;
    strm.next_in = next;
    strm.avail_in = have;
    state.hold = hold;
    state.bits = bits;
    if (state.wsize || _out !== strm.avail_out && state.mode < BAD && (state.mode < CHECK || flush !== Z_FINISH$1)) {
      if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) ;
    }
    _in -= strm.avail_in;
    _out -= strm.avail_out;
    strm.total_in += _in;
    strm.total_out += _out;
    state.total += _out;
    if (state.wrap & 4 && _out) {
      strm.adler = state.check = /*UPDATE_CHECK(state.check, strm.next_out - _out, _out);*/
      state.flags ? crc32_1(state.check, output, _out, strm.next_out - _out) : adler32_1(state.check, output, _out, strm.next_out - _out);
    }
    strm.data_type = state.bits + (state.last ? 64 : 0) + (state.mode === TYPE ? 128 : 0) + (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
    if ((_in === 0 && _out === 0 || flush === Z_FINISH$1) && ret === Z_OK$1) {
      ret = Z_BUF_ERROR$1;
    }
    return ret;
  };
  var inflateEnd = (strm) => {
    if (inflateStateCheck(strm)) {
      return Z_STREAM_ERROR$1;
    }
    let state = strm.state;
    if (state.window) {
      state.window = null;
    }
    strm.state = null;
    return Z_OK$1;
  };
  var inflateGetHeader = (strm, head) => {
    if (inflateStateCheck(strm)) {
      return Z_STREAM_ERROR$1;
    }
    const state = strm.state;
    if ((state.wrap & 2) === 0) {
      return Z_STREAM_ERROR$1;
    }
    state.head = head;
    head.done = false;
    return Z_OK$1;
  };
  var inflateSetDictionary = (strm, dictionary) => {
    const dictLength = dictionary.length;
    let state;
    let dictid;
    let ret;
    if (inflateStateCheck(strm)) {
      return Z_STREAM_ERROR$1;
    }
    state = strm.state;
    if (state.wrap !== 0 && state.mode !== DICT) {
      return Z_STREAM_ERROR$1;
    }
    if (state.mode === DICT) {
      dictid = 1;
      dictid = adler32_1(dictid, dictionary, dictLength, 0);
      if (dictid !== state.check) {
        return Z_DATA_ERROR$1;
      }
    }
    ret = updatewindow(strm, dictionary, dictLength, dictLength);
    if (ret) {
      state.mode = MEM;
      return Z_MEM_ERROR$1;
    }
    state.havedict = 1;
    return Z_OK$1;
  };
  var inflateReset_1 = inflateReset;
  var inflateReset2_1 = inflateReset2;
  var inflateResetKeep_1 = inflateResetKeep;
  var inflateInit_1 = inflateInit;
  var inflateInit2_1 = inflateInit2;
  var inflate_2$1 = inflate$2;
  var inflateEnd_1 = inflateEnd;
  var inflateGetHeader_1 = inflateGetHeader;
  var inflateSetDictionary_1 = inflateSetDictionary;
  var inflateInfo = "pako inflate (from Nodeca project)";
  var inflate_1$2 = {
    inflateReset: inflateReset_1,
    inflateReset2: inflateReset2_1,
    inflateResetKeep: inflateResetKeep_1,
    inflateInit: inflateInit_1,
    inflateInit2: inflateInit2_1,
    inflate: inflate_2$1,
    inflateEnd: inflateEnd_1,
    inflateGetHeader: inflateGetHeader_1,
    inflateSetDictionary: inflateSetDictionary_1,
    inflateInfo
  };
  function GZheader() {
    this.text = 0;
    this.time = 0;
    this.xflags = 0;
    this.os = 0;
    this.extra = null;
    this.extra_len = 0;
    this.name = "";
    this.comment = "";
    this.hcrc = 0;
    this.done = false;
  }
  var gzheader = GZheader;
  var toString = Object.prototype.toString;
  var {
    Z_NO_FLUSH,
    Z_FINISH,
    Z_OK,
    Z_STREAM_END,
    Z_NEED_DICT,
    Z_STREAM_ERROR,
    Z_DATA_ERROR,
    Z_MEM_ERROR,
    Z_BUF_ERROR
  } = constants$2;
  var defaultOptions = {
    chunkSize: 1024 * 64,
    windowBits: 15,
    to: ""
  };
  function Inflate$1(options) {
    this.options = common.assign({}, defaultOptions, options || {});
    const opt = this.options;
    if (opt.raw && opt.windowBits >= 0 && opt.windowBits < 16) {
      opt.windowBits = -opt.windowBits;
      if (opt.windowBits === 0) {
        opt.windowBits = -15;
      }
    }
    if (opt.windowBits >= 0 && opt.windowBits < 16 && !(options && options.windowBits)) {
      opt.windowBits += 32;
    }
    if (opt.windowBits > 15 && opt.windowBits < 48) {
      if ((opt.windowBits & 15) === 0) {
        opt.windowBits |= 15;
      }
    }
    this.err = 0;
    this.msg = "";
    this.ended = false;
    this.chunks = [];
    this.strm = new zstream();
    this.strm.avail_out = 0;
    let status = inflate_1$2.inflateInit2(
      this.strm,
      opt.windowBits
    );
    if (status !== Z_OK) {
      throw new Error(messages[status]);
    }
    this.header = new gzheader();
    inflate_1$2.inflateGetHeader(this.strm, this.header);
    if (opt.dictionary) {
      if (typeof opt.dictionary === "string") {
        opt.dictionary = strings.string2buf(opt.dictionary);
      } else if (toString.call(opt.dictionary) === "[object ArrayBuffer]") {
        opt.dictionary = new Uint8Array(opt.dictionary);
      }
      if (opt.raw) {
        status = inflate_1$2.inflateSetDictionary(this.strm, opt.dictionary);
        if (status !== Z_OK) {
          throw new Error(messages[status]);
        }
      }
    }
  }
  Inflate$1.prototype.push = function(data, flush_mode) {
    const strm = this.strm;
    const chunkSize = this.options.chunkSize;
    const dictionary = this.options.dictionary;
    let status, _flush_mode, last_avail_out;
    if (this.ended) return false;
    if (flush_mode === ~~flush_mode) _flush_mode = flush_mode;
    else _flush_mode = flush_mode === true ? Z_FINISH : Z_NO_FLUSH;
    if (toString.call(data) === "[object ArrayBuffer]") {
      strm.input = new Uint8Array(data);
    } else {
      strm.input = data;
    }
    strm.next_in = 0;
    strm.avail_in = strm.input.length;
    for (; ; ) {
      if (strm.avail_out === 0) {
        strm.output = new Uint8Array(chunkSize);
        strm.next_out = 0;
        strm.avail_out = chunkSize;
      }
      status = inflate_1$2.inflate(strm, _flush_mode);
      if (status === Z_NEED_DICT && dictionary) {
        status = inflate_1$2.inflateSetDictionary(strm, dictionary);
        if (status === Z_OK) {
          status = inflate_1$2.inflate(strm, _flush_mode);
        } else if (status === Z_DATA_ERROR) {
          status = Z_NEED_DICT;
        }
      }
      while (strm.avail_in > 0 && status === Z_STREAM_END && strm.state.wrap & 2 && strm.state.flags !== 0 && strm.input[strm.next_in] !== 0) {
        inflate_1$2.inflateReset(strm);
        status = inflate_1$2.inflate(strm, _flush_mode);
      }
      switch (status) {
        case Z_STREAM_ERROR:
        case Z_DATA_ERROR:
        case Z_NEED_DICT:
        case Z_MEM_ERROR:
          this.onEnd(status);
          this.ended = true;
          return false;
      }
      last_avail_out = strm.avail_out;
      if (strm.next_out) {
        if (strm.avail_out === 0 || status === Z_STREAM_END || _flush_mode > 0) {
          if (this.options.to === "string") {
            let next_out_utf8 = strings.utf8border(strm.output, strm.next_out);
            let tail = strm.next_out - next_out_utf8;
            let utf8str = strings.buf2string(strm.output, next_out_utf8);
            strm.next_out = tail;
            strm.avail_out = chunkSize - tail;
            if (tail) strm.output.set(strm.output.subarray(next_out_utf8, next_out_utf8 + tail), 0);
            this.onData(utf8str);
          } else {
            this.onData(strm.output.length === strm.next_out ? strm.output : strm.output.subarray(0, strm.next_out));
            strm.avail_out = 0;
            strm.next_out = 0;
          }
        }
      }
      if ((status === Z_OK || status === Z_BUF_ERROR) && last_avail_out === 0) continue;
      if (status === Z_STREAM_END) {
        status = inflate_1$2.inflateEnd(this.strm);
        this.onEnd(status);
        this.ended = true;
        return true;
      }
      if (strm.avail_in === 0) {
        if (_flush_mode === Z_FINISH) {
          status = inflate_1$2.inflateEnd(this.strm);
          this.onEnd(status === Z_OK ? Z_BUF_ERROR : status);
          this.ended = true;
          return false;
        }
        break;
      }
    }
    return true;
  };
  Inflate$1.prototype.onData = function(chunk) {
    this.chunks.push(chunk);
  };
  Inflate$1.prototype.onEnd = function(status) {
    if (status === Z_OK) {
      if (this.options.to === "string") {
        this.result = this.chunks.join("");
      } else {
        this.result = common.flattenChunks(this.chunks);
      }
    }
    this.chunks = [];
    this.err = status;
    this.msg = this.strm.msg;
  };
  function inflate$1(input, options) {
    const inflator = new Inflate$1(options);
    inflator.push(input, true);
    if (inflator.err) throw inflator.msg || messages[inflator.err];
    return inflator.result;
  }
  function inflateRaw$1(input, options) {
    options = options || {};
    options.raw = true;
    return inflate$1(input, options);
  }
  var Inflate_1$1 = Inflate$1;
  var inflate_2 = inflate$1;
  var inflateRaw_1$1 = inflateRaw$1;
  var ungzip$1 = inflate$1;
  var constants = constants$2;
  var inflate_1$1 = {
    Inflate: Inflate_1$1,
    inflate: inflate_2,
    inflateRaw: inflateRaw_1$1,
    ungzip: ungzip$1,
    constants
  };
  var { Deflate, deflate, deflateRaw, gzip } = deflate_1$1;
  var { Inflate, inflate, inflateRaw, ungzip } = inflate_1$1;
  var deflate_1 = deflate;
  var inflate_1 = inflate;

  // src/wad/dfwad.ts
  var SIGNATURE = "DFWAD";
  var VERSION = 1;
  var NAME_BYTES = 16;
  function decode1251(bytes) {
    try {
      return new TextDecoder("windows-1251").decode(bytes).replace(/\0+$/g, "").trim();
    } catch {
      return Array.from(bytes).map((b) => b ? String.fromCharCode(b) : "").join("").replace(/\0+$/g, "").trim();
    }
  }
  function encode1251(text) {
    const out = new Uint8Array(NAME_BYTES);
    for (let i = 0; i < Math.min(text.length, NAME_BYTES); i++) {
      const c = text.charCodeAt(i);
      out[i] = c < 256 ? c : 63;
    }
    return out;
  }
  function readU16(view, offset) {
    return view.getUint16(offset, true);
  }
  function readU32(view, offset) {
    return view.getUint32(offset, true);
  }
  function isDfwad(data) {
    if (data.length < 8) return false;
    return String.fromCharCode(...data.subarray(0, 5)) === SIGNATURE;
  }
  function parseDfwad(data) {
    if (!isDfwad(data)) throw new Error("Not a DFWAD");
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const version = data[5];
    if (version !== VERSION) throw new Error(`Unsupported DFWAD version ${version}`);
    const lumps = readU16(view, 6);
    const files = [];
    let dir = "";
    let cursor = 8;
    for (let i = 0; i < lumps; i++) {
      const name = decode1251(data.subarray(cursor, cursor + NAME_BYTES));
      const offset = readU32(view, cursor + NAME_BYTES);
      const size = readU32(view, cursor + NAME_BYTES + 4);
      cursor += NAME_BYTES + 8;
      if (offset === 0 && size === 0) {
        dir = name;
        continue;
      }
      if (!offset || !size) continue;
      const raw = data.subarray(offset, offset + size);
      let decoded;
      try {
        decoded = inflate_1(raw);
      } catch {
        decoded = raw;
      }
      files.push({ dir, name, data: decoded });
    }
    return files;
  }
  function createDfwad(files) {
    const groups = /* @__PURE__ */ new Map();
    for (const file of files) {
      const list = groups.get(file.dir) ?? [];
      list.push(file);
      groups.set(file.dir, list);
    }
    const dirs = [...groups.keys()].sort((a, b) => a.localeCompare(b));
    const lumpCount = dirs.length + files.length;
    const header = 8;
    const table = lumpCount * (NAME_BYTES + 8);
    const chunks = [];
    let dataOffset = header + table;
    for (const dir of dirs) {
      chunks.push({ name: encode1251(dir), offset: 0, size: 0 });
      for (const file of groups.get(dir) ?? []) {
        const payload = deflate_1(file.data);
        chunks.push({
          name: encode1251(file.name),
          offset: dataOffset,
          size: payload.length,
          payload
        });
        dataOffset += payload.length;
      }
    }
    const out = new Uint8Array(dataOffset);
    const view = new DataView(out.buffer);
    out.set([68, 70, 87, 65, 68, VERSION], 0);
    view.setUint16(6, lumpCount, true);
    let tableAt = 8;
    for (const chunk of chunks) {
      out.set(chunk.name, tableAt);
      view.setUint32(tableAt + NAME_BYTES, chunk.offset, true);
      view.setUint32(tableAt + NAME_BYTES + 4, chunk.size, true);
      tableAt += NAME_BYTES + 8;
      if (chunk.payload) out.set(chunk.payload, chunk.offset);
    }
    return out;
  }

  // src/i18n.ts
  var dict = {
    title: { ru: "Doom 2D Forever Model Editor", en: "Doom 2D Forever Model Editor" },
    new: { ru: "\u041D\u043E\u0432\u0430\u044F", en: "New" },
    open: { ru: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C", en: "Open" },
    openWad: { ru: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0438\u0437 WAD", en: "Open from WAD" },
    saveTxt: { ru: "\u2192 model.txt", en: "\u2192 model.txt" },
    saveWad: { ru: "\u2192 WAD", en: "\u2192 WAD" },
    help: {
      ru: "\u0412\u044B\u0431\u043E\u0440 \u0440\u0435\u0441\u0443\u0440\u0441\u043E\u0432 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u043E \u043D\u0435 \u043D\u0443\u0436\u0435\u043D. \u0420\u0435\u0434\u0430\u043A\u0442\u043E\u0440 \u043F\u043E\u0434\u0431\u0438\u0440\u0430\u0435\u0442 \u0438\u0445 \u043F\u043E \u043F\u0430\u043F\u043A\u0435 \u0438 \u0440\u0430\u0441\u0448\u0438\u0440\u0435\u043D\u0438\u044E, \u0435\u0441\u043B\u0438 \u043E\u043D\u0438 \u0435\u0441\u0442\u044C \u043D\u0430 \u0434\u0438\u0441\u043A\u0435.",
      en: "You don't pick resources one by one. The editor matches files by folder and extension."
    },
    tabModel: { ru: "\u041C\u043E\u0434\u0435\u043B\u044C", en: "Model" },
    tabAnim: { ru: "\u0410\u043D\u0438\u043C\u0430\u0446\u0438\u044F \u0438 \u043E\u0440\u0443\u0436\u0438\u0435", en: "Animation & weapons" },
    tabRes: { ru: "\u0420\u0435\u0441\u0443\u0440\u0441\u044B", en: "Resources" },
    about: { ru: "\u041E \u043C\u043E\u0434\u0435\u043B\u0438", en: "About" },
    name: { ru: "\u0418\u043C\u044F", en: "Name" },
    author: { ru: "\u0410\u0432\u0442\u043E\u0440", en: "Author" },
    description: { ru: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435", en: "Description" },
    version: { ru: "\u0412\u0435\u0440\u0441\u0438\u044F", en: "Version" },
    paths: { ru: "\u041F\u0443\u0442\u0438 \u043A \u0440\u0435\u0441\u0443\u0440\u0441\u0430\u043C", en: "Resource paths" },
    resPath: { ru: "\u041F\u0430\u043F\u043A\u0430 \u043C\u043E\u0434\u0435\u043B\u044C\u043A\u0438", en: "Model folder" },
    weapPath: { ru: "\u041F\u0430\u043F\u043A\u0430 \u043E\u0440\u0443\u0436\u0438\u044F", en: "Weapons folder" },
    browse: { ru: "\u0412\u044B\u0431\u0440\u0430\u0442\u044C...", en: "Browse..." },
    blood: { ru: "\u041A\u0440\u043E\u0432\u044C \u043C\u043E\u0434\u0435\u043B\u0438", en: "Model blood" },
    bloodOn: { ru: "\u0421\u0432\u043E\u044F \u043A\u0440\u043E\u0432\u044C", en: "Custom blood" },
    bloodKind: { ru: "\u041F\u043E\u0432\u0435\u0434\u0435\u043D\u0438\u0435", en: "Behavior" },
    bloodNormal: { ru: "\u041E\u0431\u044B\u0447\u043D\u0430\u044F", en: "Normal" },
    bloodSparks: { ru: "\u0418\u0441\u043A\u0440\u044B", en: "Sparks" },
    bloodCombine: { ru: "\u041E\u0431\u0430", en: "Combine" },
    weapons: { ru: "\u041E\u0440\u0443\u0436\u0438\u0435", en: "Weapons" },
    weapV2: {
      ru: "\u0421\u0442\u0430\u043D\u0434\u0430\u0440\u0442\u043D\u043E\u0435 \u043E\u0440\u0443\u0436\u0438\u0435 v2 (guns2) \u2014 \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0443\u0435\u0442\u0441\u044F, \u0432\u044B\u0433\u043B\u044F\u0434\u0438\u0442 \u043B\u0443\u0447\u0448\u0435",
      en: "Standard weapons v2 (guns2) \u2014 recommended, looks better"
    },
    weapV1: {
      ru: "\u0421\u0442\u0430\u043D\u0434\u0430\u0440\u0442\u043D\u043E\u0435 \u043E\u0440\u0443\u0436\u0438\u0435 v1 (guns1) \u2014 \u0441\u043F\u0440\u0430\u0439\u0442\u044B WEAPONS_OLD, \u043A\u043B\u0438\u0435\u043D\u0442\u044B < 0.667",
      en: "Standard weapons v1 (guns1) \u2014 WEAPONS_OLD sprites, clients < 0.667"
    },
    weapBuiltin: {
      ru: "\u0412\u0441\u0442\u0440\u043E\u0435\u043D\u043D\u043E\u0435 \u043E\u0440\u0443\u0436\u0438\u0435 \u2014 \u043E\u0432\u0435\u0440\u043B\u0435\u0439 \u043D\u0435 \u0440\u0438\u0441\u0443\u0435\u0442\u0441\u044F, \u0441\u043F\u0440\u0430\u0439\u0442\u044B \u0443\u0436\u0435 \u0441 \u043E\u0440\u0443\u0436\u0438\u0435\u043C",
      en: "Built-in weapons \u2014 no overlay, sprites already include guns"
    },
    weapNone: { ru: "\u0411\u0435\u0437 \u043D\u0430\u043B\u043E\u0436\u0435\u043D\u0438\u044F \u043E\u0440\u0443\u0436\u0438\u044F", en: "No weapon overlay" },
    meleeFx: { ru: "\u041D\u0430\u043A\u043B\u0430\u0434\u044B\u0432\u0430\u0442\u044C \u044D\u0444\u0444\u0435\u043A\u0442 \u0443\u0434\u0430\u0440\u0430 \u043A\u0443\u043B\u0430\u043A\u043E\u043C", en: "Overlay melee hit effect" },
    preview: { ru: "\u041F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440", en: "Preview" },
    dcolor: { ru: "\u041C\u0430\u0441\u043A\u0430", en: "Mask" },
    pcolor: { ru: "\u0426\u0432\u0435\u0442 \u0438\u0433\u0440\u043E\u043A\u0430", en: "Player color" },
    play: { ru: "\u0418\u0433\u0440\u0430\u0442\u044C", en: "Play" },
    hitbox: { ru: "\u0425\u0438\u0442\u0431\u043E\u043A\u0441", en: "Hitbox" },
    flag: { ru: "\u0424\u043B\u0430\u0433", en: "Flag" },
    fire: { ru: "\u041E\u0433\u043E\u043D\u044C", en: "Fire" },
    faceLeft: { ru: "\u0412\u043B\u0435\u0432\u043E", en: "Face left" },
    animList: { ru: "\u041A\u0430\u0434\u0440\u044B", en: "Frames" },
    weapList: { ru: "\u041E\u0440\u0443\u0436\u0438\u0435", en: "Weapon" },
    waitcount: { ru: "waitcount", en: "waitcount" },
    frames: { ru: "\u041A\u0430\u0434\u0440\u044B", en: "Frames" },
    backanim: { ru: "\u0422\u0443\u0434\u0430-\u043E\u0431\u0440\u0430\u0442\u043D\u043E", en: "Ping-pong" },
    wx: { ru: "\u041E\u0440\u0443\u0436\u0438\u0435 X", en: "Weapon X" },
    wy: { ru: "\u041E\u0440\u0443\u0436\u0438\u0435 Y", en: "Weapon Y" },
    fx: { ru: "\u0424\u043B\u0430\u0433 X", en: "Flag X" },
    fy: { ru: "\u0424\u043B\u0430\u0433 Y", en: "Flag Y" },
    fangle: { ru: "\u0423\u0433\u043E\u043B \u0444\u043B\u0430\u0433\u0430", en: "Flag angle" },
    prev: { ru: "<<", en: "<<" },
    next: { ru: ">>", en: ">>" },
    stop: { ru: "\u0421\u0442\u043E\u043F", en: "Stop" },
    hintAnim: {
      ru: "WASD \u0434\u0432\u0438\u0433\u0430\u0435\u0442 \u043E\u0440\u0443\u0436\u0438\u0435. Enter / Backspace \u2014 \u043A\u0430\u0434\u0440\u044B, \u043F\u043E\u0441\u043B\u0435 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0435\u0433\u043E \u043A\u0430\u0434\u0440\u0430 \u043E\u0440\u0443\u0436\u0438\u044F \u2014 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u0435 \u043E\u0440\u0443\u0436\u0438\u0435.",
      en: "WASD moves the weapon. Enter / Backspace step frames, then the next weapon after the last frame."
    },
    stdAnim: { ru: "\u041E\u0441\u043D\u043E\u0432\u043D\u044B\u0435 \u0430\u043D\u0438\u043C\u0430\u0446\u0438\u0438", en: "Standard animations" },
    extAnim: { ru: "\u0414\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u0430\u043D\u0438\u043C\u0430\u0446\u0438\u0438", en: "Extended animations" },
    sounds: { ru: "\u0417\u0432\u0443\u043A\u0438", en: "Sounds" },
    mask: { ru: "MASK", en: "MASK" },
    hintRes: {
      ru: "\u0417\u0435\u043B\u0451\u043D\u044B\u0439 \u2014 \u0444\u0430\u0439\u043B \u043D\u0430\u0439\u0434\u0435\u043D. \u0416\u0451\u043B\u0442\u044B\u0439 \u2014 \u043D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u0435\u0442. \u041A\u0440\u0430\u0441\u043D\u044B\u0439 \u2014 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u0435\u0442. \u041A\u043B\u0438\u043A \u2014 \u043F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440, \u0434\u0432\u043E\u0439\u043D\u043E\u0439 \u043A\u043B\u0438\u043A \u2014 \u0437\u0430\u043C\u0435\u043D\u0438\u0442\u044C \u0444\u0430\u0439\u043B.",
      en: "Green \u2014 found. Yellow \u2014 optional missing. Red \u2014 required missing. Click to preview, double-click to replace."
    },
    slop: { ru: "\u0420\u0430\u0437\u0440\u044B\u0432 (slop)", en: "Gib burst (slop)" },
    slop0: { ru: "\u041D\u0435\u0442", en: "None" },
    slop1: { ru: "\u0422\u043E\u043B\u044C\u043A\u043E slop", en: "Slop only" },
    slop2: { ru: "Slop + \u0441\u043C\u0435\u0440\u0442\u044C", en: "Slop + death" },
    ready: { ru: "\u0413\u043E\u0442\u043E\u0432\u043E.", en: "Ready." },
    loadedFolder: { ru: "\u041E\u0442\u043A\u0440\u044B\u0442\u0430 \u043F\u0430\u043F\u043A\u0430 \u043C\u043E\u0434\u0435\u043B\u044C\u043A\u0438.", en: "Opened model folder." },
    loadedWad: { ru: "WAD \u0440\u0430\u0441\u043F\u0430\u043A\u043E\u0432\u0430\u043D.", en: "WAD unpacked." },
    savedTxt: { ru: "MODEL.txt \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D.", en: "MODEL.txt saved." },
    savedWad: { ru: "DFWAD \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D.", en: "DFWAD saved." },
    newModel: { ru: "\u041D\u043E\u0432\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C\u043A\u0430.", en: "New model." },
    needName: { ru: "\u0423 \u043C\u043E\u0434\u0435\u043B\u0438 \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u0438\u043C\u044F.", en: "The model needs a name." },
    badWad: { ru: "\u042D\u0442\u043E \u043D\u0435 DFWAD \u0438\u043B\u0438 \u043D\u0435\u0442 TEXT/MODEL.", en: "Not a DFWAD, or TEXT/MODEL is missing." },
    demo: { ru: "\u0414\u0435\u043C\u043E-\u043C\u043E\u0434\u0435\u043B\u044C\u043A\u0430", en: "Demo model" },
    zoom: { ru: "\u041C\u0430\u0441\u0448\u0442\u0430\u0431", en: "Zoom" },
    alignWeaps: { ru: "\u0412\u044B\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u0432\u0441\u0435 \u0441\u0442\u0432\u043E\u043B\u044B \u043F\u043E \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u043C\u0443", en: "Align all guns to selected" },
    alignWeapsDone: { ru: "\u0412\u0441\u0435 \u0441\u0442\u0432\u043E\u043B\u044B \u0432\u044B\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u044B \u043F\u043E \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u043C\u0443.", en: "All guns aligned to the selected one." },
    fileHint: {
      ru: "\u041E\u0442\u043A\u0440\u043E\u0439 \u043F\u0430\u043F\u043A\u0443 \u0447\u0435\u0440\u0435\u0437 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0439 \u0441\u0435\u0440\u0432\u0435\u0440 (python3 -m http.server), \u0438\u043D\u0430\u0447\u0435 \u0431\u0440\u0430\u0443\u0437\u0435\u0440 \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442 \u043C\u043E\u0434\u0435\u043B\u044C\u043A\u0443 \u0441 \u0434\u0438\u0441\u043A\u0430.",
      en: "Serve this folder over HTTP (python3 -m http.server). Browsers block loading the model from file://."
    }
  };
  var animRu = {
    StandAnim: "\u0421\u0442\u043E\u0438\u0442",
    WalkAnim: "\u0425\u043E\u0434\u044C\u0431\u0430",
    Die1Anim: "\u0421\u043C\u0435\u0440\u0442\u044C 1",
    Die2Anim: "\u0421\u043C\u0435\u0440\u0442\u044C 2",
    AttackAnim: "\u0410\u0442\u0430\u043A\u0430",
    SeeUpAnim: "\u0421\u043C\u043E\u0442\u0440\u0438\u0442 \u0432\u0432\u0435\u0440\u0445",
    SeeDownAnim: "\u0421\u043C\u043E\u0442\u0440\u0438\u0442 \u0432\u043D\u0438\u0437",
    AttackUpAnim: "\u0410\u0442\u0430\u043A\u0430 \u0432\u0432\u0435\u0440\u0445",
    AttackDownAnim: "\u0410\u0442\u0430\u043A\u0430 \u0432\u043D\u0438\u0437",
    PainAnim: "\u0411\u043E\u043B\u044C",
    WalkAttackAnim: "\u0425\u043E\u0434\u044C\u0431\u0430 + \u0430\u0442\u0430\u043A\u0430",
    WalkSeeUpAnim: "\u0425\u043E\u0434\u044C\u0431\u0430 \u0432\u0432\u0435\u0440\u0445",
    WalkSeeDownAnim: "\u0425\u043E\u0434\u044C\u0431\u0430 \u0432\u043D\u0438\u0437",
    WalkAttackUpAnim: "\u0425\u043E\u0434\u044C\u0431\u0430 + \u0430\u0442\u0430\u043A\u0430 \u0432\u0432\u0435\u0440\u0445",
    WalkAttackDownAnim: "\u0425\u043E\u0434\u044C\u0431\u0430 + \u0430\u0442\u0430\u043A\u0430 \u0432\u043D\u0438\u0437",
    MeleeStandAnim: "\u041A\u0443\u043B\u0430\u043A\u0438, \u0441\u0442\u043E\u0438\u0442",
    MeleeWalkAnim: "\u041A\u0443\u043B\u0430\u043A\u0438, \u0445\u043E\u0434\u044C\u0431\u0430",
    MeleeAttackAnim: "\u0423\u0434\u0430\u0440 \u043A\u0443\u043B\u0430\u043A\u043E\u043C",
    MeleeWalkAttackAnim: "\u0425\u043E\u0434\u044C\u0431\u0430 + \u0443\u0434\u0430\u0440",
    MeleeSeeUpAnim: "\u041A\u0443\u043B\u0430\u043A\u0438 \u0432\u0432\u0435\u0440\u0445",
    MeleeSeeDownAnim: "\u041A\u0443\u043B\u0430\u043A\u0438 \u0432\u043D\u0438\u0437",
    MeleeAttackUpAnim: "\u0423\u0434\u0430\u0440 \u0432\u0432\u0435\u0440\u0445",
    MeleeAttackDownAnim: "\u0423\u0434\u0430\u0440 \u0432\u043D\u0438\u0437"
  };
  var animEn = {
    StandAnim: "Stand",
    WalkAnim: "Walk",
    Die1Anim: "Die 1",
    Die2Anim: "Die 2",
    AttackAnim: "Attack",
    SeeUpAnim: "Look up",
    SeeDownAnim: "Look down",
    AttackUpAnim: "Attack up",
    AttackDownAnim: "Attack down",
    PainAnim: "Pain",
    WalkAttackAnim: "Walk + attack",
    WalkSeeUpAnim: "Walk look up",
    WalkSeeDownAnim: "Walk look down",
    WalkAttackUpAnim: "Walk attack up",
    WalkAttackDownAnim: "Walk attack down",
    MeleeStandAnim: "Fist stand",
    MeleeWalkAnim: "Fist walk",
    MeleeAttackAnim: "Fist attack",
    MeleeWalkAttackAnim: "Fist walk attack",
    MeleeSeeUpAnim: "Fist look up",
    MeleeSeeDownAnim: "Fist look down",
    MeleeAttackUpAnim: "Fist attack up",
    MeleeAttackDownAnim: "Fist attack down"
  };
  var weapRu = {
    csaw: "\u0411\u0435\u043D\u0437\u043E\u043F\u0438\u043B\u0430",
    hgun: "\u041F\u0438\u0441\u0442\u043E\u043B\u0435\u0442",
    sg: "\u0414\u0440\u043E\u0431\u043E\u0432\u0438\u043A",
    ssg: "\u0414\u0432\u0443\u0441\u0442\u0432\u043E\u043B\u043A\u0430",
    mgun: "\u041F\u0443\u043B\u0435\u043C\u0451\u0442",
    rkt: "\u0420\u043E\u043A\u0435\u0442\u043B\u0430\u0443\u043D\u0447\u0435\u0440",
    plz: "\u041F\u043B\u0430\u0437\u043C\u0430\u0433\u0430\u043D",
    bfg: "BFG-9000",
    spl: "\u0421\u0443\u043F\u0435\u0440\u043F\u0443\u043B\u0435\u043C\u0451\u0442",
    flm: "\u041E\u0433\u043D\u0435\u043C\u0451\u0442"
  };
  var weapEn = {
    csaw: "Chainsaw",
    hgun: "Pistol",
    sg: "Shotgun",
    ssg: "Super shotgun",
    mgun: "Chaingun",
    rkt: "Rocket launcher",
    plz: "Plasma rifle",
    bfg: "BFG-9000",
    spl: "Super chaingun",
    flm: "Flamethrower"
  };
  function t(lang, key) {
    return dict[key][lang];
  }
  function animLabel(lang, section) {
    return (lang === "ru" ? animRu : animEn)[section] ?? section;
  }
  function weapLabel(lang, key) {
    return (lang === "ru" ? weapRu : weapEn)[key] ?? key;
  }

  // src/gfx.ts
  function makeCanvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }
  function putPixel(data, x, y, c) {
    if (x < 0 || y < 0 || x >= data.width || y >= data.height) return;
    const i = (y * data.width + x) * 4;
    data.data[i] = c[0];
    data.data[i + 1] = c[1];
    data.data[i + 2] = c[2];
    data.data[i + 3] = c[3];
  }
  function rect(data, x, y, w, h, c) {
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) putPixel(data, x + xx, y + yy, c);
  }
  function canvasFromData(data) {
    const c = makeCanvas(data.width, data.height);
    c.getContext("2d").putImageData(data, 0, 0);
    return c;
  }
  var SKIN = [224, 176, 144, 255];
  var ARMOR = [48, 118, 48, 255];
  var ARMOR2 = [32, 86, 32, 255];
  var HELMET = [56, 140, 56, 255];
  var VISOR = [220, 36, 36, 255];
  var BOOT = [40, 36, 32, 255];
  var BELT = [90, 70, 40, 255];
  var OUT = [16, 16, 16, 255];
  var WHITE = [255, 255, 255, 255];
  function drawMarineFrame(kind, frame, frames) {
    const data = new ImageData(FRAME, FRAME);
    const walk = kind.includes("WALK") || kind === "WALK";
    const lookUp = kind.includes("UP") || kind.includes("SEEUP");
    const lookDown = kind.includes("DOWN") || kind.includes("SEEDOWN");
    const attack = kind.includes("ATTACK");
    const die = kind.includes("DIE");
    const pain = kind === "PAIN";
    const fist = kind.includes("FIST") || kind.includes("MELEE");
    const phase = frames > 1 ? frame / frames : 0;
    const leg = walk ? Math.round(Math.sin(phase * Math.PI * 2) * 3) : 0;
    const bob = walk ? Math.round(Math.abs(Math.sin(phase * Math.PI * 2)) * 1) : 0;
    if (die) {
      const drop = 10 + frame * 4;
      body(data, 8, 28 + Math.min(drop, 18), 0, true, lookUp, lookDown);
      return canvasFromData(data);
    }
    const y = 8 - bob + (pain ? 2 : 0);
    body(data, 18, y, leg, false, lookUp, lookDown);
    if (fist) punch(data, 18, y, attack, frame);
    else emptyArm(data, 18, y, lookUp, lookDown);
    return canvasFromData(data);
  }
  function body(data, x, y, leg, fallen, lookUp, lookDown) {
    const headY = fallen ? y + 10 : y + (lookUp ? -2 : lookDown ? 3 : 0);
    rect(data, x + 6, y + 16, 16, 20, ARMOR);
    rect(data, x + 8, y + 18, 12, 16, ARMOR2);
    rect(data, x + 7, y + 34, 14, 3, BELT);
    rect(data, x + 7, y + 37, 5, 12 + leg, BOOT);
    rect(data, x + 16, y + 37, 5, 12 - leg, BOOT);
    rect(data, x + 8, headY + 2, 12, 12, HELMET);
    rect(data, x + 10, headY + 6, 9, 5, VISOR);
    rect(data, x + 7, headY + 1, 14, 2, OUT);
    rect(data, x + 20, headY + 4, 3, 4, SKIN);
  }
  function emptyArm(data, x, y, lookUp, lookDown) {
    const ay = y + 20 + (lookUp ? -6 : lookDown ? 6 : 0);
    rect(data, x + 20, ay, 7, 4, SKIN);
  }
  function punch(data, x, y, attack, frame) {
    const reach = attack ? 10 + frame % 2 * 4 : 2;
    rect(data, x + 20, y + 22, reach, 4, SKIN);
    rect(data, x + 20 + reach, y + 20, 5, 7, SKIN);
  }
  function drawMarineMask(kind, frame, frames) {
    const src = drawMarineFrame(kind, frame, frames);
    const ctx = src.getContext("2d");
    const data = ctx.getImageData(0, 0, FRAME, FRAME);
    for (let i = 0; i < data.data.length; i += 4) {
      const r = data.data[i];
      const g = data.data[i + 1];
      const b = data.data[i + 2];
      const visor = r > 180 && g < 80 && b < 80;
      const armor = g > r + 20 && g > 70 && b < 80;
      if (visor || armor) {
        data.data[i] = 255;
        data.data[i + 1] = 255;
        data.data[i + 2] = 255;
      } else {
        data.data[i + 3] = 0;
      }
    }
    ctx.putImageData(data, 0, 0);
    return src;
  }
  function stitchStrip(frames, frameSize) {
    const strip = makeCanvas(frameSize * frames.length, frameSize);
    const ctx = strip.getContext("2d");
    frames.forEach((f, i) => ctx.drawImage(f, i * frameSize, 0));
    return strip;
  }
  function drawGibs() {
    const count = 6;
    const image = makeCanvas(GIB_FRAME * count, GIB_FRAME);
    const mask = makeCanvas(GIB_FRAME * count, GIB_FRAME);
    const ic = image.getContext("2d");
    const mc = mask.getContext("2d");
    for (let i = 0; i < count; i++) {
      const data = new ImageData(GIB_FRAME, GIB_FRAME);
      const mdata = new ImageData(GIB_FRAME, GIB_FRAME);
      const ox = 8 + i % 3 * 2;
      const oy = 8 + i * 3 % 5;
      rect(data, ox, oy, 12, 10, ARMOR);
      rect(data, ox + 2, oy + 2, 6, 5, [150, 0, 0, 255]);
      rect(mdata, ox, oy, 12, 10, WHITE);
      ic.putImageData(data, i * GIB_FRAME, 0);
      mc.putImageData(mdata, i * GIB_FRAME, 0);
    }
    return { image, mask, count };
  }
  function drawWeapon(key, pose, fire) {
    const c = makeCanvas(32, 24);
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    const tilt = pose === "up" ? -0.45 : pose === "down" ? 0.4 : 0;
    ctx.translate(4, 8);
    ctx.rotate(tilt);
    ctx.fillStyle = "#3a3a3a";
    if (key === "csaw") {
      ctx.fillStyle = "#6a2";
      ctx.fillRect(0, 2, 22, 7);
      ctx.fillStyle = "#333";
      ctx.fillRect(14, 0, 12, 10);
    } else if (key === "sg" || key === "ssg") {
      ctx.fillRect(0, 3, 24, 4);
      ctx.fillRect(3, 6, 6, 6);
      if (key === "ssg") ctx.fillRect(0, 0, 22, 3);
    } else if (key === "mgun" || key === "spl") {
      ctx.fillRect(0, 2, 22, 5);
      ctx.fillRect(6, 7, 8, 5);
      ctx.fillStyle = "#222";
      ctx.fillRect(16, 1, 10, 2);
    } else if (key === "rkt") {
      ctx.fillStyle = "#4a4a32";
      ctx.fillRect(0, 0, 20, 10);
      ctx.fillStyle = "#222";
      ctx.fillRect(16, 2, 8, 6);
    } else if (key === "plz" || key === "flm" || key === "bfg") {
      ctx.fillStyle = key === "bfg" ? "#2a5a2a" : key === "flm" ? "#6a3a20" : "#2a4a6a";
      ctx.fillRect(0, 1, 20, 8);
      ctx.fillRect(14, 3, 10, 5);
    } else {
      ctx.fillRect(0, 3, 14, 4);
      ctx.fillRect(2, 6, 4, 5);
    }
    if (fire) {
      ctx.fillStyle = "#ffd24a";
      ctx.fillRect(22, 2, 6, 5);
    }
    return c;
  }
  function drawFlag() {
    const c = makeCanvas(32, 32);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#c00";
    ctx.fillRect(10, 2, 18, 12);
    ctx.fillStyle = "#333";
    ctx.fillRect(8, 2, 2, 26);
    return c;
  }
  function sliceStrip(image, frameSize) {
    const frames = [];
    const count = Math.max(1, Math.floor(image.width / frameSize));
    for (let i = 0; i < count; i++) {
      const f = makeCanvas(frameSize, image.height);
      f.getContext("2d").drawImage(image, i * frameSize, 0, frameSize, image.height, 0, 0, frameSize, image.height);
      frames.push(f);
    }
    return frames;
  }
  function tintMask(mask, color, w, h) {
    const c = makeCanvas(w, h);
    const ctx = c.getContext("2d");
    ctx.drawImage(mask, 0, 0, w, h);
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`;
    ctx.fillRect(0, 0, w, h);
    return c;
  }
  async function loadImage(blob) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const { decodeTga: decodeTga2, isTga: isTga2 } = await Promise.resolve().then(() => (init_tga(), tga_exports));
    if (isTga2(bytes)) return decodeTga2(bytes);
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("image"));
      };
      img.src = url;
    });
  }
  async function canvasToPng(canvas) {
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => b ? resolve(b) : reject(new Error("png")), "image/png");
    });
    return new Uint8Array(await blob.arrayBuffer());
  }
  function weaponDrawPoint(stored, weaponKey, guns2) {
    if (guns2) return stored;
    const base = { csaw: [8, 4], hgun: [8, 8], sg: [16, 16], ssg: [16, 24], mgun: [16, 16], rkt: [24, 24], plz: [16, 16], bfg: [24, 24], spl: [16, 16], flm: [8, 8] }[weaponKey] ?? [8, 8];
    return { x: stored.x - base[0], y: stored.y - base[1] };
  }

  // src/app.ts
  var IMAGE_EXT = /\.(png|gif|tga|bmp|jpg|jpeg)$/i;
  var SOUND_EXT = /\.(wav|ogg|mp3|flac)$/i;
  var BASE_REQUIRED = /* @__PURE__ */ new Set(["STAND", "WALK", "DIE1", "ATTACK"]);
  var Editor = class {
    lang = "ru";
    model = createEmptyModel();
    assets = /* @__PURE__ */ new Map();
    weaponPacks = { v1: /* @__PURE__ */ new Map(), v2: /* @__PURE__ */ new Map() };
    folderLabel = "";
    weaponFolderLabel = "";
    currentAnim = "StandAnim";
    currentWeap = "hgun";
    playFrame = 0;
    playing = false;
    zoom = 4;
    assignTarget = null;
    lastTick = 0;
    waitAcc = 0;
    constructor() {
      this.bind();
      this.applyLang();
      requestAnimationFrame((t2) => this.loop(t2));
      try {
        this.syncForm();
      } catch (err2) {
        console.error(err2);
      }
      void this.loadOfficial();
    }
    $(id) {
      const el = document.getElementById(id);
      if (!el) throw new Error(id);
      return el;
    }
    input(id) {
      return this.$(id);
    }
    bind() {
      document.querySelectorAll(".tab").forEach((tab) => {
        tab.addEventListener("click", () => this.showTab(tab.dataset.tab ?? "model"));
      });
      this.$("btnLang").addEventListener("click", () => {
        this.lang = this.lang === "ru" ? "en" : "ru";
        this.applyLang();
        this.fillLists();
        this.syncForm();
        this.renderResources();
      });
      this.$("btnNew").addEventListener("click", () => {
        this.model = createEmptyModel();
        this.assets.clear();
        this.folderLabel = "";
        this.status("newModel");
        void this.loadDemo(false);
      });
      this.$("btnDemo").addEventListener("click", () => void this.loadOfficial());
      this.$("btnOpen").addEventListener("click", () => this.input("pickFolder").click());
      this.$("btnResPath").addEventListener("click", () => this.input("pickFolder").click());
      this.$("btnWeapPath").addEventListener("click", () => this.input("pickFolder").click());
      this.$("btnOpenWad").addEventListener("click", () => this.input("pickWad").click());
      this.$("btnSaveTxt").addEventListener("click", () => this.saveTxt());
      this.$("btnSaveWad").addEventListener("click", () => void this.saveWad());
      this.input("pickFolder").addEventListener("change", (e) => void this.openFolder(e));
      this.input("pickWad").addEventListener("change", (e) => void this.openWad(e));
      this.input("pickFile").addEventListener("change", (e) => void this.assignPicked(e));
      for (const [id, key] of [
        ["fldName", "name"],
        ["fldAuthor", "author"],
        ["fldVersion", "version"]
      ]) {
        this.input(id).addEventListener("input", () => {
          this.model[key] = this.input(id).value;
        });
      }
      this.$("fldDesc").addEventListener("input", () => {
        this.model.description = this.$("fldDesc").value;
      });
      this.input("fldBlood").addEventListener("input", () => {
        const { r, g, b } = hexRgb(this.input("fldBlood").value);
        this.model.blood = { ...this.model.blood, r, g, b };
      });
      this.input("fldBloodKind").addEventListener("change", () => {
        this.model.blood.kind = this.input("fldBloodKind").value;
      });
      document.querySelectorAll('input[name="weapMode"]').forEach((el) => {
        el.addEventListener("change", () => {
          if (!el.checked) return;
          this.model.weaponMode = el.value;
          this.applyWeaponPack();
        });
      });
      this.input("fldMelee").addEventListener("change", () => {
        this.model.overlayMelee = this.input("fldMelee").checked;
      });
      this.input("fldSlop").addEventListener("change", () => {
        this.model.slop = Number(this.input("fldSlop").value);
      });
      this.bindListPointer("lstAnim", (value) => {
        this.applyFrameKey(value);
        this.syncAnimFields();
      });
      this.bindListPointer("lstWeap", (value) => {
        this.currentWeap = value;
        this.syncAnimFields();
        this.fillLists();
      });
      this.input("fldWait").addEventListener("input", () => {
        this.anim().waitcount = Math.max(1, Number(this.input("fldWait").value) || 1);
      });
      this.input("fldFrames").addEventListener("input", () => {
        const n = Math.max(1, Number(this.input("fldFrames").value) || 1);
        this.anim().frames = n;
        this.ensureWeaponPoints();
        if (this.playFrame >= n) this.playFrame = n - 1;
        this.fillLists();
      });
      this.input("fldBack").addEventListener("change", () => {
        this.anim().backanim = this.input("fldBack").checked;
      });
      this.input("fldWX").addEventListener("input", () => this.setCurrentPoint("x", Number(this.input("fldWX").value)));
      this.input("fldWY").addEventListener("input", () => this.setCurrentPoint("y", Number(this.input("fldWY").value)));
      this.input("fldFX").addEventListener("input", () => {
        this.model.flagPoint.x = Number(this.input("fldFX").value) || 0;
      });
      this.input("fldFY").addEventListener("input", () => {
        this.model.flagPoint.y = Number(this.input("fldFY").value) || 0;
      });
      this.input("fldFA").addEventListener("input", () => {
        this.model.flagAngle = Number(this.input("fldFA").value) || 0;
      });
      this.input("fldZoom").addEventListener("input", () => {
        this.zoom = Number(this.input("fldZoom").value) || 4;
      });
      this.$("btnAlignWeaps").addEventListener("click", () => {
        this.alignWeaponsFromSelected();
        this.focusPreview();
      });
      this.$("btnPrev").addEventListener("click", () => {
        this.stepGlobal(-1);
        this.focusPreview();
      });
      this.$("btnNext").addEventListener("click", () => {
        this.stepGlobal(1);
        this.focusPreview();
      });
      this.$("btnPlay").addEventListener("click", () => {
        this.playing = true;
        this.focusPreview();
      });
      this.$("btnStop").addEventListener("click", () => {
        this.playing = false;
        this.focusPreview();
      });
      this.$("page-anim").addEventListener("click", (e) => {
        if (isTyping(e.target)) return;
        if (e.target.closest("select")) return;
        this.focusPreview();
      });
      const stage = this.$("stage");
      stage.addEventListener("pointerdown", (e) => this.onStage(e, true));
      stage.addEventListener("pointermove", (e) => {
        if (e.buttons) this.onStage(e, false);
      });
      window.addEventListener("keydown", (e) => {
        if (isTyping(e.target)) return;
        if (e.code === "Space") {
          e.preventDefault();
          this.playing = !this.playing;
        }
        if (e.code === "Enter") {
          e.preventDefault();
          this.stepGlobal(1);
        }
        if (e.code === "Backspace") {
          e.preventDefault();
          this.stepGlobal(-1);
        }
        const move = {
          KeyA: { x: -1, y: 0 },
          KeyD: { x: 1, y: 0 },
          KeyW: { x: 0, y: -1 },
          KeyS: { x: 0, y: 1 }
        };
        const delta = move[e.code];
        if (delta) {
          e.preventDefault();
          const p = this.currentPoint();
          p.x += delta.x;
          p.y += delta.y;
          this.syncAnimFields();
        }
      });
    }
    showTab(id) {
      document.querySelectorAll(".tab").forEach((t2) => t2.classList.toggle("active", t2.dataset.tab === id));
      document.querySelectorAll(".page").forEach((p) => p.classList.toggle("active", p.id === `page-${id}`));
      if (id === "res") this.renderResources();
      if (id === "anim") queueMicrotask(() => this.focusPreview());
    }
    focusPreview() {
      const stage = this.$("stage");
      stage.tabIndex = 0;
      stage.focus({ preventScroll: true });
    }
    bindListPointer(id, onPick) {
      const list = this.$(id);
      list.tabIndex = -1;
      const steal = () => this.focusPreview();
      list.addEventListener("mousedown", (e) => {
        const rect2 = list.getBoundingClientRect();
        const onBar = e.clientX > rect2.right - 18;
        if (!onBar) e.preventDefault();
        const opt = optionAtPointer(list, e);
        if (opt && list.value !== opt.value) {
          list.value = opt.value;
          onPick(opt.value);
        }
        steal();
      });
      list.addEventListener("mouseup", steal);
      list.addEventListener("click", steal);
      list.addEventListener("focus", steal);
      list.addEventListener("keydown", (e) => {
        e.preventDefault();
        steal();
      });
    }
    applyLang() {
      document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.dataset.i18n;
        if (key) el.textContent = t(this.lang, key);
      });
      document.title = t(this.lang, "title");
      this.status("ready");
    }
    fillLists() {
      const anim = this.$("lstAnim");
      const weap = this.$("lstWeap");
      const frames = this.flatFrames();
      anim.innerHTML = frames.map((f) => {
        const def = ANIM_DEFS.find((d) => d.section === f.section);
        const label = `${weapLabel(this.lang, f.weapon)} \xB7 ${animLabel(this.lang, f.section)} \u2014 ${def.resource} ${f.frame + 1}/${f.total}`;
        return `<option value="${f.weapon}:${f.section}:${f.frame}">${label}</option>`;
      }).join("");
      weap.innerHTML = WEAPON_DEFS.map((w) => `<option value="${w.key}">${weapLabel(this.lang, w.key)}</option>`).join("");
      anim.value = this.frameKey();
      weap.value = this.currentWeap;
      this.scrollFrameList();
    }
    poseAnims() {
      const order = [
        "StandAnim",
        "AttackAnim",
        "WalkAnim",
        "SeeUpAnim",
        "AttackUpAnim",
        "SeeDownAnim",
        "AttackDownAnim"
      ];
      return order.map((section) => ANIM_DEFS.find((d) => d.section === section)).filter((d) => Boolean(d) && !NO_WEAPON_ANIMS.has(d.section));
    }
    flatFrames() {
      const out = [];
      for (const weap of WEAPON_DEFS) {
        for (const def of this.poseAnims()) {
          const anim = this.model.anims[def.section];
          if (!anim) continue;
          const total = Math.max(1, anim.frames);
          for (let frame = 0; frame < total; frame++) {
            out.push({ weapon: weap.key, section: def.section, frame, total });
          }
        }
      }
      return out;
    }
    frameKey() {
      return `${this.currentWeap}:${this.currentAnim}:${logicalFrame(this.anim(), this.playFrame)}`;
    }
    applyFrameKey(key) {
      const [weapon, section, raw] = key.split(":");
      if (!section || !this.model.anims[section]) return;
      if (weapon) this.currentWeap = weapon;
      this.currentAnim = section;
      this.playFrame = Number(raw) || 0;
      this.playing = false;
      const weap = this.$("lstWeap");
      weap.value = this.currentWeap;
    }
    anim() {
      return this.model.anims[this.currentAnim];
    }
    ensureWeaponPoints() {
      const anim = this.anim();
      if (anim) this.ensureAnimWeaponPoints(anim);
    }
    currentPoint() {
      const anim = this.anim();
      if (!anim) return { x: 0, y: 0 };
      this.ensureWeaponPoints();
      const idx = logicalFrame(anim, this.playFrame);
      return anim.points[this.currentWeap]?.[idx] ?? { x: 0, y: 0 };
    }
    setCurrentPoint(axis, value) {
      const p = this.currentPoint();
      p[axis] = Number.isFinite(value) ? value : 0;
    }
    alignWeaponsFromSelected() {
      const from = this.currentWeap;
      const row = WEAPON_ALIGN[from];
      if (!row) return;
      for (const [section, anim] of Object.entries(this.model.anims)) {
        if (NO_WEAPON_ANIMS.has(section) || !anim) continue;
        this.ensureAnimWeaponPoints(anim);
        for (let i = 0; i < anim.frames; i++) {
          const src = anim.points[from]?.[i];
          if (!src) continue;
          for (const w of WEAPON_DEFS) {
            if (w.key === from) continue;
            const off = row[w.key];
            if (!off) continue;
            const dest = anim.points[w.key][i] ?? { x: 0, y: 0 };
            dest.x = src.x + off.x;
            dest.y = src.y + off.y;
            anim.points[w.key][i] = dest;
            const leftSrc = anim.pointsLeft[from]?.[i];
            if (leftSrc && anim.pointsLeft[w.key]) {
              const left = anim.pointsLeft[w.key][i] ?? { x: 0, y: 0 };
              left.x = leftSrc.x + off.x;
              left.y = leftSrc.y + off.y;
              anim.pointsLeft[w.key][i] = left;
            }
          }
        }
      }
      this.syncAnimFields();
      this.status("alignWeapsDone");
    }
    ensureAnimWeaponPoints(anim) {
      for (const w of WEAPON_DEFS) {
        const pts = anim.points[w.key] ?? [];
        while (pts.length < anim.frames) pts.push({ ...pts[pts.length - 1] ?? { x: 48, y: 40 } });
        anim.points[w.key] = pts;
      }
    }
    syncForm() {
      this.input("fldName").value = this.model.name;
      this.input("fldAuthor").value = this.model.author;
      this.$("fldDesc").value = this.model.description;
      this.input("fldVersion").value = this.model.version;
      this.input("fldResPath").value = this.folderLabel;
      this.input("fldWeapPath").value = this.weaponFolderLabel;
      this.input("fldBlood").value = rgbHex(this.model.blood);
      this.input("fldBloodKind").value = this.model.blood.kind;
      this.input("fldMelee").checked = this.model.overlayMelee;
      this.input("fldSlop").value = String(this.model.slop);
      document.querySelectorAll('input[name="weapMode"]').forEach((el) => {
        el.checked = el.value === this.model.weaponMode;
      });
      this.applyWeaponPack();
      this.syncAnimFields();
      this.fillLists();
      this.renderResources();
    }
    syncAnimFields() {
      const a = this.anim();
      this.input("fldWait").value = String(a.waitcount);
      this.input("fldFrames").value = String(a.frames);
      this.input("fldBack").checked = a.backanim;
      const p = this.currentPoint();
      this.input("fldWX").value = String(p.x);
      this.input("fldWY").value = String(p.y);
      this.input("fldFX").value = String(this.model.flagPoint.x);
      this.input("fldFY").value = String(this.model.flagPoint.y);
      this.input("fldFA").value = String(this.model.flagAngle);
      const all = this.flatFrames();
      const logical = logicalFrame(a, this.playFrame);
      const at = Math.max(0, all.findIndex((f) => f.weapon === this.currentWeap && f.section === this.currentAnim && f.frame === logical));
      this.$("frameLabel").textContent = `${at + 1} / ${all.length}`;
      const list = this.$("lstAnim");
      if (list.options.length && list.value !== this.frameKey()) list.value = this.frameKey();
      this.scrollFrameList();
    }
    scrollFrameList() {
      const list = this.$("lstAnim");
      const page = this.$("page-anim");
      if (!page.classList.contains("active")) return;
      const opt = list.selectedOptions[0];
      if (!opt) return;
      try {
        opt.scrollIntoView({ block: "nearest" });
      } catch {
      }
    }
    status(key) {
      const known = key in { ready: 1, loadedFolder: 1, loadedWad: 1, savedTxt: 1, savedWad: 1, newModel: 1, needName: 1, badWad: 1, alignWeapsDone: 1, fileHint: 1 };
      this.$("status").textContent = known ? t(this.lang, key) : key;
    }
    step(dir) {
      const total = playbackLength(this.anim());
      this.playFrame = (this.playFrame + dir + total) % total;
      this.syncAnimFields();
    }
    stepGlobal(dir) {
      const all = this.flatFrames();
      if (!all.length) return;
      const logical = logicalFrame(this.anim(), this.playFrame);
      const at = all.findIndex((f) => f.weapon === this.currentWeap && f.section === this.currentAnim && f.frame === logical);
      const next = all[(at < 0 ? 0 : at + dir + all.length) % all.length];
      this.currentWeap = next.weapon;
      this.currentAnim = next.section;
      this.playFrame = next.frame;
      this.playing = false;
      this.$("lstWeap").value = this.currentWeap;
      this.syncAnimFields();
    }
    onStage(e, down) {
      const canvas = this.$("stage");
      const rect2 = canvas.getBoundingClientRect();
      const scale = this.zoom;
      const ox = (canvas.width - FRAME * scale) / 2;
      const oy = (canvas.height - FRAME * scale) / 2;
      const x = Math.round((e.clientX - rect2.left - ox) * (canvas.width / rect2.width) / scale);
      const y = Math.round((e.clientY - rect2.top - oy) * (canvas.height / rect2.height) / scale);
      if (e.shiftKey || this.input("chkFlag").checked && down && e.altKey) {
        this.model.flagPoint = { x, y };
      } else if (e.shiftKey) {
        this.model.flagPoint = { x, y };
      } else {
        const p = this.currentPoint();
        p.x = x;
        p.y = y;
      }
      this.syncAnimFields();
    }
    loop(now) {
      const dt = now - this.lastTick;
      this.lastTick = now;
      if (this.playing) {
        this.waitAcc += dt;
        const waitMs = Math.max(16, this.anim().waitcount / 36 * 1e3);
        if (this.waitAcc >= waitMs) {
          this.waitAcc = 0;
          this.step(1);
        }
      }
      try {
        this.draw();
      } catch (err2) {
        console.error(err2);
      }
      requestAnimationFrame((t2) => this.loop(t2));
    }
    draw() {
      const canvas = this.$("stage");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#202820";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let y = 0; y < canvas.height; y += 8) {
        for (let x = 0; x < canvas.width; x += 8) {
          if ((x + y) / 8 % 2 === 0) {
            ctx.fillStyle = "#1a221a";
            ctx.fillRect(x, y, 8, 8);
          }
        }
      }
      const scale = this.zoom;
      const ox = Math.floor((canvas.width - FRAME * scale) / 2);
      const oy = Math.floor((canvas.height - FRAME * scale) / 2);
      const anim = this.anim();
      const def = ANIM_DEFS.find((d) => d.section === this.currentAnim);
      if (!anim || !def) return;
      const idx = logicalFrame(anim, this.playFrame);
      const left = this.input("chkLeft").checked;
      const sprite = this.frameImage(anim.resource, left ? anim.resource2 || anim.resource : anim.resource, idx, false);
      const maskName = left && anim.mask2 ? anim.mask2 : anim.mask;
      const mask = this.frameImage(anim.resource, maskName, idx, true);
      const pose = def.section.includes("Up") ? "up" : def.section.includes("Down") ? "down" : "norm";
      const fire = this.input("chkFire").checked || def.section.includes("Attack");
      const showWeap = this.model.weaponMode !== "none" && this.model.weaponMode !== "builtin" && !NO_WEAPON_ANIMS.has(def.section);
      if (this.input("chkFlag").checked && !NO_WEAPON_ANIMS.has(def.section)) {
        ctx.save();
        const fx = ox + this.model.flagPoint.x * scale;
        const fy = oy + this.model.flagPoint.y * scale;
        ctx.translate(fx, fy);
        ctx.rotate((left ? -this.model.flagAngle : this.model.flagAngle) * Math.PI / 180);
        ctx.drawImage(drawFlag(), -16 * scale / 2, -16 * scale / 2, 32 * scale / 2, 32 * scale / 2);
        ctx.restore();
      }
      if (showWeap) {
        const stored = this.currentPoint();
        const p = weaponDrawPoint(stored, this.currentWeap, this.model.weaponMode === "v2");
        const weap = this.weaponSprite(this.currentWeap, pose, fire);
        const ww = imageSize(weap);
        ctx.save();
        if (left) {
          ctx.translate(ox + FRAME * scale, oy);
          ctx.scale(-1, 1);
          ctx.drawImage(weap, p.x * scale, p.y * scale, ww.w * scale, ww.h * scale);
        } else {
          ctx.drawImage(weap, ox + p.x * scale, oy + p.y * scale, ww.w * scale, ww.h * scale);
        }
        ctx.restore();
      }
      ctx.save();
      if (left) {
        ctx.translate(ox + FRAME * scale, oy);
        ctx.scale(-1, 1);
        ctx.drawImage(sprite, 0, 0, FRAME * scale, FRAME * scale);
        if (this.input("chkMask").checked) {
          const tint = tintMask(mask, hexRgb(this.input("fldPlayerColor").value), FRAME, FRAME);
          ctx.drawImage(tint, 0, 0, FRAME * scale, FRAME * scale);
        }
      } else {
        ctx.drawImage(sprite, ox, oy, FRAME * scale, FRAME * scale);
        if (this.input("chkMask").checked) {
          const tint = tintMask(mask, hexRgb(this.input("fldPlayerColor").value), FRAME, FRAME);
          ctx.drawImage(tint, ox, oy, FRAME * scale, FRAME * scale);
        }
      }
      ctx.restore();
      if (this.model.overlayMelee && this.currentWeap === "csaw" && def.section.includes("Melee") && fire) {
        ctx.fillStyle = "rgba(255,220,80,.35)";
        ctx.fillRect(ox + 40 * scale, oy + 22 * scale, 14 * scale, 8 * scale);
      }
      if (this.input("chkHitbox").checked) {
        ctx.strokeStyle = "#39f";
        ctx.strokeRect(ox + PLAYER_RECT.x * scale, oy + PLAYER_RECT.y * scale, PLAYER_RECT.w * scale, PLAYER_RECT.h * scale);
        ctx.strokeStyle = "#f3c";
        ctx.strokeRect(ox + PLAYER_HEAD.x * scale, oy + PLAYER_HEAD.y * scale, PLAYER_HEAD.w * scale, PLAYER_HEAD.h * scale);
      }
      ctx.strokeStyle = "#f0c030";
      ctx.beginPath();
      ctx.arc(ox + this.currentPoint().x * scale, oy + this.currentPoint().y * scale, 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    applyWeaponPack() {
      if (this.model.weaponMode === "v2") this.weaponFolderLabel = "GameWAD/WEAPONS";
      else if (this.model.weaponMode === "v1") this.weaponFolderLabel = "GameWAD/WEAPONS_OLD";
      const path = document.getElementById("fldWeapPath");
      if (path) path.value = this.weaponFolderLabel;
    }
    weaponPack() {
      return this.model.weaponMode === "v1" ? this.weaponPacks.v1 : this.weaponPacks.v2;
    }
    weaponSprite(key, pose, fire) {
      const base = key.toUpperCase();
      const pos = pose === "up" ? "_UP" : pose === "down" ? "_DN" : "";
      const shot = fire ? "_FIRE" : "";
      const names = [`${base}${pos}${shot}`, `${base}${pos}`, `${base}${shot}`, base];
      const pack = this.weaponPack();
      for (const name of names) {
        const asset = pack.get(name) ?? this.assets.get(name);
        if (asset?.image) return asset.image;
      }
      return drawWeapon(key, pose, fire);
    }
    frameImage(fallbackRes, name, index, mask) {
      const asset = this.assets.get(name.toUpperCase()) ?? this.assets.get(fallbackRes.toUpperCase());
      if (asset?.image) {
        const frames = sliceStrip(asset.image, name.toUpperCase().includes("GIB") ? 32 : FRAME);
        return frames[Math.min(index, frames.length - 1)] ?? frames[0];
      }
      const def = findAnimByResource(fallbackRes);
      const kind = def?.resource ?? fallbackRes;
      return mask ? drawMarineMask(kind, index, this.anim().frames) : drawMarineFrame(kind, index, this.anim().frames);
    }
    async openFolder(e) {
      const input = e.target;
      const files = [...input.files ?? []];
      input.value = "";
      if (!files.length) return;
      this.folderLabel = files[0].webkitRelativePath.split("/")[0] ?? "";
      await this.ingestFiles(files);
      this.status("loadedFolder");
      this.syncForm();
    }
    async openWad(e) {
      const input = e.target;
      const file = input.files?.[0];
      input.value = "";
      if (!file) return;
      const bytes = new Uint8Array(await file.arrayBuffer());
      try {
        const lumps = parseDfwad(bytes);
        await this.ingestWad(lumps);
        this.folderLabel = file.name;
        this.status("loadedWad");
        this.syncForm();
      } catch {
        this.status("badWad");
      }
    }
    async ingestWad(lumps) {
      this.assets.clear();
      let modelTxt = "";
      for (const lump of lumps) {
        const dir = lump.dir.replace(/\\/g, "/").toUpperCase();
        const name = lump.name.replace(/\0/g, "").toUpperCase();
        if (dir.includes("TEXT") && name.replace(/\.[^.]+$/, "") === "MODEL") {
          modelTxt = new TextDecoder("windows-1251").decode(lump.data);
          continue;
        }
        const blob = new Blob([lump.data]);
        const asset = {
          name,
          blob,
          bytes: lump.data,
          kind: IMAGE_EXT.test(name) || dir.includes("TEXTURE") ? "image" : SOUND_EXT.test(name) || dir.includes("SOUND") ? "sound" : "other"
        };
        if (asset.kind === "image") {
          try {
            asset.image = await loadImage(new Blob([lump.data]));
          } catch {
          }
        }
        this.assets.set(stem(name), asset);
      }
      if (modelTxt) this.model = parseModelTxt(modelTxt);
      else throw new Error("no model");
    }
    async ingestFiles(files) {
      let modelFile;
      for (const file of files) {
        const base = stem(file.name);
        if (base === "MODEL" || file.name.toLowerCase() === "model.txt") {
          modelFile = file;
          continue;
        }
        const bytes = new Uint8Array(await file.arrayBuffer());
        const asset = {
          name: base,
          blob: file,
          bytes,
          kind: IMAGE_EXT.test(file.name) ? "image" : SOUND_EXT.test(file.name) ? "sound" : "other"
        };
        if (asset.kind === "image") {
          try {
            asset.image = await loadImage(file);
          } catch {
          }
        }
        this.assets.set(base, asset);
        this.autoBind(file, asset);
      }
      if (modelFile) this.model = parseModelTxt(await modelFile.text());
      else this.guessFromFiles();
    }
    autoBind(file, asset) {
      const matched = matchResourceName(stem(file.name));
      if (!matched) return;
      const def = findAnimByResource(matched.resource);
      if (def) {
        const anim = this.model.anims[def.section];
        if (matched.kind === "sprite") anim.resource = matched.resource;
        if (matched.kind === "mask") anim.mask = stem(file.name);
        if (matched.kind === "left") anim.resource2 = stem(file.name);
        if (matched.kind === "leftmask") anim.mask2 = stem(file.name);
        if (asset.image && matched.kind === "sprite") {
          anim.frames = Math.max(1, Math.floor(asset.image.width / FRAME));
        }
      }
      if (asset.kind === "sound") {
        const key = stem(file.name);
        if (key.startsWith("PAIN") || key === "MEGAPAIN") {
          const slot = this.model.pain.find((s) => s.key.toUpperCase() === key);
          if (slot) slot.key = key;
          else this.model.pain.push({ key, level: key === "MEGAPAIN" ? 4 : 1 });
        }
        if (key.startsWith("DIE") || key.startsWith("FALL")) {
          const slot = this.model.die.find((s) => s.key.toUpperCase() === key);
          if (slot) slot.key = key;
          else this.model.die.push({ key, level: key.startsWith("FALL") ? 4 : 1 });
        }
      }
    }
    guessFromFiles() {
      for (const def of ANIM_DEFS) {
        for (const alias of def.aliases) {
          if (this.assets.has(alias)) this.model.anims[def.section].resource = alias;
          if (this.assets.has(`${alias}MASK`)) this.model.anims[def.section].mask = `${alias}MASK`;
        }
      }
    }
    saveTxt() {
      if (!this.model.name.trim()) {
        this.status("needName");
        return;
      }
      download(`${this.model.name || "model"}.txt`, serializeModelTxt(this.model), "text/plain");
      this.status("savedTxt");
    }
    async saveWad() {
      if (!this.model.name.trim()) {
        this.status("needName");
        return;
      }
      const files = [
        { dir: "TEXT", name: "MODEL", data: new TextEncoder().encode(serializeModelTxt(this.model)) }
      ];
      const names = /* @__PURE__ */ new Set();
      for (const anim of Object.values(this.model.anims)) {
        for (const n of [anim.resource, anim.mask, anim.resource2, anim.mask2]) if (n) names.add(n.toUpperCase());
      }
      names.add(this.model.gibs.resource.toUpperCase());
      names.add(this.model.gibs.mask.toUpperCase());
      for (const name of names) {
        const asset = this.assets.get(name);
        if (!asset) continue;
        files.push({ dir: "TEXTURES", name, data: asset.bytes });
      }
      for (const slot of [...this.model.pain, ...this.model.die]) {
        const asset = this.assets.get(slot.key.toUpperCase());
        if (asset) files.push({ dir: "SOUNDS", name: slot.key.toUpperCase(), data: asset.bytes });
      }
      const wad = createDfwad(files);
      download(`${this.model.name || "model"}.wad`, wad, "application/octet-stream");
      this.status("savedWad");
    }
    renderResources() {
      this.$("resBase").innerHTML = ANIM_DEFS.filter((d) => d.group === "base").map((d) => this.resRow(d.section, d.resource, true)).join("");
      const extra = document.getElementById("resExtra");
      if (extra) extra.innerHTML = ANIM_DEFS.filter((d) => d.group === "extra").map((d) => this.resRow(d.section, d.resource, false)).join("");
      const sounds = [
        ...this.model.pain.map((s) => ({ key: s.key, extra: `pain ${s.level}` })),
        ...this.model.die.map((s) => ({ key: s.key, extra: `die ${s.level}` }))
      ];
      this.$("resSounds").innerHTML = sounds.map((s) => {
        const ok = this.assets.has(s.key.toUpperCase());
        return `<div class="res-row ${ok ? "ok" : "warn"}" data-sound="${s.key}">
        <span>${s.key}</span><span>${s.extra}</span>
        <button type="button" data-play="${s.key}">\u25B6</button>
      </div>`;
      }).join("");
      this.$("resBase").onclick = (e) => this.onResClick(e, true);
      if (extra) extra.onclick = (e) => this.onResClick(e, false);
      this.$("resSounds").onclick = (e) => {
        const t2 = e.target;
        const play = t2.dataset.play;
        if (play) {
          const asset = this.assets.get(play.toUpperCase());
          if (asset) new Audio(URL.createObjectURL(asset.blob)).play().catch(() => void 0);
          return;
        }
        const row = t2.closest("[data-sound]");
        if (row && e.detail === 2) this.pickAssign("sound", row.dataset.sound ?? "");
      };
    }
    resRow(section, resource, required) {
      const anim = this.model.anims[section];
      const spr = this.assets.has(anim.resource.toUpperCase());
      const mask = this.assets.has(anim.mask.toUpperCase());
      const need = required && BASE_REQUIRED.has(resource);
      const cls = spr ? "ok" : need ? "bad" : "warn";
      return `<div class="res-row ${cls}" data-anim="${section}">
      <span>${resource}</span>
      <span class="${mask ? "ok" : "warn"}">MASK</span>
      <span>${anim.frames}f</span>
    </div>`;
    }
    onResClick(e, _base) {
      const row = e.target.closest("[data-anim]");
      if (!row) return;
      const section = row.dataset.anim ?? "";
      this.currentAnim = section;
      this.playFrame = 0;
      const anim = this.model.anims[section];
      const asset = this.assets.get(anim.resource.toUpperCase());
      const box = this.$("resPreview");
      box.innerHTML = "";
      if (asset?.image) box.append(asset.image.cloneNode(true));
      else {
        const c = drawMarineFrame(anim.resource, 0, anim.frames);
        box.append(c);
      }
      if (e.detail === 2) this.pickAssign("sprite", section);
      this.fillLists();
    }
    pickAssign(type, key) {
      this.assignTarget = { type, key };
      this.input("pickFile").click();
    }
    async assignPicked(e) {
      const input = e.target;
      const file = input.files?.[0];
      input.value = "";
      if (!file || !this.assignTarget) return;
      const bytes = new Uint8Array(await file.arrayBuffer());
      const name = stem(file.name);
      const asset = {
        name,
        blob: file,
        bytes,
        kind: IMAGE_EXT.test(file.name) ? "image" : SOUND_EXT.test(file.name) ? "sound" : "other"
      };
      if (asset.kind === "image") {
        try {
          asset.image = await loadImage(file);
        } catch {
        }
      }
      this.assets.set(name, asset);
      if (this.assignTarget.type === "sprite") {
        this.model.anims[this.assignTarget.key].resource = name;
        if (asset.image) this.model.anims[this.assignTarget.key].frames = Math.max(1, Math.floor(asset.image.width / FRAME));
      } else if (this.assignTarget.type === "mask") {
        this.model.anims[this.assignTarget.key].mask = name;
      } else {
        const key = this.assignTarget.key;
        const pain = this.model.pain.find((s) => s.key === key);
        const die = this.model.die.find((s) => s.key === key);
        if (pain) pain.key = name;
        if (die) die.key = name;
      }
      this.assignTarget = null;
      this.syncForm();
    }
    async loadOfficial() {
      try {
        const txt = await fetchPublic("doomer/TEXT/MODEL.txt").then((r) => {
          if (!r.ok) throw new Error("model");
          return r.text();
        });
        this.model = parseModelTxt(txt);
        this.assets.clear();
        this.weaponPacks.v1.clear();
        this.weaponPacks.v2.clear();
        const textures = [
          "STAND.tga",
          "STANDMASK.tga",
          "WALK.tga",
          "WALKMASK.tga",
          "ATTACK.tga",
          "ATTACKMASK.tga",
          "ATTACKUP.tga",
          "ATTACKUPMASK.tga",
          "ATTACKDOWN.tga",
          "ATTACKDOWNMASK.tga",
          "SEEUP.tga",
          "SEEUPMASK.tga",
          "SEEDOWN.tga",
          "SEEDOWNMASK.tga",
          "PAIN.tga",
          "PAINMASK.tga",
          "DIE1.png",
          "DIE1MASK.png",
          "DIE2.png",
          "DIE2MASK.png",
          "GIBS.tga",
          "GIBSMASK.tga"
        ];
        const sounds = [
          "PAIN1.wav",
          "PAIN2.wav",
          "PAIN3.wav",
          "PAIN4.wav",
          "PAIN5.wav",
          "PAIN6.wav",
          "MEGAPAIN.wav",
          "DIE1.wav",
          "DIE2.wav",
          "DIE3.wav",
          "DIE4.wav",
          "DIE5.wav",
          "DIE6.wav",
          "FALL1.wav",
          "FALL2.wav"
        ];
        await Promise.all([
          ...textures.map((file) => this.fetchAsset(`doomer/TEXTURES/${file}`, "image")),
          ...sounds.map((file) => this.fetchAsset(`doomer/SOUNDS/${file}`, "sound")),
          ...weaponSpriteUrls("weapons").map((url) => this.fetchAsset(url, "image", this.weaponPacks.v2)),
          ...weaponSpriteUrls("weapons_old").map((url) => this.fetchAsset(url, "image", this.weaponPacks.v1))
        ]);
        this.folderLabel = "DoomerWAD";
        this.applyWeaponPack();
        this.syncForm();
        this.status("loadedFolder");
      } catch (err2) {
        console.error(err2);
        await this.loadDemo();
        if (typeof location !== "undefined" && location.protocol === "file:") this.status("fileHint");
      }
    }
    async fetchAsset(url, kind, into = this.assets) {
      const res = await fetchPublic(url);
      if (!res.ok) return;
      const bytes = new Uint8Array(await res.arrayBuffer());
      const blob = new Blob([bytes]);
      const name = stem(url.split("/").pop() ?? url);
      const asset = { name, blob, bytes, kind };
      if (kind === "image") {
        try {
          asset.image = await loadImage(blob);
        } catch {
        }
      }
      into.set(name, asset);
    }
    async loadDemo(reset = true) {
      if (reset) this.model = createEmptyModel();
      this.model.name = "Doomer";
      this.model.author = "d2df-me";
      this.model.description = "Demo model generated in the editor";
      this.model.weaponMode = "v2";
      this.assets.clear();
      for (const def of ANIM_DEFS) {
        const anim = this.model.anims[def.section];
        const frames = [];
        const masks = [];
        for (let i = 0; i < anim.frames; i++) {
          frames.push(drawMarineFrame(def.resource, i, anim.frames));
          masks.push(drawMarineMask(def.resource, i, anim.frames));
        }
        const strip = stitchStrip(frames, FRAME);
        const mask = stitchStrip(masks, FRAME);
        await this.putCanvas(anim.resource, strip);
        await this.putCanvas(anim.mask, mask);
      }
      const gibs = drawGibs();
      this.model.gibs.count = gibs.count;
      await this.putCanvas("GIBS", gibs.image);
      await this.putCanvas("GIBSMASK", gibs.mask);
      this.folderLabel = "(demo)";
      this.syncForm();
      this.status("newModel");
    }
    async putCanvas(name, canvas) {
      const bytes = await canvasToPng(canvas);
      const blob = new Blob([bytes], { type: "image/png" });
      this.assets.set(name.toUpperCase(), {
        name: name.toUpperCase(),
        blob,
        bytes,
        kind: "image",
        image: await loadImage(blob)
      });
    }
  };
  async function fetchPublic(path) {
    const rel = path.replace(/^\//, "");
    const urls = [`./${rel}`, `./public/${rel}`];
    let last;
    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (res.ok) return res;
        last = res;
      } catch {
      }
    }
    if (last) return last;
    throw new Error(rel);
  }
  function weaponSpriteUrls(dir) {
    const weaps = ["CSAW", "HGUN", "SG", "SSG", "MGUN", "RKT", "PLZ", "BFG", "SPL", "FLM"];
    const variants = ["", "_FIRE", "_UP", "_UP_FIRE", "_DN", "_DN_FIRE"];
    const extra = ["PUNCH", "PUNCHB", "PUNCH_UP", "PUNCH_DN", "PUNCHB_UP", "PUNCHB_DN"];
    return [
      ...weaps.flatMap((w) => variants.map((v) => `${dir}/${w}${v}.tga`)),
      ...extra.map((name) => `${dir}/${name}.tga`)
    ];
  }
  function imageSize(src) {
    if (src instanceof HTMLCanvasElement || src instanceof HTMLImageElement) {
      return { w: src.width, h: src.height };
    }
    return { w: FRAME, h: FRAME };
  }
  function hexRgb(hex) {
    const n = hex.replace("#", "");
    return {
      r: parseInt(n.slice(0, 2), 16),
      g: parseInt(n.slice(2, 4), 16),
      b: parseInt(n.slice(4, 6), 16)
    };
  }
  function rgbHex(c) {
    const h = (n) => n.toString(16).padStart(2, "0");
    return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
  }
  function download(name, data, type) {
    const blob = typeof data === "string" ? new Blob([data], { type }) : new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
  function optionAtPointer(list, e) {
    const direct = e.target.closest("option");
    if (direct instanceof HTMLOptionElement) return direct;
    const rect2 = list.getBoundingClientRect();
    const sample = list.options[0];
    if (!sample) return null;
    const h = sample.getBoundingClientRect().height || 16;
    const index = Math.floor((e.clientY - rect2.top + list.scrollTop) / h);
    if (index < 0 || index >= list.options.length) return null;
    return list.options[index];
  }
  function isTyping(target) {
    if (target instanceof HTMLTextAreaElement) return true;
    if (!(target instanceof HTMLInputElement)) return false;
    return !["checkbox", "radio", "button", "range", "color"].includes(target.type);
  }

  // src/main.ts
  new Editor();
})();
/*! Bundled license information:

pako/dist/pako.esm.mjs:
  (*! pako 2.2.0 https://github.com/nodeca/pako @license (MIT AND Zlib) *)
*/
