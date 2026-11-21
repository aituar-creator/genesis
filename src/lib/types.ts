/** Источник, из которого система вывела значение. Нужен для карточки «Почему так выглядит». */
export type InputSource = "text" | "photo" | "music";

export type AxisSource = { input: InputSource; note: string; weight: number };

/** Одна ось паспорта: значение 0..1 и откуда оно взялось. */
export type Axis = { value: number; sources: AxisSource[] };

export type AxisKey =
  | "valence"
  | "energy"
  | "tempo"
  | "temperature"
  | "density"
  | "intimacy"
  | "timeOfDay"
  | "era";

export type ConflictKind = "bright-sadness";

export type Passport = Record<AxisKey, Axis> & {
  conflict?: { kind: ConflictKind; strength: number };
  /** Детерминизм: один и тот же день всегда рисуется одинаково. */
  seed: number;
};

export type StyleKey =
  | "impressionism"
  | "kandinsky"
  | "rothko"
  | "ma"
  | "film"
  | "collage"
  | "turner"
  | "popart";

export type ExplainIcon = "music" | "photo" | "text" | "weather" | "people" | "clock" | "cup";

export type Season = "winter" | "spring" | "summer" | "autumn";

/** Заглушка фото для прототипа: верх и низ кадра (небо/земля). */
export type PhotoStub = { top: string; bottom: string; /** настоящее фото (data URL) */ src?: string };

export type Song = {
  title: string;
  artist: string;
  bpm: number;
  mode: "major" | "minor";
  year: number;
  /** Энергия фрагмента 0..1 (громкость, плотность звука). */
  energy: number;
  /** Номер трека в каталоге («dz:123») — по нему получаем свежий фрагмент. Сама песня не хранится. */
  ref?: string;
  cover?: string;
  genre?: string;
  /** Тональность словами, например «ля минор». */
  key?: string;
  /** true — параметры измерены по 30-секундному фрагменту; false — оценены по жанру и году. */
  measured?: boolean;
};

/** То, что языковая модель извлекает из текста (в прототипе — словарная эвристика). */
export type TextMood = {
  valence: number;
  energy: number;
  density: number;
  intimacy: number;
  timeOfDay: number;
  /** Эмоции дня простыми словами (от языковой модели). */
  emotions?: string[];
  /** Найденные слова — для объяснения. */
  hits?: { positive: string[]; negative: string[]; calm: string[]; lively: string[]; details: string[]; people: string[] };
};

export type Day = {
  id: string;
  /** ISO-дата YYYY-MM-DD */
  date: string;
  time: string;
  text: string;
  title: string;
  /** Рукописная подпись — всегда дословная цитата из text. */
  caption: string;
  /** 4 цвета: основа палитры из фото, уже сдвинутая настроением. */
  palette: [string, string, string, string];
  photos: PhotoStub[];
  song: Song;
  /** Вклад текста в паспорт — нужен, чтобы пересчитать день в ремиксе. */
  textMood: TextMood;
  passport: Passport;
  styles: Partial<Record<StyleKey, number>>;
  explain: { icon: ExplainIcon; text: string }[];
  season: Season;
  withFriends: boolean;
  /** Кто разобрал текст: языковая модель или запасной словарь. У демо-дней не задано. */
  analyzedBy?: "claude" | "dictionary";
};
