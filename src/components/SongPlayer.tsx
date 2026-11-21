"use client";

import { IconPlayerPauseFilled, IconPlayerPlayFilled } from "@tabler/icons-react";
import { useState } from "react";
import type { Song } from "@/lib/types";

/** Мини-плеер фрагмента песни. В прототипе звука нет — только визуальное состояние. */
export function SongPlayer({ song }: { song: Song }) {
  const [playing, setPlaying] = useState(true);
  const beat = 60 / song.bpm;
  const bars = [0.5, 0.9, 0.6, 1, 0.7, 0.4, 0.85, 0.55];

  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-field)] bg-night-800 px-3 py-2.5">
      <button
        type="button"
        onClick={() => setPlaying((p) => !p)}
        aria-label={playing ? "Пауза" : "Играть фрагмент"}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-glow-400 text-glow-ink"
      >
        {playing ? <IconPlayerPauseFilled size={16} /> : <IconPlayerPlayFilled size={16} />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-star-100">{song.title}</p>
        <p className="truncate font-mono text-[11px] text-star-500">
          {song.artist} · {song.bpm} bpm · {song.mode === "major" ? "мажор" : "минор"}
        </p>
        <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-night-600">
          <div
            className="h-full rounded-full bg-glow-400"
            style={{ animation: "progress 30s linear infinite", animationPlayState: playing ? "running" : "paused" }}
          />
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
            }}
          />
        ))}
      </div>
    </div>
  );
}
