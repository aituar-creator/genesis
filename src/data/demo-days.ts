import { derivePassport, styleWeights } from "@/lib/rules";
import type { Axis, AxisSource, Day } from "@/lib/types";

const t = (note: string, weight = 1): AxisSource => ({ input: "text", note, weight });
const p = (note: string, weight = 1): AxisSource => ({ input: "photo", note, weight });
const m = (note: string, weight = 1): AxisSource => ({ input: "music", note, weight });
const ax = (value: number, ...sources: AxisSource[]): Axis => ({ value, sources });

/**
 * Демо-дни для прототипа дизайна. Значения подобраны вручную так,
 * чтобы дни были максимально непохожими и показывали все приёмы.
 */
const CURATED: Day[] = [
  {
    id: "first-snow",
    date: "2026-11-21",
    time: "22:40",
    text: "Утром выпал первый снег. Сидела у окна с какао и смотрела, как всё становится тихим. Немного грустно, что осень закончилась, но снег за окном, а у меня какао — и это почему-то спасает.",
    title: "Первый снег у окна",
    caption: "снег за окном, а у меня какао",
    palette: ["#8c9bc2", "#d49a5e", "#f2a65a", "#3e4a6e"],
    photos: [
      { top: "#8c9bc2", bottom: "#d49a5e" },
      { top: "#b8c6d6", bottom: "#6e8197" },
    ],
    song: { title: "Let It Snow", artist: "Frank Sinatra", bpm: 72, mode: "major", year: 1950, energy: 0.3 },
    textMood: { valence: 0.3, energy: 0.15, density: 0.15, intimacy: 0.85, timeOfDay: 0.25 },
    passport: {
      valence: ax(0.42, t("«немного грустно», «осень закончилась»", 0.6), m("мажор", 0.4)),
      energy: ax(0.22, t("«тихо», сидела у окна"), m("мягкая громкость")),
      tempo: ax(0.28, m("72 удара в минуту")),
      temperature: ax(0.38, t("снег, холод"), t("какао — тёплая деталь"), p("охристые тона фото")),
      density: ax(0.15, t("одно событие"), p("2 кадра")),
      intimacy: ax(0.85, t("наедине с собой")),
      timeOfDay: ax(0.25, t("утро")),
      era: ax(0.15, m("1950, джаз")),
      conflict: { kind: "bright-sadness", strength: 0.7 },
      seed: 1121,
    },
    styles: { impressionism: 0.7, film: 0.3 },
    explain: [
      { icon: "music", text: "72 удара в минуту — кадры сменяются медленно" },
      { icon: "text", text: "Грустный текст и светлая песня — это «светлая грусть»: тёплая палитра и много пустоты" },
      { icon: "cup", text: "Холод и какао — в холодный воздух вплетены тёплые акценты" },
      { icon: "photo", text: "Охристые тона фото — основа палитры" },
    ],
    season: "winter",
    withFriends: false,
  },
  {
    id: "office-night",
    date: "2025-11-21",
    time: "03:12",
    text: "Ночь в офисе перед сдачей. Кофе уже не работает, мониторы гудят, в наушниках техно. Мы всё-таки успели собрать билд за десять минут до дедлайна.",
    title: "Ночь в офисе перед сдачей",
    caption: "успели за десять минут до дедлайна",
    palette: ["#4a5a7a", "#7f8fb0", "#9c97e8", "#1f2540"],
    photos: [
      { top: "#1f2540", bottom: "#4a5a7a" },
      { top: "#2e3a5a", bottom: "#7f8fb0" },
      { top: "#141830", bottom: "#9c97e8" },
    ],
    song: { title: "Strobe", artist: "deadmau5", bpm: 128, mode: "minor", year: 2009, energy: 0.85 },
    textMood: { valence: 0.4, energy: 0.8, density: 0.65, intimacy: 0.35, timeOfDay: 0.95 },
    passport: {
      valence: ax(0.4, t("усталость, но «успели»"), m("минор")),
      energy: ax(0.82, t("дедлайн, напряжение"), m("плотный звук")),
      tempo: ax(0.78, m("128 ударов в минуту")),
      temperature: ax(0.12, p("сине-серые мониторы"), t("ночь")),
      density: ax(0.65, t("команда, билд, кофе"), p("3 кадра")),
      intimacy: ax(0.35, t("«мы» — команда рядом")),
      timeOfDay: ax(0.95, t("ночь, 3 часа"), p("время съёмки 03:05")),
      era: ax(0.85, m("2009, электроника")),
      seed: 2511,
    },
    styles: { kandinsky: 0.6, collage: 0.25, rothko: 0.15 },
    explain: [
      { icon: "music", text: "128 ударов и электроника — резкий ритм кадров и чистое цифровое изображение" },
      { icon: "text", text: "Высокая энергия и дедлайн — геометрия Кандинского и диагонали" },
      { icon: "clock", text: "Три часа ночи — холодный «неоновый» свет" },
      { icon: "photo", text: "Сине-серые мониторы — основа палитры" },
    ],
    season: "autumn",
    withFriends: false,
  },
  {
    id: "lake-july",
    date: "2026-07-12",
    time: "21:05",
    text: "Поехали всей компанией на озеро. Вода тёплая, Лёша сжёг сосиски, мы смеялись до слёз. На закате все сидели на пирсе и молчали.",
    title: "Июльское озеро и смех",
    caption: "мы смеялись до слёз",
    palette: ["#f2a65a", "#e8736a", "#7fc4c9", "#ffe3b5"],
    photos: [
      { top: "#7fc4c9", bottom: "#d49a5e" },
      { top: "#f2a65a", bottom: "#3e6b6e" },
      { top: "#ffe3b5", bottom: "#e8736a" },
      { top: "#9fd0e0", bottom: "#c98b4e" },
    ],
    song: { title: "Here Comes the Sun", artist: "The Beatles", bpm: 129, mode: "major", year: 1969, energy: 0.6 },
    textMood: { valence: 0.9, energy: 0.65, density: 0.7, intimacy: 0.25, timeOfDay: 0.7 },
    passport: {
      valence: ax(0.88, t("смех, «до слёз»"), m("мажор")),
      energy: ax(0.6, t("компания, озеро")),
      tempo: ax(0.62, m("129 ударов в минуту")),
      temperature: ax(0.9, t("лето, тёплая вода"), p("тёплые закатные тона")),
      density: ax(0.7, t("много людей и событий"), p("4 кадра")),
      intimacy: ax(0.25, t("вся компания")),
      timeOfDay: ax(0.7, t("закат"), p("золотой час")),
      era: ax(0.25, m("1969, рок")),
      seed: 712,
    },
    styles: { film: 0.6, popart: 0.25, impressionism: 0.15 },
    explain: [
      { icon: "people", text: "Друзья, лето и песня 60-х — плёнка с засветами и тёплым зерном" },
      { icon: "clock", text: "Закат на пирсе — свет золотого часа" },
      { icon: "photo", text: "4 кадра и много событий — композиция-коллаж" },
    ],
    season: "summer",
    withFriends: true,
  },
  {
    id: "storm",
    date: "2026-06-03",
    time: "18:30",
    text: "Сегодня решилась и уволилась. Вышла из офиса, и началась гроза. Стояла под козырьком, вся мокрая, и было страшно и очень свободно одновременно.",
    title: "Гроза над крышами",
    caption: "страшно и очень свободно одновременно",
    palette: ["#5a4a7a", "#e8c25a", "#2e3266", "#8c9bc2"],
    photos: [{ top: "#2e3266", bottom: "#5a4a7a" }],
    song: { title: "Running Up That Hill", artist: "Kate Bush", bpm: 108, mode: "minor", year: 1985, energy: 0.8 },
    textMood: { valence: 0.5, energy: 0.95, density: 0.3, intimacy: 0.75, timeOfDay: 0.6 },
    passport: {
      valence: ax(0.55, t("«страшно», но «свободно»")),
      energy: ax(0.9, t("переломный момент, гроза"), m("мощный бит")),
      tempo: ax(0.55, m("108 ударов в минуту")),
      temperature: ax(0.35, t("дождь"), p("фиолетово-серое небо")),
      density: ax(0.3, t("одно главное событие")),
      intimacy: ax(0.75, t("одна под козырьком")),
      timeOfDay: ax(0.6, t("вечер")),
      era: ax(0.6, m("1985, синти-поп")),
      seed: 603,
    },
    styles: { turner: 0.65, rothko: 0.2, collage: 0.15 },
    explain: [
      { icon: "weather", text: "Гроза и переломный момент — вихревой свет в духе Тёрнера" },
      { icon: "music", text: "Песня 80-х — лёгкие VHS-артефакты в зерне" },
      { icon: "text", text: "Сильные эмоции — большая амплитуда движения" },
    ],
    season: "summer",
    withFriends: false,
  },
  {
    id: "birthday",
    date: "2026-04-18",
    time: "23:50",
    text: "День рождения на кухне! Друзья принесли торт с бенгальскими огнями, танцевали между холодильником и плитой, соседи стучали, но нам было всё равно.",
    title: "День рождения на кухне",
    caption: "танцевали между холодильником и плитой",
    palette: ["#e8736a", "#ffc979", "#7fe0b0", "#9c97e8"],
    photos: [
      { top: "#ffc979", bottom: "#e8736a" },
      { top: "#9c97e8", bottom: "#ffe3b5" },
      { top: "#7fe0b0", bottom: "#e8736a" },
    ],
    song: { title: "September", artist: "Earth, Wind & Fire", bpm: 126, mode: "major", year: 1978, energy: 0.9 },
    textMood: { valence: 0.95, energy: 0.9, density: 0.85, intimacy: 0.2, timeOfDay: 0.9 },
    passport: {
      valence: ax(0.95, t("праздник, танцы"), m("мажор")),
      energy: ax(0.88, t("танцевали"), m("танцевальный ритм")),
      tempo: ax(0.75, m("126 ударов в минуту")),
      temperature: ax(0.8, p("тёплый свет кухни"), t("бенгальские огни")),
      density: ax(0.85, t("друзья, торт, соседи"), p("3 кадра")),
      intimacy: ax(0.2, t("компания друзей")),
      timeOfDay: ax(0.9, t("поздний вечер")),
      era: ax(0.45, m("1978, диско")),
      seed: 418,
    },
    styles: { popart: 0.55, collage: 0.3, film: 0.15 },
    explain: [
      { icon: "music", text: "Мажор и танцевальный темп — яркий плоский поп-арт" },
      { icon: "people", text: "Много людей и событий — фрагменты наслаиваются коллажем" },
      { icon: "photo", text: "Тёплый свет кухни — основа палитры" },
    ],
    season: "spring",
    withFriends: true,
  },
  {
    id: "morning-tea",
    date: "2026-03-08",
    time: "08:15",
    text: "Проснулась раньше всех. Заварила чай, открыла окно, слушала, как капает с крыши. Никуда не нужно спешить.",
    title: "Утренний чай в тишине",
    caption: "никуда не нужно спешить",
    palette: ["#e6e4ff", "#b8c6d6", "#e8b4a0", "#6e8197"],
    photos: [{ top: "#e6e4ff", bottom: "#b8c6d6" }],
    song: { title: "Gymnopédie No. 1", artist: "Erik Satie", bpm: 66, mode: "major", year: 1888, energy: 0.08 },
    textMood: { valence: 0.7, energy: 0.1, density: 0.08, intimacy: 0.95, timeOfDay: 0.1 },
    passport: {
      valence: ax(0.7, t("спокойствие"), m("мягкий мажор")),
      energy: ax(0.1, t("тишина"), m("одно фортепиано")),
      tempo: ax(0.18, m("66 ударов в минуту")),
      temperature: ax(0.5, t("весна, капель"), p("светлые прохладные тона")),
      density: ax(0.08, t("одно действие"), p("1 кадр")),
      intimacy: ax(0.95, t("одна, раньше всех")),
      timeOfDay: ax(0.1, t("раннее утро"), p("время съёмки 08:02")),
      era: ax(0.05, m("1888, классика")),
      seed: 308,
    },
    styles: { ma: 0.6, impressionism: 0.25, rothko: 0.15 },
    explain: [
      { icon: "clock", text: "Утро и одиночество — японская эстетика пустоты «ма»" },
      { icon: "music", text: "66 ударов в минуту — почти неподвижный кадр" },
      { icon: "text", text: "Тишина в тексте — много воздуха в композиции" },
    ],
    season: "spring",
    withFriends: false,
  },
  {
    id: "empty-station",
    date: "2026-10-02",
    time: "20:40",
    text: "Проводила его на поезд. Вокзал был почти пустой, горели жёлтые фонари. Шла домой пешком и не включала музыку, только одну песню по кругу.",
    title: "Пустой вокзал в октябре",
    caption: "только одну песню по кругу",
    palette: ["#3e4a6e", "#c98b4e", "#2a2350", "#8a6a9b"],
    photos: [
      { top: "#2a2350", bottom: "#c98b4e" },
      { top: "#3e4a6e", bottom: "#8a6a9b" },
    ],
    song: { title: "Teardrop", artist: "Massive Attack", bpm: 77, mode: "minor", year: 1998, energy: 0.3 },
    textMood: { valence: 0.15, energy: 0.2, density: 0.2, intimacy: 0.8, timeOfDay: 0.8 },
    passport: {
      valence: ax(0.18, t("проводила, пустой вокзал"), m("минор")),
      energy: ax(0.2, t("шла пешком")),
      tempo: ax(0.3, m("77 ударов в минуту")),
      temperature: ax(0.45, t("октябрь"), p("жёлтые фонари")),
      density: ax(0.2, t("одно событие")),
      intimacy: ax(0.8, t("одна по дороге домой")),
      timeOfDay: ax(0.8, t("вечер, фонари")),
      era: ax(0.65, m("1998, трип-хоп")),
      seed: 1002,
    },
    styles: { rothko: 0.6, film: 0.25, ma: 0.15 },
    explain: [
      { icon: "music", text: "Минор и низкая энергия — большие цветовые поля в духе Ротко" },
      { icon: "photo", text: "Жёлтые фонари в синем — тёплое пятно в холодном поле" },
      { icon: "text", text: "Одиночество — крупный план и глубокая виньетка" },
    ],
    season: "autumn",
    withFriends: false,
  },
];

/**
 * Паспорт и смесь приёмов демо-дней считает тот же движок правил, что и ремикс,
 * — так «А что если…» всегда начинается ровно с того, что видно на открытке.
 * Источники осей и объяснения берём из ручной разметки: они подробнее.
 */
export const DEMO_DAYS: Day[] = CURATED.map((d) => {
  const derived = derivePassport({ mood: d.textMood, song: d.song, palette: d.palette, photoCount: d.photos.length, seed: d.passport.seed });
  const passport = { ...derived };
  for (const k of ["valence", "energy", "tempo", "temperature", "density", "intimacy", "timeOfDay", "era"] as const) {
    passport[k] = { value: derived[k].value, sources: d.passport[k].sources };
  }
  return { ...d, passport, styles: styleWeights(passport) };
});

export function getDay(id: string): Day | undefined {
  return DEMO_DAYS.find((d) => d.id === id);
}

/** День, который показываем в «В этот день»: тот же день и месяц, другой год. */
export function onThisDay(todayIso: string): Day | undefined {
  const md = todayIso.slice(5);
  const year = todayIso.slice(0, 4);
  return DEMO_DAYS.find((d) => d.date.slice(5) === md && d.date.slice(0, 4) !== year);
}

/** «Сегодня» прототипа — фиксировано, чтобы демо было воспроизводимым. */
export const TODAY = "2026-11-21";
