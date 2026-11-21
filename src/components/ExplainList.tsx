import {
  IconClock,
  IconCloudStorm,
  IconCup,
  IconMusic,
  IconPhoto,
  IconQuote,
  IconUsers,
} from "@tabler/icons-react";
import type { Day, ExplainIcon } from "@/lib/types";

const ICONS: Record<ExplainIcon, typeof IconMusic> = {
  music: IconMusic,
  photo: IconPhoto,
  text: IconQuote,
  weather: IconCloudStorm,
  people: IconUsers,
  clock: IconClock,
  cup: IconCup,
};

/** Объяснение «потому что…» — строится из атрибуций паспорта, не из LLM. */
export function ExplainList({ items }: { items: Day["explain"] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((it, i) => {
        const Icon = ICONS[it.icon];
        return (
          <li key={i} className="animate-rise flex items-start gap-3 text-[13px] leading-snug text-star-300" style={{ animationDelay: `${i * 70}ms` }}>
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-night-700 text-glow-400">
              <Icon size={15} stroke={1.75} aria-hidden />
            </span>
            {it.text}
          </li>
        );
      })}
    </ul>
  );
}
