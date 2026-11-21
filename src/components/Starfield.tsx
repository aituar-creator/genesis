import { rng } from "@/lib/visual";

/** Фоновое небо. Звёзды детерминированы — сервер и клиент рисуют одно и то же. */
export function Starfield({ count = 90, seed = 7 }: { count?: number; seed?: number }) {
  const r = rng(seed);
  const stars = Array.from({ length: count }, () => ({
    x: r() * 100,
    y: r() * 100,
    s: r() < 0.12 ? 2.5 : r() < 0.5 ? 1.5 : 1,
    o: 0.25 + r() * 0.6,
    d: 2.5 + r() * 5,
    delay: r() * 5,
  }));
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-star-100"
          style={
            {
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.s,
              height: s.s,
              "--o": s.o,
              opacity: s.o,
              animation: `twinkle ${s.d}s ease-in-out ${s.delay}s infinite`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
