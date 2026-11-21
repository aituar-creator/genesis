import { Suspense } from "react";
import { EntryView } from "@/components/EntryView";
import { DEMO_LETTER } from "@/data/letters";

/** Записи пользователя живут в браузере, поэтому заранее собираем только демо-письмо. */
export function generateStaticParams() {
  return [{ id: DEMO_LETTER.id }];
}

export const metadata = { title: "Запись — Послесвечение" };

export default function EntryPage() {
  return (
    <Suspense fallback={<main className="flex-1" />}>
      <EntryView />
    </Suspense>
  );
}
