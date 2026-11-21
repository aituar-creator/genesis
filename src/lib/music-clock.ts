"use client";

/**
 * Общие «часы музыки»: плеер сообщает, что играет, а живая открытка берёт отсюда фазу удара —
 * так пульс открытки совпадает с настоящей песней, а не просто с её темпом.
 */
let current: { audio: HTMLAudioElement; bpm: number } | null = null;

export function setPlayingAudio(audio: HTMLAudioElement | null, bpm = 0) {
  current = audio ? { audio, bpm } : null;
}

/** Счётчик ударов: по времени песни, если она играет, иначе — по внутренним часам. */
export function beatAt(nowSec: number, bpm: number): { beat: number; playing: boolean } {
  if (current && !current.audio.paused && current.bpm === bpm) {
    return { beat: (current.audio.currentTime * bpm) / 60, playing: true };
  }
  return { beat: (nowSec * bpm) / 60, playing: false };
}
