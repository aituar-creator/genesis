/**
 * Анализ 30-секундного фрагмента песни прямо в браузере, без библиотек:
 * — темп: огибающая «атак» (spectral flux) → автокорреляция → удары в минуту;
 * — лад и тональность: хромаграмма → корреляция с профилями Крумхансла (мажор/минор);
 * — энергия: громкость (RMS) + яркость звучания (спектральный центроид) + темп.
 * Ядро работает на чистом массиве сэмплов, поэтому его можно проверить и в Node.
 */

export type AudioFeatures = {
  bpm: number;
  mode: "major" | "minor";
  key: string;
  energy: number;
  brightness: number;
  loudnessDb: number;
};

const TARGET_SR = 11025;
const NOTE_NAMES = ["до", "до-диез", "ре", "ми-бемоль", "ми", "фа", "фа-диез", "соль", "ля-бемоль", "ля", "си-бемоль", "си"];
// Профили тональностей Крумхансла — Кесслер
const MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Итеративное БПФ (радикс-2) на месте. */
function fft(re: Float64Array, im: Float64Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k;
        const b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci;
        const ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
        const nr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = nr;
      }
    }
  }
}

function spectra(x: Float32Array, size: number, hop: number, each: (mag: Float64Array) => void) {
  const win = new Float64Array(size).map((_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1)));
  const re = new Float64Array(size);
  const im = new Float64Array(size);
  const mag = new Float64Array(size / 2);
  for (let start = 0; start + size <= x.length; start += hop) {
    for (let i = 0; i < size; i++) {
      re[i] = x[start + i] * win[i];
      im[i] = 0;
    }
    fft(re, im);
    for (let k = 0; k < size / 2; k++) mag[k] = Math.hypot(re[k], im[k]);
    each(mag);
  }
}

function pearson(a: number[], b: number[]) {
  const ma = a.reduce((s, v) => s + v, 0) / a.length;
  const mb = b.reduce((s, v) => s + v, 0) / b.length;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < a.length; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  return num / Math.sqrt(da * db || 1);
}

/** Ядро анализа: моно-сигнал любой частоты дискретизации. */
export function analyzeSamples(input: Float32Array, sampleRate: number): AudioFeatures {
  // 1. Понижаем частоту до ~11 кГц усреднением — этого хватает для ритма и нот.
  const factor = Math.max(1, Math.round(sampleRate / TARGET_SR));
  const sr = sampleRate / factor;
  const x = new Float32Array(Math.floor(input.length / factor));
  for (let i = 0; i < x.length; i++) {
    let s = 0;
    for (let j = 0; j < factor; j++) s += input[i * factor + j];
    x[i] = s / factor;
  }

  // 2. Громкость
  let sumSq = 0;
  for (const v of x) sumSq += v * v;
  const rms = Math.sqrt(sumSq / (x.length || 1));
  const loudnessDb = 20 * Math.log10(rms + 1e-9);

  // 3. Огибающая атак и яркость
  const size = 1024;
  const hop = 256;
  const fps = sr / hop;
  const flux: number[] = [];
  let prev: Float64Array | null = null;
  let centroidSum = 0;
  let centroidN = 0;
  spectra(x, size, hop, (mag) => {
    const logMag = mag.map((m) => Math.log1p(10 * m));
    if (prev) {
      let f = 0;
      for (let k = 1; k < logMag.length; k++) f += Math.max(0, logMag[k] - prev[k]);
      flux.push(f);
    }
    prev = logMag;
    let num = 0;
    let den = 0;
    for (let k = 1; k < mag.length; k++) {
      num += k * mag[k];
      den += mag[k];
    }
    if (den > 1e-6) {
      centroidSum += (num / den) * (sr / size);
      centroidN++;
    }
  });
  const centroidHz = centroidN ? centroidSum / centroidN : 1000;
  const brightness = clamp01((centroidHz - 600) / 1800);

  // Убираем медленный тренд, оставляем только всплески
  const win = Math.round(fps * 0.5);
  const env = flux.map((v, i) => {
    let s = 0;
    let n = 0;
    for (let j = Math.max(0, i - win); j < Math.min(flux.length, i + win); j++) {
      s += flux[j];
      n++;
    }
    return Math.max(0, v - s / n);
  });

  // 4. Темп: автокорреляция огибающей, предпочтение «естественным» 120 ударам
  const lagMin = Math.floor((60 * fps) / 190);
  const lagMax = Math.ceil((60 * fps) / 55);
  const ac: number[] = [];
  for (let lag = 0; lag <= lagMax + 1; lag++) {
    let s = 0;
    for (let i = 0; i + lag < env.length; i++) s += env[i] * env[i + lag];
    ac.push(s / Math.max(1, env.length - lag));
  }
  let best = lagMin;
  let bestScore = -Infinity;
  for (let lag = lagMin; lag <= lagMax; lag++) {
    const bpm = (60 * fps) / lag;
    const prior = Math.exp(-0.5 * (Math.log2(bpm / 120) / 0.9) ** 2);
    const score = ac[lag] * prior;
    if (score > bestScore) {
      bestScore = score;
      best = lag;
    }
  }
  // Уточняем пик параболой
  const [a, b, c] = [ac[best - 1] ?? 0, ac[best], ac[best + 1] ?? 0];
  const shift = a - 2 * b + c !== 0 ? (0.5 * (a - c)) / (a - 2 * b + c) : 0;
  const bpm = Math.round((60 * fps) / (best + Math.max(-0.5, Math.min(0.5, shift))));

  // 5. Хромаграмма и тональность
  const chroma = new Array(12).fill(0);
  const csize = 4096;
  spectra(x, csize, csize / 2, (mag) => {
    for (let k = 1; k < mag.length; k++) {
      const f = (k * sr) / csize;
      if (f < 65 || f > 2100) continue;
      const pc = (((Math.round(69 + 12 * Math.log2(f / 440)) % 12) + 12) % 12);
      chroma[pc] += mag[k];
    }
  });
  let keyBest = { score: -Infinity, tonic: 0, mode: "major" as "major" | "minor" };
  for (let tonic = 0; tonic < 12; tonic++) {
    const rotated = chroma.map((_, i) => chroma[(i + tonic) % 12]);
    const maj = pearson(rotated, MAJOR);
    const min = pearson(rotated, MINOR);
    if (maj > keyBest.score) keyBest = { score: maj, tonic, mode: "major" };
    if (min > keyBest.score) keyBest = { score: min, tonic, mode: "minor" };
  }

  // 6. Энергия: громкость + яркость + темп
  const loud = clamp01((loudnessDb + 32) / 22);
  const tempoNorm = clamp01((bpm - 60) / 100);
  const energy = clamp01(0.55 * loud + 0.25 * brightness + 0.2 * tempoNorm);

  return {
    bpm,
    mode: keyBest.mode,
    key: `${NOTE_NAMES[keyBest.tonic]} ${keyBest.mode === "major" ? "мажор" : "минор"}`,
    energy: Math.round(energy * 100) / 100,
    brightness: Math.round(brightness * 100) / 100,
    loudnessDb: Math.round(loudnessDb * 10) / 10,
  };
}

/** Браузер: скачать фрагмент, декодировать и проанализировать. */
export async function analyzePreview(url: string): Promise<AudioFeatures> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Фрагмент недоступен: ${res.status}`);
  const data = await res.arrayBuffer();
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  try {
    const buf = await ctx.decodeAudioData(data);
    const mono = new Float32Array(buf.length);
    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < d.length; i++) mono[i] += d[i] / buf.numberOfChannels;
    }
    return analyzeSamples(mono, buf.sampleRate);
  } finally {
    ctx.close().catch(() => {});
  }
}
