// 스크린샷 이미지 업로드 관련 공용 상수/헬퍼.
// app/api/analyze/route.ts 와 app/api/detect-speakers/route.ts 둘 다에서 쓴다.

export const MAX_IMAGES = 4;
// base64 문자열 길이 기준 (원본 바이너리 기준 대략 5MB 정도).
export const MAX_IMAGE_BASE64_CHARS = 7_000_000;
export const ALLOWED_IMAGE_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export interface ImageInputLike {
  base64: string;
  mediaType: string;
}

// 요청 바디에서 온 images 필드가 실제로 유효한 이미지 배열인지 검증한다.
export function validateImages(images: unknown): images is ImageInputLike[] {
  if (!Array.isArray(images)) return false;
  if (images.length === 0 || images.length > MAX_IMAGES) return false;
  return images.every((img) => {
    if (!img || typeof img !== "object") return false;
    const i = img as Record<string, unknown>;
    return (
      typeof i.base64 === "string" &&
      i.base64.length > 0 &&
      i.base64.length <= MAX_IMAGE_BASE64_CHARS &&
      typeof i.mediaType === "string" &&
      ALLOWED_IMAGE_MEDIA_TYPES.includes(i.mediaType)
    );
  });
}

// Claude API의 이미지 content block 형태로 변환한다.
// SDK가 내보내는 정확한 타입(Anthropic.ImageBlockParam 등)에 의존하지 않고
// 순수 객체로 만든 뒤 호출부에서 필요시 as any로 넘긴다 (SDK 버전 차이에
// 덜 민감하게 하기 위함).
export function buildImageContentBlocks(images: ImageInputLike[]) {
  return images.map((img) => ({
    type: "image" as const,
    source: {
      type: "base64" as const,
      media_type: img.mediaType,
      data: img.base64,
    },
  }));
}
