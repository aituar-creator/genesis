"use client";

import { useEffect, useRef, useState } from "react";
import { beatAt } from "@/lib/music-clock";
import { createRenderer, shaderParams, type PostcardRenderer } from "@/lib/shader";
import type { Day } from "@/lib/types";
import { StyleLayer } from "./StyleLayer";

/**
 * Живой фон открытки. Рисуется только когда открытка на экране и вкладка активна;
 * при «уменьшении движения» — один неподвижный кадр. Без WebGL2 — статичный SVG.
 * Рендерер создаётся один раз; при смене дня (ремикс) меняются только параметры.
 */
export function LiveCanvas({ day }: { day: Day }) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const renderer = useRef<PostcardRenderer | null>(null);
  const dayRef = useRef(day);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    // Свой холст на каждый запуск эффекта: после очистки контекст WebGL теряется навсегда.
    const canvas = document.createElement("canvas");
    canvas.className = "absolute inset-0 h-full w-full";
    host.appendChild(canvas);
    const r = createRenderer(canvas, shaderParams(dayRef.current));
    if (!r) {
      canvas.remove();
      setFailed(true); // откат на SVG, если WebGL недоступен
      return;
    }
    renderer.current = r;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = true;
    let raf = 0;
    let last = 0;
    const t0 = performance.now();

    const draw = (t: number) => {
      const { beat, playing } = beatAt(t, dayRef.current.song.bpm);
      r.render(t, beat, playing);
    };
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const { width, height } = canvas.getBoundingClientRect();
      r.resize(Math.max(1, Math.round(width * dpr)), Math.max(1, Math.round(height * dpr)));
      draw(reduce ? 3 : (performance.now() - t0) / 1000);
    };
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden) return;
      if (now - last < 1000 / 40) return; // ~40 кадров в секунду — бережём батарею
      last = now;
      draw((now - t0) / 1000);
    };

    fit();
    draw(1); // первый кадр сразу — открытка не бывает пустой
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);
    if (!reduce) raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      r.destroy();
      canvas.remove();
      renderer.current = null;
    };
  }, []);

  useEffect(() => {
    dayRef.current = day;
    renderer.current?.setParams(shaderParams(day));
  }, [day]);

  if (failed) return <StyleLayer day={day} />;
  return <div ref={ref} aria-hidden className="absolute inset-0" />;
}
