import type { StyleKey } from "@/lib/types";
import { STYLE_META } from "@/lib/visual";

/** Полоса смешивания художественных приёмов: «70% импрессионизм · 30% плёнка». */
export function StyleMixBar({ styles }: { styles: Partial<Record<StyleKey, number>> }) {
  const entries = (Object.entries(styles) as [StyleKey, number][]).sort((a, b) => b[1] - a[1]);
  return (
    <div>
      <div className="flex h-2.5 overflow-hidden rounded-full">
        {entries.map(([k, w]) => (
          <div key={k} style={{ width: `${w * 100}%`, background: STYLE_META[k].color }} />
        ))}
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-[11px] text-star-300">
        {entries.map(([k, w]) => (
          <li key={k} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: STYLE_META[k].color }} />
            {Math.round(w * 100)}% {STYLE_META[k].label}
          </li>
        ))}
      </ul>
    </div>
  );
}
