import type { PhotoStub } from "@/lib/types";

type Props = {
  palette: string[];
  photo?: PhotoStub;
  /** Реальное фото (object URL) — на экране новой записи. */
  src?: string;
  /** Длительность удара, с. */
  beat?: number;
  /** Амплитуда пульса. */
  amp?: number;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Главный образ «Света звезды»: отпечаток дня внутри ореолов его палитры.
 * Ореолы пульсируют в такт песне (--beat) с силой энергии дня (--amp).
 */
export function GlowOrb({ palette, photo, src, beat = 1, amp = 0.04, className = "", style }: Props) {
  const [c1, c2, c3] = palette;
  const halo = (size: string, color: string, opacity: number, delay: number) => (
    <span
      className="absolute left-1/2 top-1/2 aspect-square rounded-full"
      style={
        {
          width: size,
          background: color,
          opacity,
          transform: "translate(-50%, -50%)",
          animation: `halo-pulse var(--beat) ease-in-out ${delay}s infinite`,
        } as React.CSSProperties
      }
    />
  );

  return (
    <div
      className={`relative aspect-square ${className}`}
      style={{ "--beat": `${beat}s`, "--amp": amp, ...style } as React.CSSProperties}
    >
      {halo("260%", c3 ?? c1, 0.07, 0)}
      {halo("190%", c1, 0.1, beat * 0.15)}
      {halo("140%", c2 ?? c1, 0.26, beat * 0.3)}
      <div
        className="absolute inset-0 overflow-hidden rounded-full"
        style={{ boxShadow: `0 0 0 2px var(--glow-300), 0 0 0 7px ${c2 ?? c1}40` }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- локальный object URL
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : photo ? (
          <div className="flex h-full w-full flex-col">
            <div className="flex-[55]" style={{ background: photo.top }} />
            <div className="flex-[45]" style={{ background: photo.bottom }} />
          </div>
        ) : (
          <div className="h-full w-full" style={{ background: c1 }} />
        )}
      </div>
    </div>
  );
}
