import type { Passport } from "@/lib/types";
import { AXIS_META } from "@/lib/visual";

/** Радар 8 осей паспорта дня. */
export function PassportRadar({
  passport,
  color = "#f2a65a",
  compare,
  labels = true,
}: {
  passport: Passport;
  color?: string;
  compare?: Passport;
  labels?: boolean;
}) {
  const cx = 110;
  const cy = 100;
  const R = 72;
  const n = AXIS_META.length;
  const pt = (i: number, k: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + Math.cos(a) * R * k, cy + Math.sin(a) * R * k] as const;
  };
  const ring = (k: number) => AXIS_META.map((_, i) => pt(i, k).join(",")).join(" ");
  const shape = AXIS_META.map((a, i) => pt(i, Math.max(0.08, passport[a.key].value)).join(",")).join(" ");

  return (
    <svg viewBox="0 0 220 200" className="w-full" role="img" aria-label="Паспорт дня: восемь осей настроения">
      <g fill="none" stroke="var(--night-600)" strokeWidth="1">
        <polygon points={ring(1)} />
        <polygon points={ring(0.66)} />
        <polygon points={ring(0.33)} />
        {AXIS_META.map((_, i) => {
          const [x, y] = pt(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} />;
        })}
      </g>
      {compare && (
        <polygon
          points={AXIS_META.map((a, i) => pt(i, Math.max(0.08, compare[a.key].value)).join(",")).join(" ")}
          fill="none"
          stroke="var(--star-500)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      )}
      <polygon points={shape} fill={color} fillOpacity="0.28" stroke="var(--glow-400)" strokeWidth="1.5" strokeLinejoin="round" />
      {AXIS_META.map((a, i) => {
        const [x, y] = pt(i, Math.max(0.08, passport[a.key].value));
        return <circle key={a.key} cx={x} cy={y} r="2.5" fill="var(--glow-300)" />;
      })}
      {labels && AXIS_META.map((a, i) => {
        const [x, y] = pt(i, 1.2);
        return (
          <text
            key={a.key}
            x={x}
            y={y}
            textAnchor={Math.abs(x - cx) < 4 ? "middle" : x > cx ? "start" : "end"}
            dominantBaseline="middle"
            fontSize="10"
            fill="var(--star-500)"
            fontFamily="var(--font-jetbrains)"
          >
            {a.label}
          </text>
        );
      })}
    </svg>
  );
}
