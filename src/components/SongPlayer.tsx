"use client";

import { IconLoader2, IconPlayerPauseFilled, IconPlayerPlayFilled } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { resolvePreview } from "@/lib/music";
import { setPlayingAudio } from "@/lib/music-clock";
import type { Song } from "@/lib/types";

type State = "idle" | "loading" | "playing" | "paused" | "unavailable";

/**
 * Плеер официального 30-секундного фрагмента. Песня не хранится: ссылку на фрагмент
 * получаем из каталога в момент нажатия (ссылки Deezer живут ~15 минут).
 */
export function SongPlayer({ song }: { song: Song }) {
  const [state, setState] = useState<State>("idle");
  const [progress, setProgress] = useState(0);
  const audio = useRef<HTMLAudioElement | null>(null);
  const beat = 60 / song.bpm;
  const bars = [0.5, 0.9, 0.6, 1, 0.7, 0.4, 0.85, 0.55];
  const playing = state === "playing";

  useEffect(
    () => () => {
      audio.current?.pause();
      audio.current = null;
      setPlayingAudio(null);
    },
    [],
  );

  const toggle = async () => {
    if (state === "loading") return;
    if (playing) {
      audio.current?.pause();
      setState("paused");
      return;
    }
    if (audio.current && state === "paused") {
      await audio.current.play().catch(() => setState("unavailable"));
      setState("playing");
      return;
    }
    setState("loading");
    const url = await resolvePreview(song);
    if (!url) {
      setState("unavailable");
      return;
    }
    const a = new Audio(url);
    a.ontimeupdate = () => setProgress(a.duration ? a.currentTime / a.duration : 0);
    a.onended = () => {
      setPlayingAudio(null);
      setState("idle");
      setProgress(0);
      audio.current = null;
    };
    audio.current = a;
    // Открытка будет пульсировать в фазе с настоящей песней
    setPlayingAudio(a, song.bpm);
    try {
      await a.play();
      setState("playing");
    } catch {
      setState("unavailable");
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-field)] bg-night-800 px-3 py-2.5">
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Пауза" : "Играть фрагмент"}
        className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-glow-400 text-glow-ink"
      >
        {song.cover && (
          // eslint-disable-next-line @next/next/no-img-element -- обложка с CDN каталога
          <img src={song.cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        )}
        <span className="relative">
          {state === "loading" ? (
            <IconLoader2 size={16} className="animate-spin" />
          ) : playing ? (
            <IconPlayerPauseFilled size={16} />
          ) : (
            <IconPlayerPlayFilled size={16} />
          )}
        </span>
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-star-100">{song.title}</p>
        <p className="truncate font-mono text-[11px] text-star-500">
          {state === "unavailable"
            ? "фрагмент сейчас недоступен"
            : `${song.artist} · ${song.bpm} bpm · ${song.key ?? (song.mode === "major" ? "мажор" : "минор")}`}
        </p>
        <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-night-600">
          <div className="h-full rounded-full bg-glow-400 transition-[width] duration-200" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
      <div aria-hidden className="flex h-6 items-end gap-[3px]">
        {bars.map((h, i) => (
          <span
            key={i}
            className="w-[3px] origin-bottom rounded-full bg-star-500"
            style={{
              height: `${h * 100}%`,
              animation: `eq ${beat}s ease-in-out ${(i * beat) / bars.length}s infinite`,
              animationPlayState: playing ? "running" : "paused",
              opacity: playing ? 1 : 0.5,
            }}
          />
        ))}
      </div>
    </div>
  );
}
