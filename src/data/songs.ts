import type { Song } from "@/lib/types";

/**
 * Каталог песен прототипа. В рабочей версии — поиск через Deezer/iTunes
 * и анализ 30-секундного фрагмента (темп, лад, энергия). Здесь значения заданы вручную.
 */
export const SONGS: (Song & { id: string; genre: string })[] = [
  { id: "let-it-snow", title: "Let It Snow", artist: "Frank Sinatra", bpm: 72, mode: "major", year: 1950, energy: 0.3, genre: "джаз" },
  { id: "strobe", title: "Strobe", artist: "deadmau5", bpm: 128, mode: "minor", year: 2009, energy: 0.85, genre: "электроника" },
  { id: "here-comes-the-sun", title: "Here Comes the Sun", artist: "The Beatles", bpm: 129, mode: "major", year: 1969, energy: 0.6, genre: "рок" },
  { id: "teardrop", title: "Teardrop", artist: "Massive Attack", bpm: 77, mode: "minor", year: 1998, energy: 0.3, genre: "трип-хоп" },
  { id: "september", title: "September", artist: "Earth, Wind & Fire", bpm: 126, mode: "major", year: 1978, energy: 0.9, genre: "диско" },
  { id: "gymnopedie", title: "Gymnopédie No. 1", artist: "Erik Satie", bpm: 66, mode: "major", year: 1888, energy: 0.08, genre: "классика" },
  { id: "running-up", title: "Running Up That Hill", artist: "Kate Bush", bpm: 108, mode: "minor", year: 1985, energy: 0.8, genre: "синти-поп" },
  { id: "clair-de-lune", title: "Clair de Lune", artist: "Claude Debussy", bpm: 60, mode: "major", year: 1905, energy: 0.1, genre: "классика" },
  { id: "blinding-lights", title: "Blinding Lights", artist: "The Weeknd", bpm: 171, mode: "minor", year: 2019, energy: 0.8, genre: "синти-поп" },
  { id: "dreams", title: "Dreams", artist: "Fleetwood Mac", bpm: 120, mode: "major", year: 1977, energy: 0.5, genre: "софт-рок" },
];

export function findSong(id: string) {
  return SONGS.find((s) => s.id === id);
}
