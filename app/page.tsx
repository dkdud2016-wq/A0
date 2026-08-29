"use client";

import { useState } from "react";
import InputScreen from "@/components/InputScreen";
import LoadingScreen from "@/components/LoadingScreen";
import ResultScreen from "@/components/ResultScreen";
import type { AnalysisResult } from "@/lib/types";

type Stage = "input" | "loading" | "result";

// 로딩 화면이 너무 빨리 사라지지 않도록 최소로 보여주는 시간(ms)
const MIN_LOADING_MS = 3800;

export default function Home() {
  const [stage, setStage] = useState<Stage>("input");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (text: string) => {
    setError(null);
    setStage("loading");

    const started = Date.now();

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
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

  const handleRestart = () => {
    setResult(null);
    setError(null);
    setStage("input");
  };

  if (stage === "loading") return <LoadingScreen />;
  if (stage === "result" && result)
    return <ResultScreen result={result} onRestart={handleRestart} />;

  return <InputScreen onSubmit={handleSubmit} errorMessage={error} />;
}
