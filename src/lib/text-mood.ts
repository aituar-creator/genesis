import type { Season, TextMood } from "./types";

/**
 * Разбор текста «правилами дневника» — работает без сети и без ключа API.
 * Если задан ANTHROPIC_API_KEY, вместо него текст разбирает Claude (src/app/api/analyze/route.ts).
 * Контракт один: текст → TextMood (оси, эмоции, слова-доказательства) + название + подпись из слов пользователя.
 *
 * Как устроено: слова сравниваются по корням (начало слова), учитываются отрицания
 * («не грустно» → не грусть) и усилители («очень», «безумно» → вес ×2).
 */

/** Эмоции: корень → название эмоции. Знак: +1 светлая, −1 тяжёлая. */
const EMOTIONS: { name: string; sign: 1 | -1; stems: string[] }[] = [
  { name: "радость", sign: 1, stems: ["рад", "счаст", "весел", "ура", "кайф", "класс", "здоров", "отличн", "прекрасн", "чудесн", "смея", "смеял", "смех", "хохот", "улыб", "праздн"] },
  { name: "нежность", sign: 1, stems: ["люб", "обня", "нежн", "поцел", "милый", "милая", "родн", "забот"] },
  { name: "уют", sign: 1, stems: ["уют", "плед", "какао", "тепл", "камин", "свеч", "дома", "домой", "мягк"] },
  { name: "спокойствие", sign: 1, stems: ["спокой", "тих", "тишин", "умиротвор", "безмят", "медлен", "никуда", "неспеш"] },
  { name: "восторг", sign: 1, stems: ["восторг", "вау", "невероят", "потряс", "волшеб", "красив", "красот", "мечт"] },
  { name: "свобода", sign: 1, stems: ["свобод", "легко", "лёгк", "легк", "наконец"] },
  { name: "гордость", sign: 1, stems: ["горж", "получилось", "справил", "успели", "успел", "смогл", "смог", "победи", "сдал"] },
  { name: "благодарность", sign: 1, stems: ["благодар", "спасиб", "спасает", "повезло"] },
  { name: "ностальгия", sign: 1, stems: ["вспомин", "вспомнил", "детств", "раньше", "старые", "старых", "пластинк", "как тогда"] },
  { name: "грусть", sign: -1, stems: ["груст", "печал", "тоск", "плак", "слёз", "слез", "жаль", "закончил", "прощ", "проводил", "скуч"] },
  { name: "одиночество", sign: -1, stems: ["одино", "никого", "пуст", "некому", "сам по себе", "сама по себе"] },
  { name: "усталость", sign: -1, stems: ["устал", "вымот", "выжат", "сил нет", "сонн", "не выспал", "измуч"] },
  { name: "тревога", sign: -1, stems: ["тревог", "страш", "боюсь", "боял", "волн", "нерв", "паник", "пережива"] },
  { name: "злость", sign: -1, stems: ["злю", "злость", "злой", "бесит", "раздраж", "обид", "ненави"] },
  { name: "тяжесть", sign: -1, stems: ["тяжел", "тяжёл", "плохо", "ужас", "кошмар", "боль", "болел", "болит"] },
];

/** «Тёплая» деталь, которая тоже считается источником уюта. */
const LIVELY = ["танц", "бег", "крич", "быстр", "дедлайн", "концерт", "вечеринк", "тусов", "гроз", "спешил", "бешен", "поехал", "ехали", "прыг", "гуля", "работ", "сдач", "толп", "шумн", "громк", "носил", "успели", "веселил", "смея", "смеял", "хохот", "купал", "играл"];
const CALM = ["тих", "спокой", "медлен", "лежал", "сидел", "плед", "чай", "спал", "молча", "тишин", "смотрел", "ничего", "никуда", "читал", "дремал", "неспеш"];
const PEOPLE_STEMS = ["друз", "компани", "вместе", "мам", "пап", "сестр", "брат", "подруг", "друг", "семь", "коллег", "команд", "бабушк", "дедушк", "сын", "доч", "муж", "жен", "парн", "девушк", "однокурс", "одноклас", "соседк", "сосед", "гост"];
const PEOPLE_EXACT = new Set(["мы", "нас", "нам", "нами", "они"]);
const INTENSIFIERS = new Set(["очень", "так", "такой", "такая", "безумно", "ужасно", "невероятно", "совсем", "сильно", "жутко", "дико", "реально"]);
const NEGATIONS = new Set(["не", "ни", "нисколько", "вовсе"]);
/** Слова, которые совпадают по корню, но не о том. */
const EXCLUDE = new Set(["любой", "любая", "любое", "любого", "любую", "радио", "радиус", "тихоокеанский", "одинаково", "один", "одна"]);

const DETAILS: [string, string][] = [
  ["какао", "какао"], ["кофе", "кофе"], ["чай", "чай"], ["снег", "снег"], ["снеж", "снег"], ["дожд", "дождь"], ["море", "море"], ["морск", "море"],
  ["гроз", "гроза"], ["костр", "костёр"], ["костер", "костёр"], ["торт", "торт"], ["закат", "закат"], ["рассвет", "рассвет"],
  ["поезд", "поезд"], ["вокзал", "вокзал"], ["парк", "парк"], ["окн", "окно"], ["окош", "окно"], ["крыш", "крыша"], ["кухн", "кухня"],
  ["озер", "озеро"], ["лесу", "лес"], ["лесн", "лес"], ["метро", "метро"], ["офис", "офис"], ["музык", "музыка"], ["песн", "песня"],
  ["книг", "книга"], ["кино", "кино"], ["фильм", "кино"], ["пицц", "пицца"], ["звезд", "звёзды"], ["гитар", "гитара"],
  ["пирог", "пирог"], ["пластинк", "пластинки"], ["фонар", "фонари"], ["листь", "листья"], ["листопад", "листья"], ["пляж", "пляж"],
  ["горы", "горы"], ["горах", "горы"], ["дач", "дача"], ["арбуз", "арбуз"], ["мороженое", "мороженое"], ["цвет", "цветы"],
  ["солнц", "солнце"], ["туман", "туман"], ["ветер", "ветер"], ["ветр", "ветер"], ["радуг", "радуга"], ["луна", "луна"], ["луну", "луна"],
  ["велосипед", "велосипед"], ["котик", "кот"], ["кошк", "кот"], ["собак", "собака"], ["свеч", "свечи"], ["камин", "камин"], ["плед", "плед"],
  ["каток", "каток"], ["катк", "каток"], ["набережн", "набережная"], ["река", "река"], ["реки", "река"], ["реке", "река"], ["мост", "мост"],
  ["самолет", "самолёт"], ["аэропорт", "аэропорт"], ["трамва", "трамвай"], ["автобус", "автобус"], ["машин", "машина"], ["балкон", "балкон"],
  ["подар", "подарок"], ["фейерверк", "фейерверк"], ["шашлык", "шашлык"], ["блин", "блины"], ["суп", "суп"], ["вино", "вино"], ["пиво", "пиво"],
];

const MONTH_ADJ = ["Январск", "Февральск", "Мартовск", "Апрельск", "Майск", "Июньск", "Июльск", "Августовск", "Сентябрьск", "Октябрьск", "Ноябрьск", "Декабрьск"];

const words = (text: string) => text.toLowerCase().replace(/ё/g, "е").match(/[а-яa-z]+/g) ?? [];
const norm = (s: string) => s.replace(/ё/g, "е");
const starts = (w: string, stems: string[]) => !EXCLUDE.has(w) && stems.some((s) => w.startsWith(norm(s)));

function hitsFor(ws: string[], stems: string[]) {
  const found = new Set<string>();
  for (const w of ws) if (starts(w, stems)) found.add(w);
  return [...found];
}

export function seasonOf(isoDate: string): Season {
  const mo = Number(isoDate.slice(5, 7));
  return mo === 12 || mo <= 2 ? "winter" : mo <= 5 ? "spring" : mo <= 8 ? "summer" : "autumn";
}

export function analyzeText(text: string, time: string): TextMood {
  const ws = words(text);
  const lower = norm(text.toLowerCase());

  // Эмоции с учётом отрицаний и усилителей
  const score = new Map<string, number>();
  const positive = new Set<string>();
  const negative = new Set<string>();
  let light = 0;
  let heavy = 0;
  ws.forEach((w, i) => {
    const prev = ws[i - 1] ?? "";
    const prev2 = ws[i - 2] ?? "";
    const negated = NEGATIONS.has(prev) || (INTENSIFIERS.has(prev) && NEGATIONS.has(prev2));
    const weight = INTENSIFIERS.has(prev) ? 2 : 1;
    for (const em of EMOTIONS) {
      if (!starts(w, em.stems)) continue;
      const sign = negated ? -em.sign : em.sign;
      if (!negated) score.set(em.name, (score.get(em.name) ?? 0) + weight);
      if (sign > 0) {
        light += weight;
        positive.add(negated ? `не ${w}` : w);
      } else {
        heavy += weight;
        negative.add(negated ? `не ${w}` : w);
      }
      break;
    }
  });
  // Фразы из нескольких слов
  for (const em of EMOTIONS)
    for (const stem of em.stems)
      if (stem.includes(" ") && lower.includes(stem)) {
        score.set(em.name, (score.get(em.name) ?? 0) + 1);
        if (em.sign > 0) light++;
        else heavy++;
        (em.sign > 0 ? positive : negative).add(stem);
      }

  let emotions = [...score.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n);
  const sad = emotions.includes("грусть") || emotions.includes("одиночество");
  const warm = emotions.some((e) => ["уют", "радость", "нежность", "благодарность", "ностальгия"].includes(e));
  if (sad && warm) emotions = ["светлая грусть", ...emotions.filter((e) => e !== "грусть")];
  emotions = emotions.slice(0, 3);

  const lively = hitsFor(ws, LIVELY);
  const calm = hitsFor(ws, CALM);
  const people = [...new Set(ws.filter((w) => PEOPLE_EXACT.has(w) || starts(w, PEOPLE_STEMS)))];
  const details = [...new Set(ws.flatMap((w) => DETAILS.filter(([s]) => w.startsWith(norm(s))).map(([, name]) => name)))];
  const sentences = text.split(/[.!?…]+/).filter((s) => s.trim()).length;
  const exclaims = Math.min(3, (text.match(/!/g) ?? []).length);

  const clamp = (x: number, lo = 0.05, hi = 0.95) => Math.max(lo, Math.min(hi, x));
  const hour = Number(time.slice(0, 2));
  const timeOfDay = /утр|проснул|рассвет|будильник/.test(lower)
    ? 0.12
    : /ноч|до утра/.test(lower)
      ? 0.95
      : /вечер|закат|фонар/.test(lower)
        ? 0.75
        : /днем|обед/.test(lower)
          ? 0.45
          : hour < 11 ? 0.15 : hour < 17 ? 0.45 : hour < 22 ? 0.75 : 0.9;

  // Свет дня: доля светлых сигналов, сглаженная к середине, когда сигналов мало.
  const total = light + heavy;
  const valence = total ? 0.5 + ((light - heavy) / (total + 1.5)) * 0.5 : 0.55;
  const energy = clamp(0.4 + 0.11 * (lively.length - calm.length) + 0.05 * exclaims);
  // Если явных эмоций нет — называем настроение по осям, чтобы объяснение не было пустым.
  if (!emotions.length) emotions = [valence > 0.6 ? (energy >= 0.5 ? "лёгкость" : "спокойствие") : valence < 0.4 ? "задумчивость" : "ровный день"];

  return {
    valence: clamp(valence),
    energy,
    density: clamp(0.12 + 0.05 * sentences + 0.07 * Math.min(people.length, 4) + 0.04 * details.length),
    intimacy: people.length ? clamp(0.55 - 0.08 * people.length, 0.15) : 0.85,
    timeOfDay,
    emotions,
    hits: { positive: [...positive], negative: [...negative], calm, lively, details, people },
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
