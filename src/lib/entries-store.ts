"use client";

import { useSyncExternalStore } from "react";
import { findSong, SONGS } from "@/data/songs";
import { buildDay } from "./build-day";
import type { Day } from "./types";

/**
 * Записи пользователя в прототипе живут только в этом браузере (localStorage) —
 * как и задумано по приватности: дневник не уходит на сервер.
 */
export type StoredEntry = {
  id: string;
  date: string;
  time: string;
  text: string;
  songId: string;
  palette: [string, string, string, string];
  photos: string[];
  /** «Свет доходит позже»: дата, когда запись откроется. */
  deliverAt?: string;
};

type State = { entries: StoredEntry[]; arrived: string[] };

const KEY = "afterglow.v1";
const EMPTY: State = { entries: [], arrived: [] };
let cache: State | null = null;
const listeners = new Set<() => void>();

function read(): State {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache!;
}

function write(next: State) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Хранилище недоступно или переполнено — запись останется до перезагрузки страницы.
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useEntries() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function addEntry(e: StoredEntry) {
  const s = read();
  write({ ...s, entries: [e, ...s.entries] });
}

/** Демо-перемотка времени: считаем, что свет уже долетел. */
export function markArrived(id: string) {
  const s = read();
  if (!s.arrived.includes(id)) write({ ...s, arrived: [...s.arrived, id] });
}

export function resetDemo() {
  write(EMPTY);
}

export function isSealed(deliverAt: string | undefined, id: string, state: State, today: string) {
  return !!deliverAt && deliverAt > today && !state.arrived.includes(id);
}

export function entryToDay(e: StoredEntry): Day {
  return buildDay({
    id: e.id,
    date: e.date,
    time: e.time,
    text: e.text,
    song: findSong(e.songId) ?? SONGS[0],
    palette: e.palette,
    photos: e.photos,
  });
}

/** Дней между двумя ISO-датами. */
export function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

export function addDays(iso: string, n: number) {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
