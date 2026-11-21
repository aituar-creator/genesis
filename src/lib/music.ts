import type { Song } from "./types";

/** Трек из поиска. `ref` — устойчивый номер («dz:123»), ссылку на фрагмент получаем заново при проигрывании. */
export type MusicTrack = {
  ref: string;
  title: string;
  artist: string;
  cover?: string;
  previewUrl?: string;
};

/** Подробности трека: свежая ссылка на фрагмент + метаданные для оценки, если фрагмент не послушать. */
export type MusicTrackInfo = MusicTrack & {
  year?: number;
  genre?: string;
  /** Темп из каталога Deezer, если он там есть (часто 0). */
  bpmHint?: number;
};

/**
 * Оценка параметров песни без звука — по жанру, году и темпу из каталога.
 * Это запасной путь из концепции: «если фрагмента нет, параметры оцениваются по исполнителю, жанру и году».
 */
const GENRE_PRESETS: { match: RegExp; bpm: number; energy: number; mode: Song["mode"] }[] = [
  { match: /dance|электрон|electro|house|techno|edm|танц/i, bpm: 124, energy: 0.85, mode: "minor" },
  { match: /rock|рок|metal|метал|punk|панк/i, bpm: 120, energy: 0.8, mode: "major" },
  { match: /hip.?hop|rap|рэп|хип/i, bpm: 92, energy: 0.7, mode: "minor" },
  { match: /r&b|soul|соул/i, bpm: 88, energy: 0.5, mode: "minor" },
  { match: /jazz|джаз|blues|блюз/i, bpm: 92, energy: 0.35, mode: "major" },
  { match: /classical|классик|soundtrack|саундтрек|film|кино/i, bpm: 72, energy: 0.2, mode: "major" },
  { match: /indie|инди|alternative|альтерн/i, bpm: 110, energy: 0.55, mode: "minor" },
  { match: /pop|поп/i, bpm: 112, energy: 0.65, mode: "major" },
];

export function estimateSong(info: MusicTrackInfo): Song {
  const preset = GENRE_PRESETS.find((g) => info.genre && g.match.test(info.genre)) ?? { bpm: 105, energy: 0.5, mode: "major" as const };
  return {
    title: info.title,
    artist: info.artist,
    bpm: info.bpmHint && info.bpmHint > 40 ? Math.round(info.bpmHint) : preset.bpm,
    mode: preset.mode,
    year: info.year ?? 2010,
    energy: preset.energy,
    ref: info.ref,
    cover: info.cover,
    genre: info.genre,
    measured: false,
  };
}

export async function searchTracks(q: string, signal?: AbortSignal): Promise<MusicTrack[]> {
  const res = await fetch(`/api/music/search?q=${encodeURIComponent(q)}`, { signal });
  if (!res.ok) return [];
  return (await res.json()).tracks ?? [];
}

export async function trackInfo(ref: string): Promise<MusicTrackInfo | null> {
  try {
    const res = await fetch(`/api/music/track?ref=${encodeURIComponent(ref)}`);
    return res.ok ? ((await res.json()) as MusicTrackInfo) : null;
  } catch {
    return null;
  }
}

/** Свежая ссылка на фрагмент для песни: по номеру трека или, для демо-песен, поиском по названию. */
export async function resolvePreview(song: Song): Promise<string | null> {
  if (song.ref) {
    const info = await trackInfo(song.ref);
    if (info?.previewUrl) return info.previewUrl;
  }
  try {
    const found = await searchTracks(`${song.title} ${song.artist}`);
    const withPreview = found.find((t) => t.previewUrl);
    if (!withPreview) return null;
    // Ссылки из поиска тоже живут недолго, но для немедленного проигрывания их хватает.
    return withPreview.previewUrl ?? null;
  } catch {
    return null;
  }
}
