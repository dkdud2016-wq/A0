"use client";

import { useEffect, useState } from "react";
import { LOADING_STEPS } from "@/lib/prompt";

export default function LoadingScreen() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const delays = [0, 1400, 1400, 1600, 1600];
    let cancelled = false;
    let idx = 0;

    const advance = () => {
      if (cancelled) return;
      setStepIndex(idx);
      if (idx < LOADING_STEPS.length - 1) {
        idx += 1;
        setTimeout(advance, delays[idx] ?? 1500);
      }
    };
    advance();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <div className="mb-6 text-5xl animate-blink">🔮</div>
      <p className="text-lg font-bold text-ink transition-opacity duration-300">
        {LOADING_STEPS[stepIndex]}
      </p>
      <div className="mt-8 flex gap-1.5">
        {LOADING_STEPS.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              i <= stepIndex ? "bg-coral" : "bg-ink/10"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
