import type { AxisKey } from "@/lib/types";
import { rng } from "@/lib/visual";
import { DEMO_DAYS, TODAY } from "./demo-days";

/**
 * Архив для карты созвездий. Полные демо-дни + «фоновые» записи прошлых месяцев:
 * у каждой есть паспорт из 8 осей, название и цвет. Фоновые записи сгенерированы
 * вокруг демо-дней с шумом — так выглядит дневник, который ведут год.
 */
export type StarPoint = {
  id: string;
  date: string;
  title: string;
  color: string;
  axes: number[];
  /** Если это полноценный день — ссылка на него. */
  dayId?: string;
};

export const AXIS_ORDER: AxisKey[] = ["valence", "energy", "tempo", "temperature", "density", "intimacy", "timeOfDay", "era"];

const FAMILIES: Record<string, { months: number[]; titles: string[] }> = {
  "first-snow": { months: [11, 12, 1, 2], titles: ["Чай и плед", "Снег под фонарём", "Окно в инее", "Тихая суббота дома", "Варежки на батарее", "Свеча и книга"] },
  "office-night": { months: [], titles: ["Код до утра", "Последний коммит", "Третья ночь сессии", "Свет мониторов", "Пицца в два ночи"] },
  "lake-july": { months: [6, 7, 8], titles: ["Пикник у реки", "Костёр и гитара", "Крыша на закате", "Велосипеды до ночи", "Арбуз на пляже", "Палатки у озера"] },
  "morning-tea": { months: [], titles: ["Кофе до будильника", "Туман над двором", "Первый луч на кухне", "Пустая утренняя улица", "Йога у окна"] },
  "empty-station": { months: [9, 10, 11], titles: ["Мокрый парк", "Последний трамвай", "Листья у подъезда", "Длинная дорога домой", "Пустая скамейка"] },
  birthday: { months: [3, 4, 5], titles: ["Свадьба Кати", "Танцы до утра", "Сюрприз для мамы"] },
};

function build(): StarPoint[] {
  const r = rng(2026);
  const out: StarPoint[] = DEMO_DAYS.map((d) => ({
    id: d.id,
    date: d.date,
    title: d.title,
    color: d.palette[1],
    axes: AXIS_ORDER.map((k) => d.passport[k].value),
    dayId: d.id,
  }));

  for (const [dayId, fam] of Object.entries(FAMILIES)) {
    const base = DEMO_DAYS.find((d) => d.id === dayId)!;
    fam.titles.forEach((title, i) => {
      const axes = AXIS_ORDER.map((k) => Math.max(0, Math.min(1, base.passport[k].value + (r() - 0.5) * 0.2)));
      let date = "";
      for (let tries = 0; tries < 20; tries++) {
        const month = fam.months.length ? fam.months[Math.floor(r() * fam.months.length)] : 1 + Math.floor(r() * 12);
        const year = r() < 0.5 ? 2025 : 2026;
        const day = 1 + Math.floor(r() * 28);
        date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        if (date <= TODAY) break;
      }
      out.push({ id: `${dayId}-${i}`, date, title, color: base.palette[Math.floor(r() * 4)], axes });
    });
  }
  return out;
}

export const ARCHIVE: StarPoint[] = build();
