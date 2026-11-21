import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RemixView } from "@/components/RemixView";
import { DEMO_DAYS, getDay } from "@/data/demo-days";

export function generateStaticParams() {
  return DEMO_DAYS.map((d) => ({ id: d.id }));
}

export const metadata = { title: "А что если… — Послесвечение" };

async function RemixContent({ params }: { params: PageProps<"/day/[id]/remix">["params"] }) {
  const { id } = await params;
  const day = getDay(id);
  if (!day) notFound();
  return <RemixView day={day} backHref={`/day/${day.id}`} />;
}

export default function RemixPage({ params }: PageProps<"/day/[id]/remix">) {
  return (
    <Suspense fallback={<main className="flex-1" />}>
      <RemixContent params={params} />
    </Suspense>
  );
}
