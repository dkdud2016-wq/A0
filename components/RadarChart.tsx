"use client";

import type { ScoreItem } from "@/lib/types";

interface RadarChartProps {
  scores: ScoreItem[];
  size?: number;
}

export default function RadarChart({ scores, size = 240 }: RadarChartProps) {
  const n = scores.length;
  const center = size / 2;
  const maxRadius = size / 2 - 34;
  const angleFor = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;

  const pointFor = (i: number, ratio: number) => {
    const angle = angleFor(i);
    return {
      x: center + Math.cos(angle) * maxRadius * ratio,
      y: center + Math.sin(angle) * maxRadius * ratio,
    };
  };

  const dataPoints = scores.map((s, i) => pointFor(i, Math.max(s.score, 4) / 100));
  const dataPath = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {rings.map((r) => {
        const ringPoints = scores
          .map((_, i) => pointFor(i, r))
          .map((p) => `${p.x},${p.y}`)
          .join(" ");
        return (
          <polygon
            key={r}
            points={ringPoints}
            fill="none"
            stroke="#1F1B24"
            strokeOpacity={0.08}
            strokeWidth={1}
          />
        );
      })}

      {scores.map((_, i) => {
        const p = pointFor(i, 1);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={p.x}
            y2={p.y}
            stroke="#1F1B24"
            strokeOpacity={0.08}
            strokeWidth={1}
          />
        );
      })}

      <polygon
        points={dataPath}
        fill="#FF6B5E"
        fillOpacity={0.28}
        stroke="#FF6B5E"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#FF6B5E" />
      ))}

      {scores.map((s, i) => {
        const p = pointFor(i, 1.24);
        return (
          <text
            key={s.name}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={11}
            fontWeight={700}
            fill="#1F1B24"
          >
            {s.name}
          </text>
        );
      })}
    </svg>
  );
}
