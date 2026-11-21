import { hexToRgb } from "./palette";
import type { Day, StyleKey } from "./types";
import { visualParams } from "./visual";

/**
 * Живая открытка: один фрагментный шейдер WebGL2, в котором 8 художественных приёмов
 * смешиваются по весам паспорта дня. Каждый приём — своя функция цвета; ритм — от темпа песни.
 */

export const STYLE_ORDER: StyleKey[] = ["impressionism", "kandinsky", "rothko", "ma", "film", "collage", "turner", "popart"];

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
out vec4 outColor;

uniform vec2 uRes;
uniform float uTime;
uniform float uBeat;      // непрерывный счётчик ударов
uniform float uAmp;       // сила пульса (энергия дня)
uniform vec3 uPal[4];
uniform float uW[8];      // веса приёмов
uniform float uSeed;
uniform float uGrain;
uniform float uVignette;
uniform float uEra;
uniform float uValence;
uniform float uPlaying;   // 1 — сейчас играет песня

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21) + uSeed); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return v;
}
vec3 pal(float t) {
  t = fract(t) * 4.0;
  int i = int(floor(t));
  float f = smoothstep(0.0, 1.0, fract(t));
  vec3 a = uPal[i];
  vec3 b = uPal[(i + 1) % 4];
  return mix(a, b, f);
}
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float sdSeg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }

vec3 night() { return mix(vec3(0.05, 0.06, 0.14), uPal[3] * 0.4, 0.45); }

// 1. Импрессионизм: короткие мазки, цвет плывёт по палитре
vec3 impressionism(vec2 q, float t) {
  vec2 w = q + 0.25 * vec2(fbm(q * 2.0 + t * 0.05), fbm(q * 2.0 - t * 0.04));
  float ang = fbm(w * 1.5) * 6.2831;
  vec2 r = rot(ang) * (q * 38.0);
  float stroke = smoothstep(0.35, 0.9, noise(vec2(r.x * 0.35, r.y * 2.2) + t * 0.1));
  vec3 c = pal(fbm(w * 1.8 + t * 0.02) * 1.3);
  vec3 base = mix(night(), pal(fbm(w * 0.8) + 0.3) * 0.55, 0.6);
  return mix(base, c * 0.95, stroke * 0.8);
}

// 2. Кандинский: окружности, отрезки, жёсткая геометрия, движение по удару
vec3 kandinsky(vec2 q, float t, float pulse) {
  vec3 col = night() * 0.9;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    vec2 c = vec2(hash(vec2(fi, 1.0)) - 0.5, hash(vec2(fi, 2.0)) - 0.5) * vec2(0.7, 0.9);
    c += 0.03 * vec2(sin(t * 0.7 + fi), cos(t * 0.5 + fi));
    float r = 0.06 + 0.12 * hash(vec2(fi, 3.0)) + pulse * 0.02;
    float d = length(q - c);
    float ring = smoothstep(0.008, 0.0, abs(d - r) - 0.004);
    float disk = smoothstep(r * 0.55, r * 0.5, d) * step(0.5, hash(vec2(fi, 4.0)));
    col = mix(col, uPal[i % 4], max(ring, disk * 0.8));
  }
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    vec2 a = vec2(hash(vec2(fi, 7.0)) - 0.5, hash(vec2(fi, 8.0)) - 0.5) * vec2(0.8, 1.0);
    float ang = hash(vec2(fi, 9.0)) * 3.14 + sin(t * 0.3 + fi) * 0.1;
    float len = 0.25 + 0.3 * hash(vec2(fi, 10.0)) + pulse * 0.05;
    float d = sdSeg(q, a, a + len * vec2(cos(ang), sin(ang)));
    col = mix(col, uPal[(i + 1) % 4], smoothstep(0.006, 0.0, d - 0.002 * (1.0 + fi)));
  }
  return col;
}

// 3. Цветовые поля Ротко: два мягких прямоугольника, дышат
vec3 rothko(vec2 q, float t) {
  vec3 col = night();
  float breathe = 0.01 * sin(t * 0.4);
  float edge = 0.03 + 0.02 * fbm(q * 6.0 + t * 0.05);
  float top = smoothstep(edge, 0.0, max(abs(q.x) - 0.33 - breathe, abs(q.y - 0.2) - 0.22 - breathe));
  float bot = smoothstep(edge, 0.0, max(abs(q.x) - 0.33 - breathe, abs(q.y + 0.27) - 0.17 - breathe));
  col = mix(col, uPal[3] * 1.1 + 0.03, top * 0.9);
  col = mix(col, uPal[1] * 0.9, bot * 0.85);
  return col + (fbm(q * 9.0) - 0.5) * 0.04;
}

// 4. Пустота «ма»: почти ничего, одно солнце и линия горизонта
vec3 ma(vec2 q, float t) {
  vec3 col = mix(night(), uPal[0] * 0.35, 0.35 + 0.15 * q.y);
  float sun = smoothstep(0.07, 0.065, length(q - vec2(0.22, 0.3 + 0.01 * sin(t * 0.2))));
  col = mix(col, uPal[2], sun * 0.85);
  float horizon = smoothstep(0.003, 0.0, abs(q.y + 0.18)) * smoothstep(0.45, 0.2, abs(q.x));
  return mix(col, uPal[0], horizon * 0.6);
}

// 5. Плёнка: тёплый градиент, бегущие засветы, мерцание
vec3 film(vec2 q, float t) {
  vec3 col = mix(uPal[3] * 0.5, uPal[0] * 0.7, smoothstep(-0.5, 0.6, q.y));
  vec2 lp = vec2(0.45 + 0.1 * sin(t * 0.3), 0.5 + 0.08 * cos(t * 0.23));
  float leak = exp(-4.0 * length(q - lp)) + 0.6 * exp(-6.0 * length(q - vec2(-0.5, -0.4 + 0.1 * sin(t * 0.17))));
  col += uPal[2] * leak * 0.9 + vec3(0.25, 0.1, 0.0) * leak * 0.5;
  col *= 0.95 + 0.05 * noise(vec2(t * 8.0, 0.0));
  return col;
}

// 6. Коллаж: повёрнутые фрагменты, перекладываются на каждый удар
vec3 collage(vec2 q, float t, float beatStep) {
  vec3 col = night();
  for (int i = 0; i < 7; i++) {
    float fi = float(i) + beatStep * 0.37;
    vec2 c = vec2(hash(vec2(floor(fi), 11.0)) - 0.5, hash(vec2(floor(fi), 12.0)) - 0.5) * vec2(0.8, 1.0);
    vec2 p = rot(hash(vec2(floor(fi), 13.0)) * 1.2 - 0.6) * (q - c);
    vec2 s = vec2(0.08 + 0.12 * hash(vec2(floor(fi), 14.0)), 0.06 + 0.1 * hash(vec2(floor(fi), 15.0)));
    float box = smoothstep(0.004, 0.0, max(abs(p.x) - s.x, abs(p.y) - s.y));
    col = mix(col, uPal[i % 4] * (0.8 + 0.2 * noise(p * 30.0)), box * 0.85);
  }
  return col;
}

// 7. Свет Тёрнера: вихрь, яркое ядро, стихия
vec3 turner(vec2 q, float t) {
  vec2 p = q - vec2(0.0, 0.08);
  float r = length(p);
  float a = atan(p.y, p.x) + 1.6 / (r + 0.25) + t * 0.25;
  vec2 sw = vec2(cos(a), sin(a)) * r;
  float f = fbm(sw * 3.5 + t * 0.1);
  vec3 col = mix(uPal[3] * 0.4, uPal[1], f);
  col = mix(col, uPal[0] * 1.2 + 0.1, smoothstep(0.35, 0.0, r) * 0.8);
  return col + vec3(1.0, 0.9, 0.7) * exp(-8.0 * r) * 0.35;
}

// 8. Поп-арт: полутоновые точки, плоский яркий цвет, точки пульсируют
vec3 popart(vec2 q, float t, float pulse) {
  float band = floor((q.y + 0.5) * 4.0 + 0.3 * sin(q.x * 3.0 + t * 0.5));
  vec3 bg = uPal[int(mod(band, 4.0))];
  vec2 g = q * 34.0;
  vec2 cell = fract(g) - 0.5;
  float lum = 0.25 + 0.25 * sin(length(q) * 9.0 - t * 1.5) + pulse * 0.25;
  float dot_ = smoothstep(lum * 0.5 + 0.02, lum * 0.5, length(cell));
  return mix(bg * 0.85, uPal[(int(mod(band, 4.0)) + 2) % 4], dot_);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 q = (uv - 0.5) * vec2(aspect, 1.0);
  float t = uTime;
  float pulse = pow(1.0 - fract(uBeat), 3.0) * uAmp * (1.0 + uPlaying);
  float beatStep = floor(uBeat);

  vec3 acc = vec3(0.0);
  float wsum = 0.0;
  if (uW[0] > 0.01) { acc += uW[0] * impressionism(q, t); wsum += uW[0]; }
  if (uW[1] > 0.01) { acc += uW[1] * kandinsky(q, t, pulse); wsum += uW[1]; }
  if (uW[2] > 0.01) { acc += uW[2] * rothko(q, t); wsum += uW[2]; }
  if (uW[3] > 0.01) { acc += uW[3] * ma(q, t); wsum += uW[3]; }
  if (uW[4] > 0.01) { acc += uW[4] * film(q, t); wsum += uW[4]; }
  if (uW[5] > 0.01) { acc += uW[5] * collage(q, t, beatStep); wsum += uW[5]; }
  if (uW[6] > 0.01) { acc += uW[6] * turner(q, t); wsum += uW[6]; }
  if (uW[7] > 0.01) { acc += uW[7] * popart(q, t, pulse); wsum += uW[7]; }
  vec3 col = wsum > 0.0 ? acc / wsum : night();

  // Свет дня: светлые дни чуть ярче и воздушнее
  col = mix(col, col * 1.15 + 0.03, uValence * 0.5);
  // Пульс под удар песни
  col *= 1.0 + pulse * 0.18;
  // Виньетка — близость
  col *= 1.0 - uVignette * smoothstep(0.35, 0.85, length(q * vec2(1.15, 0.95)));
  // VHS для песен 80-х и 90-х: строки развёртки
  float vhs = smoothstep(0.35, 0.45, uEra) * smoothstep(0.75, 0.65, uEra);
  col *= 1.0 - vhs * 0.07 * (0.5 + 0.5 * sin(gl_FragCoord.y * 1.7 + t * 30.0));
  // Плёночное зерно — всегда, меняется только характер
  col += (hash(gl_FragCoord.xy * 0.73 + floor(t * 24.0)) - 0.5) * uGrain;

  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

export type ShaderParams = {
  palette: number[]; // 12 чисел
  weights: number[]; // 8 чисел
  seed: number;
  amp: number;
  grain: number;
  vignette: number;
  era: number;
  valence: number;
  bpm: number;
};

export function shaderParams(day: Day): ShaderParams {
  const v = visualParams(day);
  return {
    palette: day.palette.flatMap((h) => hexToRgb(h).map((c) => c / 255)),
    weights: STYLE_ORDER.map((k) => day.styles[k] ?? 0),
    seed: (day.passport.seed % 997) / 997,
    amp: v.amp * 4,
    grain: 0.05 + v.grain * 0.5,
    vignette: Math.min(0.85, v.vignette),
    era: day.passport.era.value,
    valence: day.passport.valence.value,
    bpm: day.song.bpm,
  };
}

export type PostcardRenderer = {
  render: (timeSec: number, beat: number, playing: boolean) => void;
  resize: (w: number, h: number) => void;
  setParams: (p: ShaderParams) => void;
  destroy: () => void;
};

/** Создаёт рендерер на канвасе. Возвращает null, если WebGL2 недоступен. */
export function createRenderer(canvas: HTMLCanvasElement, params: ShaderParams, opts: { preserve?: boolean } = {}): PostcardRenderer | null {
  const gl = canvas.getContext("webgl2", { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: !!opts.preserve });
  if (!gl) return null;

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader compile error");
    return s;
  };
  let prog: WebGLProgram;
  try {
    prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link error");
  } catch (e) {
    console.warn("Шейдер открытки не собрался, остаёмся на статичной версии:", e);
    return null;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const u = (n: string) => gl.getUniformLocation(prog, n);
  const U = {
    res: u("uRes"), time: u("uTime"), beat: u("uBeat"), amp: u("uAmp"), pal: u("uPal"), w: u("uW"), seed: u("uSeed"),
    grain: u("uGrain"), vignette: u("uVignette"), era: u("uEra"), valence: u("uValence"), playing: u("uPlaying"),
  };

  const apply = (p: ShaderParams) => {
    gl.uniform3fv(U.pal, p.palette);
    gl.uniform1fv(U.w, p.weights);
    gl.uniform1f(U.seed, p.seed);
    gl.uniform1f(U.amp, p.amp);
    gl.uniform1f(U.grain, p.grain);
    gl.uniform1f(U.vignette, p.vignette);
    gl.uniform1f(U.era, p.era);
    gl.uniform1f(U.valence, p.valence);
  };
  apply(params);

  return {
    render(timeSec, beat, playing) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(U.res, canvas.width, canvas.height);
      gl.uniform1f(U.time, timeSec);
      gl.uniform1f(U.beat, beat);
      gl.uniform1f(U.playing, playing ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    resize(w, h) {
      canvas.width = w;
      canvas.height = h;
    },
    setParams: apply,
    destroy() {
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
