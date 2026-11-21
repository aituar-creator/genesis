import { derivePassport, explainDay, styleWeights } from "./rules";
import { analyzeText, captionFor, seasonOf, titleFor } from "./text-mood";
import type { Day, PhotoStub, Song, TextMood } from "./types";

export type DayInput = {
  id: string;
  date: string;
  time: string;
  text: string;
  song: Song;
  palette: [string, string, string, string];
  /** data URL настоящих фото; пусто — нарисуем отпечаток из палитры. */
  photos: string[];
  /** Можно передать готовое настроение текста (демо), иначе считаем словарём. */
  mood?: TextMood;
  /** Готовые название и подпись (от Claude); иначе собираем сами. */
  title?: string;
  caption?: string;
  analyzedBy?: Day["analyzedBy"];
};

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Полный путь «ввод → паспорт → правила → открытка» для одной записи. */
export function buildDay(input: DayInput): Day {
  const mood = input.mood ?? analyzeText(input.text, input.time);
  const pal = input.palette;
  const photos: PhotoStub[] = input.photos.length
    ? input.photos.map((src, k) => ({ src, top: pal[k % 4], bottom: pal[(k + 1) % 4] }))
    : [{ top: pal[0], bottom: pal[1] }];
  const passport = derivePassport({ mood, song: input.song, palette: pal, photoCount: input.photos.length || 1, seed: hash(input.id) });
  const styles = styleWeights(passport);
  return {
    id: input.id,
    date: input.date,
    time: input.time,
    text: input.text,
    title: input.title ?? titleFor(input.date, mood),
    caption: input.caption ?? captionFor(input.text, mood),
    palette: pal,
    photos,
    song: input.song,
    textMood: mood,
    passport,
    styles,
    explain: explainDay(passport, styles, input.song, mood, pal),
    season: seasonOf(input.date),
    withFriends: (mood.hits?.people.length ?? 0) > 0,
    analyzedBy: input.analyzedBy,
  };
}
