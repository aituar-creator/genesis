import { findSong } from "@/data/songs";
import type { MusicTrackInfo } from "@/lib/music";

/** Подробности трека: свежая ссылка на 30-секундный фрагмент, год, жанр и темп из каталога. */

type DeezerTrack = {
  id: number;
  title: string;
  preview?: string;
  bpm?: number;
  release_date?: string;
  artist?: { name: string };
  album?: { id: number; cover_medium?: string; release_date?: string };
  error?: unknown;
};
type DeezerAlbum = { genres?: { data?: { name: string }[] }; release_date?: string };

const deezer = async <T,>(path: string): Promise<T> => {
  const res = await fetch(`https://api.deezer.com/${path}`, { signal: AbortSignal.timeout(6000), cache: "no-store" });
  if (!res.ok) throw new Error(`Deezer ${res.status}`);
  return (await res.json()) as T;
};

export async function GET(req: Request) {
  const ref = new URL(req.url).searchParams.get("ref") ?? "";

  if (ref.startsWith("local:")) {
    const s = findSong(ref.slice(6));
    if (!s) return Response.json({ error: "Не найдено" }, { status: 404 });
    const info: MusicTrackInfo = { ref, title: s.title, artist: s.artist, year: s.year, genre: s.genre, bpmHint: s.bpm };
    return Response.json(info);
  }

  const id = /^dz:(\d{1,15})$/.exec(ref)?.[1];
  if (!id) return Response.json({ error: "Неверный номер трека" }, { status: 400 });

  try {
    const t = await deezer<DeezerTrack>(`track/${id}`);
    if (t.error || !t.id) return Response.json({ error: "Не найдено" }, { status: 404 });
    let genre: string | undefined;
    if (t.album?.id) {
      try {
        genre = (await deezer<DeezerAlbum>(`album/${t.album.id}`)).genres?.data?.[0]?.name;
      } catch {
        // жанр не обязателен
      }
    }
    const date = t.release_date || t.album?.release_date;
    const info: MusicTrackInfo = {
      ref,
      title: t.title,
      artist: t.artist?.name ?? "",
      cover: t.album?.cover_medium,
      previewUrl: t.preview || undefined,
      year: date ? Number(date.slice(0, 4)) || undefined : undefined,
      genre,
      bpmHint: t.bpm && t.bpm > 0 ? t.bpm : undefined,
    };
    return Response.json(info);
  } catch (error) {
    console.error("Трек из Deezer не получен:", error);
    return Response.json({ error: "Каталог недоступен" }, { status: 502 });
  }
}
