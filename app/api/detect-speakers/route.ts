import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SPEAKER_DETECT_SYSTEM_PROMPT, SPEAKER_DETECT_TOOL } from "@/lib/prompt";
import { validateImages, buildImageContentBlocks } from "@/lib/media";
import type { DetectSpeakersResult } from "@/lib/types";

export const runtime = "nodejs";

const MIN_LENGTH = 20;
const MAX_LENGTH = 8000;
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

// analyze와 별도의 버킷을 쓴다 (한 번의 "분석하기" 클릭이 판별 1회 +
// 분석 1회, 총 2번의 요청을 만들 수 있으므로).
const rateBucket = new Map<string, number[]>();
const RATE_LIMIT = 12;
const RATE_WINDOW_MS = 10 * 60 * 1000;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (rateBucket.get(key) || []).filter(
    (t) => now - t < RATE_WINDOW_MS
  );
  timestamps.push(now);
  rateBucket.set(key, timestamps);
  return timestamps.length > RATE_LIMIT;
}

function validateResult(data: unknown): data is DetectSpeakersResult {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.isDialogue === "boolean" &&
    Array.isArray(d.speakers) &&
    d.speakers.every((s) => typeof s === "string")
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

    const userContent = hasImages
      ? [
          ...buildImageContentBlocks(images),
          {
            type: "text" as const,
            text:
              (text
                ? `추가로 사용자가 다음 설명도 함께 붙였다: "${text}"\n\n`
                : "") +
              "위 이미지(들)가 여러 명의 대화 스크린샷인지 판별하고, 등장인물(또는 화자 라벨)을 submit_speakers 도구로 제출해줘.",
          },
        ]
      : `다음 텍스트가 여러 명의 대화인지 판별하고, 등장인물 이름을 submit_speakers 도구로 제출해줘.\n\n---\n${text}\n---`;

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: SPEAKER_DETECT_SYSTEM_PROMPT,
      tools: [SPEAKER_DETECT_TOOL],
      tool_choice: { type: "tool", name: "submit_speakers" },
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
      // 판별에 실패해도 전체 흐름이 막히면 안 되므로, 대화 아님으로
      // 안전하게 폴백한다 (화면에서는 그냥 바로 분석으로 넘어감).
      return NextResponse.json({ isDialogue: false, speakers: [] });
    }

    return NextResponse.json(toolUse.input as DetectSpeakersResult);
  } catch (err: unknown) {
    console.error("detect-speakers error", err);
    // 판별 단계는 부가 기능이므로, 오류가 나도 사용자를 막지 않고
    // "대화 아님"으로 폴백해 바로 분석이 진행되게 한다.
    return NextResponse.json({ isDialogue: false, speakers: [] });
  }
}
