import type { StarPoint } from "@/data/archive";
const MONTHS_GEN_PREP = ["в январе", "в феврале", "в марте", "в апреле", "в мае", "в июне", "в июле", "в августе", "в сентябре", "в октябре", "в ноябре", "в декабре"];

/**
 * Созвездия: дни с похожими паспортами соединяются линиями.
 * 1) расстояние между днями — евклидово по 8 осям паспорта;
 * 2) связываем пары ближе порога, компоненты связности от 3 дней — созвездия;
 * 3) внутри созвездия рисуем минимальное остовное дерево — как линии на звёздной карте;
 * 4) название — по правилам от центра созвездия (тот же язык, что и паспорт).
 * Положение на карте — проекция 8 осей на 2 главные компоненты (PCA).
 */

const THRESHOLD = 0.33;

export type Constellation = {
  name: string;
  members: string[];
  edges: [string, string][];
  center: { x: number; y: number };
  note: string;
};

export type SkyMap = {
  pos: Record<string, { x: number; y: number }>;
  constellations: Constellation[];
};

const dist = (a: number[], b: number[]) => Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0));

function pca2(points: number[][]) {
  const n = points.length;
  const dim = points[0].length;
  const mean = Array.from({ length: dim }, (_, j) => points.reduce((s, p) => s + p[j], 0) / n);
  const X = points.map((p) => p.map((v, j) => v - mean[j]));
  const cov = Array.from({ length: dim }, (_, a) =>
    Array.from({ length: dim }, (_, b) => X.reduce((s, row) => s + row[a] * row[b], 0) / n),
  );
  const power = (M: number[][], seed: number[]) => {
    let v = seed;
    for (let it = 0; it < 80; it++) {
      const w = M.map((row) => row.reduce((s, x, j) => s + x * v[j], 0));
      const len = Math.hypot(...w) || 1;
      v = w.map((x) => x / len);
    }
    return v;
  };
  const v1 = power(cov, Array.from({ length: dim }, (_, i) => 1 + i * 0.1));
  const l1 = v1.reduce((s, x, i) => s + x * cov[i].reduce((t, y, j) => t + y * v1[j], 0), 0);
  const deflated = cov.map((row, a) => row.map((x, b) => x - l1 * v1[a] * v1[b]));
  const v2 = power(deflated, Array.from({ length: dim }, (_, i) => (i % 2 ? 1 : -1) + i * 0.05));
  return X.map((row) => [row.reduce((s, x, j) => s + x * v1[j], 0), row.reduce((s, x, j) => s + x * v2[j], 0)]);
}

function nameFor(c: number[], topMonth: number): string {
  const [v, e, , w, , i, tod] = c;
  // ноябрь тоже считаем: первый снег — уже зима по ощущениям
  const winter = topMonth >= 10 || topMonth <= 1;
  if (i < 0.4 && e > 0.75 && v > 0.65) return "Шумные праздники";
  if (tod > 0.85 && e > 0.55) return "Ночи перед дедлайном";
  if (i < 0.45 && v > 0.65) return "Тёплые дни вместе";
  if (v < 0.4 && i > 0.65) return "Одинокие прогулки";
  if (e < 0.4 && i > 0.65 && winter) return "Тихие зимние окна";
  if (tod < 0.3 && e < 0.4) return "Тихие утра";
  if (e < 0.4 && i > 0.65) return w > 0.55 ? "Уютные вечера" : "Тихие вечера";
  return "Безымянное созвездие";
}

export function daysWord(n: number) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return `${n} день`;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return `${n} дня`;
  return `${n} дней`;
}

/**
 * Только для читаемости карты: раздвигаем созвездия друг от друга и чуть
 * «раскрываем» каждое изнутри. Состав созвездий от этого не меняется.
 */
function spreadForReading(pos: SkyMap["pos"], constellations: Constellation[], points: StarPoint[]) {
  const inConst = new Set(constellations.flatMap((c) => c.members));
  const groups = [...constellations.map((c) => c.members), ...points.filter((p) => !inConst.has(p.id)).map((p) => [p.id])];
  const centers = groups.map((g) => ({
    x: g.reduce((s, id) => s + pos[id].x, 0) / g.length,
    y: g.reduce((s, id) => s + pos[id].y, 0) / g.length,
  }));
  const offsets = groups.map((g, gi) => {
    const r = Math.max(0.01, ...g.map((id) => Math.hypot(pos[id].x - centers[gi].x, pos[id].y - centers[gi].y)));
    const k = g.length > 1 ? 9 / r : 0;
    return g.map((id) => ({ id, dx: (pos[id].x - centers[gi].x) * k, dy: (pos[id].y - centers[gi].y) * k }));
  });
  for (let it = 0; it < 120; it++) {
    for (let a = 0; a < centers.length; a++)
      for (let b = a + 1; b < centers.length; b++) {
        const dx = centers[b].x - centers[a].x;
        const dy = centers[b].y - centers[a].y;
        const d = Math.hypot(dx, dy) || 0.01;
        const min = 30;
        if (d < min) {
          const push = (min - d) / 2;
          centers[a].x -= (dx / d) * push;
          centers[a].y -= (dy / d) * push;
          centers[b].x += (dx / d) * push;
          centers[b].y += (dy / d) * push;
        }
      }
    for (const c of centers) {
      c.x = Math.min(82, Math.max(18, c.x));
      c.y = Math.min(92, Math.max(20, c.y));
    }
  }
  groups.forEach((_, gi) => offsets[gi].forEach(({ id, dx, dy }) => (pos[id] = { x: centers[gi].x + dx, y: centers[gi].y + dy })));
  constellations.forEach((c) => {
    c.center = {
      x: c.members.reduce((s, id) => s + pos[id].x, 0) / c.members.length,
      y: Math.min(...c.members.map((id) => pos[id].y)),
    };
  });
}

export function buildSkyMap(points: StarPoint[]): SkyMap {
  const proj = pca2(points.map((p) => p.axes));
  const xs = proj.map((p) => p[0]);
  const ys = proj.map((p) => p[1]);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const pos: SkyMap["pos"] = {};
  points.forEach((p, k) => {
    pos[p.id] = { x: 8 + ((proj[k][0] - minX) / (maxX - minX || 1)) * 84, y: 10 + ((proj[k][1] - minY) / (maxY - minY || 1)) * 88 };
  });

  // Компоненты связности (union-find)
  const parent = points.map((_, k) => k);
  const find = (k: number): number => (parent[k] === k ? k : (parent[k] = find(parent[k])));
  for (let a = 0; a < points.length; a++)
    for (let b = a + 1; b < points.length; b++) if (dist(points[a].axes, points[b].axes) < THRESHOLD) parent[find(a)] = find(b);
  const groups = new Map<number, number[]>();
  points.forEach((_, k) => groups.set(find(k), [...(groups.get(find(k)) ?? []), k]));

  const constellations: Constellation[] = [];
  for (const idx of groups.values()) {
    if (idx.length < 3) continue;
    // Минимальное остовное дерево (Прим)
    const inTree = new Set([idx[0]]);
    const edges: [string, string][] = [];
    while (inTree.size < idx.length) {
      let best: [number, number, number] = [-1, -1, Infinity];
      for (const a of inTree)
        for (const b of idx) if (!inTree.has(b)) {
          const d = dist(points[a].axes, points[b].axes);
          if (d < best[2]) best = [a, b, d];
        }
      inTree.add(best[1]);
      edges.push([points[best[0]].id, points[best[1]].id]);
    }
    const centroid = points[0].axes.map((_, j) => idx.reduce((s, k) => s + points[k].axes[j], 0) / idx.length);
    const months = new Map<number, number>();
    idx.forEach((k) => {
      const m = Number(points[k].date.slice(5, 7)) - 1;
      months.set(m, (months.get(m) ?? 0) + 1);
    });
    const topMonth = [...months.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const center = {
      x: idx.reduce((s, k) => s + pos[points[k].id].x, 0) / idx.length,
      y: Math.min(...idx.map((k) => pos[points[k].id].y)),
    };
    constellations.push({
      name: nameFor(centroid, topMonth),
      members: idx.map((k) => points[k].id),
      edges,
      center,
      note: `${daysWord(idx.length)} · чаще всего ${MONTHS_GEN_PREP[topMonth]}`,
    });
  }
  spreadForReading(pos, constellations, points);

  // Одинаковые названия различаем порядковым номером
  const seen = new Map<string, number>();
  for (const c of constellations) {
    const n = (seen.get(c.name) ?? 0) + 1;
    seen.set(c.name, n);
    if (n > 1) c.name = `${c.name} ${["", "", "II", "III", "IV"][n] ?? n}`;
  }
  return { pos, constellations: constellations.sort((a, b) => b.members.length - a.members.length) };
}
