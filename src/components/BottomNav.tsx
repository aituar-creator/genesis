"use client";

import { IconLayoutList, IconPlus, IconSparkles } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** Нижняя навигация: Небо / + / Лента. */
export function BottomNav() {
  const path = usePathname();
  const item = (href: string, label: string, Icon: typeof IconSparkles) => {
    const active = path === href;
    return (
      <Link
        href={href}
        className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] ${active ? "text-glow-400" : "text-star-700"}`}
        aria-current={active ? "page" : undefined}
      >
        <Icon size={20} stroke={1.75} aria-hidden />
        {label}
      </Link>
    );
  };

  return (
    <nav className="sticky bottom-0 z-20 mt-auto border-t border-night-700 bg-night-900/90 px-6 pb-[max(env(safe-area-inset-bottom),8px)] pt-1 backdrop-blur">
      <div className="flex items-center">
        {item("/", "Небо", IconSparkles)}
        <Link
          href="/new"
          aria-label="Новая запись"
          className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-glow-400 text-glow-ink shadow-[0_0_0_6px_rgba(255,201,121,0.14),0_0_0_14px_rgba(255,201,121,0.06)]"
        >
          <IconPlus size={24} stroke={2} />
        </Link>
        {item("/feed", "Лента", IconLayoutList)}
      </div>
    </nav>
  );
}
