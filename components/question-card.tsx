"use client";

import { useEffect, useState } from "react";
import { pickQuestionForToday } from "@/lib/questions";
import { addRecord, hasAnsweredToday, markAnsweredToday } from "@/lib/storage";
import { getTimeColor } from "@/lib/time-color";

type Props = {
  onSaved?: () => void;
};

export function QuestionCard({ onSaved }: Props) {
  const [visible, setVisible] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const check = () => {
      const h = new Date().getHours();
      const isEvening = h >= 21 || h < 3;
      if (isEvening && !hasAnsweredToday()) {
        setQuestion(pickQuestionForToday());
        setVisible(true);
      } else {
        setVisible(false);
      }
    };
    check();
    const id = window.setInterval(check, 60_000);
    return () => window.clearInterval(id);
  }, []);

  if (!visible || dismissed) return null;

  const handleSave = () => {
    const text = answer.trim();
    if (!text) return;
    setSaving(true);
    const color = getTimeColor();
    addRecord({
      type: "answer",
      timeOfDay: color.name,
      question,
      answer: text,
    });
    markAnsweredToday();
    setAnswer("");
    setDismissed(true);
    onSaved?.();
  };

  const handleSkip = () => {
    markAnsweredToday();
    setDismissed(true);
  };

  return (
    <section
      className="mx-6 mt-4 mb-6 px-5 py-6 border border-current/20 rounded"
      style={{
        animation: "ato-fade-in 1.2s ease-out both",
      }}
    >
      <p className="font-garamond italic text-[11px] tracking-[0.4em] opacity-50 mb-3">
        — today&apos;s question
      </p>
      <p className="font-mincho text-[15px] leading-loose tracking-[0.1em]">{question}</p>
      <div className="mt-5">
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="…"
          aria-label="1行で答える"
          className="w-full bg-transparent border-b border-current/30 focus:border-current/60 outline-none py-2 font-mincho text-[14px] tracking-wider placeholder:opacity-40"
        />
      </div>
      <div className="mt-5 flex justify-end gap-5 font-mincho text-[12px] tracking-[0.3em]">
        <button
          type="button"
          onClick={handleSkip}
          disabled={saving}
          className="opacity-50 hover:opacity-80 transition-opacity duration-700"
        >
          今日はやめておく
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !answer.trim()}
          className="opacity-80 hover:opacity-100 transition-opacity duration-700 disabled:opacity-30"
        >
          のこす
        </button>
      </div>
    </section>
  );
}
