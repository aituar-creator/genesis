"use client";

import { findSong } from "@/data/songs";
import { analyzePreview } from "./audio-analysis";
import { estimateSong, searchTracks, trackInfo, type MusicTrack } from "./music";
import type { Song } from "./types";

/**
 * Песня → измеренные параметры для паспорта дня.
 * 1) свежий фрагмент из каталога → анализ в браузере (темп, лад, энергия);
 * 2) нет фрагмента или он не декодировался → оценка по жанру и году;
 * 3) песня из встроенного каталога → готовые значения.
 */
export async function measureTrack(track: MusicTrack): Promise<Song> {
  if (track.ref.startsWith("local:")) {
    const local = findSong(track.ref.slice(6));
    if (local) return local;
  }
  const info = await trackInfo(track.ref);
  const base = info ?? { ...track };
  const preview = info?.previewUrl ?? track.previewUrl;
  if (preview) {
    try {
      const f = await analyzePreview(preview);
      // Темп по фрагменту бывает ошибочен ровно в 2 раза; если каталог знает темп — сверяемся.
      const hint = info?.bpmHint;
      const ratio = hint ? hint / f.bpm : 1;
      const bpm = hint && (Math.abs(ratio - 2) < 0.12 || Math.abs(ratio - 0.5) < 0.04) ? Math.round(hint) : f.bpm;
      return {
        title: base.title,
        artist: base.artist,
        bpm,
        mode: f.mode,
        key: f.key,
        energy: f.energy,
        year: info?.year ?? 2010,
        ref: track.ref,
        cover: base.cover,
        genre: info?.genre,
        measured: true,
      };
    } catch (error) {
      console.warn("Фрагмент не удалось проанализировать, оцениваем по жанру и году:", error);
    }
  }
  return estimateSong(base);
}

/** Найти песню по строке и сразу измерить (кнопка «пример»). */
export async function findAndMeasure(query: string): Promise<Song | null> {
  try {
    const [first] = await searchTracks(query);
    return first ? await measureTrack(first) : null;
  } catch {
    return null;
  }
}
