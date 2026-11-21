import type { Season, TextMood } from "./types";

/**
 * ВРЕМЕННАЯ замена языковой модели для прототипа: словарь корней слов.
 * В рабочей версии этот модуль заменит вызов Claude со строгой JSON-схемой (docs/PLAN.md, этап 1).
 * Контракт тот же: текст → TextMood + название + подпись из слов пользователя.
 */

const POSITIVE = ["рад", "счаст", "смея", "смеял", "смех", "люб", "весел", "класс", "кайф", "улыб", "праздн", "уют", "обня", "солн", "свобод", "спасает", "тепл", "нежн", "восторг", "ура", "красив", "лучш"];
const NEGATIVE = ["груст", "печал", "тоск", "устал", "одино", "плак", "страш", "тяжел", "тяжёл", "скуч", "боль", "злость", "злю", "тревог", "пуст", "закончил", "проводил", "жаль", "обид", "холодн", "плохо"];
const LIVELY = ["танц", "бег", "крич", "быстр", "дедлайн", "концерт", "вечеринк", "гроз", "спешил", "бешен", "поехал", "ехали", "прыг", "гуля", "работ", "сдач", "много", "толп"];
const CALM = ["тих", "спокой", "медлен", "лежал", "сидел", "плед", "чай", "спал", "молча", "тишин", "смотрел", "ничего", "никуда", "окн"];
const PEOPLE = ["друз", "мы", "компани", "вместе", "мам", "пап", "сестр", "брат", "подруг", "друг", "семь", "коллег", "команд", "бабушк", "дедушк"];
const DETAILS: [string, string][] = [
  ["какао", "какао"], ["кофе", "кофе"], ["чай", "чай"], ["снег", "снег"], ["дожд", "дождь"], ["море", "море"],
  ["гроз", "гроза"], ["костр", "костёр"], ["костёр", "костёр"], ["торт", "торт"], ["закат", "закат"], ["рассвет", "рассвет"],
  ["поезд", "поезд"], ["вокзал", "вокзал"], ["парк", "парк"], ["окн", "окно"], ["крыш", "крыша"], ["кухн", "кухня"],
  ["озер", "озеро"], ["озёр", "озеро"], ["лес", "лес"], ["метро", "метро"], ["офис", "офис"], ["музык", "музыка"],
  ["книг", "книга"], ["кино", "кино"], ["пицц", "пицца"], ["звёзд", "звёзды"], ["звезд", "звёзды"], ["гитар", "гитара"],
  ["пирог", "пирог"], ["пластинк", "пластинки"], ["фонар", "фонари"], ["листь", "листья"], ["пляж", "пляж"], ["горы", "горы"], ["гор", "горы"], ["дач", "дача"],
];

const MONTH_ADJ = ["Январск", "Февральск", "Мартовск", "Апрельск", "Майск", "Июньск", "Июльск", "Августовск", "Сентябрьск", "Октябрьск", "Ноябрьск", "Декабрьск"];

const words = (text: string) => text.toLowerCase().replace(/ё/g, "е").match(/[а-яa-z]+/g) ?? [];
const norm = (s: string) => s.replace(/ё/g, "е");

function hitsFor(ws: string[], stems: string[]) {
  const found = new Set<string>();
  for (const w of ws) if (stems.some((s) => w.startsWith(norm(s)))) found.add(w);
  return [...found];
}

export function seasonOf(isoDate: string): Season {
  const mo = Number(isoDate.slice(5, 7));
  return mo === 12 || mo <= 2 ? "winter" : mo <= 5 ? "spring" : mo <= 8 ? "summer" : "autumn";
}

export function analyzeText(text: string, time: string): TextMood {
  const ws = words(text);
  const positive = hitsFor(ws, POSITIVE);
  const negative = hitsFor(ws, NEGATIVE);
  const lively = hitsFor(ws, LIVELY);
  const calm = hitsFor(ws, CALM);
  const people = hitsFor(ws, PEOPLE);
  const details = [...new Set(ws.flatMap((w) => DETAILS.filter(([s]) => w.startsWith(norm(s))).map(([, name]) => name)))];
  const sentences = text.split(/[.!?…]+/).filter((s) => s.trim()).length;

  const clamp = (x: number, lo = 0.05, hi = 0.95) => Math.max(lo, Math.min(hi, x));
  const lower = text.toLowerCase();
  const hour = Number(time.slice(0, 2));
  const timeOfDay = /утр|проснул|рассвет/.test(lower)
    ? 0.12
    : /ноч/.test(lower)
      ? 0.95
      : /вечер|закат/.test(lower)
        ? 0.75
        : /днём|днем|обед/.test(lower)
          ? 0.45
          : hour < 11 ? 0.15 : hour < 17 ? 0.45 : hour < 22 ? 0.75 : 0.9;

  return {
    valence: clamp(0.5 + 0.14 * (positive.length - negative.length)),
    energy: clamp(0.4 + 0.13 * (lively.length - calm.length)),
    density: clamp(0.12 + 0.05 * sentences + 0.08 * people.length + 0.05 * details.length),
    intimacy: people.length ? clamp(0.55 - 0.1 * people.length, 0.15) : 0.85,
    timeOfDay,
    hits: { positive, negative, calm, lively, details, people },
  };
}

/** Название дня: «Ноябрьский вечер и какао». Единый спокойный тон, 3–7 слов, без эмодзи. */
export function titleFor(isoDate: string, mood: TextMood) {
  const part = mood.timeOfDay < 0.3 ? ["утро", "ое"] : mood.timeOfDay < 0.6 ? ["день", "ий"] : mood.timeOfDay < 0.9 ? ["вечер", "ий"] : ["ночь", "ая"];
  const adj = MONTH_ADJ[Number(isoDate.slice(5, 7)) - 1] + part[1];
  const detail = mood.hits?.details[0];
  return detail ? `${adj} ${part[0]} и ${detail}` : `${adj} ${part[0]}`;
}

/** Подпись — всегда дословный фрагмент текста пользователя (его голос, а не алгоритма). */
export function captionFor(text: string, mood: TextMood) {
  const clauses = text
    .split(/[.!?…;:,—–\n]+/)
    .map((c) => c.trim())
    .filter(Boolean);
  const fits = (c: string) => {
    const n = c.split(/\s+/).length;
    return n >= 3 && n <= 8;
  };
  const has = (c: string, list: string[] = []) => list.some((w) => c.toLowerCase().replace(/ё/g, "е").includes(w));
  const pick =
    clauses.find((c) => fits(c) && has(c, mood.hits?.details.map(norm))) ??
    clauses.find((c) => fits(c) && has(c, [...(mood.hits?.positive ?? []), ...(mood.hits?.negative ?? [])])) ??
    clauses.find(fits) ??
    clauses[0]?.split(/\s+/).slice(0, 6).join(" ") ??
    "";
  return pick.charAt(0).toLowerCase() + pick.slice(1);
}
