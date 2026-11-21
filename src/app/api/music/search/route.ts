import { SONGS } from "@/data/songs";
import type { MusicTrack } from "@/lib/music";

/**
 * Поиск песни. Deezer не отдаёт CORS для своего API, поэтому ищем через сервер.
 * Если Deezer недоступен — ищем по встроенному каталогу, чтобы демо не ломалось.
 */

type DeezerSearch = {
  data?: { id: number; title: string; preview?: string; artist?: { name: string }; album?: { cover_medium?: string } }[];
};

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim().slice(0, 100) ?? "";
  if (!q) return Response.json({ tracks: [] });

  try {
    const res = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=8`, {
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Deezer ${res.status}`);
    const json = (await res.json()) as DeezerSearch;
    const tracks: MusicTrack[] = (json.data ?? []).map((t) => ({
      ref: `dz:${t.id}`,
      title: t.title,
      artist: t.artist?.name ?? "",
      cover: t.album?.cover_medium,
      previewUrl: t.preview || undefined,
    }));
    if (tracks.length) return Response.json({ tracks, source: "deezer" });
  } catch (error) {
    console.error("Поиск в Deezer не удался:", error);
  }

  const lower = q.toLowerCase();
  const local: MusicTrack[] = SONGS.filter((s) => `${s.title} ${s.artist}`.toLowerCase().includes(lower)).map((s) => ({
    ref: `local:${s.id}`,
    title: s.title,
    artist: s.artist,
  }));
  return Response.json({ tracks: local, source: "local" });
}
