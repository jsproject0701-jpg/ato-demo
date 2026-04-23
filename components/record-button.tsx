"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { addRecord, blobToBase64 } from "@/lib/storage";
import { getTimeColor } from "@/lib/time-color";

const DURATION_MS = 15_000;

type Phase = "idle" | "recording" | "transcribing" | "saving";

type Props = {
  label?: string;
};

const pickMimeType = (): string | undefined => {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg"];
  for (const t of candidates) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return undefined;
};

const extensionFor = (mimeType: string | undefined): string => {
  if (!mimeType) return "webm";
  if (mimeType.startsWith("audio/mp4")) return "m4a";
  if (mimeType.startsWith("audio/webm")) return "webm";
  if (mimeType.startsWith("audio/ogg")) return "ogg";
  return "webm";
};

export function RecordButton({ label = "触れて、15秒" }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [remaining, setRemaining] = useState<number>(15);
  const [error, setError] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [text, setText] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopTimerRef = useRef<number | null>(null);
  const tickTimerRef = useRef<number | null>(null);
  const finishedRef = useRef(false);

  const cleanup = useCallback(() => {
    if (stopTimerRef.current) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (tickTimerRef.current) {
      window.clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try {
        recorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    recorderRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const transcribeAndSave = useCallback(async (blob: Blob, mimeType: string | undefined) => {
    setPhase("transcribing");
    try {
      const form = new FormData();
      const ext = extensionFor(mimeType);
      const file = new File([blob], `audio.${ext}`, { type: blob.type || mimeType || "audio/webm" });
      form.append("audio", file);

      const [res, audioBase64] = await Promise.all([
        fetch("/api/transcribe", { method: "POST", body: form }),
        blobToBase64(blob),
      ]);
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: `${res.status}` }));
        throw new Error(j.error || `${res.status}`);
      }
      const j = (await res.json()) as { transcript?: string };
      const transcript = (j.transcript ?? "").trim();

      setPhase("saving");
      const color = getTimeColor();
      addRecord({
        type: "voice",
        timeOfDay: color.name,
        transcript: transcript || undefined,
        audioBlob: audioBase64,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "文字起こしに失敗しました");
    } finally {
      setRemaining(15);
      window.setTimeout(() => setPhase("idle"), 600);
    }
  }, []);

  const start = useCallback(async () => {
    setError(null);
    finishedRef.current = false;
    chunksRef.current = [];

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setShowFallback(true);
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setShowFallback(true);
      setError("マイクを使えませんでした");
      return;
    }
    streamRef.current = stream;

    const mimeType = pickMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    } catch {
      stream.getTracks().forEach((t) => t.stop());
      setShowFallback(true);
      setError("録音できる形式がありません");
      return;
    }

    recorderRef.current = recorder;

    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
    };

    recorder.onstop = () => {
      const tracks = streamRef.current?.getTracks() ?? [];
      tracks.forEach((t) => t.stop());
      streamRef.current = null;

      if (finishedRef.current) return;
      finishedRef.current = true;

      const chunks = chunksRef.current;
      chunksRef.current = [];
      if (chunks.length === 0) {
        setRemaining(15);
        setPhase("idle");
        return;
      }
      const blob = new Blob(chunks, { type: mimeType || chunks[0]?.type || "audio/webm" });
      void transcribeAndSave(blob, mimeType);
    };

    recorder.start();
    setPhase("recording");
    setRemaining(15);

    const startedAt = Date.now();
    tickTimerRef.current = window.setInterval(() => {
      const passed = Date.now() - startedAt;
      const left = Math.max(0, Math.ceil((DURATION_MS - passed) / 1000));
      setRemaining(left);
    }, 200);

    stopTimerRef.current = window.setTimeout(() => {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        try {
          recorderRef.current.stop();
        } catch {
          // ignore
        }
      }
    }, DURATION_MS);
  }, [transcribeAndSave]);

  const stopEarly = useCallback(() => {
    if (stopTimerRef.current) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (tickTimerRef.current) {
      window.clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try {
        recorderRef.current.stop();
      } catch {
        // ignore
      }
    }
  }, []);

  const handleClick = () => {
    if (phase === "idle") void start();
    else if (phase === "recording") stopEarly();
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    const color = getTimeColor();
    addRecord({
      type: "voice",
      timeOfDay: color.name,
      transcript: t,
    });
    setText("");
  };

  const isRecording = phase === "recording";
  const isBusy = phase === "transcribing" || phase === "saving";

  const buttonLabel = (() => {
    if (phase === "transcribing") return "起こしてる";
    if (phase === "saving") return "—";
    if (isRecording) return `${remaining}`;
    return label;
  })();

  return (
    <div className="flex flex-col items-center select-none">
      <button
        type="button"
        onClick={handleClick}
        disabled={isBusy || (showFallback && phase === "idle")}
        aria-label={isRecording ? "録音を終える" : "録音を始める"}
        className="relative w-44 h-44 rounded-full border flex items-center justify-center font-mincho tracking-[0.3em] text-[13px] transition-opacity duration-700 disabled:opacity-30"
        style={{
          borderColor: "currentColor",
          opacity: showFallback && phase === "idle" ? 0.3 : isRecording ? 1 : 0.7,
        }}
      >
        {isRecording && (
          <>
            <span
              className="absolute inset-0 rounded-full border pointer-events-none"
              style={{
                borderColor: "currentColor",
                animation: "ato-pulse 2.4s ease-out infinite",
              }}
            />
            <span
              className="absolute inset-0 rounded-full border pointer-events-none"
              style={{
                borderColor: "currentColor",
                animation: "ato-pulse 2.4s ease-out infinite",
                animationDelay: "1.2s",
              }}
            />
          </>
        )}
        <span className="relative">{buttonLabel}</span>
      </button>

      {error && (
        <p className="mt-4 text-[11px] tracking-[0.3em] opacity-50 font-mincho">{error}</p>
      )}

      {showFallback && (
        <form
          onSubmit={handleTextSubmit}
          className="mt-8 w-72 max-w-[80vw] flex flex-col items-center"
          style={{ animation: "ato-fade-in 1.2s ease-out both" }}
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="…"
            aria-label="言葉で残す"
            className="w-full bg-transparent border-b border-current/30 focus:border-current/60 outline-none py-2 text-center font-mincho text-[14px] tracking-wider placeholder:opacity-40"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="mt-4 font-mincho text-[12px] tracking-[0.4em] opacity-70 hover:opacity-100 transition-opacity duration-700 disabled:opacity-30"
          >
            のこす
          </button>
        </form>
      )}
    </div>
  );
}
