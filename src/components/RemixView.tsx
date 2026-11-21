"use client";

import { IconArrowBackUp, IconArrowLeft, IconWand } from "@tabler/icons-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { SONGS } from "@/data/songs";
import { diffDays, remixDay } from "@/lib/rules";
import type { Day } from "@/lib/types";
import { CONFLICT_LABEL } from "@/lib/visual";
import { PassportRadar } from "./PassportRadar";
import { Postcard } from "./Postcard";
import { StyleMixBar } from "./StyleMixBar";

const LIGHTS: { key: string; label: string; palette?: [string, string, string, string] }[] = [
  { key: "own", label: "как на фото" },
  { key: "gold", label: "золотой час", palette: ["#f2a65a", "#ffc979", "#e8736a", "#ffe3b5"] },
  { key: "city", label: "холодный город", palette: ["#4a5a7a", "#7f8fb0", "#9c97e8", "#1f2540"] },
  { key: "lilac", label: "сирень и дождь", palette: ["#8a6a9b", "#b8c6d6", "#5a4a7a", "#e6e4ff"] },
  { key: "sea", label: "море", palette: ["#3e8a9b", "#7fc4c9", "#e6e4ff", "#1f4a5a"] },
];

const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-2 font-mono text-[11px] tracking-[0.08em] text-star-500">{children}</p>
);

/**
 * «А что если…»: меняешь песню, свет фото или настроение текста — правила
 * пересчитывают паспорт и перерисовывают открытку, а карточка объясняет разницу.
 */
export function RemixView({ day, backHref, onBack }: { day: Day; backHref?: string; onBack?: () => void }) {
  const [songTitle, setSongTitle] = useState<string | null>(null);
  const [light, setLight] = useState("own");
  const [valence, setValence] = useState<number | null>(null);

  const song = SONGS.find((s) => s.title === songTitle);
  const palette = LIGHTS.find((l) => l.key === light)?.palette;
  const changed = !!song || !!palette || valence !== null;

  const remixed = useMemo(
    () => (changed ? remixDay(day, { song, palette, valence: valence ?? undefined }) : day),
    [changed, day, song, palette, valence],
  );
  const diff = changed ? diffDays(day, remixed) : [];
  const v = valence ?? day.textMood.valence;

  const reset = () => {
    setSongTitle(null);
    setLight("own");
    setValence(null);
  };

  const back = onBack ? (
    <button type="button" onClick={onBack} aria-label="Назад к дню" className="-ml-2 rounded-full p-2 text-star-500 hover:text-star-100">
      <IconArrowLeft size={20} />
    </button>
  ) : (
    <Link href={backHref ?? "/"} aria-label="Назад к дню" className="-ml-2 rounded-full p-2 text-star-500 hover:text-star-100">
      <IconArrowLeft size={20} />
    </Link>
  );

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 pb-8 pt-[max(env(safe-area-inset-top),12px)]">
      <header className="flex items-center justify-between">
        {back}
        <span className="flex items-center gap-1.5 font-display text-[14px] text-star-100">
          <IconWand size={16} className="text-glow-400" aria-hidden /> А что если…
        </span>
        <button
          type="button"
          onClick={reset}
          disabled={!changed}
          aria-label="Вернуть как было"
          className="-mr-2 rounded-full p-2 text-star-500 hover:text-star-100 disabled:opacity-30"
        >
          <IconArrowBackUp size={20} />
        </button>
      </header>

      <div className="animate-rise">
        <Postcard day={remixed} live />
      </div>

      <section className="rounded-[var(--radius-field)] bg-night-800 p-4" aria-live="polite">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-mono text-[11px] tracking-[0.08em] text-star-500">ЧТО ИЗМЕНИЛОСЬ</p>
          {remixed.passport.conflict && (
            <span className="rounded-full bg-glow-500/15 px-2 py-0.5 font-mono text-[10px] text-glow-400">
              {CONFLICT_LABEL[remixed.passport.conflict.kind]}
            </span>
          )}
        </div>
        {diff.length ? (
          <ul className="flex flex-col gap-1.5 text-[13px] leading-snug text-star-300">
            {diff.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-glow-400" />
                {line}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] leading-snug text-star-500">
            Поменяй песню, свет фото или настроение текста — правила перерисуют день и объяснят, что поменялось.
          </p>
        )}
        <div className="mt-4 grid grid-cols-[1fr_120px] items-center gap-3">
          <div className="flex flex-col gap-3">
            {changed && (
              <div className="opacity-60">
                <p className="mb-1 font-mono text-[10px] text-star-700">было</p>
                <StyleMixBar styles={day.styles} />
              </div>
            )}
            <div>
              <p className="mb-1 font-mono text-[10px] text-star-700">{changed ? "стало" : "сейчас"}</p>
              <StyleMixBar styles={remixed.styles} />
            </div>
          </div>
          <PassportRadar passport={remixed.passport} color={remixed.palette[1]} compare={changed ? day.passport : undefined} labels={false} />
        </div>
      </section>

      <section aria-label="Другая песня">
        <Label>ДРУГАЯ ПЕСНЯ</Label>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {SONGS.map((s) => {
            const active = (songTitle ?? day.song.title) === s.title;
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={active}
                onClick={() => setSongTitle(s.title === day.song.title ? null : s.title)}
                className={`flex shrink-0 flex-col items-start rounded-[var(--radius-field)] border px-3 py-2 text-left transition-colors ${
                  active ? "border-glow-500/60 bg-glow-500/10" : "border-night-600 hover:border-night-500"
                }`}
              >
                <span className={`whitespace-nowrap text-[13px] ${active ? "text-glow-400" : "text-star-100"}`}>{s.title}</span>
                <span className="whitespace-nowrap font-mono text-[10px] text-star-500">
                  {s.bpm} bpm · {s.mode === "major" ? "мажор" : "минор"} · {s.year}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-label="Свет фото">
        <Label>СВЕТ ФОТО</Label>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {LIGHTS.map((l) => {
            const pal = l.palette ?? day.palette;
            const active = light === l.key;
            return (
              <button
                key={l.key}
                type="button"
                aria-pressed={active}
                onClick={() => setLight(l.key)}
                className={`flex shrink-0 items-center gap-2 rounded-full border py-1.5 pl-2 pr-3 text-xs transition-colors ${
                  active ? "border-glow-500/60 bg-glow-500/10 text-glow-400" : "border-night-600 text-star-300"
                }`}
              >
                <span className="flex -space-x-1">
                  {pal.slice(0, 3).map((c) => (
                    <span key={c} className="h-3.5 w-3.5 rounded-full border border-night-900" style={{ background: c }} />
                  ))}
                </span>
                <span className="whitespace-nowrap">{l.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-label="Настроение текста">
        <Label>НАСТРОЕНИЕ ТЕКСТА</Label>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(v * 100)}
          onChange={(e) => setValence(Number(e.target.value) / 100)}
          aria-label="Настроение текста: от тяжёлого к светлому"
          className="w-full accent-[var(--glow-400)]"
        />
        <div className="flex justify-between font-mono text-[10px] text-star-700">
          <span>тяжёлый</span>
          <span>светлый</span>
        </div>
      </section>
    </main>
  );
}
