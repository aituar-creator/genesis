import type { AxisKey, Day, StyleKey } from "./types";

/** Правила: паспорт → визуальные параметры открытки. Прототипная версия таблицы из docs/PLAN.md. */
export function visualParams(day: Day) {
  const ps = day.passport;
  return {
    /** Длительность одного удара, с — пульс свечения. */
    beat: 60 / day.song.bpm,
    /** Амплитуда пульса — энергия. */
    amp: 0.02 + ps.energy.value * 0.08,
    /** Размер главного отпечатка — близость. */
    orb: 0.4 + ps.intimacy.value * 0.18,
    /** Сколько отпечатков-спутников — плотность. */
    satellites: Math.min(day.photos.length - 1, Math.round(ps.density.value * 3)),
    /** Сила зерна — эпоха (старее → больше зерна). */
    grain: 0.06 + (1 - ps.era.value) * 0.12,
    /** Виньетка — близость. */
    vignette: 0.25 + ps.intimacy.value * 0.45,
  };
}

export const STYLE_META: Record<StyleKey, { label: string; color: string }> = {
  impressionism: { label: "импрессионизм", color: "#f2a65a" },
  kandinsky: { label: "Кандинский", color: "#9c97e8" },
  rothko: { label: "цветовые поля", color: "#8a6a9b" },
  ma: { label: "пустота «ма»", color: "#e6e4ff" },
  film: { label: "плёнка", color: "#8c9bc2" },
  collage: { label: "коллаж", color: "#7fe0b0" },
  turner: { label: "свет Тёрнера", color: "#e8c25a" },
  popart: { label: "поп-арт", color: "#e8736a" },
};

export const AXIS_META: { key: AxisKey; label: string }[] = [
  { key: "valence", label: "свет" },
  { key: "energy", label: "энергия" },
  { key: "tempo", label: "темп" },
  { key: "temperature", label: "тепло" },
  { key: "density", label: "плотность" },
  { key: "intimacy", label: "близость" },
  { key: "timeOfDay", label: "время" },
  { key: "era", label: "эпоха" },
];

export const CONFLICT_LABEL = { "bright-sadness": "светлая грусть" } as const;

const MONTHS_GEN = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

export const MONTHS_SHORT = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

/** 2026-11-21 → 21.11.2026 */
export function stampDate(iso: string) {
  const [y, mo, d] = iso.split("-");
  return `${d}.${mo}.${y}`;
}

/** 2026-11-21 → 21 ноября */
export function humanDate(iso: string) {
  const [, mo, d] = iso.split("-");
  return `${Number(d)} ${MONTHS_GEN[Number(mo) - 1]}`;
}

/** Детерминированный генератор псевдослучайных чисел (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let r = Math.imul(a ^ (a >>> 15), 1 | a);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function isWarm(day: Day) {
  return day.passport.temperature.value >= 0.5;
}
