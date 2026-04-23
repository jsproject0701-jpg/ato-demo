"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { addRecord } from "@/lib/storage";
import { getTimeColor } from "@/lib/time-color";

const DURATION_MS = 15_000;

type Phase = "idle" | "recording" | "saving";

type Props = {
  label?: string;
};

export function RecordButton({ label = "触れて、15秒" }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [remaining, setRemaining] = useState<number>(15);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef<string>("");
  const stopTimerRef = useRef<number | null>(null);
  const tickTimerRef = useRef<number | null>(null);
  const finishedRef = useRef<boolean>(false);

  const cleanupTimers = useCallback(() => {
    if (stopTimerRef.current) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (tickTimerRef.current) {
      window.clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
  }, []);

  const teardownRecognition = useCallback(() => {
    if (!recognitionRef.current) return;
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    try {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      rec.stop();
    } catch {
      // ignore
    }
  }, []);

  useEffect(
    () => () => {
      cleanupTimers();
      teardownRecognition();
    },
    [cleanupTimers, teardownRecognition]
  );

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    cleanupTimers();
    teardownRecognition();

    setPhase("saving");
    const transcript = transcriptRef.current.trim();
    const color = getTimeColor();
    addRecord({
      type: "voice",
      timeOfDay: color.name,
      transcript: transcript || undefined,
    });
    transcriptRef.current = "";
    setRemaining(15);
    window.setTimeout(() => setPhase("idle"), 600);
  }, [cleanupTimers, teardownRecognition]);

  const start = useCallback(() => {
    setError(null);
    transcriptRef.current = "";
    finishedRef.current = false;

    const Ctor =
      typeof window !== "undefined"
        ? window.SpeechRecognition ?? window.webkitSpeechRecognition
        : undefined;

    if (Ctor) {
      try {
        const rec = new Ctor();
        rec.lang = "ja-JP";
        rec.continuous = true;
        rec.interimResults = true;
        rec.maxAlternatives = 1;
        rec.onresult = (event) => {
          let finalText = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) finalText += result[0]?.transcript ?? "";
          }
          if (finalText) {
            transcriptRef.current = (transcriptRef.current + finalText).trim();
          }
        };
        rec.onerror = (e) => {
          if (e.error === "not-allowed" || e.error === "service-not-allowed") {
            setError("マイクが使えません");
            finish();
          }
        };
        rec.onend = () => {
          // ブラウザが自動で止めた場合も保存に進む
          finish();
        };
        rec.start();
        recognitionRef.current = rec;
      } catch {
        setError("音声認識を開始できません");
      }
    }

    setPhase("recording");
    setRemaining(15);

    const startedAt = Date.now();
    tickTimerRef.current = window.setInterval(() => {
      const passed = Date.now() - startedAt;
      const left = Math.max(0, Math.ceil((DURATION_MS - passed) / 1000));
      setRemaining(left);
    }, 200);

    stopTimerRef.current = window.setTimeout(finish, DURATION_MS);
  }, [finish]);

  const handleClick = () => {
    if (phase === "idle") start();
    else if (phase === "recording") finish();
  };

  const isRecording = phase === "recording";
  const isSaving = phase === "saving";

  return (
    <div className="flex flex-col items-center select-none">
      <button
        type="button"
        onClick={handleClick}
        disabled={isSaving}
        aria-label={isRecording ? "録音を終える" : "録音を始める"}
        className="relative w-44 h-44 rounded-full border flex items-center justify-center font-mincho tracking-[0.3em] text-[13px] transition-opacity duration-700 disabled:opacity-50"
        style={{
          borderColor: "currentColor",
          opacity: isRecording ? 1 : 0.7,
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
        <span className="relative">
          {isSaving ? "—" : isRecording ? `${remaining}` : label}
        </span>
      </button>

      {error && (
        <p className="mt-4 text-[11px] tracking-[0.3em] opacity-50 font-mincho">{error}</p>
      )}
    </div>
  );
}
