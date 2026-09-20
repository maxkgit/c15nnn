import { FRAME, GIB_FRAME, type Point } from "./model/format";

export type Pixel = [number, number, number, number];

export function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

export function putPixel(data: ImageData, x: number, y: number, c: Pixel): void {
  if (x < 0 || y < 0 || x >= data.width || y >= data.height) return;
  const i = (y * data.width + x) * 4;
  data.data[i] = c[0];
  data.data[i + 1] = c[1];
  data.data[i + 2] = c[2];
  data.data[i + 3] = c[3];
}

function rect(data: ImageData, x: number, y: number, w: number, h: number, c: Pixel): void {
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) putPixel(data, x + xx, y + yy, c);
}

function canvasFromData(data: ImageData): HTMLCanvasElement {
  const c = makeCanvas(data.width, data.height);
  c.getContext("2d")!.putImageData(data, 0, 0);
  return c;
}

const SKIN: Pixel = [224, 176, 144, 255];
const ARMOR: Pixel = [48, 118, 48, 255];
const ARMOR2: Pixel = [32, 86, 32, 255];
const HELMET: Pixel = [56, 140, 56, 255];
const VISOR: Pixel = [220, 36, 36, 255];
const BOOT: Pixel = [40, 36, 32, 255];
const BELT: Pixel = [90, 70, 40, 255];
const OUT: Pixel = [16, 16, 16, 255];
const WHITE: Pixel = [255, 255, 255, 255];

export function drawMarineFrame(kind: string, frame: number, frames: number): HTMLCanvasElement {
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

function body(
  data: ImageData,
  x: number,
  y: number,
  leg: number,
  fallen: boolean,
  lookUp: boolean,
  lookDown: boolean,
): void {
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

function emptyArm(
  data: ImageData,
  x: number,
  y: number,
  lookUp: boolean,
  lookDown: boolean,
): void {
  const ay = y + 20 + (lookUp ? -6 : lookDown ? 6 : 0);
  rect(data, x + 20, ay, 7, 4, SKIN);
}

function punch(data: ImageData, x: number, y: number, attack: boolean, frame: number): void {
  const reach = attack ? 10 + (frame % 2) * 4 : 2;
  rect(data, x + 20, y + 22, reach, 4, SKIN);
  rect(data, x + 20 + reach, y + 20, 5, 7, SKIN);
}

export function drawMarineMask(kind: string, frame: number, frames: number): HTMLCanvasElement {
  const src = drawMarineFrame(kind, frame, frames);
  const ctx = src.getContext("2d")!;
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

export function stitchStrip(frames: HTMLCanvasElement[], frameSize: number): HTMLCanvasElement {
  const strip = makeCanvas(frameSize * frames.length, frameSize);
  const ctx = strip.getContext("2d")!;
  frames.forEach((f, i) => ctx.drawImage(f, i * frameSize, 0));
  return strip;
}

export function drawGibs(): { image: HTMLCanvasElement; mask: HTMLCanvasElement; count: number } {
  const count = 6;
  const image = makeCanvas(GIB_FRAME * count, GIB_FRAME);
  const mask = makeCanvas(GIB_FRAME * count, GIB_FRAME);
  const ic = image.getContext("2d")!;
  const mc = mask.getContext("2d")!;
  for (let i = 0; i < count; i++) {
    const data = new ImageData(GIB_FRAME, GIB_FRAME);
    const mdata = new ImageData(GIB_FRAME, GIB_FRAME);
    const ox = 8 + (i % 3) * 2;
    const oy = 8 + ((i * 3) % 5);
    rect(data, ox, oy, 12, 10, ARMOR);
    rect(data, ox + 2, oy + 2, 6, 5, [150, 0, 0, 255]);
    rect(mdata, ox, oy, 12, 10, WHITE);
    ic.putImageData(data, i * GIB_FRAME, 0);
    mc.putImageData(mdata, i * GIB_FRAME, 0);
  }
  return { image, mask, count };
}

export function drawWeapon(key: string, pose: "norm" | "up" | "down", fire: boolean): HTMLCanvasElement {
  const c = makeCanvas(32, 24);
  const ctx = c.getContext("2d")!;
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

export function drawFlag(): HTMLCanvasElement {
  const c = makeCanvas(32, 32);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#c00";
  ctx.fillRect(10, 2, 18, 12);
  ctx.fillStyle = "#333";
  ctx.fillRect(8, 2, 2, 26);
  return c;
}

export function sliceStrip(image: HTMLCanvasElement | HTMLImageElement, frameSize: number): HTMLCanvasElement[] {
  const frames: HTMLCanvasElement[] = [];
  const count = Math.max(1, Math.floor(image.width / frameSize));
  for (let i = 0; i < count; i++) {
    const f = makeCanvas(frameSize, image.height);
    f.getContext("2d")!.drawImage(image, i * frameSize, 0, frameSize, image.height, 0, 0, frameSize, image.height);
    frames.push(f);
  }
  return frames;
}

export function tintMask(mask: CanvasImageSource, color: { r: number; g: number; b: number }, w: number, h: number): HTMLCanvasElement {
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  ctx.drawImage(mask, 0, 0, w, h);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`;
  ctx.fillRect(0, 0, w, h);
  return c;
}

export async function loadImage(blob: Blob): Promise<HTMLCanvasElement | HTMLImageElement> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const { decodeTga, isTga } = await import("./tga");
  if (isTga(bytes)) return decodeTga(bytes);
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

export async function canvasToPng(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("png"))), "image/png");
  });
  return new Uint8Array(await blob.arrayBuffer());
}

export function weaponDrawPoint(stored: Point, weaponKey: string, guns2: boolean): Point {
  if (guns2) return stored;
  const base = { csaw: [8, 4], hgun: [8, 8], sg: [16, 16], ssg: [16, 24], mgun: [16, 16], rkt: [24, 24], plz: [16, 16], bfg: [24, 24], spl: [16, 16], flm: [8, 8] }[
    weaponKey
  ] ?? [8, 8];
  return { x: stored.x - base[0], y: stored.y - base[1] };
}
