"use client";

import { resolvePreview } from "./music";
import { createRenderer, shaderParams } from "./shader";
import type { Day } from "./types";
import { rng, stampDate, visualParams } from "./visual";

/**
 * Сохранение живой открытки как видео 4:5 со звучащим фрагментом песни.
 * Кадр собирается на 2D-холсте: живой фон (тот же шейдер) + отпечаток, рамка, дата, подпись и название.
 * Запись идёт в реальном времени через MediaRecorder — 15 секунд.
 */

const W = 864;
const H = 1080;
const S = W / 343; // масштаб относительно открытки на телефоне

export type ExportResult = { blob: Blob; mime: string; withAudio: boolean };

const loadImg = (src: string) =>
  new Promise<HTMLImageElement | null>((res) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => res(i);
    i.onerror = () => res(null);
    i.src = src;
  });

function pickMime() {
  const types = ["video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  return types.find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) ?? "";
}

export function canExportVideo() {
  return typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && !!pickMime() && "captureStream" in HTMLCanvasElement.prototype;
}

function font(varName: string, fallback: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || fallback;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function coverDraw(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const k = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / k;
  const sh = h / k;
  ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x, y, w, h);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export async function exportPostcardVideo(day: Day, opts: { seconds?: number; onProgress?: (p: number) => void } = {}): Promise<ExportResult> {
  const seconds = opts.seconds ?? 15;
  const mime = pickMime();
  if (!mime) throw new Error("Этот браузер не умеет записывать видео");

  // Холсты
  const glCanvas = document.createElement("canvas");
  glCanvas.width = W;
  glCanvas.height = H;
  const renderer = createRenderer(glCanvas, shaderParams(day), { preserve: true });
  const out = document.createElement("canvas");
  out.width = W;
  out.height = H;
  const ctx = out.getContext("2d")!;

  // Шрифты и изображения
  await document.fonts.ready;
  const fHand = font("--font-caveat", "cursive");
  const fDisplay = font("--font-unbounded", "sans-serif");
  const fMono = font("--font-jetbrains", "monospace");
  const photos = await Promise.all(day.photos.map((p) => (p.src ? loadImg(p.src) : Promise.resolve(null))));

  // Звук: официальный фрагмент через Web Audio → дорожка в видео
  let audio: HTMLAudioElement | null = null;
  let actx: AudioContext | null = null;
  const tracks: MediaStreamTrack[] = [];
  try {
    const url = await resolvePreview(day.song);
    if (url) {
      audio = new Audio();
      audio.crossOrigin = "anonymous";
      audio.src = url;
      actx = new AudioContext();
      const src = actx.createMediaElementSource(audio);
      const dest = actx.createMediaStreamDestination();
      src.connect(dest);
      tracks.push(...dest.stream.getAudioTracks());
    }
  } catch {
    audio = null;
  }

  const v = visualParams(day);
  const [c1, c2, c3] = day.palette;
  const stars = (() => {
    const r = rng(day.passport.seed + 1);
    return Array.from({ length: 14 }, () => ({ x: r() * W, y: r() * 0.7 * H, o: 0.3 + r() * 0.5 }));
  })();
  const sats = day.photos.slice(1, 1 + v.satellites);
  const satPos = [
    { x: 0.08, y: 0.18, rot: -8 },
    { x: 0.68, y: 0.52, rot: 7 },
    { x: 0.12, y: 0.58, rot: 4 },
  ];

  const drawFrame = (t: number, beat: number, playing: boolean) => {
    // 1. Живой фон
    if (renderer) {
      renderer.render(t, beat, playing);
      ctx.drawImage(glCanvas, 0, 0);
    } else {
      ctx.fillStyle = "#171a3a";
      ctx.fillRect(0, 0, W, H);
    }
    // 2. Звёзды
    ctx.fillStyle = "#e6e4ff";
    for (const s of stars) {
      ctx.globalAlpha = s.o;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 0.75 * S, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 3. Отпечаток в ореолах (пульс по удару)
    const cx = W / 2;
    const cy = H * 0.44;
    const d = v.orb * W;
    const pulse = 1 + v.amp * Math.sin(Math.PI * (beat % 1)) ** 2;
    const halo = (k: number, color: string, alpha: number, p: number) => {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, (d * k * p) / 2, 0, Math.PI * 2);
      ctx.fill();
    };
    halo(2.6, c3 ?? c1, 0.07, pulse);
    halo(1.9, c1, 0.1, pulse);
    halo(1.4, c2 ?? c1, 0.26, 1 + (pulse - 1) * 0.6);
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, d / 2, 0, Math.PI * 2);
    ctx.clip();
    if (photos[0]) coverDraw(ctx, photos[0], cx - d / 2, cy - d / 2, d, d);
    else {
      ctx.fillStyle = day.photos[0]?.top ?? c1;
      ctx.fillRect(cx - d / 2, cy - d / 2, d, d * 0.55);
      ctx.fillStyle = day.photos[0]?.bottom ?? c2;
      ctx.fillRect(cx - d / 2, cy - d / 2 + d * 0.55, d, d * 0.45);
    }
    ctx.restore();
    ctx.lineWidth = 2 * S;
    ctx.strokeStyle = "#ffe3b5";
    ctx.beginPath();
    ctx.arc(cx, cy, d / 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 5 * S;
    ctx.strokeStyle = c2 ?? c1;
    ctx.beginPath();
    ctx.arc(cx, cy, d / 2 + 4.5 * S, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // 4. Отпечатки-спутники
    sats.forEach((ph, i) => {
      const size = 0.22 * W;
      ctx.save();
      ctx.translate(satPos[i].x * W + size / 2, satPos[i].y * H + size / 2);
      ctx.rotate((satPos[i].rot * Math.PI) / 180);
      ctx.fillStyle = "#e6e4ff";
      roundRect(ctx, -size / 2, -size / 2, size, size, 6 * S);
      ctx.fill();
      const inner = size - 6 * S;
      ctx.save();
      roundRect(ctx, -inner / 2, -inner / 2, inner, inner, 3 * S);
      ctx.clip();
      const img = photos[i + 1];
      if (img) coverDraw(ctx, img, -inner / 2, -inner / 2, inner, inner);
      else {
        ctx.fillStyle = ph.top;
        ctx.fillRect(-inner / 2, -inner / 2, inner, inner / 2);
        ctx.fillStyle = ph.bottom;
        ctx.fillRect(-inner / 2, 0, inner, inner / 2);
      }
      ctx.restore();
      ctx.restore();
    });

    // 5. Рамка-паспарту
    ctx.strokeStyle = "rgba(230,228,255,0.15)";
    ctx.lineWidth = 1 * S;
    roundRect(ctx, 8 * S, 8 * S, W - 16 * S, H - 16 * S, 12 * S);
    ctx.stroke();

    // 6. Дата-штамп
    ctx.fillStyle = "rgba(255,227,181,0.9)";
    ctx.font = `${11 * S}px ${fMono}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(stampDate(day.date), 16 * S, 16 * S);

    // 7. Подпись и название
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    const titleY = H - 20 * S;
    ctx.fillStyle = "#e6e4ff";
    ctx.font = `${16 * S}px ${fDisplay}`;
    ctx.fillText(day.title, W / 2, titleY);
    ctx.fillStyle = "#ffe3b5";
    ctx.font = `${22 * S}px ${fHand}`;
    const lines = wrap(ctx, `«${day.caption}»`, W - 40 * S);
    lines.reverse().forEach((line, i) => ctx.fillText(line, W / 2, titleY - 26 * S - i * 24 * S));
  };

  const stream = out.captureStream(30);
  const recorder = new MediaRecorder(new MediaStream([...stream.getVideoTracks(), ...tracks]), {
    mimeType: mime,
    videoBitsPerSecond: 6_000_000,
  });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise<void>((res) => (recorder.onstop = () => res()));

  drawFrame(0, 0, false);
  let withAudio = false;
  if (audio && actx) {
    try {
      await actx.resume();
      await audio.play();
      withAudio = true;
    } catch {
      withAudio = false;
    }
  }
  recorder.start(250);
  const start = performance.now();

  await new Promise<void>((resolve) => {
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      const beat = withAudio && audio ? (audio.currentTime * day.song.bpm) / 60 : (t * day.song.bpm) / 60;
      drawFrame(t, beat, withAudio);
      opts.onProgress?.(Math.min(1, t / seconds));
      if (t >= seconds) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  recorder.stop();
  await done;
  audio?.pause();
  await actx?.close().catch(() => {});
  renderer?.destroy();
  stream.getTracks().forEach((tr) => tr.stop());

  const type = mime.split(";")[0];
  return { blob: new Blob(chunks, { type }), mime: type, withAudio };
}
