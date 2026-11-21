import { paletteWarmth, warmthWord } from "./palette";
import type { Axis, AxisSource, Day, Passport, Song, StyleKey, TextMood } from "./types";
import { STYLE_META } from "./visual";

/**
 * Движок правил: ввод (текст, фото, песня) → паспорт дня → веса художественных приёмов → объяснение.
 * Это сердце продукта: никакой генерации, только явные и объяснимые формулы.
 */

const clamp = (x: number) => Math.max(0, Math.min(1, x));
const t = (note: string, weight = 1): AxisSource => ({ input: "text", note, weight });
const p = (note: string, weight = 1): AxisSource => ({ input: "photo", note, weight });
const m = (note: string, weight = 1): AxisSource => ({ input: "music", note, weight });
const ax = (value: number, ...sources: AxisSource[]): Axis => ({ value: clamp(value), sources });

export type RuleInputs = {
  mood: TextMood;
  song: Song;
  palette: string[];
  photoCount: number;
  seed: number;
};

export function derivePassport({ mood, song, palette, photoCount, seed }: RuleInputs): Passport {
  const modeLight = song.mode === "major" ? 0.8 : 0.25;
  const brightSadness = mood.valence < 0.45 && song.mode === "major";
  const warmth = paletteWarmth(palette);

  return {
    valence: ax(0.6 * mood.valence + 0.4 * modeLight, t("настроение текста", 0.6), m(song.mode === "major" ? "мажор" : "минор", 0.4)),
    energy: ax(0.5 * mood.energy + 0.5 * song.energy, t("насыщенность текста", 0.5), m("энергия фрагмента", 0.5)),
    tempo: ax((song.bpm - 60) / 80, m(`${song.bpm} ударов в минуту`)),
    temperature: ax(warmth + (brightSadness ? 0.15 : 0), p(`${warmthWord(warmth)} тона фото`)),
    density: ax(mood.density * 0.75 + Math.min(photoCount, 4) * 0.06, t("события и люди"), p(`${photoCount} кадр.`)),
    intimacy: ax(mood.intimacy, t("наедине или с людьми")),
    timeOfDay: ax(mood.timeOfDay, t("время суток в тексте")),
    era: ax((song.year - 1950) / 70, m(`${song.year}`)),
    conflict: brightSadness ? { kind: "bright-sadness", strength: clamp((0.45 - mood.valence) * 2 + 0.4) } : undefined,
    seed,
  };
}

/** Функции активации приёмов. Каждая — произведение осей, которые «включают» приём. */
export function styleWeights(ps: Passport): Partial<Record<StyleKey, number>> {
  const v = ps.valence.value;
  const e = ps.energy.value;
  const tp = ps.tempo.value;
  const w = ps.temperature.value;
  const d = ps.density.value;
  const i = ps.intimacy.value;
  const tod = ps.timeOfDay.value;
  const era = ps.era.value;

  const raw: Record<StyleKey, number> = {
    impressionism: (1 - e) * (0.3 + 0.7 * w) * (1 - 0.8 * tp),
    kandinsky: e * tp * (1 - 0.6 * w),
    rothko: (1 - v) * (1 - e) * (0.3 + 0.7 * i),
    ma: (1 - e) * (1 - d) * i * (1 - 0.7 * tod),
    film: (1 - era) * (0.4 + 0.6 * w) * (0.3 + 0.9 * (1 - i)),
    collage: d * (0.2 + 0.6 * e),
    turner: e * (1 - Math.abs(v - 0.5) * 1.6) * (1 - 0.5 * tp),
    popart: v * e * tp * w * 1.4,
  };
  if (ps.conflict?.kind === "bright-sadness") {
    raw.impressionism *= 1.6;
    raw.film *= 1.3;
  }

  const sq = (Object.entries(raw) as [StyleKey, number][]).map(([k, x]) => [k, Math.max(0, x) ** 2] as const);
  const sum = sq.reduce((s, [, x]) => s + x, 0) || 1;
  const top = sq
    .map(([k, x]) => [k, x / sum] as const)
    .sort((a, b) => b[1] - a[1])
    .filter(([, x], idx) => idx === 0 || x >= 0.08)
    .slice(0, 3);
  const topSum = top.reduce((s, [, x]) => s + x, 0);
  const rounded = top.map(([k, x]) => [k, Math.round((x / topSum) * 20) / 20] as const).filter(([, x]) => x > 0);
  const drift = 1 - rounded.reduce((s, [, x]) => s + x, 0);
  const out: Partial<Record<StyleKey, number>> = {};
  rounded.forEach(([k, x], idx) => (out[k] = Math.round((idx === 0 ? x + drift : x) * 100) / 100));
  return out;
}

const STYLE_REASON: Record<StyleKey, string> = {
  impressionism: "день спокойный и тёплый: мазки размывают детали, как это делает память",
  kandinsky: "энергия высокая и ритм быстрый: геометрия и диагонали передают напряжение",
  rothko: "день тяжёлый и тихий: большие пустые поля дают воздух",
  ma: "тишина наедине с собой: смысл держится на пустом пространстве",
  film: "тепло, люди рядом и песня прошлых лет: засветы и тёплое зерно старых снимков",
  collage: "событий много: фрагменты наслаиваются, как сам день",
  turner: "эмоции сильные: стихия света становится метафорой чувства",
  popart: "чистая радость и танцевальный темп: яркий плоский цвет без полутонов",
};

function eraFilm(year: number) {
  if (year < 1975) return "тёплое зерно старой плёнки";
  if (year < 1995) return "VHS-артефакты";
  return "чистое цифровое изображение";
}

export function explainDay(ps: Passport, styles: Partial<Record<StyleKey, number>>, song: Song, mood: TextMood, palette: string[]): Day["explain"] {
  const tp = ps.tempo.value;
  const lines: Day["explain"] = [];
  lines.push({
    icon: "music",
    text: `${song.measured ? "Послушали фрагмент песни: " : ""}${song.bpm} ударов в минуту, ${song.key ?? (song.mode === "major" ? "мажор" : "минор")} — кадры ${
      tp < 0.35 ? "сменяются медленно" : tp > 0.65 ? "бьются в резком ритме" : "идут спокойным шагом"
    }${song.mode === "minor" ? ", насыщенность снижена" : ""}${song.measured === false ? " (оценено по жанру и году)" : ""}`,
  });
  if (mood.emotions?.length) {
    lines.push({ icon: "text", text: `В тексте слышно: ${mood.emotions.join(", ")}` });
  }
  if (ps.conflict) {
    lines.push({ icon: "text", text: "Грустный текст и светлая песня — «светлая грусть»: тёплая палитра, медленный ритм и много пустоты" });
  } else if (mood.hits && (mood.hits.positive.length || mood.hits.negative.length)) {
    const words = [...mood.hits.positive, ...mood.hits.negative].slice(0, 3).map((w) => `«${w}»`).join(", ");
    lines.push({ icon: "text", text: `В тексте ${words} — ${ps.valence.value > 0.55 ? "больше света и воздуха" : "палитра приглушена"}` });
  }
  if (mood.hits?.details.length) {
    lines.push({ icon: "cup", text: `Деталь дня: ${mood.hits.details.slice(0, 2).map((w) => `«${w}»`).join(", ")} — она попала в название и подпись` });
  }
  lines.push({ icon: "photo", text: `${warmthWord(paletteWarmth(palette))[0].toUpperCase()}${warmthWord(paletteWarmth(palette)).slice(1)} тона фото — основа палитры` });
  lines.push({ icon: "clock", text: `Песня ${song.year} года — ${eraFilm(song.year)}` });
  const top = (Object.entries(styles) as [StyleKey, number][]).sort((a, b) => b[1] - a[1])[0];
  if (top) lines.push({ icon: "people", text: `Главный приём — ${STYLE_META[top[0]].label}, потому что ${STYLE_REASON[top[0]]}` });
  return lines;
}

/** Пересчёт существующего дня с другими вводными — основа ремикса «А что если…». */
export function remixDay(day: Day, change: { song?: Song; palette?: [string, string, string, string]; valence?: number }): Day {
  const song = change.song ?? day.song;
  const palette = change.palette ?? day.palette;
  const mood: TextMood = { ...day.textMood, valence: change.valence ?? day.textMood.valence };
  const passport = derivePassport({ mood, song, palette, photoCount: day.photos.length, seed: day.passport.seed });
  const styles = styleWeights(passport);
  const photos = change.palette
    ? day.photos.map((ph, k) => ({ ...ph, top: palette[k % 4], bottom: palette[(k + 1) % 4] }))
    : day.photos;
  return { ...day, song, palette, photos, textMood: mood, passport, styles, explain: explainDay(passport, styles, song, mood, palette) };
}

/** Что изменилось между двумя версиями дня — человеческими словами. */
export function diffDays(a: Day, b: Day): string[] {
  const out: string[] = [];
  const d = (k: keyof Omit<Passport, "seed" | "conflict">) => b.passport[k].value - a.passport[k].value;
  if (a.song.bpm !== b.song.bpm)
    out.push(`Темп ${a.song.bpm} → ${b.song.bpm} bpm: ореолы пульсируют ${b.song.bpm > a.song.bpm ? "быстрее" : "медленнее"}`);
  if (Math.abs(d("energy")) > 0.08) out.push(`Энергия ${d("energy") > 0 ? "выше" : "ниже"} — движение ${d("energy") > 0 ? "резче, контраст сильнее" : "мягче"}`);
  if (Math.abs(d("valence")) > 0.08) out.push(`Свет ${d("valence") > 0 ? "ярче" : "тише"} — ${d("valence") > 0 ? "больше воздуха в кадре" : "насыщенность приглушена"}`);
  if (Math.abs(d("temperature")) > 0.1) out.push(`Палитра ${d("temperature") > 0 ? "теплее" : "холоднее"}`);
  if (Math.abs(d("era")) > 0.15) out.push(`Эпоха песни ${a.song.year} → ${b.song.year}: ${eraFilm(b.song.year)}`);
  if (!a.passport.conflict && b.passport.conflict) out.push("Появился внутренний конфликт — «светлая грусть»");
  if (a.passport.conflict && !b.passport.conflict) out.push("Внутренний конфликт ушёл — текст и песня звучат в унисон");
  const topA = Object.entries(a.styles).sort((x, y) => y[1] - x[1])[0]?.[0] as StyleKey;
  const topB = Object.entries(b.styles).sort((x, y) => y[1] - x[1])[0]?.[0] as StyleKey;
  if (topA !== topB) out.push(`Главный приём: ${STYLE_META[topA].label} → ${STYLE_META[topB].label}`);
  return out;
}
