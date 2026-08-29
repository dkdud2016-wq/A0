"use client";

import { useRef, useState } from "react";
import RevealCard from "./RevealCard";
import RadarChart from "./RadarChart";
import type { AnalysisResult } from "@/lib/types";

interface ResultScreenProps {
  result: AnalysisResult;
  onRestart: () => void;
}

function scoreBarColor(score: number) {
  if (score >= 75) return "bg-coral";
  if (score >= 45) return "bg-sunny";
  return "bg-mint";
}

export default function ResultScreen({ result, onRestart }: ResultScreenProps) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [copyLabel, setCopyLabel] = useState("텍스트로 복사");

  const handleSaveImage = async () => {
    if (!captureRef.current || saving) return;
    setSaving(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: "#FFF8F0",
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = "너를-너무-잘-알아.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error(e);
      alert("이미지 저장에 실패했어요. 스크린샷으로 저장해보세요!");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyText = async () => {
    const summary = [
      `${result.type.emoji} ${result.type.name}`,
      `"${result.headline}"`,
      "",
      ...result.scores.slice(0, 4).map((s) => `${s.name} ${s.score}`),
      "",
      "- 너를 너무 잘 알아 -",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(summary);
      setCopyLabel("복사 완료 ✓");
      setTimeout(() => setCopyLabel("텍스트로 복사"), 1800);
    } catch {
      alert("복사에 실패했어요.");
    }
  };

  let cardIndex = 0;

  return (
    <div className="flex flex-1 flex-col px-5 pb-10 pt-10">
      <div ref={captureRef} className="flex flex-col gap-4">
        {/* 1. 한 줄 요약 */}
        <RevealCard index={cardIndex++} className="bg-ink text-cream">
          <p className="text-xs font-semibold uppercase tracking-wide text-cream/50">
            당신의 한 줄 요약
          </p>
          <p className="mt-3 text-xl font-extrabold leading-snug">
            &ldquo;{result.headline}&rdquo;
          </p>
        </RevealCard>

        {/* 2. 나의 유형 */}
        <RevealCard index={cardIndex++}>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">
            나의 유형
          </p>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-4xl">{result.type.emoji}</span>
            <h2 className="text-2xl font-extrabold text-ink">{result.type.name}</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ink/70">
            {result.type.description}
          </p>
          <ul className="mt-4 space-y-1.5">
            {result.type.traits.map((trait, i) => (
              <li key={i} className="flex gap-2 text-sm text-ink/80">
                <span className="text-coral">•</span>
                <span>{trait}</span>
              </li>
            ))}
          </ul>
        </RevealCard>

        {/* 3. 성향 레이더 */}
        <RevealCard index={cardIndex++}>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">
            성향 레이더
          </p>
          <div className="mt-2">
            <RadarChart scores={result.scores} />
          </div>
          <div className="mt-4 space-y-4">
            {result.scores.map((s) => (
              <div key={s.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-bold text-ink">{s.name}</span>
                  <span className="font-bold text-coral">{s.score}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-ink/5">
                  <div
                    className={`h-full rounded-full ${scoreBarColor(s.score)}`}
                    style={{ width: `${s.score}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-ink/60">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </RevealCard>

        {/* 4. 팩트 폭격 */}
        <RevealCard index={cardIndex++} className="bg-coral/10">
          <p className="text-xs font-semibold uppercase tracking-wide text-coral">
            🔥 팩트 폭격
          </p>
          <div className="mt-3 space-y-3">
            {result.roast.map((line, i) => (
              <p key={i} className="text-[15px] font-medium leading-relaxed text-ink">
                {line}
              </p>
            ))}
          </div>
        </RevealCard>

        {/* 5. 인간관계 패턴 */}
        <RevealCard index={cardIndex++}>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">
            인간관계 패턴
          </p>
          <div className="mt-3 space-y-4">
            <div>
              <p className="text-sm font-bold text-ink">👬 친구 관계</p>
              <p className="mt-1 text-sm leading-relaxed text-ink/70">
                {result.relationships.friends}
              </p>
            </div>
            <div>
              <p className="text-sm font-bold text-ink">⚡ 갈등 상황</p>
              <p className="mt-1 text-sm leading-relaxed text-ink/70">
                {result.relationships.conflict}
              </p>
            </div>
            <div>
              <p className="text-sm font-bold text-ink">💌 관심 있는 사람에게</p>
              <p className="mt-1 text-sm leading-relaxed text-ink/70">
                {result.relationships.interest}
              </p>
            </div>
          </div>
        </RevealCard>

        {/* 6. 의외의 특징 */}
        <RevealCard index={cardIndex++} className="bg-lilac/15">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
            👀 의외의 특징
          </p>
          <ol className="mt-3 space-y-2.5">
            {result.surprises.map((s, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink">
                <span className="font-extrabold text-lilac">{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </RevealCard>

        {/* 7. AI의 최종 한마디 */}
        <RevealCard index={cardIndex++} className="bg-mint/15 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
            AI의 최종 한마디
          </p>
          <p className="mt-3 text-[15px] font-semibold leading-relaxed text-ink">
            {result.finalMessage}
          </p>
        </RevealCard>
      </div>

      {/* 공유 바 (캡처 영역 밖 — 원문/버튼 노출 없음) */}
      <div className="mt-6 space-y-2.5 animate-fade-up">
        <p className="text-center text-xs text-ink/40">친구에게 자랑하기</p>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleSaveImage}
            disabled={saving}
            className="rounded-2xl bg-ink py-3.5 text-sm font-bold text-cream shadow-pop transition active:translate-y-0.5 active:shadow-none disabled:opacity-60"
          >
            {saving ? "저장 중..." : "📸 이미지 저장"}
          </button>
          <button
            onClick={handleCopyText}
            className="rounded-2xl bg-white py-3.5 text-sm font-bold text-ink shadow-card transition active:translate-y-0.5"
          >
            {copyLabel}
          </button>
        </div>
        <button
          onClick={onRestart}
          className="w-full rounded-2xl border border-ink/10 py-3.5 text-sm font-bold text-ink/60 transition active:translate-y-0.5"
        >
          다시 분석하기 ↺
        </button>
      </div>
    </div>
  );
}
