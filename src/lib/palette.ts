/** Работа с цветом: тёплость палитры и извлечение палитры из фото (в браузере). */

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function rgbToHex(r: number, g: number, b: number) {
  return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  return [h, s, l];
}

/** Насколько палитра тёплая, 0..1. Тёплые оттенки — красный…жёлтый, взвешиваем по насыщенности. */
export function paletteWarmth(palette: string[]) {
  let warm = 0;
  let total = 0;
  for (const hex of palette) {
    const [h, s] = rgbToHsl(...hexToRgb(hex));
    const w = 0.15 + s;
    const isWarm = h < 70 || h > 330 ? 1 : h < 100 || h > 290 ? 0.5 : 0;
    warm += isWarm * w;
    total += w;
  }
  return total ? warm / total : 0.5;
}

export function warmthWord(w: number) {
  return w > 0.65 ? "тёплые" : w < 0.35 ? "холодные" : "смешанные";
}

/**
 * Доминирующие цвета изображения: уменьшаем до 48×48, квантуем по 4 бита на канал,
 * берём самые частые и достаточно разные корзины.
 */
export function extractPalette(img: CanvasImageSource, count = 4): string[] {
  const size = 48;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;
  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const e = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    e.n++;
    e.r += r;
    e.g += g;
    e.b += b;
    buckets.set(key, e);
  }
  const sorted = [...buckets.values()].sort((a, b) => b.n - a.n).map((e) => [e.r / e.n, e.g / e.n, e.b / e.n] as const);
  const picked: (readonly [number, number, number])[] = [];
  for (const c of sorted) {
    if (picked.every((p) => Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]) > 48)) picked.push(c);
    if (picked.length === count) break;
  }
  return picked.map((c) => rgbToHex(...c));
}

/** Уменьшенная копия фото (data URL) — чтобы хранить запись на устройстве. */
export function thumbnail(img: HTMLImageElement, max = 480) {
  const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * k);
  canvas.height = Math.round(img.naturalHeight * k);
  canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.8);
}

export function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Палитра из нескольких фото: по два цвета с каждого, затем добираем. */
export function mergePalettes(palettes: string[][], fallback: string[]): [string, string, string, string] {
  const out: string[] = [];
  for (let round = 0; out.length < 4 && round < 4; round++) {
    for (const p of palettes) if (p[round] && !out.includes(p[round]) && out.length < 4) out.push(p[round]);
  }
  for (const c of fallback) if (out.length < 4 && !out.includes(c)) out.push(c);
  return out.slice(0, 4) as [string, string, string, string];
}
