"use client";

import { useState } from "react";

interface InputScreenProps {
  onSubmit: (text: string) => void;
  errorMessage: string | null;
}

const EXAMPLE_TAGS = ["카톡 대화", "문자", "일기", "메모", "SNS 글", "업무 메신저"];

export default function InputScreen({ onSubmit, errorMessage }: InputScreenProps) {
  const [text, setText] = useState("");
  const canSubmit = text.trim().length >= 20;

  return (
    <div className="flex flex-1 flex-col px-6 pb-10 pt-14">
      <header className="mb-8 animate-fade-up">
        <h1 className="text-3xl font-extrabold leading-tight text-ink">
          너를 너무<br />잘 알아.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink/70">
          카톡, 일기, 메모를 넣어보세요.
          <br />
          당신이 어떤 사람인지 AI가 아주 조금 참견해드립니다.
        </p>
      </header>

      <div className="mb-3 flex flex-wrap gap-1.5 animate-fade-up [animation-delay:80ms] opacity-0">
        {EXAMPLE_TAGS.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-lilac/15 px-2.5 py-1 text-xs font-medium text-ink/60"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex flex-1 flex-col animate-fade-up [animation-delay:140ms] opacity-0">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="최근 카톡이나 일기를 붙여넣어 보세요..."
          maxLength={8000}
          className="min-h-[240px] flex-1 resize-none rounded-3xl border border-ink/10 bg-white p-5 text-[15px] leading-relaxed text-ink shadow-card outline-none placeholder:text-ink/30 focus:border-coral/40"
        />
        <div className="mt-2 flex items-center justify-between text-xs text-ink/40">
          <span>🔒 입력한 텍스트는 분석에만 사용됩니다.</span>
          <span>{text.length}/8000</span>
        </div>
      </div>

      {errorMessage && (
        <p className="mt-3 rounded-xl bg-coral/10 px-4 py-2.5 text-sm text-coral">
          {errorMessage}
        </p>
      )}

      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => onSubmit(text.trim())}
        className="mt-5 w-full rounded-2xl bg-ink py-4 text-base font-bold text-cream shadow-pop transition active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:bg-ink/20 disabled:shadow-none"
      >
        나 분석하기 🔍
      </button>
      {!canSubmit && text.length > 0 && (
        <p className="mt-2 text-center text-xs text-ink/40">
          최소 20자 이상 입력해주세요 ({text.trim().length}/20)
        </p>
      )}
    </div>
  );
}
