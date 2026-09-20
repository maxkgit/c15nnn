import { inflate, deflate } from "pako";

const SIGNATURE = "DFWAD";
const VERSION = 1;
const NAME_BYTES = 16;

export interface WadFile {
  dir: string;
  name: string;
  data: Uint8Array;
}

function decode1251(bytes: Uint8Array): string {
  try {
    return new TextDecoder("windows-1251").decode(bytes).replace(/\0+$/g, "").trim();
  } catch {
    return Array.from(bytes)
      .map((b) => (b ? String.fromCharCode(b) : ""))
      .join("")
      .replace(/\0+$/g, "")
      .trim();
  }
}

function encode1251(text: string): Uint8Array {
  const out = new Uint8Array(NAME_BYTES);
  for (let i = 0; i < Math.min(text.length, NAME_BYTES); i++) {
    const c = text.charCodeAt(i);
    out[i] = c < 256 ? c : 0x3f;
  }
  return out;
}

function readU16(view: DataView, offset: number): number {
  return view.getUint16(offset, true);
}

function readU32(view: DataView, offset: number): number {
  return view.getUint32(offset, true);
}

export function isDfwad(data: Uint8Array): boolean {
  if (data.length < 8) return false;
  return String.fromCharCode(...data.subarray(0, 5)) === SIGNATURE;
}

export function parseDfwad(data: Uint8Array): WadFile[] {
  if (!isDfwad(data)) throw new Error("Not a DFWAD");
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const version = data[5];
  if (version !== VERSION) throw new Error(`Unsupported DFWAD version ${version}`);
  const lumps = readU16(view, 6);
  const files: WadFile[] = [];
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
    let decoded: Uint8Array;
    try {
      decoded = inflate(raw);
    } catch {
      decoded = raw;
    }
    files.push({ dir, name, data: decoded });
  }
  return files;
}

export function createDfwad(files: WadFile[]): Uint8Array {
  const groups = new Map<string, WadFile[]>();
  for (const file of files) {
    const list = groups.get(file.dir) ?? [];
    list.push(file);
    groups.set(file.dir, list);
  }
  const dirs = [...groups.keys()].sort((a, b) => a.localeCompare(b));
  const lumpCount = dirs.length + files.length;
  const header = 8;
  const table = lumpCount * (NAME_BYTES + 8);
  const chunks: { name: Uint8Array; offset: number; size: number; payload?: Uint8Array }[] = [];
  let dataOffset = header + table;

  for (const dir of dirs) {
    chunks.push({ name: encode1251(dir), offset: 0, size: 0 });
    for (const file of groups.get(dir) ?? []) {
      const payload = deflate(file.data);
      chunks.push({
        name: encode1251(file.name),
        offset: dataOffset,
        size: payload.length,
        payload,
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

export function wadKey(file: WadFile): string {
  const dir = file.dir.replace(/\\/g, "/").replace(/\/+$/, "");
  return `${dir}/${file.name}`.replace(/^\/+/, "").toUpperCase();
}
