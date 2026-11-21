import type { Day } from "@/lib/types";
import { rng, stampDate, visualParams } from "@/lib/visual";
import { GlowOrb } from "./GlowOrb";
import { LiveCanvas } from "./LiveCanvas";
import { StyleLayer } from "./StyleLayer";

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

/**
 * Живая открытка 4:5. Постоянные элементы (по концепции): рамка-паспарту, дата-штамп
 * слева сверху, рукописная подпись, название внизу, зерно. Остальное — из паспорта.
 * live — живой фон на шейдере (экран дня, ремикс); в лентах — лёгкая статичная версия.
 */
export function Postcard({ day, compact = false, live = false }: { day: Day; compact?: boolean; live?: boolean }) {
  const v = visualParams(day);
  const r = rng(day.passport.seed + 1);
  const sats = day.photos.slice(1, 1 + v.satellites);
  const satPos = [
    { left: "8%", top: "18%", rot: -8 },
    { left: "68%", top: "52%", rot: 7 },
    { left: "12%", top: "58%", rot: 4 },
  ];

  return (
    <article
      className="relative aspect-[4/5] w-full overflow-hidden rounded-[var(--radius-card)] bg-night-800"
      aria-label={`Открытка дня «${day.title}»`}
    >
      {live ? <LiveCanvas day={day} /> : <StyleLayer day={day} />}

      {Array.from({ length: 14 }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className="absolute rounded-full bg-star-100"
          style={{ left: `${r() * 100}%`, top: `${r() * 70}%`, width: 1.5, height: 1.5, opacity: 0.3 + r() * 0.5 }}
        />
      ))}

      <GlowOrb
        palette={day.palette}
        photo={day.photos[0]}
        src={day.photos[0]?.src}
        beat={v.beat}
        amp={v.amp}
        className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2"
        style={{ width: `${v.orb * 100}%` }}
      />

      {sats.map((ph, i) => (
        <div
          key={i}
          aria-hidden
          className="absolute aspect-square w-[22%] rounded-md bg-star-100 p-[3px]"
          style={{ left: satPos[i].left, top: satPos[i].top, transform: `rotate(${satPos[i].rot}deg)` }}
        >
          {ph.src ? (
            // eslint-disable-next-line @next/next/no-img-element -- фото хранится на устройстве как data URL
            <img src={ph.src} alt="" className="h-full w-full rounded-[3px] object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col overflow-hidden rounded-[3px]">
              <div className="flex-1" style={{ background: ph.top }} />
              <div className="flex-1" style={{ background: ph.bottom }} />
            </div>
          )}
        </div>
      ))}

      {/* Виньетку и зерно живой версии рисует шейдер */}
      {!live && (
        <>
          <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(8,10,26,${v.vignette}) 100%)` }}
      />
          <div
        aria-hidden
        className="pointer-events-none absolute inset-0 mix-blend-overlay"
        style={{ backgroundImage: GRAIN, opacity: v.grain }}
      />
        </>
      )}
      <div aria-hidden className="pointer-events-none absolute inset-2 rounded-[12px] border border-star-100/15" />

      <div className="absolute left-4 top-4 font-mono text-[11px] tracking-[0.08em] text-glow-300/90">
        {stampDate(day.date)}
      </div>

      <div className="absolute inset-x-4 bottom-4 text-center">
        <p className={`font-hand leading-tight text-glow-300 ${compact ? "text-lg" : "text-[22px]"}`}>
          «{day.caption}»
        </p>
        <h2 className={`mt-1 font-display leading-snug text-star-100 ${compact ? "text-[13px]" : "text-base"}`}>
          {day.title}
        </h2>
      </div>
    </article>
  );
}
