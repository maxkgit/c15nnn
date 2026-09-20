import {
  ANIM_DEFS,
  FRAME,
  NO_WEAPON_ANIMS,
  PLAYER_HEAD,
  PLAYER_RECT,
  WEAPON_ALIGN,
  WEAPON_DEFS,
  createEmptyModel,
  findAnimByResource,
  logicalFrame,
  matchResourceName,
  parseModelTxt,
  playbackLength,
  serializeModelTxt,
  stem,
  type AnimData,
  type PlayerModel,
  type Point,
  type WeaponMode,
} from "./model/format";
import { createDfwad, parseDfwad, type WadFile } from "./wad/dfwad";
import {
  animLabel,
  t,
  weapLabel,
  type Lang,
} from "./i18n";
import {
  canvasToPng,
  drawFlag,
  drawGibs,
  drawMarineFrame,
  drawMarineMask,
  drawWeapon,
  loadImage,
  sliceStrip,
  stitchStrip,
  tintMask,
  weaponDrawPoint,
} from "./gfx";

interface Asset {
  name: string;
  blob: Blob;
  bytes: Uint8Array;
  kind: "image" | "sound" | "text" | "other";
  image?: HTMLImageElement | HTMLCanvasElement;
}

const IMAGE_EXT = /\.(png|gif|tga|bmp|jpg|jpeg)$/i;
const SOUND_EXT = /\.(wav|ogg|mp3|flac)$/i;
const BASE_REQUIRED = new Set(["STAND", "WALK", "DIE1", "ATTACK"]);

export class Editor {
  lang: Lang = "ru";
  model = createEmptyModel();
  assets = new Map<string, Asset>();
  weaponPacks = { v1: new Map<string, Asset>(), v2: new Map<string, Asset>() };
  folderLabel = "";
  weaponFolderLabel = "";
  currentAnim = "StandAnim";
  currentWeap = "hgun";
  playFrame = 0;
  playing = false;
  zoom = 4;
  assignTarget: { type: "sprite" | "mask" | "sound"; key: string } | null = null;
  private lastTick = 0;
  private waitAcc = 0;

  constructor() {
    this.bind();
    this.applyLang();
    requestAnimationFrame((t) => this.loop(t));
    try {
      this.syncForm();
    } catch (err) {
      console.error(err);
    }
    void this.loadOfficial();
  }

  private $(id: string): HTMLElement {
    const el = document.getElementById(id);
    if (!el) throw new Error(id);
    return el;
  }

  private input(id: string): HTMLInputElement {
    return this.$(id) as HTMLInputElement;
  }

  private bind(): void {
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => this.showTab((tab as HTMLElement).dataset.tab ?? "model"));
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
      ["fldVersion", "version"],
    ] as const) {
      this.input(id).addEventListener("input", () => {
        this.model[key] = this.input(id).value;
      });
    }
    (this.$("fldDesc") as HTMLTextAreaElement).addEventListener("input", () => {
      this.model.description = (this.$("fldDesc") as HTMLTextAreaElement).value;
    });
    this.input("fldBlood").addEventListener("input", () => {
      const { r, g, b } = hexRgb(this.input("fldBlood").value);
      this.model.blood = { ...this.model.blood, r, g, b };
    });
    this.input("fldBloodKind").addEventListener("change", () => {
      this.model.blood.kind = this.input("fldBloodKind").value as PlayerModel["blood"]["kind"];
    });
    document.querySelectorAll<HTMLInputElement>('input[name="weapMode"]').forEach((el) => {
      el.addEventListener("change", () => {
        if (!el.checked) return;
        this.model.weaponMode = el.value as WeaponMode;
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
    this.input("fldFX").addEventListener("input", () => { this.model.flagPoint.x = Number(this.input("fldFX").value) || 0; });
    this.input("fldFY").addEventListener("input", () => { this.model.flagPoint.y = Number(this.input("fldFY").value) || 0; });
    this.input("fldFA").addEventListener("input", () => { this.model.flagAngle = Number(this.input("fldFA").value) || 0; });
    this.input("fldZoom").addEventListener("input", () => { this.zoom = Number(this.input("fldZoom").value) || 4; });

    this.$("btnAlignWeaps").addEventListener("click", () => {
      this.alignWeaponsFromSelected();
      this.focusPreview();
    });
    this.$("btnPrev").addEventListener("click", () => { this.stepGlobal(-1); this.focusPreview(); });
    this.$("btnNext").addEventListener("click", () => { this.stepGlobal(1); this.focusPreview(); });
    this.$("btnPlay").addEventListener("click", () => { this.playing = true; this.focusPreview(); });
    this.$("btnStop").addEventListener("click", () => { this.playing = false; this.focusPreview(); });

    this.$("page-anim").addEventListener("click", (e) => {
      if (isTyping(e.target)) return;
      if ((e.target as HTMLElement).closest("select")) return;
      this.focusPreview();
    });

    const stage = this.$("stage") as HTMLCanvasElement;
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
      const move: Record<string, { x: number; y: number }> = {
        KeyA: { x: -1, y: 0 },
        KeyD: { x: 1, y: 0 },
        KeyW: { x: 0, y: -1 },
        KeyS: { x: 0, y: 1 },
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

  private showTab(id: string): void {
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", (t as HTMLElement).dataset.tab === id));
    document.querySelectorAll(".page").forEach((p) => p.classList.toggle("active", p.id === `page-${id}`));
    if (id === "res") this.renderResources();
    if (id === "anim") queueMicrotask(() => this.focusPreview());
  }

  private focusPreview(): void {
    const stage = this.$("stage") as HTMLCanvasElement;
    stage.tabIndex = 0;
    stage.focus({ preventScroll: true });
  }

  private bindListPointer(id: string, onPick: (value: string) => void): void {
    const list = this.$(id) as HTMLSelectElement;
    list.tabIndex = -1;
    const steal = () => this.focusPreview();
    list.addEventListener("mousedown", (e) => {
      const rect = list.getBoundingClientRect();
      const onBar = e.clientX > rect.right - 18;
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

  private applyLang(): void {
    document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
      const key = el.dataset.i18n as Parameters<typeof t>[1];
      if (key) el.textContent = t(this.lang, key);
    });
    document.title = t(this.lang, "title");
    this.status("ready");
  }

  private fillLists(): void {
    const anim = this.$("lstAnim") as HTMLSelectElement;
    const weap = this.$("lstWeap") as HTMLSelectElement;
    const frames = this.flatFrames();
    anim.innerHTML = frames.map((f) => {
      const def = ANIM_DEFS.find((d) => d.section === f.section)!;
      const label = `${weapLabel(this.lang, f.weapon)} · ${animLabel(this.lang, f.section)} — ${def.resource} ${f.frame + 1}/${f.total}`;
      return `<option value="${f.weapon}:${f.section}:${f.frame}">${label}</option>`;
    }).join("");
    weap.innerHTML = WEAPON_DEFS.map((w) => `<option value="${w.key}">${weapLabel(this.lang, w.key)}</option>`).join("");
    anim.value = this.frameKey();
    weap.value = this.currentWeap;
    this.scrollFrameList();
  }

  private poseAnims() {
    const order = [
      "StandAnim",
      "AttackAnim",
      "WalkAnim",
      "SeeUpAnim",
      "AttackUpAnim",
      "SeeDownAnim",
      "AttackDownAnim",
    ];
    return order
      .map((section) => ANIM_DEFS.find((d) => d.section === section))
      .filter((d): d is NonNullable<typeof d> => Boolean(d) && !NO_WEAPON_ANIMS.has(d.section));
  }

  private flatFrames(): { weapon: string; section: string; frame: number; total: number }[] {
    const out: { weapon: string; section: string; frame: number; total: number }[] = [];
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

  private frameKey(): string {
    return `${this.currentWeap}:${this.currentAnim}:${logicalFrame(this.anim(), this.playFrame)}`;
  }

  private applyFrameKey(key: string): void {
    const [weapon, section, raw] = key.split(":");
    if (!section || !this.model.anims[section]) return;
    if (weapon) this.currentWeap = weapon;
    this.currentAnim = section;
    this.playFrame = Number(raw) || 0;
    this.playing = false;
    const weap = this.$("lstWeap") as HTMLSelectElement;
    weap.value = this.currentWeap;
  }

  private anim(): AnimData {
    return this.model.anims[this.currentAnim];
  }

  private ensureWeaponPoints(): void {
    const anim = this.anim();
    if (anim) this.ensureAnimWeaponPoints(anim);
  }

  private currentPoint(): Point {
    const anim = this.anim();
    if (!anim) return { x: 0, y: 0 };
    this.ensureWeaponPoints();
    const idx = logicalFrame(anim, this.playFrame);
    return anim.points[this.currentWeap]?.[idx] ?? { x: 0, y: 0 };
  }

  private setCurrentPoint(axis: "x" | "y", value: number): void {
    const p = this.currentPoint();
    p[axis] = Number.isFinite(value) ? value : 0;
  }

  private alignWeaponsFromSelected(): void {
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

  private ensureAnimWeaponPoints(anim: AnimData): void {
    for (const w of WEAPON_DEFS) {
      const pts = anim.points[w.key] ?? [];
      while (pts.length < anim.frames) pts.push({ ...(pts[pts.length - 1] ?? { x: 48, y: 40 }) });
      anim.points[w.key] = pts;
    }
  }

  private syncForm(): void {
    this.input("fldName").value = this.model.name;
    this.input("fldAuthor").value = this.model.author;
    (this.$("fldDesc") as HTMLTextAreaElement).value = this.model.description;
    this.input("fldVersion").value = this.model.version;
    this.input("fldResPath").value = this.folderLabel;
    this.input("fldWeapPath").value = this.weaponFolderLabel;
    this.input("fldBlood").value = rgbHex(this.model.blood);
    this.input("fldBloodKind").value = this.model.blood.kind;
    this.input("fldMelee").checked = this.model.overlayMelee;
    this.input("fldSlop").value = String(this.model.slop);
    document.querySelectorAll<HTMLInputElement>('input[name="weapMode"]').forEach((el) => {
      el.checked = el.value === this.model.weaponMode;
    });
    this.applyWeaponPack();
    this.syncAnimFields();
    this.fillLists();
    this.renderResources();
  }

  private syncAnimFields(): void {
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
    const list = this.$("lstAnim") as HTMLSelectElement;
    if (list.options.length && list.value !== this.frameKey()) list.value = this.frameKey();
    this.scrollFrameList();
  }

  private scrollFrameList(): void {
    const list = this.$("lstAnim") as HTMLSelectElement;
    const page = this.$("page-anim");
    if (!page.classList.contains("active")) return;
    const opt = list.selectedOptions[0];
    if (!opt) return;
    try {
      opt.scrollIntoView({ block: "nearest" });
    } catch {
      /* hidden list */
    }
  }

  private status(key: Parameters<typeof t>[1] | string): void {
    const known = key in { ready: 1, loadedFolder: 1, loadedWad: 1, savedTxt: 1, savedWad: 1, newModel: 1, needName: 1, badWad: 1, alignWeapsDone: 1, fileHint: 1 };
    this.$("status").textContent = known ? t(this.lang, key as Parameters<typeof t>[1]) : key;
  }

  private step(dir: number): void {
    const total = playbackLength(this.anim());
    this.playFrame = (this.playFrame + dir + total) % total;
    this.syncAnimFields();
  }

  private stepGlobal(dir: number): void {
    const all = this.flatFrames();
    if (!all.length) return;
    const logical = logicalFrame(this.anim(), this.playFrame);
    const at = all.findIndex((f) => f.weapon === this.currentWeap && f.section === this.currentAnim && f.frame === logical);
    const next = all[(at < 0 ? 0 : at + dir + all.length) % all.length];
    this.currentWeap = next.weapon;
    this.currentAnim = next.section;
    this.playFrame = next.frame;
    this.playing = false;
    (this.$("lstWeap") as HTMLSelectElement).value = this.currentWeap;
    this.syncAnimFields();
  }

  private onStage(e: PointerEvent, down: boolean): void {
    const canvas = this.$("stage") as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const scale = this.zoom;
    const ox = (canvas.width - FRAME * scale) / 2;
    const oy = (canvas.height - FRAME * scale) / 2;
    const x = Math.round((e.clientX - rect.left - ox) * (canvas.width / rect.width) / scale);
    const y = Math.round((e.clientY - rect.top - oy) * (canvas.height / rect.height) / scale);
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

  private loop(now: number): void {
    const dt = now - this.lastTick;
    this.lastTick = now;
    if (this.playing) {
      this.waitAcc += dt;
      const waitMs = Math.max(16, (this.anim().waitcount / 36) * 1000);
      if (this.waitAcc >= waitMs) {
        this.waitAcc = 0;
        this.step(1);
      }
    }
    try {
      this.draw();
    } catch (err) {
      console.error(err);
    }
    requestAnimationFrame((t) => this.loop(t));
  }

  private draw(): void {
    const canvas = this.$("stage") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#202820";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < canvas.height; y += 8) {
      for (let x = 0; x < canvas.width; x += 8) {
        if (((x + y) / 8) % 2 === 0) {
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
      ctx.rotate(((left ? -this.model.flagAngle : this.model.flagAngle) * Math.PI) / 180);
      ctx.drawImage(drawFlag(), -16 * scale / 2, -16 * scale / 2, 32 * scale / 2, 32 * scale / 2);
      ctx.restore();
    }

    if (showWeap) {
      const stored = this.currentPoint();
      const p = weaponDrawPoint(stored, this.currentWeap, this.model.weaponMode === "v2");
      const weap = this.weaponSprite(this.currentWeap, pose as "norm" | "up" | "down", fire);
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

  private applyWeaponPack(): void {
    if (this.model.weaponMode === "v2") this.weaponFolderLabel = "weapons";
    else if (this.model.weaponMode === "v1") this.weaponFolderLabel = "weapons_old";
    const path = document.getElementById("fldWeapPath") as HTMLInputElement | null;
    if (path) path.value = this.weaponFolderLabel;
  }

  private weaponPack(): Map<string, Asset> {
    return this.model.weaponMode === "v1" ? this.weaponPacks.v1 : this.weaponPacks.v2;
  }

  private weaponSprite(key: string, pose: "norm" | "up" | "down", fire: boolean): CanvasImageSource {
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

  private frameImage(fallbackRes: string, name: string, index: number, mask: boolean): CanvasImageSource {
    const asset = this.assets.get(name.toUpperCase()) ?? this.assets.get(fallbackRes.toUpperCase());
    if (asset?.image) {
      const frames = sliceStrip(asset.image, name.toUpperCase().includes("GIB") ? 32 : FRAME);
      return frames[Math.min(index, frames.length - 1)] ?? frames[0];
    }
    const def = findAnimByResource(fallbackRes);
    const kind = def?.resource ?? fallbackRes;
    return mask ? drawMarineMask(kind, index, this.anim().frames) : drawMarineFrame(kind, index, this.anim().frames);
  }

  private async openFolder(e: Event): Promise<void> {
    const input = e.target as HTMLInputElement;
    const files = [...(input.files ?? [])];
    input.value = "";
    if (!files.length) return;
    this.folderLabel = files[0].webkitRelativePath.split("/")[0] ?? "";
    await this.ingestFiles(files);
    this.status("loadedFolder");
    this.syncForm();
  }

  private async openWad(e: Event): Promise<void> {
    const input = e.target as HTMLInputElement;
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

  private async ingestWad(lumps: WadFile[]): Promise<void> {
    this.assets.clear();
    let modelTxt = "";
    for (const lump of lumps) {
      const dir = lump.dir.replace(/\\/g, "/").toUpperCase();
      const name = lump.name.replace(/\0/g, "").toUpperCase();
      if (dir.includes("TEXT") && name.replace(/\.[^.]+$/, "") === "MODEL") {
        modelTxt = new TextDecoder("windows-1251").decode(lump.data);
        continue;
      }
      const blob = new Blob([lump.data as BlobPart]);
      const asset: Asset = {
        name,
        blob,
        bytes: lump.data,
        kind: IMAGE_EXT.test(name) || dir.includes("TEXTURE") ? "image" : SOUND_EXT.test(name) || dir.includes("SOUND") ? "sound" : "other",
      };
      if (asset.kind === "image") {
        try { asset.image = await loadImage(new Blob([lump.data as BlobPart])); } catch { /* tga etc */ }
      }
      this.assets.set(stem(name), asset);
    }
    if (modelTxt) this.model = parseModelTxt(modelTxt);
    else throw new Error("no model");
  }

  private async ingestFiles(files: File[]): Promise<void> {
    let modelFile: File | undefined;
    for (const file of files) {
      const base = stem(file.name);
      if (base === "MODEL" || file.name.toLowerCase() === "model.txt") {
        modelFile = file;
        continue;
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      const asset: Asset = {
        name: base,
        blob: file,
        bytes,
        kind: IMAGE_EXT.test(file.name) ? "image" : SOUND_EXT.test(file.name) ? "sound" : "other",
      };
      if (asset.kind === "image") {
        try { asset.image = await loadImage(file); } catch { /* skip */ }
      }
      this.assets.set(base, asset);
      this.autoBind(file, asset);
    }
    if (modelFile) this.model = parseModelTxt(await modelFile.text());
    else this.guessFromFiles();
  }

  private autoBind(file: File, asset: Asset): void {
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

  private guessFromFiles(): void {
    for (const def of ANIM_DEFS) {
      for (const alias of def.aliases) {
        if (this.assets.has(alias)) this.model.anims[def.section].resource = alias;
        if (this.assets.has(`${alias}MASK`)) this.model.anims[def.section].mask = `${alias}MASK`;
      }
    }
  }

  private saveTxt(): void {
    if (!this.model.name.trim()) {
      this.status("needName");
      return;
    }
    download(`${this.model.name || "model"}.txt`, serializeModelTxt(this.model), "text/plain");
    this.status("savedTxt");
  }

  private async saveWad(): Promise<void> {
    if (!this.model.name.trim()) {
      this.status("needName");
      return;
    }
    const files: WadFile[] = [
      { dir: "TEXT", name: "MODEL", data: new TextEncoder().encode(serializeModelTxt(this.model)) },
    ];
    const names = new Set<string>();
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

  private renderResources(): void {
    this.$("resBase").innerHTML = ANIM_DEFS.filter((d) => d.group === "base").map((d) => this.resRow(d.section, d.resource, true)).join("");
    const extra = document.getElementById("resExtra");
    if (extra) extra.innerHTML = ANIM_DEFS.filter((d) => d.group === "extra").map((d) => this.resRow(d.section, d.resource, false)).join("");
    const sounds = [
      ...this.model.pain.map((s) => ({ key: s.key, extra: `pain ${s.level}` })),
      ...this.model.die.map((s) => ({ key: s.key, extra: `die ${s.level}` })),
    ];
    this.$("resSounds").innerHTML = sounds.map((s) => {
      const ok = this.assets.has(s.key.toUpperCase());
      return `<div class="res-row ${ok ? "ok" : "warn"}" data-sound="${s.key}">
        <span>${s.key}</span><span>${s.extra}</span>
        <button type="button" data-play="${s.key}">▶</button>
      </div>`;
    }).join("");

    this.$("resBase").onclick = (e) => this.onResClick(e, true);
    if (extra) extra.onclick = (e) => this.onResClick(e, false);
    this.$("resSounds").onclick = (e) => {
      const t = e.target as HTMLElement;
      const play = t.dataset.play;
      if (play) {
        const asset = this.assets.get(play.toUpperCase());
        if (asset) new Audio(URL.createObjectURL(asset.blob)).play().catch(() => undefined);
        return;
      }
      const row = t.closest<HTMLElement>("[data-sound]");
      if (row && e.detail === 2) this.pickAssign("sound", row.dataset.sound ?? "");
    };
  }

  private resRow(section: string, resource: string, required: boolean): string {
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

  private onResClick(e: Event, _base: boolean): void {
    const row = (e.target as HTMLElement).closest<HTMLElement>("[data-anim]");
    if (!row) return;
    const section = row.dataset.anim ?? "";
    this.currentAnim = section;
    this.playFrame = 0;
    const anim = this.model.anims[section];
    const asset = this.assets.get(anim.resource.toUpperCase());
    const box = this.$("resPreview");
    box.innerHTML = "";
    if (asset?.image) box.append(asset.image.cloneNode(true) as HTMLImageElement);
    else {
      const c = drawMarineFrame(anim.resource, 0, anim.frames);
      box.append(c);
    }
    if ((e as MouseEvent).detail === 2) this.pickAssign("sprite", section);
    this.fillLists();
  }

  private pickAssign(type: "sprite" | "mask" | "sound", key: string): void {
    this.assignTarget = { type, key };
    this.input("pickFile").click();
  }

  private async assignPicked(e: Event): Promise<void> {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file || !this.assignTarget) return;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const name = stem(file.name);
    const asset: Asset = {
      name,
      blob: file,
      bytes,
      kind: IMAGE_EXT.test(file.name) ? "image" : SOUND_EXT.test(file.name) ? "sound" : "other",
    };
    if (asset.kind === "image") {
      try { asset.image = await loadImage(file); } catch { /* skip */ }
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

  async loadOfficial(): Promise<void> {
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
        "STAND.tga", "STANDMASK.tga", "WALK.tga", "WALKMASK.tga",
        "ATTACK.tga", "ATTACKMASK.tga", "ATTACKUP.tga", "ATTACKUPMASK.tga",
        "ATTACKDOWN.tga", "ATTACKDOWNMASK.tga", "SEEUP.tga", "SEEUPMASK.tga",
        "SEEDOWN.tga", "SEEDOWNMASK.tga", "PAIN.tga", "PAINMASK.tga",
        "DIE1.png", "DIE1MASK.png", "DIE2.png", "DIE2MASK.png",
        "GIBS.tga", "GIBSMASK.tga",
      ];
      const sounds = [
        "PAIN1.wav", "PAIN2.wav", "PAIN3.wav", "PAIN4.wav", "PAIN5.wav", "PAIN6.wav",
        "MEGAPAIN.wav", "DIE1.wav", "DIE2.wav", "DIE3.wav", "DIE4.wav", "DIE5.wav",
        "DIE6.wav", "FALL1.wav", "FALL2.wav",
      ];
      await Promise.all([
        ...textures.map((file) => this.fetchAsset(`doomer/TEXTURES/${file}`, "image")),
        ...sounds.map((file) => this.fetchAsset(`doomer/SOUNDS/${file}`, "sound")),
        ...weaponSpriteUrls("weapons").map((url) => this.fetchAsset(url, "image", this.weaponPacks.v2)),
        ...weaponSpriteUrls("weapons_old").map((url) => this.fetchAsset(url, "image", this.weaponPacks.v1)),
      ]);
      this.folderLabel = "DoomerWAD";
      this.applyWeaponPack();
      this.syncForm();
      this.status("loadedFolder");
    } catch (err) {
      console.error(err);
      await this.loadDemo();
      if (typeof location !== "undefined" && location.protocol === "file:") this.status("fileHint");
    }
  }

  private async fetchAsset(url: string, kind: Asset["kind"], into = this.assets): Promise<void> {
    const res = await fetchPublic(url);
    if (!res.ok) return;
    const bytes = new Uint8Array(await res.arrayBuffer());
    const blob = new Blob([bytes as BlobPart]);
    const name = stem(url.split("/").pop() ?? url);
    const asset: Asset = { name, blob, bytes, kind };
    if (kind === "image") {
      try { asset.image = await loadImage(blob); } catch { /* skip broken tga */ }
    }
    into.set(name, asset);
  }

  async loadDemo(reset = true): Promise<void> {
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

  private async putCanvas(name: string, canvas: HTMLCanvasElement): Promise<void> {
    const bytes = await canvasToPng(canvas);
    const blob = new Blob([bytes as BlobPart], { type: "image/png" });
    this.assets.set(name.toUpperCase(), {
      name: name.toUpperCase(),
      blob,
      bytes,
      kind: "image",
      image: await loadImage(blob),
    });
  }
}

async function fetchPublic(path: string): Promise<Response> {
  const rel = path.replace(/^\//, "");
  const urls = [`./${rel}`, `./public/${rel}`];
  let last: Response | undefined;
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
      last = res;
    } catch {
      /* file:// or missing */
    }
  }
  if (last) return last;
  throw new Error(rel);
}

function weaponSpriteUrls(dir: string): string[] {
  const weaps = ["CSAW", "HGUN", "SG", "SSG", "MGUN", "RKT", "PLZ", "BFG", "SPL", "FLM"];
  const variants = ["", "_FIRE", "_UP", "_UP_FIRE", "_DN", "_DN_FIRE"];
  const extra = ["PUNCH", "PUNCHB", "PUNCH_UP", "PUNCH_DN", "PUNCHB_UP", "PUNCHB_DN"];
  return [
    ...weaps.flatMap((w) => variants.map((v) => `${dir}/${w}${v}.tga`)),
    ...extra.map((name) => `${dir}/${name}.tga`),
  ];
}

function imageSize(src: CanvasImageSource): { w: number; h: number } {
  if (src instanceof HTMLCanvasElement || src instanceof HTMLImageElement) {
    return { w: src.width, h: src.height };
  }
  return { w: FRAME, h: FRAME };
}

function hexRgb(hex: string): { r: number; g: number; b: number } {
  const n = hex.replace("#", "");
  return {
    r: parseInt(n.slice(0, 2), 16),
    g: parseInt(n.slice(2, 4), 16),
    b: parseInt(n.slice(4, 6), 16),
  };
}

function rgbHex(c: { r: number; g: number; b: number }): string {
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
}

function download(name: string, data: string | Uint8Array, type: string): void {
  const blob = typeof data === "string" ? new Blob([data], { type }) : new Blob([data as BlobPart], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function optionAtPointer(list: HTMLSelectElement, e: MouseEvent): HTMLOptionElement | null {
  const direct = (e.target as HTMLElement).closest("option");
  if (direct instanceof HTMLOptionElement) return direct;
  const rect = list.getBoundingClientRect();
  const sample = list.options[0];
  if (!sample) return null;
  const h = sample.getBoundingClientRect().height || 16;
  const index = Math.floor((e.clientY - rect.top + list.scrollTop) / h);
  if (index < 0 || index >= list.options.length) return null;
  return list.options[index];
}

function isTyping(target: EventTarget | null): boolean {
  if (target instanceof HTMLTextAreaElement) return true;
  if (!(target instanceof HTMLInputElement)) return false;
  return !["checkbox", "radio", "button", "range", "color"].includes(target.type);
}
