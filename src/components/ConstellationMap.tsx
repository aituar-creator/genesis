"use client";

import { IconChevronRight } from "@tabler/icons-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ARCHIVE } from "@/data/archive";
import { buildSkyMap } from "@/lib/constellations";
import { humanDate } from "@/lib/visual";

/** Карта созвездий: похожие по паспорту дни стоят рядом и соединены линиями. */
export function ConstellationMap() {
  const map = useMemo(() => buildSkyMap(ARCHIVE), []);
  const [active, setActive] = useState<number | null>(null);
  const [star, setStar] = useState<string | null>(null);

  const memberOf = (id: string) => map.constellations.findIndex((c) => c.members.includes(id));
  const selected = star ? ARCHIVE.find((p) => p.id === star) : undefined;
  const selConst = selected ? map.constellations[memberOf(selected.id)] : undefined;

  return (
    <section aria-label="Созвездия похожих дней" className="flex flex-col gap-3">
      <div className="relative -mx-1 rounded-[var(--radius-card)] bg-night-950/60 ring-1 ring-night-700">
        <svg viewBox="0 0 100 108" className="block w-full" role="img" aria-label="Карта: похожие дни рядом">
          {map.constellations.map((c, ci) => {
            const dim = active !== null && active !== ci;
            return (
              <g key={c.name} opacity={dim ? 0.15 : 1} style={{ transition: "opacity .3s" }}>
                {c.edges.map(([a, b], k) => (
                  <line
                    key={`${a}-${b}`}
                    x1={map.pos[a].x}
                    y1={map.pos[a].y}
                    x2={map.pos[b].x}
                    y2={map.pos[b].y}
                    pathLength={100}
                    stroke={active === ci ? "var(--glow-300)" : "var(--star-500)"}
                    strokeOpacity={active === ci ? 0.9 : 0.45}
                    strokeWidth={0.35}
                    strokeDasharray="100"
                    style={{ animation: `draw-line 1.2s var(--ease-soft) ${0.2 + ci * 0.15 + k * 0.06}s both` }}
                  />
                ))}
                <text
                  x={Math.min(84, Math.max(16, c.center.x))}
                  y={Math.max(4, c.center.y - 4.5)}
                  textAnchor="middle"
                  fontSize="3"
                  fill={active === ci ? "var(--glow-300)" : "var(--star-300)"}
                  fontFamily="var(--font-manrope)"
                  className="cursor-pointer select-none"
                  onClick={() => setActive(active === ci ? null : ci)}
                >
                  {c.name}
                </text>
              </g>
            );
          })}
          {ARCHIVE.map((p) => {
            const ci = memberOf(p.id);
            const dim = active !== null && ci !== active;
            const { x, y } = map.pos[p.id];
            const isSel = star === p.id;
            return (
              <g
                key={p.id}
                opacity={dim ? 0.2 : 1}
                className="cursor-pointer"
                onClick={() => {
                  setStar(p.id);
                  if (ci >= 0) setActive(ci);
                }}
                role="button"
                aria-label={p.title}
              >
                <circle cx={x} cy={y} r={4} fill="transparent" />
                {p.dayId && <circle cx={x} cy={y} r={3.2} fill={p.color} opacity={0.18} />}
                <circle cx={x} cy={y} r={p.dayId ? 1.7 : 1} fill={p.color} />
                {isSel && <circle cx={x} cy={y} r={3} fill="none" stroke="var(--glow-300)" strokeWidth={0.4} />}
              </g>
            );
          })}
        </svg>
        <p className="pointer-events-none absolute bottom-2 left-3 font-mono text-[10px] text-star-700">похожие дни — рядом</p>
      </div>

      {selected && (
        <div className="animate-rise flex items-center gap-3 rounded-[var(--radius-field)] bg-night-800 p-3">
          <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: selected.color, boxShadow: `0 0 0 4px ${selected.color}30` }} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] text-star-100">{selected.title}</p>
            <p className="font-mono text-[11px] text-star-500">
              {humanDate(selected.date)} {selected.date.slice(0, 4)}
              {selConst ? ` · ${selConst.name}` : " · одинокая звезда"}
            </p>
          </div>
          {selected.dayId ? (
            <Link href={`/day/${selected.dayId}`} className="flex items-center gap-1 text-xs text-glow-400">
              открыть <IconChevronRight size={14} />
            </Link>
          ) : (
            <span className="font-mono text-[10px] text-star-700">архив</span>
          )}
        </div>
      )}

      <ul className="flex flex-col gap-1.5">
        {map.constellations.map((c, ci) => (
          <li key={c.name}>
            <button
              type="button"
              onClick={() => setActive(active === ci ? null : ci)}
              aria-pressed={active === ci}
              className={`flex w-full items-center justify-between rounded-[var(--radius-field)] px-3 py-2.5 text-left transition-colors ${
                active === ci ? "bg-glow-500/10 ring-1 ring-glow-500/40" : "bg-night-800/70 hover:bg-night-800"
              }`}
            >
              <span className={`text-[13px] ${active === ci ? "text-glow-400" : "text-star-100"}`}>{c.name}</span>
              <span className="font-mono text-[10px] text-star-500">{c.note}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="text-[11px] leading-relaxed text-star-700">
        Созвездия собираются сами: дни соединяются, когда их паспорта из 8 осей похожи. Название — по общим чертам дней.
      </p>
    </section>
  );
}
