import { buildDay } from "@/lib/build-day";
import { findSong } from "./songs";

/**
 * «Свет доходит позже»: демо-письмо из прошлого. Отправлено год назад, долетает через 3 дня
 * после «сегодня» прототипа — на нём можно показать перемотку времени и прилёт.
 */
export const DEMO_LETTER = {
  id: "letter-grandma",
  sentOn: "2025-11-24",
  deliverAt: "2026-11-24",
  day: buildDay({
    id: "letter-grandma",
    date: "2025-11-24",
    time: "21:10",
    text: "Приехали к бабушке, она испекла пирог с яблоками. Слушали её старые пластинки, папа подпевал и путал слова. Хочу запомнить, как она смеётся.",
    song: findSong("dreams")!,
    palette: ["#d49a5e", "#f2c48d", "#8a5a3c", "#e8b4a0"],
    photos: [],
    mood: { valence: 0.85, energy: 0.35, density: 0.55, intimacy: 0.3, timeOfDay: 0.75, hits: { positive: ["смеется"], negative: [], calm: [], lively: [], details: ["пирог", "пластинки"], people: ["бабушке", "папа"] } },
  }),
};
