import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { Postcard } from "@/components/Postcard";
import { DEMO_DAYS } from "@/data/demo-days";
import { humanDate, STYLE_META } from "@/lib/visual";
import type { StyleKey } from "@/lib/types";

export default function FeedPage() {
  const days = [...DEMO_DAYS].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <main className="flex flex-1 flex-col gap-6 px-4 pb-6 pt-[max(env(safe-area-inset-top),16px)]">
        <header>
          <p className="font-mono text-[11px] tracking-[0.12em] text-star-500">ЛЕНТА</p>
          <h1 className="font-display text-[22px] text-star-100">Оглавление дней</h1>
        </header>
        {days.map((d) => {
          const top = (Object.entries(d.styles) as [StyleKey, number][]).sort((a, b) => b[1] - a[1])[0][0];
          return (
            <Link key={d.id} href={`/day/${d.id}`} className="flex flex-col gap-2">
              <Postcard day={d} />
              <div className="flex justify-between px-1 font-mono text-[11px] text-star-500">
                <span>
                  {humanDate(d.date)} {d.date.slice(0, 4)}
                </span>
                <span>{STYLE_META[top].label}</span>
              </div>
            </Link>
          );
        })}
      </main>
      <BottomNav />
    </>
  );
}
