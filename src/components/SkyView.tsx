"use client";

import { IconChevronRight } from "@tabler/icons-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DEMO_LETTER } from "@/data/letters";
import { daysWord } from "@/lib/constellations";
import { daysBetween, entryToDay, isSealed, useEntries } from "@/lib/entries-store";
import type { Day } from "@/lib/types";
import { humanDate, isWarm, MONTHS_SHORT, rng } from "@/lib/visual";
import { ConstellationMap } from "./ConstellationMap";
import { GlowOrb } from "./GlowOrb";
import { Postcard } from "./Postcard";
import { Chip } from "./ui";

type Filter = "warm" | "cold" | "winter" | "summer" | "friends" | null;

const FILTERS: { key: Exclude<Filter, null>; label: string; test: (d: Day) => boolean }[] = [
  { key: "warm", label: "тёплые", test: (d) => isWarm(d) },
  { key: "cold", label: "холодные", test: (d) => !isWarm(d) },
  { key: "winter", label: "зима", test: (d) => d.season === "winter" },
  { key: "summer", label: "лето", test: (d) => d.season === "summer" },
  { key: "friends", label: "с друзьями", test: (d) => d.withFriends },
];

/** Цвета «фоновых» записей года по сезону — чтобы небо выглядело живым дневником. */
const SEASON_COLORS = [
  ["#8c9bc2", "#b8c6d6", "#6e8197"], // зима
  ["#b8c6d6", "#e8b4a0", "#9c97e8"], // весна
  ["#f2a65a", "#7fc4c9", "#e8736a"], // лето
  ["#c98b4e", "#8a6a9b", "#d49a5e"], // осень
];
const seasonOf = (month: number) => [0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 0][month];

export function SkyView({ days, year, today, onThisDay }: { days: Day[]; year: number; today: string; onThisDay?: Day }) {
  const [filter, setFilter] = useState<Filter>(null);
  const [mode, setMode] = useState<"calendar" | "stars">("calendar");
  const test = FILTERS.find((f) => f.key === filter)?.test;
  const state = useEntries();

  const byDate = useMemo(() => new Map(days.filter((d) => d.date.startsWith(String(year))).map((d) => [d.date, d])), [days, year]);

  /** Свет в пути: демо-письмо из прошлого и записи, отправленные в будущее. */
  const travelling = useMemo(() => {
    const list: { id: string; sentOn: string; deliverAt: string; label: string }[] = [];
    if (isSealed(DEMO_LETTER.deliverAt, DEMO_LETTER.id, state, today))
      list.push({ id: DEMO_LETTER.id, sentOn: DEMO_LETTER.sentOn, deliverAt: DEMO_LETTER.deliverAt, label: "Письмо из прошлого года" });
    for (const e of state.entries)
      if (isSealed(e.deliverAt, e.id, state, today)) list.push({ id: e.id, sentOn: e.date, deliverAt: e.deliverAt!, label: "Твой день" });
    return list;
  }, [state, today]);

  const recent = useMemo(() => {
    const mine = state.entries.filter((e) => !isSealed(e.deliverAt, e.id, state, today)).map((e) => ({ day: entryToDay(e), href: `/entry/${e.id}` }));
    const letter = state.arrived.includes(DEMO_LETTER.id) ? [{ day: DEMO_LETTER.day, href: `/entry/${DEMO_LETTER.id}` }] : [];
    const demo = [...days]
      .filter((d) => d.date <= today)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((d) => ({ day: d, href: `/day/${d.id}` }));
    return [...mine, ...letter, ...demo].slice(0, 5);
  }, [days, today, state]);

  const r = rng(year);
  const months = MONTHS_SHORT.map((label, m) => {
    const len = new Date(year, m + 1, 0).getDate();
    const cells = Array.from({ length: len }, (_, i) => {
      const iso = `${year}-${String(m + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
      const roll = r();
      const colorRoll = r();
      const day = byDate.get(iso);
      if (day) return { kind: "day" as const, iso, day };
      if (iso > today) return { kind: "future" as const, iso };
      if (roll < 0.42) {
        const pal = SEASON_COLORS[seasonOf(m)];
        return { kind: "past" as const, iso, color: pal[Math.floor(colorRoll * pal.length)] };
      }
      return { kind: "empty" as const, iso };
    });
    return { label, cells };
  });

  const lit = months.reduce((n, m) => n + m.cells.filter((c) => c.kind === "day" || c.kind === "past").length, 0);

  return (
    <div className="flex flex-col gap-5 px-4 pb-6 pt-[max(env(safe-area-inset-top),16px)]">
      <header className="flex items-end justify-between">
        <div>
          <p className="font-mono text-[11px] tracking-[0.12em] text-star-500">ПОСЛЕСВЕЧЕНИЕ</p>
          <h1 className="font-display text-[28px] leading-none text-star-100">{year}</h1>
        </div>
        <p className="font-mono text-[11px] text-star-500">{lit} дней светят</p>
      </header>

      <div className="grid grid-cols-2 gap-1 rounded-full bg-night-800 p-1" role="tablist" aria-label="Вид неба">
        {(
          [
            ["calendar", "Календарь"],
            ["stars", "Созвездия"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={mode === key}
            onClick={() => setMode(key)}
            className={`rounded-full py-2 text-xs transition-colors ${mode === key ? "bg-night-600 text-star-100" : "text-star-500"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "stars" ? (
        <ConstellationMap />
      ) : (
      <>
      <section aria-label="Небо года: каждый день — звезда своей палитры" className="flex flex-col gap-[7px]">
        {months.map((mo) => (
          <div key={mo.label} className="flex items-center gap-2">
            <span className="w-7 shrink-0 font-mono text-[10px] text-star-700">{mo.label}</span>
            <div className="grid flex-1 grid-cols-[repeat(31,minmax(0,1fr))] items-center gap-[2px]">
              {mo.cells.map((c) => {
                if (c.kind === "day") {
                  const on = !test || test(c.day);
                  return (
                    <Link
                      key={c.iso}
                      href={`/day/${c.day.id}`}
                      aria-label={`${humanDate(c.iso)} — ${c.day.title}`}
                      className="relative z-10 mx-auto aspect-square w-full scale-[1.6] rounded-full transition-opacity"
                      style={{
                        background: c.day.palette[1],
                        boxShadow: `0 0 0 2px ${c.day.palette[0]}55, 0 0 0 5px ${c.day.palette[2]}22`,
                        opacity: on ? 1 : 0.15,
                      }}
                    />
                  );
                }
                if (c.kind === "past")
                  return (
                    <span
                      key={c.iso}
                      aria-hidden
                      className="mx-auto aspect-square w-[70%] rounded-full transition-opacity"
                      style={{ background: c.color, opacity: test ? 0.12 : 0.55 }}
                    />
                  );
                if (c.kind === "future")
                  return <span key={c.iso} aria-hidden className="mx-auto aspect-square w-[45%] rounded-full border border-night-600" />;
                return <span key={c.iso} aria-hidden className="mx-auto aspect-square w-[35%] rounded-full bg-night-700" />;
              })}
            </div>
          </div>
        ))}
      </section>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {FILTERS.map((f) => (
          <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(filter === f.key ? null : f.key)}>
            {f.label}
          </Chip>
        ))}
      </div>
      </>
      )}

      {travelling.length > 0 && (
        <section aria-label="Свет в пути" className="flex flex-col gap-2">
          <h2 className="font-display text-[15px] text-star-100">Свет в пути</h2>
          {travelling.map((t) => {
            const total = Math.max(1, daysBetween(t.sentOn, t.deliverAt));
            const left = Math.max(0, daysBetween(today, t.deliverAt));
            const progress = Math.min(1, (total - left) / total);
            return (
              <Link key={t.id} href={`/entry/${t.id}`} className="rounded-[var(--radius-field)] bg-night-800 p-3.5 transition-colors hover:bg-night-700">
                <div className="flex items-baseline justify-between">
                  <p className="text-[13px] text-star-100">{t.label}</p>
                  <p className="font-mono text-[11px] text-glow-400">через {daysWord(left)}</p>
                </div>
                <div className="relative mt-2.5 h-[2px] rounded-full bg-night-600">
                  <div className="h-full rounded-full bg-glow-400/60" style={{ width: `${progress * 100}%` }} />
                  <span
                    className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-glow-300 shadow-[0_0_0_3px_rgba(255,201,121,0.2)]"
                    style={{ left: `${progress * 100}%` }}
                  />
                </div>
                <p className="mt-1.5 font-mono text-[10px] text-star-700">
                  отправлено {humanDate(t.sentOn)} {t.sentOn.slice(0, 4)} · откроется {humanDate(t.deliverAt)} {t.deliverAt.slice(0, 4)}
                </p>
              </Link>
            );
          })}
        </section>
      )}

      {onThisDay && (
        <Link href={`/day/${onThisDay.id}`} className="flex items-center gap-4 overflow-hidden rounded-[var(--radius-field)] bg-night-800 p-3.5 transition-colors hover:bg-night-700">
          <GlowOrb palette={onThisDay.palette} photo={onThisDay.photos[0]} beat={60 / onThisDay.song.bpm} amp={0.06} className="ml-2 w-10 shrink-0" />
          <div className="ml-2 min-w-0 flex-1">
            <p className="font-mono text-[11px] text-glow-400">в этот день · {onThisDay.date.slice(0, 4)}</p>
            <p className="truncate text-[14px] text-star-100">{onThisDay.title}</p>
          </div>
          <IconChevronRight size={18} className="text-star-700" aria-hidden />
        </Link>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-[15px] text-star-100">Недавние дни</h2>
          <Link href="/feed" className="text-xs text-star-500 hover:text-star-300">
            вся лента
          </Link>
        </div>
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {recent.map(({ day, href }) => (
            <Link key={day.id} href={href} className="w-[62%] shrink-0 snap-start">
              <Postcard day={day} compact />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
