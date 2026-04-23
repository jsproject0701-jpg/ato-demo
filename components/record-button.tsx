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
  const [voiceUnsupported, setVoiceUnsupported] = useState(false);
  const [text, setText] = useState("");

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
    if (transcript) {
      const color = getTimeColor();
      addRecord({
        type: "voice",
        timeOfDay: color.name,
        transcript,
      });
    }
    transcriptRef.current = "";
    setRemaining(15);
    window.setTimeout(() => setPhase("idle"), 600);
  }, [cleanupTimers, teardownRecognition]);

  const start = useCallback(() => {
    transcriptRef.current = "";
    finishedRef.current = false;

    const Ctor =
      typeof window !== "undefined"
        ? window.SpeechRecognition ?? window.webkitSpeechRecognition
        : undefined;

    if (!Ctor) {
      setVoiceUnsupported(true);
      return;
    }

    const isSafari =
      typeof navigator !== "undefined" &&
      /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    let started = false;
    try {
      const rec = new Ctor();
      rec.lang = navigator.language || "ja-JP";
      rec.continuous = !isSafari;
      rec.interimResults = !isSafari;
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
      rec.onerror = () => {
        setVoiceUnsupported(true);
        finish();
      };
      rec.onend = () => {
        if (isSafari && !finishedRef.current && recognitionRef.current) {
          try {
            rec.start();
            return;
          } catch {
            // restart 失敗時は素直に終了
          }
        }
        finish();
      };
      rec.start();
      recognitionRef.current = rec;
      started = true;
    } catch {
      setVoiceUnsupported(true);
      return;
    }

    if (!started) return;

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
  const isSaving = phase === "saving";

  return (
    <div className="flex flex-col items-center select-none">
      <button
        type="button"
        onClick={handleClick}
        disabled={isSaving || voiceUnsupported}
        aria-label={isRecording ? "録音を終える" : "録音を始める"}
        className="relative w-44 h-44 rounded-full border flex items-center justify-center font-mincho tracking-[0.3em] text-[13px] transition-opacity duration-700 disabled:opacity-30"
        style={{
          borderColor: "currentColor",
          opacity: voiceUnsupported ? 0.3 : isRecording ? 1 : 0.7,
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

      {voiceUnsupported && (
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
