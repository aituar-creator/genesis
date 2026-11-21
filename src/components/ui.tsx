import Link from "next/link";

/** Фильтр-чип. */
export function Chip({
  active = false,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition-colors ${
        active
          ? "border-glow-500/50 bg-glow-500/15 text-glow-400"
          : "border-night-600 text-star-300 hover:border-night-500"
      }`}
    >
      {children}
    </button>
  );
}

const primaryCls =
  "flex w-full items-center justify-center gap-2 rounded-full bg-glow-400 px-5 py-3.5 text-[15px] font-semibold text-glow-ink shadow-[0_0_0_6px_rgba(255,201,121,0.12),0_0_0_14px_rgba(255,201,121,0.05)] transition-transform active:scale-[0.98]";

/** Главная кнопка экрана: pill с ореолом. Одна на экран. */
export function PrimaryButton({
  children,
  onClick,
  href,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  type?: "button" | "submit";
}) {
  if (href)
    return (
      <Link href={href} className={primaryCls}>
        {children}
      </Link>
    );
  return (
    <button type={type} onClick={onClick} className={primaryCls}>
      {children}
    </button>
  );
}

/** Карточка-поверхность. */
export function Surface({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[var(--radius-field)] bg-night-800 ${className}`}>{children}</div>;
}
