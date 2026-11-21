"use client";

import { IconCheck, IconMusic, IconPlayerPauseFilled, IconPlayerPlayFilled, IconSearch, IconX } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { measureTrack } from "@/lib/measure-song";
import { resolvePreview, searchTracks, type MusicTrack } from "@/lib/music";
import type { Song } from "@/lib/types";

const SUGGESTIONS = ["Frank Sinatra Let It Snow", "Кино Группа крови", "The Weeknd Blinding Lights", "Земфира Искала"];

const Cover = ({ src, size = 40 }: { src?: string; size?: number }) =>
  src ? (
    // eslint-disable-next-line @next/next/no-img-element -- обложка с CDN каталога
    <img src={src} alt="" width={size} height={size} className="shrink-0 rounded-lg object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="flex shrink-0 items-center justify-center rounded-lg bg-night-700 text-glow-400" style={{ width: size, height: size }}>
      <IconMusic size={18} aria-hidden />
    </span>
  );

/** Поиск песни по каталогу Deezer, прослушивание фрагмента и измерение темпа и лада. */
export function SongPicker({
  value,
  onChange,
  measuring,
  setMeasuring,
}: {
  value: Song | null;
  onChange: (s: Song | null) => void;
  measuring: MusicTrack | null;
  setMeasuring: (t: MusicTrack | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        setResults(await searchTracks(q, ctrl.signal));
      } catch {
        if (!ctrl.signal.aborted) setResults([]);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 350);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [query]);

  useEffect(() => () => audio.current?.pause(), []);

  const pick = async (t: MusicTrack) => {
    setMeasuring(t);
    setQuery("");
    setResults([]);
    try {
      onChange(await measureTrack(t));
    } finally {
      setMeasuring(null);
    }
  };

  const toggle = async () => {
    if (!value) return;
    if (playing) {
      audio.current?.pause();
      setPlaying(false);
      return;
    }
    const url = await resolvePreview(value);
    if (!url) return;
    audio.current?.pause();
    audio.current = new Audio(url);
    audio.current.onended = () => setPlaying(false);
    await audio.current.play().catch(() => setPlaying(false));
    setPlaying(true);
  };

  if (measuring)
    return (
      <div className="flex items-center gap-3 rounded-[var(--radius-field)] border border-glow-500/40 px-3 py-2.5" role="status">
        <Cover src={measuring.cover} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] text-star-100">{measuring.title}</p>
          <p className="animate-pulse font-mono text-[11px] text-glow-400">слушаем фрагмент: темп, лад, энергия…</p>
        </div>
      </div>
    );

  if (value)
    return (
      <div className="flex items-center gap-3 rounded-[var(--radius-field)] border border-night-600 px-3 py-2.5">
        <button type="button" onClick={toggle} aria-label={playing ? "Пауза" : "Послушать фрагмент"} className="relative shrink-0">
          <Cover src={value.cover} />
          <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-night-950/40 text-star-100">
            {playing ? <IconPlayerPauseFilled size={16} /> : <IconPlayerPlayFilled size={16} />}
          </span>
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] text-star-100">{value.title}</p>
          <p className="truncate font-mono text-[11px] text-star-500">
            {value.artist} · {value.bpm} bpm · {value.key ?? (value.mode === "major" ? "мажор" : "минор")}
          </p>
          <p className="font-mono text-[10px] text-star-700">
            {value.measured ? "измерено по 30-секундному фрагменту" : value.measured === false ? "оценено по жанру и году" : "из каталога дневника"}
          </p>
        </div>
        <IconCheck size={18} className="shrink-0 text-aurora" aria-hidden />
        <button
          type="button"
          aria-label="Сменить песню"
          onClick={() => {
            audio.current?.pause();
            setPlaying(false);
            onChange(null);
          }}
          className="shrink-0 text-star-700 hover:text-star-300"
        >
          <IconX size={16} />
        </button>
      </div>
    );

  return (
    <div>
      <div className="relative">
        <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-star-700" aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Название или исполнитель"
          aria-label="Найти песню"
          className="h-11 w-full rounded-[var(--radius-field)] bg-night-800 pl-9 pr-3 text-[14px] text-star-100 outline-none placeholder:text-star-700 focus:ring-1 focus:ring-night-500"
        />
      </div>
      {query.trim() ? (
        <ul className="mt-1.5 max-h-[280px] overflow-y-auto rounded-[var(--radius-field)] border border-night-600 bg-night-800">
          {loading && !results.length && <li className="px-3 py-2.5 text-[13px] text-star-700">Ищем…</li>}
          {!loading && !results.length && <li className="px-3 py-2.5 text-[13px] text-star-700">Ничего не нашли</li>}
          {results.map((t) => (
            <li key={t.ref}>
              <button type="button" onClick={() => pick(t)} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-night-700">
                <Cover src={t.cover} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] text-star-100">{t.title}</span>
                  <span className="block truncate text-[11px] text-star-500">{t.artist}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setQuery(s)}
              className="rounded-full border border-night-600 px-2.5 py-1 text-[11px] text-star-500 hover:text-star-300"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
