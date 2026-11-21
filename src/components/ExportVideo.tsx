"use client";

import { IconDownload, IconMovie, IconShare2, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { canExportVideo, exportPostcardVideo } from "@/lib/export-video";
import type { Day } from "@/lib/types";

type State =
  | { kind: "idle" }
  | { kind: "recording"; progress: number }
  | { kind: "ready"; url: string; file: File; withAudio: boolean }
  | { kind: "error"; message: string };

/** Окно «Сохранить как видео»: записывает живую открытку под фрагмент песни (15 секунд). */
export function ExportVideo({ day, onClose }: { day: Day; onClose: () => void }) {
  const [state, setState] = useState<State>({ kind: "idle" });

  useEffect(() => () => {
    if (state.kind === "ready") URL.revokeObjectURL(state.url);
  }, [state]);

  const start = async () => {
    if (!canExportVideo()) {
      setState({ kind: "error", message: "Этот браузер не умеет записывать видео. Попробуйте Chrome или Safari 17+." });
      return;
    }
    setState({ kind: "recording", progress: 0 });
    try {
      const res = await exportPostcardVideo(day, { onProgress: (p) => setState({ kind: "recording", progress: p }) });
      const ext = res.mime.includes("mp4") ? "mp4" : "webm";
      const file = new File([res.blob], `poslesvechenie-${day.date}.${ext}`, { type: res.mime });
      setState({ kind: "ready", url: URL.createObjectURL(res.blob), file, withAudio: res.withAudio });
    } catch (e) {
      setState({ kind: "error", message: e instanceof Error ? e.message : "Не получилось записать видео" });
    }
  };

  const share = async () => {
    if (state.kind !== "ready") return;
    try {
      await navigator.share({ files: [state.file], title: day.title });
    } catch {
      // пользователь закрыл окно «Поделиться»
    }
  };
  const canShare = state.kind === "ready" && typeof navigator !== "undefined" && !!navigator.canShare?.({ files: [state.file] });
  const recording = state.kind === "recording";

  return (
    <div className="fixed inset-0 z-40 mx-auto flex max-w-[430px] flex-col justify-end">
      <button type="button" aria-label="Закрыть" onClick={recording ? undefined : onClose} className="absolute inset-0 bg-night-950/70" />
      <section role="dialog" aria-modal="true" aria-label="Сохранить как видео" className="animate-sheet relative rounded-t-[24px] border-t border-night-600 bg-night-900 px-5 pb-[max(env(safe-area-inset-bottom),24px)] pt-3">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-night-600" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-[17px] text-star-100">Сохранить как видео</h2>
            <p className="mt-1 text-xs text-star-500">Открытка 4:5, 15 секунд, под фрагмент «{day.song.title}»</p>
          </div>
          {!recording && (
            <button type="button" aria-label="Закрыть" onClick={onClose} className="-mr-2 rounded-full p-2 text-star-500">
              <IconX size={18} />
            </button>
          )}
        </div>

        <div className="mt-4" aria-live="polite">
          {state.kind === "idle" && (
            <button type="button" onClick={start} className="flex w-full items-center justify-center gap-2 rounded-full bg-glow-400 px-5 py-3.5 text-[15px] font-semibold text-glow-ink">
              <IconMovie size={18} aria-hidden /> Записать видео
            </button>
          )}
          {recording && (
            <div>
              <div className="flex justify-between font-mono text-[11px] text-star-500">
                <span>записываем под музыку…</span>
                <span>{Math.round(state.progress * 15)} из 15 с</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-night-700">
                <div className="h-full rounded-full bg-glow-400 transition-[width]" style={{ width: `${state.progress * 100}%` }} />
              </div>
              <p className="mt-2 text-[11px] text-star-700">Не закрывайте вкладку, пока идёт запись.</p>
            </div>
          )}
          {state.kind === "ready" && (
            <div className="flex flex-col gap-3">
              <video src={state.url} controls playsInline className="mx-auto aspect-[4/5] w-[60%] rounded-xl bg-night-800" />
              {!state.withAudio && <p className="text-center text-[11px] text-star-700">Фрагмент песни не загрузился — видео без звука.</p>}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={state.url}
                  download={state.file.name}
                  className="flex items-center justify-center gap-2 rounded-full bg-glow-400 px-4 py-3 text-[14px] font-semibold text-glow-ink"
                >
                  <IconDownload size={17} aria-hidden /> Скачать
                </a>
                <button
                  type="button"
                  onClick={share}
                  disabled={!canShare}
                  className="flex items-center justify-center gap-2 rounded-full border border-night-600 px-4 py-3 text-[14px] text-star-300 disabled:opacity-40"
                >
                  <IconShare2 size={17} aria-hidden /> Поделиться
                </button>
              </div>
            </div>
          )}
          {state.kind === "error" && <p className="text-center text-[13px] text-ember">{state.message}</p>}
        </div>
      </section>
    </div>
  );
}
