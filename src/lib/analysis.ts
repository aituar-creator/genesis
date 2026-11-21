import type { TextMood } from "./types";

/**
 * Результат разбора текста записи — общий контракт для Claude и запасного словаря.
 * Хранится вместе с записью, чтобы день всегда выглядел одинаково и не требовал повторного вызова.
 */
export type TextAnalysis = {
  mood: TextMood;
  title: string;
  /** Дословный фрагмент текста пользователя. */
  caption: string;
  source: "claude" | "dictionary";
};

/** Запрос разбора с клиента. При любой ошибке сети возвращает null — тогда разберём словарём. */
export async function requestAnalysis(text: string, date: string, time: string): Promise<TextAnalysis | null> {
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, date, time }),
    });
    if (!res.ok) return null;
    return (await res.json()) as TextAnalysis;
  } catch {
    return null;
  }
}
