"use client";

import { useState } from "react";

interface SpeakerSelectProps {
  speakers: string[];
  onConfirm: (speakerName?: string) => void;
  onBack: () => void;
}

export default function SpeakerSelect({
  speakers,
  onConfirm,
  onBack,
}: SpeakerSelectProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [showCustom, setShowCustom] = useState(speakers.length === 0);

  const canConfirm = showCustom ? customName.trim().length > 0 : !!selected;

  const handleConfirm = () => {
    if (showCustom) {
      onConfirm(customName.trim());
    } else if (selected) {
      onConfirm(selected);
    }
  };

  return (
    <div className="flex flex-1 flex-col px-6 pb-10 pt-14">
      <header className="mb-8 animate-fade-up">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 text-sm font-medium text-ink/40"
        >
          ← 다시 입력하기
        </button>
        <h1 className="text-2xl font-extrabold leading-tight text-ink">
          이 중에 당신은<br />누구인가요?
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink/70">
          여러 명이 나오는 대화 같아요. 당신의 말투만 골라서
          분석할게요.
        </p>
      </header>

      <div className="flex flex-1 flex-col gap-2 animate-fade-up [animation-delay:80ms] opacity-0">
        {speakers.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => {
              setSelected(name);
              setShowCustom(false);
            }}
            className={`w-full rounded-2xl border px-5 py-4 text-left text-base font-bold transition ${
              selected === name && !showCustom
                ? "border-coral bg-coral/10 text-coral"
                : "border-ink/10 bg-white text-ink"
            }`}
          >
            {name}
          </button>
        ))}

        {!showCustom && (
          <button
            type="button"
            onClick={() => {
              setShowCustom(true);
              setSelected(null);
            }}
            className="mt-1 text-left text-sm font-medium text-ink/40 underline underline-offset-2"
          >
            목록에 내 이름이 없어요
          </button>
        )}

        {showCustom && (
          <div className="mt-1 rounded-2xl border border-ink/10 bg-white p-4">
            <label className="mb-2 block text-xs font-semibold text-ink/50">
              대화에서 내 이름/닉네임을 직접 입력해주세요
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="예: 민지"
              maxLength={60}
              className="w-full rounded-xl border border-ink/10 bg-cream px-4 py-3 text-[15px] text-ink outline-none placeholder:text-ink/30 focus:border-coral/40"
            />
            {speakers.length > 0 && (
              <button
                type="button"
                onClick={() => setShowCustom(false)}
                className="mt-2 text-xs font-medium text-ink/40 underline underline-offset-2"
              >
                목록에서 다시 고르기
              </button>
            )}
          </div>
        )}

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => onConfirm(undefined)}
          className="mt-4 text-center text-xs text-ink/40 underline underline-offset-2"
        >
          구분 없이 전체 텍스트로 분석하기
        </button>
      </div>

      <button
        type="button"
        disabled={!canConfirm}
        onClick={handleConfirm}
        className="mt-5 w-full rounded-2xl bg-ink py-4 text-base font-bold text-cream shadow-pop transition active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:bg-ink/20 disabled:shadow-none"
      >
        나 분석하기 🔍
      </button>
    </div>
  );
}
