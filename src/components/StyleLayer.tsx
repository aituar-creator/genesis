import type { Day, StyleKey } from "@/lib/types";
import { rng } from "@/lib/visual";

/**
 * Фон открытки: смесь художественных приёмов по весам паспорта.
 * Каждый приём — набор простых фигур; прозрачность слоя = вес приёма.
 * В полноценной версии эти слои заменят GLSL-фильтры (см. docs/PLAN.md).
 */
export function StyleLayer({ day }: { day: Day }) {
  const r = rng(day.passport.seed);
  const [c1, c2, c3, c4] = day.palette;
  const entries = (Object.entries(day.styles) as [StyleKey, number][]).sort((a, b) => b[1] - a[1]);

  const layer = (key: StyleKey, w: number) => {
    const o = Math.min(1, 0.25 + w);
    switch (key) {
      case "impressionism":
        return (
          <g key={key} opacity={o * 0.55}>
            {Array.from({ length: 70 }, (_, i) => (
              <ellipse
                key={i}
                cx={r() * 100}
                cy={r() * 125}
                rx={2 + r() * 4}
                ry={0.8 + r() * 1.4}
                fill={[c1, c2, c3, c4][i % 4]}
                opacity={0.25 + r() * 0.35}
                transform={`rotate(${-25 + r() * 50})`}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
              />
            ))}
          </g>
        );
      case "rothko":
        return (
          <g key={key} opacity={o * 0.5}>
            <rect x="6" y="10" width="88" height="44" rx="3" fill={c4} />
            <rect x="6" y="60" width="88" height="52" rx="3" fill={c2} opacity="0.7" />
          </g>
        );
      case "kandinsky":
        return (
          <g key={key} opacity={o * 0.7} fill="none" strokeLinecap="round">
            {Array.from({ length: 7 }, (_, i) => {
              const x = r() * 100;
              const y = r() * 125;
              return (
                <line key={`l${i}`} x1={x} y1={y} x2={x + 30 - r() * 60} y2={y + 30 - r() * 60} stroke={[c2, c3, c1][i % 3]} strokeWidth={0.6 + r() * 1.2} />
              );
            })}
            <circle cx={20 + r() * 60} cy={20 + r() * 30} r={6 + r() * 6} stroke={c3} strokeWidth="1" />
            <circle cx={20 + r() * 60} cy={70 + r() * 30} r={3 + r() * 4} fill={c2} opacity="0.6" />
            <rect x={10 + r() * 60} y={80 + r() * 20} width="14" height="14" stroke={c1} strokeWidth="0.8" transform="rotate(20 50 90)" />
          </g>
        );
      case "ma":
        return (
          <g key={key} opacity={o * 0.6}>
            <line x1="14" y1="98" x2="86" y2="98" stroke={c1} strokeWidth="0.4" />
            <circle cx="76" cy="22" r="5" fill={c3} opacity="0.7" />
          </g>
        );
      case "film":
        return (
          <g key={key} opacity={o * 0.55}>
            <circle cx="96" cy="8" r="30" fill={`url(#leak-${day.id})`} />
            <rect x="0" y="0" width="100" height="125" fill="none" stroke={c3} strokeWidth="0.6" strokeDasharray="2 3" opacity="0.5" />
          </g>
        );
      case "collage":
        return (
          <g key={key} opacity={o * 0.55}>
            {Array.from({ length: 5 }, (_, i) => (
              <rect
                key={i}
                x={r() * 70}
                y={r() * 100}
                width={14 + r() * 20}
                height={10 + r() * 16}
                fill={[c1, c2, c3, c4][i % 4]}
                opacity="0.55"
                transform={`rotate(${-15 + r() * 30})`}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
              />
            ))}
          </g>
        );
      case "turner":
        return (
          <g key={key} opacity={o * 0.6} fill="none">
            {Array.from({ length: 6 }, (_, i) => (
              <path
                key={i}
                d={`M ${50 - 8 * i} 55 A ${8 + i * 7} ${6 + i * 6} ${i * 25} 1 1 ${50 + 6 * i} ${58 + i * 2}`}
                stroke={i % 2 ? c2 : c1}
                strokeWidth={1.2 + i * 0.5}
                opacity={0.6 - i * 0.07}
              />
            ))}
          </g>
        );
      case "popart":
        return (
          <g key={key} opacity={o * 0.5}>
            <rect width="100" height="125" fill={`url(#dots-${day.id})`} />
          </g>
        );
    }
  };

  return (
    <svg aria-hidden viewBox="0 0 100 125" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      <defs>
        <radialGradient id={`leak-${day.id}`}>
          <stop offset="0" stopColor={c3} stopOpacity="0.9" />
          <stop offset="1" stopColor={c3} stopOpacity="0" />
        </radialGradient>
        <pattern id={`dots-${day.id}`} width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.9" fill={c1} />
        </pattern>
      </defs>
      {entries.map(([k, w]) => layer(k, w))}
    </svg>
  );
}
