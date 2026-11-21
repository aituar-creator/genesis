"use client";

import { IconArrowLeft, IconClockHour4, IconLock } from "@tabler/icons-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { TODAY } from "@/data/demo-days";
import { DEMO_LETTER } from "@/data/letters";
import { daysBetween, entryToDay, isSealed, markArrived, useEntries } from "@/lib/entries-store";
import type { Day } from "@/lib/types";
import { humanDate } from "@/lib/visual";
import { daysWord } from "@/lib/constellations";
import { DayView } from "./DayView";
import { GlowOrb } from "./GlowOrb";
import { Postcard } from "./Postcard";
import { RemixView } from "./RemixView";
import { PrimaryButton } from "./ui";

const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

/** Запись пользователя или письмо из прошлого: запечатано → прилёт → папка дня. */
export function EntryView() {
  const { id } = useParams<{ id: string }>();
  const mounted = useMounted();
  const state = useEntries();
  const [revealing, setRevealing] = useState(false);
  const [remix, setRemix] = useState(false);

  const found = useMemo(() => {
    if (id === DEMO_LETTER.id) return { day: DEMO_LETTER.day, sentOn: DEMO_LETTER.sentOn, deliverAt: DEMO_LETTER.deliverAt, photos: 0 };
    const e = state.entries.find((x) => x.id === id);
    return e ? { day: entryToDay(e), sentOn: e.date, deliverAt: e.deliverAt, photos: e.photos.length } : null;
  }, [id, state.entries]);

  useEffect(() => {
    if (!revealing) return;
    const t = setTimeout(() => setRevealing(false), 3200);
    return () => clearTimeout(t);
  }, [revealing]);

  if (!mounted) return <main className="flex-1" />;

  if (!found)
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-display text-[17px] text-star-100">Эта звезда живёт на другом устройстве</p>
        <p className="text-[13px] text-star-500">Записи хранятся только там, где их написали.</p>
        <Link href="/" className="text-sm text-glow-400">
          К небу
        </Link>
      </main>
    );

  const { day, sentOn, deliverAt } = found;

  if (isSealed(deliverAt, id, state, TODAY))
    return <Sealed day={day} sentOn={sentOn} deliverAt={deliverAt!} photos={found.photos} onRewind={() => (markArrived(id), setRevealing(true))} />;

  if (revealing) return <Arrival day={day} travelled={deliverAt ? daysBetween(sentOn, deliverAt) : 0} />;

  if (remix) return <RemixView day={day} onBack={() => setRemix(false)} />;
  return <DayView day={day} onRemix={() => setRemix(true)} />;
}

function Sealed({ day, sentOn, deliverAt, photos, onRewind }: { day: Day; sentOn: string; deliverAt: string; photos: number; onRewind: () => void }) {
  const total = Math.max(1, daysBetween(sentOn, deliverAt));
  const left = Math.max(0, daysBetween(TODAY, deliverAt));
  const progress = Math.min(1, (total - left) / total);

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 pb-8 pt-[max(env(safe-area-inset-top),12px)]">
      <header className="flex items-center justify-between">
        <Link href="/" aria-label="Назад к небу" className="-ml-2 rounded-full p-2 text-star-500 hover:text-star-100">
          <IconArrowLeft size={20} />
        </Link>
        <span className="font-mono text-[11px] text-star-500">свет в пути</span>
        <span className="w-9" />
      </header>

      <div className="relative mx-auto mt-4 w-[46%]">
        <GlowOrb palette={["#3a3f7a", "#6e6aa8", "#2e3266", "#1c1f42"]} beat={2.4} amp={0.05} />
        <span className="absolute inset-0 flex items-center justify-center text-star-300">
          <IconLock size={28} stroke={1.5} aria-hidden />
        </span>
      </div>

      <div className="text-center">
        <h1 className="font-display text-[20px] text-star-100">{left > 0 ? `Долетит через ${daysWord(left)}` : "Свет уже рядом"}</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-star-500">
          Этот день отправлен в будущее {humanDate(sentOn)} {sentOn.slice(0, 4)}. Он откроется {humanDate(deliverAt)} {deliverAt.slice(0, 4)} — и
          можно будет увидеть, как он ощущался.
        </p>
      </div>

      <div className="rounded-[var(--radius-field)] bg-night-800 p-4">
        <div className="flex justify-between font-mono text-[10px] text-star-500">
          <span>{sentOn.split("-").reverse().join(".")}</span>
          <span>{deliverAt.split("-").reverse().join(".")}</span>
        </div>
        <div className="relative mt-2 h-[3px] rounded-full bg-night-600">
          <div className="h-full rounded-full bg-glow-400/70" style={{ width: `${progress * 100}%` }} />
          <span
            className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-glow-300 shadow-[0_0_0_4px_rgba(255,201,121,0.2)]"
            style={{ left: `${progress * 100}%` }}
          />
        </div>
        <p className="mt-3 flex items-center gap-2 text-[12px] text-star-300">
          <IconClockHour4 size={15} className="text-star-500" aria-hidden />
          Внутри: запись, {photos ? `${photos} фото` : "палитра дня"} и песня «{day.song.title}»
        </p>
      </div>

      <div className="mt-auto">
        <PrimaryButton onClick={onRewind}>Перемотать время (демо)</PrimaryButton>
        <p className="mt-2 text-center text-[11px] text-star-700">В настоящем приложении придёт уведомление в день прилёта.</p>
      </div>
    </main>
  );
}

function Arrival({ day, travelled }: { day: Day; travelled: number }) {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6" role="status" aria-live="polite">
      {[0, 0.6].map((d) => (
        <span
          key={d}
          aria-hidden
          className="absolute left-1/2 top-[40%] aspect-square w-[90%] rounded-full border border-glow-400/40"
          style={{ transform: "translate(-50%, -50%)", opacity: 0, animation: `ignite-ring 2s var(--ease-soft) ${d}s 2 both` }}
        />
      ))}
      <div className="animate-rise w-[78%]" style={{ animationDelay: "0.6s" }}>
        <Postcard day={day} compact />
      </div>
      <div className="animate-rise mt-6 text-center" style={{ animationDelay: "1s" }}>
        <p className="font-display text-[18px] text-star-100">Свет долетел</p>
        <p className="mt-1 font-mono text-[12px] text-star-500">этот день летел к тебе {daysWord(travelled)}</p>
      </div>
    </main>
  );
}
