import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DayView } from "@/components/DayView";
import { DEMO_DAYS, getDay } from "@/data/demo-days";

export function generateStaticParams() {
  return DEMO_DAYS.map((d) => ({ id: d.id }));
}

export async function generateMetadata({ params }: PageProps<"/day/[id]">) {
  const { id } = await params;
  const day = getDay(id);
  return { title: day ? `${day.title} — Послесвечение` : "Послесвечение" };
}

async function DayContent({ params }: { params: PageProps<"/day/[id]">["params"] }) {
  const { id } = await params;
  const day = getDay(id);
  if (!day) notFound();
  return <DayView day={day} />;
}

/** Пока день загружается — пустая открытка того же размера, чтобы экран не прыгал. */
function DaySkeleton() {
  return (
    <main className="flex flex-1 flex-col gap-4 px-4 pt-14">
      <div className="aspect-[4/5] w-full animate-pulse rounded-[var(--radius-card)] bg-night-800" />
      <div className="h-[60px] animate-pulse rounded-[var(--radius-field)] bg-night-800" />
    </main>
  );
}

export default function DayPage({ params }: PageProps<"/day/[id]">) {
  return (
    <Suspense fallback={<DaySkeleton />}>
      <DayContent params={params} />
    </Suspense>
  );
}
