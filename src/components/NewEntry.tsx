"use client";

import { IconCheck, IconMusic, IconPhotoPlus, IconSearch, IconSend, IconSparkles, IconX } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { TODAY } from "@/data/demo-days";
import { SONGS } from "@/data/songs";
import { requestAnalysis } from "@/lib/analysis";
import { addDays, addEntry } from "@/lib/entries-store";
import { extractPalette, loadImage, mergePalettes, thumbnail } from "@/lib/palette";
import { humanDate } from "@/lib/visual";
import { PrimaryButton } from "./ui";

const IGNITE_STEPS = ["Claude читает, как прошёл день", "Слушаем песню", "Смотрим на свет фотографий", "Собираем паспорт дня"];
const SEND_STEPS = ["Запечатываем день", "Свет отправлен"];

const WHEN = [
  { key: "now", label: "Сейчас", days: 0 },
  { key: "month", label: "Через месяц", days: 30 },
  { key: "year", label: "Через год", days: 365 },
] as const;

type Photo = { src: string; palette: string[] };

/** Цвета по умолчанию, если фото не добавлены: вечернее небо. */
const FALLBACK: [string, string, string, string] = ["#8c9bc2", "#d49a5e", "#f2a65a", "#3e4a6e"];

export function NewEntry() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [query, setQuery] = useState("");
  const [songId, setSongId] = useState<string | null>(null);
  const [when, setWhen] = useState<(typeof WHEN)[number]["key"]>("now");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | { mode: "ignite" | "send"; deliverAt?: string }>(null);
  const [step, setStep] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const song = SONGS.find((s) => s.id === songId);
  const steps = busy?.mode === "send" ? SEND_STEPS : IGNITE_STEPS;

  useEffect(() => {
    if (!busy) return;
    const tick = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), busy.mode === "send" ? 1200 : 650);
    return () => clearInterval(tick);
  }, [busy, steps.length]);

  const results = query.trim()
    ? SONGS.filter((s) => `${s.title} ${s.artist}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 5)
    : SONGS.slice(0, 4);

  const onFiles = async (files: File[]) => {
    const added: Photo[] = [];
    for (const f of files.slice(0, 4 - photos.length)) {
      const url = URL.createObjectURL(f);
      try {
        const img = await loadImage(url);
        added.push({ src: thumbnail(img), palette: extractPalette(img) });
      } catch {
        setError("Не получилось открыть фото");
      } finally {
        URL.revokeObjectURL(url);
      }
    }
    setPhotos((ps) => [...ps, ...added]);
  };

  const submit = async () => {
    if (busy) return;
    if (!text.trim()) {
      setError("Напиши хотя бы пару слов о дне");
      return;
    }
    if (!song) {
      setError("Выбери песню — она меняет форму дня");
      return;
    }
    const id = `u-${Date.now().toString(36)}`;
    const days = WHEN.find((w) => w.key === when)!.days;
    const deliverAt = days ? addDays(TODAY, days) : undefined;
    const time = new Date().toTimeString().slice(0, 5);
    const started = Date.now();
    setStep(0);
    setBusy({ mode: deliverAt ? "send" : "ignite", deliverAt });

    // Пока идёт анимация, Claude читает текст. Без ответа — запись разберётся словарём.
    const analysis = await requestAnalysis(text.trim(), TODAY, time);
    addEntry({
      id,
      date: TODAY,
      time,
      text: text.trim(),
      songId: song.id,
      palette: mergePalettes(photos.map((p) => p.palette), FALLBACK),
      photos: photos.map((p) => p.src),
      deliverAt,
      analysis: analysis ?? undefined,
    });
    const minShow = deliverAt ? 2600 : 2800;
    setTimeout(() => router.push(`/entry/${id}`), Math.max(0, minShow - (Date.now() - started)));
  };

  const fillDemo = () => {
    setText("Утром выпал первый снег. Сидела у окна с какао и смотрела, как всё становится тихим. Немного грустно, что осень закончилась.");
    setSongId("let-it-snow");
    setError(null);
  };

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-[max(env(safe-area-inset-top),12px)]">
      <header className="flex items-center justify-between">
        <Link href="/" aria-label="Закрыть" className="-ml-2 rounded-full p-2 text-star-700 hover:text-star-100">
          <IconX size={20} />
        </Link>
        <span className="font-mono text-[11px] text-star-500">{humanDate(TODAY)} · вечер</span>
        <button type="button" onClick={fillDemo} className="text-xs text-star-500 underline-offset-4 hover:text-star-300 hover:underline">
          пример
        </button>
      </header>

      <h1 className="font-display text-[24px] leading-tight text-star-100">
        Каким светом
        <br />
        был твой день?
      </h1>

      <div>
        <label htmlFor="entry" className="sr-only">
          Как прошёл день
        </label>
        <textarea
          id="entry"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
          rows={5}
          placeholder="Утром выпал первый снег. Сидела у окна с какао…"
          className="w-full resize-none rounded-[var(--radius-field)] border border-transparent bg-night-800 p-3.5 text-[14px] leading-relaxed text-star-100 outline-none placeholder:text-star-700 focus:border-night-500"
        />
      </div>

      <section aria-label="Фотографии дня">
        <p className="mb-2 font-mono text-[11px] tracking-[0.08em] text-star-500">ФОТО ДНЯ</p>
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
          {photos.map((p, i) => (
            <div key={i} className="relative shrink-0">
              <div className="h-[68px] w-[68px] overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element -- локальное превью */}
                <img src={p.src} alt={`Фото ${i + 1}`} className="h-full w-full object-cover" />
              </div>
              <div className="mt-1 flex justify-center gap-0.5" aria-label="Цвета, найденные на фото">
                {p.palette.map((c) => (
                  <span key={c} className="h-2 w-2 rounded-full" style={{ background: c }} />
                ))}
              </div>
              <button
                type="button"
                aria-label="Убрать фото"
                onClick={() => setPhotos((ps) => ps.filter((_, k) => k !== i))}
                className="absolute right-1 top-1 rounded-full bg-night-950/70 p-0.5 text-star-100"
              >
                <IconX size={12} />
              </button>
            </div>
          ))}
          {photos.length < 4 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-xl border border-dashed border-night-500 text-star-700 hover:text-star-300"
              aria-label="Добавить фото"
            >
              <IconPhotoPlus size={20} />
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              onFiles(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-star-700">Фото остаются на устройстве — из их цветов растёт палитра дня.</p>
      </section>

      <section aria-label="Песня дня">
        <p className="mb-2 font-mono text-[11px] tracking-[0.08em] text-star-500">ПЕСНЯ ДНЯ</p>
        {song ? (
          <div className="flex items-center gap-3 rounded-[var(--radius-field)] border border-night-600 px-3 py-2.5">
            <IconMusic size={18} className="text-glow-400" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] text-star-100">{song.title}</p>
              <p className="truncate font-mono text-[11px] text-star-500">
                {song.artist} · {song.bpm} bpm · {song.mode === "major" ? "мажор" : "минор"}
              </p>
            </div>
            <IconCheck size={18} className="text-aurora" aria-label="Фрагмент найден" />
            <button type="button" aria-label="Сменить песню" onClick={() => setSongId(null)} className="text-star-700 hover:text-star-300">
              <IconX size={16} />
            </button>
          </div>
        ) : (
          <div>
            <div className="relative">
              <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-star-700" aria-hidden />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Название или исполнитель"
                aria-label="Найти песню"
                className="h-11 w-full rounded-[var(--radius-field)] bg-night-800 pl-9 pr-3 text-[14px] text-star-100 outline-none placeholder:text-star-700 focus:ring-1 focus:ring-night-500"
              />
            </div>
            <ul className="mt-1.5 overflow-hidden rounded-[var(--radius-field)] border border-night-600 bg-night-800">
              {results.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSongId(s.id);
                      setQuery("");
                      setError(null);
                    }}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-[13px] text-star-300 hover:bg-night-700"
                  >
                    <span className="truncate">
                      {s.title} <span className="text-star-700">— {s.artist}</span>
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-star-700">{s.bpm}</span>
                  </button>
                </li>
              ))}
              {!results.length && <li className="px-3 py-2.5 text-[13px] text-star-700">Ничего не нашли — в прототипе 10 песен</li>}
            </ul>
          </div>
        )}
      </section>

      <section aria-label="Когда зажечь">
        <p className="mb-2 font-mono text-[11px] tracking-[0.08em] text-star-500">КОГДА ЗАЖЕЧЬ</p>
        <div className="grid grid-cols-3 gap-1 rounded-full bg-night-800 p-1">
          {WHEN.map((w) => (
            <button
              key={w.key}
              type="button"
              aria-pressed={when === w.key}
              onClick={() => setWhen(w.key)}
              className={`rounded-full py-2 text-xs transition-colors ${when === w.key ? "bg-night-600 text-star-100" : "text-star-500"}`}
            >
              {w.label}
            </button>
          ))}
        </div>
        {when !== "now" && (
          <p className="animate-rise mt-2 text-[12px] leading-snug text-star-500">
            Свет звезды доходит до нас позже. Запись запечатается и откроется {humanDate(addDays(TODAY, WHEN.find((w) => w.key === when)!.days))}{" "}
            {addDays(TODAY, WHEN.find((w) => w.key === when)!.days).slice(0, 4)}.
          </p>
        )}
      </section>

      <div className="mt-auto pt-2">
        {error && <p className="mb-2 text-center text-xs text-ember">{error}</p>}
        <PrimaryButton onClick={submit}>
          {when === "now" ? <IconSparkles size={18} aria-hidden /> : <IconSend size={18} aria-hidden />}
          {when === "now" ? "Зажечь день" : "Отправить свет в будущее"}
        </PrimaryButton>
      </div>

      {busy && (
        <div className="fixed inset-0 z-50 mx-auto flex max-w-[430px] flex-col items-center justify-center bg-night-950" role="status" aria-live="polite">
          {busy.mode === "ignite" &&
            [0, 0.5, 1].map((d) => (
              <span
                key={d}
                aria-hidden
                className="absolute left-1/2 top-[42%] aspect-square w-[80%] rounded-full border border-glow-400/40"
                style={{ transform: "translate(-50%, -50%)", opacity: 0, animation: `ignite-ring 1.8s var(--ease-soft) ${d}s infinite both` }}
              />
            ))}
          <span
            aria-hidden
            className="absolute left-1/2 top-[42%] aspect-square w-[34%] rounded-full bg-glow-400"
            style={{
              transform: "translate(-50%, -50%)",
              animation:
                busy.mode === "send"
                  ? "ignite-core 1s var(--ease-soft) both, float-up 1.4s ease-in 1.1s both"
                  : "ignite-core 1.6s var(--ease-soft) both",
              boxShadow: "0 0 0 18px rgba(255,201,121,0.15), 0 0 0 44px rgba(255,201,121,0.07), 0 0 0 80px rgba(255,201,121,0.03)",
            }}
          />
          <div className="absolute inset-x-6 bottom-[18%] text-center">
            <p className="font-display text-[17px] text-star-100">{busy.mode === "send" ? "Свет летит в будущее" : "Зажигаем день"}</p>
            <p key={step} className="animate-rise mt-2 font-mono text-[12px] text-star-500">
              {steps[step]}
              {busy.mode === "send" && step === steps.length - 1 && busy.deliverAt
                ? ` — долетит ${humanDate(busy.deliverAt)} ${busy.deliverAt.slice(0, 4)}`
                : "…"}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
