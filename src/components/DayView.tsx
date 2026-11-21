"use client";

import { IconArrowLeft, IconBulb, IconPlayerStop, IconShare2, IconVolume, IconWand, IconX } from "@tabler/icons-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Day } from "@/lib/types";
import { CONFLICT_LABEL, humanDate } from "@/lib/visual";
import { ExplainList } from "./ExplainList";
import { PassportRadar } from "./PassportRadar";
import { Postcard } from "./Postcard";
import { SongPlayer } from "./SongPlayer";
import { StyleMixBar } from "./StyleMixBar";

const secondaryBtn =
  "flex flex-col items-center justify-center gap-1 rounded-[var(--radius-field)] border border-night-600 px-2 py-2.5 text-[12px] text-star-300 hover:border-night-500";

/** Голос озвучки по концепции: квадрант валентность × энергия, скорость — от темпа песни. */
function voiceFor(day: Day) {
  const v = day.passport.valence.value;
  const e = day.passport.energy.value;
  const label = v >= 0.5 ? (e >= 0.5 ? "живой и быстрый" : "мягкий и светлый") : e >= 0.5 ? "ровный и собранный" : "тихий и задумчивый";
  return { label, rate: 0.85 + day.passport.tempo.value * 0.35, pitch: 0.85 + v * 0.3 };
}

/** Папка дня: открытка, песня, запись и лист «Почему так выглядит». */
export function DayView({ day, onRemix, backHref = "/" }: { day: Day; onRemix?: () => void; backHref?: string }) {
  const [sheet, setSheet] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const speak = () => {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
    if (!synth) {
      setToast("Этот браузер не умеет озвучивать текст");
      return;
    }
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const voice = voiceFor(day);
    const u = new SpeechSynthesisUtterance(day.text);
    u.lang = "ru-RU";
    u.rate = voice.rate;
    u.pitch = voice.pitch;
    const ru = synth.getVoices().find((x) => x.lang.startsWith("ru"));
    if (ru) u.voice = ru;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    synth.cancel();
    synth.speak(u);
    setSpeaking(true);
    setToast(`Голос: ${voice.label}, скорость ×${voice.rate.toFixed(2)} от темпа песни`);
  };

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheet(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet]);

  const conflict = day.passport.conflict;

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 pb-8 pt-[max(env(safe-area-inset-top),12px)]">
      <header className="flex items-center justify-between">
        <Link href={backHref} aria-label="Назад к небу" className="-ml-2 rounded-full p-2 text-star-500 hover:text-star-100">
          <IconArrowLeft size={20} />
        </Link>
        <span className="font-mono text-[11px] tracking-[0.06em] text-star-500">
          {humanDate(day.date)} {day.date.slice(0, 4)} · {day.time}
        </span>
        <button
          type="button"
          aria-label="Сохранить как видео"
          onClick={() => setToast("Экспорт видео появится в следующей версии")}
          className="-mr-2 rounded-full p-2 text-star-500 hover:text-star-100"
        >
          <IconShare2 size={20} />
        </button>
      </header>

      <div className="animate-rise">
        <Postcard day={day} />
      </div>

      <SongPlayer song={day.song} />

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setSheet(true)}
          className="flex flex-col items-center justify-center gap-1 rounded-[var(--radius-field)] border border-glow-500/40 bg-glow-500/10 px-2 py-2.5 text-[12px] font-medium text-glow-400"
        >
          <IconBulb size={18} aria-hidden /> Почему так
        </button>
        {onRemix ? (
          <button type="button" onClick={onRemix} className={secondaryBtn}>
            <IconWand size={18} aria-hidden /> А что если…
          </button>
        ) : (
          <Link href={`/day/${day.id}/remix`} className={secondaryBtn}>
            <IconWand size={18} aria-hidden /> А что если…
          </Link>
        )}
        <button type="button" onClick={speak} aria-pressed={speaking} className={secondaryBtn}>
          {speaking ? <IconPlayerStop size={18} aria-hidden /> : <IconVolume size={18} aria-hidden />}
          {speaking ? "Стоп" : "Послушать"}
        </button>
      </div>

      <section className="rounded-[var(--radius-field)] bg-night-800/70 p-4">
        <p className="mb-2 font-mono text-[11px] tracking-[0.08em] text-star-500">ЗАПИСЬ</p>
        <p className="text-[14px] leading-relaxed text-star-300">{day.text}</p>
      </section>

      {toast && (
        <div role="status" className="animate-rise fixed inset-x-0 bottom-6 z-40 mx-auto w-fit max-w-[90%] rounded-full bg-night-700 px-4 py-2.5 text-center text-[13px] text-star-100 shadow-lg">
          {toast}
        </div>
      )}

      {sheet && (
        <div className="fixed inset-0 z-30 mx-auto flex max-w-[430px] flex-col justify-end">
          <button type="button" aria-label="Закрыть" onClick={() => setSheet(false)} className="absolute inset-0 bg-night-950/70" />
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Почему так выглядит"
            className="animate-sheet relative max-h-[88dvh] overflow-y-auto rounded-t-[24px] border-t border-night-600 bg-night-900 px-5 pb-[max(env(safe-area-inset-bottom),24px)] pt-3"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-night-600" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-[17px] text-star-100">Почему так выглядит</h2>
                <p className="mt-1 text-xs text-star-500">Паспорт дня: как текст, фото и песня стали формой</p>
              </div>
              <button type="button" aria-label="Закрыть" onClick={() => setSheet(false)} className="-mr-2 rounded-full p-2 text-star-500">
                <IconX size={18} />
              </button>
            </div>

            {conflict && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-glow-500/15 px-3 py-1 font-mono text-[11px] text-glow-400">
                <span className="h-1.5 w-1.5 rounded-full bg-glow-400" />
                внутренний конфликт: {CONFLICT_LABEL[conflict.kind]}
              </p>
            )}

            <div className="mx-auto mt-2 max-w-[300px]">
              <PassportRadar passport={day.passport} color={day.palette[1]} />
            </div>

            <ExplainList items={day.explain} />

            <div className="mt-6">
              <p className="mb-2 font-mono text-[11px] tracking-[0.08em] text-star-500">ИТОГ</p>
              <StyleMixBar styles={day.styles} />
            </div>

            <div className="mt-6">
              <p className="mb-2 font-mono text-[11px] tracking-[0.08em] text-star-500">ПАЛИТРА ИЗ ФОТО</p>
              <div className="flex gap-2">
                {day.palette.map((c) => (
                  <div key={c} className="flex-1">
                    <div className="h-9 rounded-lg" style={{ background: c }} />
                    <p className="mt-1 text-center font-mono text-[10px] text-star-700">{c}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-6 text-[11px] leading-relaxed text-star-700">
              Это настроение записи, а не диагноз. Песня не хранится — только ссылка и официальный фрагмент.
            </p>
          </section>
        </div>
      )}
    </main>
  );
}
