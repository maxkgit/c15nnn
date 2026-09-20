export function isTga(bytes: Uint8Array): boolean {
  if (bytes.length < 18) return false;
  const imageType = bytes[2];
  const bpp = bytes[16];
  return (imageType === 2 || imageType === 10) && (bpp === 24 || bpp === 32);
}

export function decodeTga(bytes: Uint8Array): HTMLCanvasElement {
  const idLength = bytes[0];
  const imageType = bytes[2];
  const width = bytes[12] | (bytes[13] << 8);
  const height = bytes[14] | (bytes[15] << 8);
  const bpp = bytes[16];
  const desc = bytes[17];
  const originTop = (desc & 0x20) !== 0;
  const bytesPerPixel = bpp / 8;
  let offset = 18 + idLength;
  const pixels = new Uint8Array(width * height * 4);

  const write = (i: number, b: number, g: number, r: number, a: number) => {
    const o = i * 4;
    pixels[o] = r;
    pixels[o + 1] = g;
    pixels[o + 2] = b;
    pixels[o + 3] = a;
  };

  const readPixel = (): [number, number, number, number] => {
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
      const run = (packet & 0x7f) + 1;
      if (packet & 0x80) {
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
  canvas.getContext("2d")!.putImageData(data, 0, 0);
  return canvas;
}
