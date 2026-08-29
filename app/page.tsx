"use client";

import { useState } from "react";
import InputScreen from "@/components/InputScreen";
import LoadingScreen from "@/components/LoadingScreen";
import ResultScreen from "@/components/ResultScreen";
import SpeakerSelect from "@/components/SpeakerSelect";
import type { AnalysisResult, DetectSpeakersResult } from "@/lib/types";

type Stage = "input" | "detecting" | "speaker-select" | "loading" | "result";

// 로딩 화면이 너무 빨리 사라지지 않도록 최소로 보여주는 시간(ms)
const MIN_LOADING_MS = 3800;

type PendingInput = {
  text?: string;
  images?: { base64: string; mediaType: string }[];
};

export default function Home() {
  const [stage, setStage] = useState<Stage>("input");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingInput, setPendingInput] = useState<PendingInput>({});
  const [detectedSpeakers, setDetectedSpeakers] = useState<string[]>([]);

  const runAnalysis = async (input: PendingInput, speakerName?: string) => {
    setError(null);
    setStage("loading");

    const started = Date.now();

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, speakerName }),
      });

      const data = await res.json();

      const elapsed = Date.now() - started;
      if (elapsed < MIN_LOADING_MS) {
        await new Promise((r) => setTimeout(r, MIN_LOADING_MS - elapsed));
      }

      if (!res.ok) {
        setError(data?.error || "분석에 실패했어요. 다시 시도해주세요.");
        setStage("input");
        return;
      }

      setResult(data as AnalysisResult);
      setStage("result");
    } catch (e) {
      const elapsed = Date.now() - started;
      if (elapsed < MIN_LOADING_MS) {
        await new Promise((r) => setTimeout(r, MIN_LOADING_MS - elapsed));
      }
      setError("네트워크 오류로 분석에 실패했어요. 다시 시도해주세요.");
      setStage("input");
    }
  };

  const handleSubmit = async (input: PendingInput) => {
    setError(null);
    setPendingInput(input);
    setStage("detecting");

    try {
      const res = await fetch("/api/detect-speakers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const data = (await res.json().catch(() => null)) as
        | DetectSpeakersResult
        | null;

      if (res.ok && data?.isDialogue) {
        setDetectedSpeakers(Array.isArray(data.speakers) ? data.speakers : []);
        setStage("speaker-select");
        return;
      }

      // 대화가 아니거나 판별 실패 시 바로 분석으로 진행.
      await runAnalysis(input);
    } catch (e) {
      // 판별 자체가 실패해도 전체 흐름을 막지 않고 바로 분석으로 진행.
      await runAnalysis(input);
    }
  };

  const handleSpeakerConfirm = (speakerName?: string) => {
    runAnalysis(pendingInput, speakerName);
  };

  const handleBackToInput = () => {
    setError(null);
    setStage("input");
  };

  const handleRestart = () => {
    setResult(null);
    setError(null);
    setPendingInput({});
    setDetectedSpeakers([]);
    setStage("input");
  };

  if (stage === "detecting")
    return <LoadingScreen message="🔍 대화 속 말투를 확인하는 중..." />;
  if (stage === "loading") return <LoadingScreen />;
  if (stage === "speaker-select")
    return (
      <SpeakerSelect
        speakers={detectedSpeakers}
        onConfirm={handleSpeakerConfirm}
        onBack={handleBackToInput}
      />
    );
  if (stage === "result" && result)
    return <ResultScreen result={result} onRestart={handleRestart} />;

  return <InputScreen onSubmit={handleSubmit} errorMessage={error} />;
}
