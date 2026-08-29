import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildAnalysisSystemPrompt, RESULT_TOOL } from "@/lib/prompt";
import { validateImages, buildImageContentBlocks } from "@/lib/media";
import type { AnalysisResult } from "@/lib/types";

export const runtime = "nodejs";

const MIN_LENGTH = 20;
const MAX_LENGTH = 8000;
const MAX_SPEAKER_NAME_LENGTH = 60;
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

// 아주 단순한 IP 기반 레이트리밋 (서버리스 인스턴스 단위, 완벽하지 않음)
const rateBucket = new Map<string, number[]>();
const RATE_LIMIT = 8; // 창 안 최대 요청 수
const RATE_WINDOW_MS = 10 * 60 * 1000; // 10분

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (rateBucket.get(key) || []).filter(
    (t) => now - t < RATE_WINDOW_MS
  );
  timestamps.push(now);
  rateBucket.set(key, timestamps);
  return timestamps.length > RATE_LIMIT;
}

function validateResult(data: unknown): data is AnalysisResult {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.headline === "string" &&
    typeof d.type === "object" &&
    Array.isArray(d.scores) &&
    Array.isArray(d.roast) &&
    typeof d.relationships === "object" &&
    Array.isArray(d.surprises) &&
    typeof d.finalMessage === "string"
  );
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "서버에 ANTHROPIC_API_KEY가 설정되어 있지 않습니다." },
        { status: 500 }
      );
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "잠시 후 다시 시도해주세요. 요청이 너무 많습니다." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const hasImages = Array.isArray(body?.images) && body.images.length > 0;
    const images = hasImages ? body.images : undefined;
    const speakerNameRaw =
      typeof body?.speakerName === "string" ? body.speakerName.trim() : "";
    const speakerName =
      speakerNameRaw.length > 0 && speakerNameRaw.length <= MAX_SPEAKER_NAME_LENGTH
        ? speakerNameRaw
        : undefined;

    if (!hasImages) {
      if (text.length < MIN_LENGTH) {
        return NextResponse.json(
          {
            error: `텍스트가 너무 짧아요. 최소 ${MIN_LENGTH}자 이상 붙여넣거나 스크린샷을 올려주세요.`,
          },
          { status: 400 }
        );
      }
      if (text.length > MAX_LENGTH) {
        return NextResponse.json(
          {
            error: `텍스트가 너무 길어요. ${MAX_LENGTH}자 이내로 줄여주세요.`,
          },
          { status: 400 }
        );
      }
    } else if (!validateImages(images)) {
      return NextResponse.json(
        { error: "이미지 형식이 올바르지 않거나 너무 크거나 개수가 많아요." },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({ apiKey });

    const analysisInstruction = speakerName
      ? `이 중 "${speakerName}"의 발화만을 분석 대상으로 삼아 커뮤니케이션 스타일을 분석해서 submit_analysis 도구를 호출해줘.`
      : `이 내용을 바탕으로 커뮤니케이션 스타일을 분석해서 submit_analysis 도구를 호출해줘.`;

    const userContent = hasImages
      ? [
          ...buildImageContentBlocks(images),
          {
            type: "text" as const,
            text:
              `다음은 사용자가 업로드한 스크린샷이다.` +
              (text ? ` 사용자가 다음 설명도 함께 붙였다: "${text}"\n\n` : " ") +
              analysisInstruction,
          },
        ]
      : `다음은 사용자가 붙여넣은 텍스트다. ${analysisInstruction}\n\n---\n${text}\n---`;

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: buildAnalysisSystemPrompt(speakerName),
      tools: [RESULT_TOOL],
      tool_choice: { type: "tool", name: "submit_analysis" },
      messages: [
        {
          role: "user",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content: userContent as any,
        },
      ],
    });

    const toolUse = message.content.find(
      (block) => block.type === "tool_use"
    ) as { type: "tool_use"; input: unknown } | undefined;

    if (!toolUse || !validateResult(toolUse.input)) {
      return NextResponse.json(
        { error: "분석 결과를 생성하지 못했습니다. 다시 시도해주세요." },
        { status: 502 }
      );
    }

    return NextResponse.json(toolUse.input as AnalysisResult);
  } catch (err: unknown) {
    console.error("analyze error", err);
    const status =
      typeof err === "object" && err !== null && "status" in err
        ? (err as { status?: number }).status
        : undefined;
    const message = status
      ? `AI 분석 중 오류가 발생했습니다 (${status}).`
      : "알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
