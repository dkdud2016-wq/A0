"use client";

import { useRef, useState } from "react";
import { MAX_IMAGES } from "@/lib/media";

interface SelectedImage {
  id: string;
  base64: string;
  mediaType: string;
  previewUrl: string;
}

interface InputScreenProps {
  onSubmit: (input: {
    text?: string;
    images?: { base64: string; mediaType: string }[];
  }) => void;
  errorMessage: string | null;
}

const EXAMPLE_TAGS = ["카톡 대화", "문자", "일기", "메모", "SNS 글", "업무 메신저"];
const MAX_OUTPUT_DIM = 1600;

// 파일을 읽어서 브라우저 캔버스로 리사이즈한 뒤 JPEG base64로 변환한다.
// 모바일 스크린샷은 용량이 커서 그대로 보내면 느리고 서버 페이로드
// 제한에 걸릴 수 있어, 업로드 전에 클라이언트에서 줄인다.
async function fileToImageInput(file: File): Promise<SelectedImage> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const img = document.createElement("img");
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("이미지를 불러오지 못했습니다."));
    img.src = dataUrl;
  });

  let { width, height } = img;
  if (width > MAX_OUTPUT_DIM || height > MAX_OUTPUT_DIM) {
    const scale = MAX_OUTPUT_DIM / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas context 생성 실패");
  ctx.drawImage(img, 0, 0, width, height);

  const outDataUrl = canvas.toDataURL("image/jpeg", 0.85);
  const base64 = outDataUrl.split(",")[1] ?? "";

  return {
    id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
    base64,
    mediaType: "image/jpeg",
    previewUrl: outDataUrl,
  };
}

export default function InputScreen({ onSubmit, errorMessage }: InputScreenProps) {
  const [mode, setMode] = useState<"text" | "image">("text");
  const [text, setText] = useState("");
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmitText = text.trim().length >= 20;
  const canSubmitImage = images.length > 0;
  const canSubmit = mode === "text" ? canSubmitText : canSubmitImage;

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setImageError(null);

    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) {
      setImageError("이미지 파일만 올릴 수 있어요.");
      return;
    }

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      setImageError(`스크린샷은 최대 ${MAX_IMAGES}장까지 올릴 수 있어요.`);
      return;
    }

    setIsProcessingFiles(true);
    try {
      const toProcess = files.slice(0, remaining);
      const converted = await Promise.all(toProcess.map(fileToImageInput));
      setImages((prev) => [...prev, ...converted]);
      if (files.length > remaining) {
        setImageError(`스크린샷은 최대 ${MAX_IMAGES}장까지만 반영됐어요.`);
      }
    } catch {
      setImageError("이미지를 처리하지 못했어요. 다른 파일로 시도해주세요.");
    } finally {
      setIsProcessingFiles(false);
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleSubmitClick = () => {
    if (mode === "text") {
      onSubmit({ text: text.trim() });
    } else {
      onSubmit({
        images: images.map(({ base64, mediaType }) => ({ base64, mediaType })),
      });
    }
  };

  return (
    <div className="flex flex-1 flex-col px-6 pb-10 pt-14">
      <header className="mb-6 animate-fade-up">
        <h1 className="text-3xl font-extrabold leading-tight text-ink">
          너를 너무<br />잘 알아.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink/70">
          카톡, 일기, 메모를 넣어보세요.
          <br />
          당신이 어떤 사람인지 AI가 아주 조금 참견해드립니다.
        </p>
      </header>

      <div className="mb-4 flex gap-1.5 rounded-2xl bg-ink/5 p-1 animate-fade-up [animation-delay:40ms] opacity-0">
        <button
          type="button"
          onClick={() => setMode("text")}
          className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${
            mode === "text" ? "bg-white text-ink shadow-card" : "text-ink/40"
          }`}
        >
          텍스트 붙여넣기
        </button>
        <button
          type="button"
          onClick={() => setMode("image")}
          className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${
            mode === "image" ? "bg-white text-ink shadow-card" : "text-ink/40"
          }`}
        >
          스크린샷 업로드
        </button>
      </div>

      {mode === "text" && (
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
      )}

      {mode === "text" ? (
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
      ) : (
        <div className="flex flex-1 flex-col animate-fade-up [animation-delay:140ms] opacity-0">
          <p className="mb-2 text-xs text-ink/50">
            카톡 대화를 캡처해서 올려주세요. 여러 장이면 대화 순서대로
            선택해주세요 (최대 {MAX_IMAGES}장).
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessingFiles || images.length >= MAX_IMAGES}
            className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-ink/15 bg-white text-ink/50 shadow-card disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-3xl">📸</span>
            <span className="text-sm font-bold">
              {isProcessingFiles
                ? "이미지 처리 중..."
                : "탭해서 스크린샷 선택"}
            </span>
          </button>

          {images.length > 0 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="relative aspect-square overflow-hidden rounded-xl border border-ink/10 bg-white"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.previewUrl}
                    alt="선택한 스크린샷"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink/70 text-[11px] font-bold text-white"
                    aria-label="이미지 제거"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {imageError && (
            <p className="mt-3 rounded-xl bg-coral/10 px-4 py-2.5 text-sm text-coral">
              {imageError}
            </p>
          )}

          <div className="mt-2 flex items-center justify-between text-xs text-ink/40">
            <span>🔒 업로드한 이미지는 분석에만 사용되고 저장되지 않습니다.</span>
            <span>{images.length}/{MAX_IMAGES}</span>
          </div>

          <div className="flex-1" />
        </div>
      )}

      {errorMessage && (
        <p className="mt-3 rounded-xl bg-coral/10 px-4 py-2.5 text-sm text-coral">
          {errorMessage}
        </p>
      )}

      <button
        type="button"
        disabled={!canSubmit || isProcessingFiles}
        onClick={handleSubmitClick}
        className="mt-5 w-full rounded-2xl bg-ink py-4 text-base font-bold text-cream shadow-pop transition active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:bg-ink/20 disabled:shadow-none"
      >
        나 분석하기 🔍
      </button>
      {mode === "text" && !canSubmitText && text.length > 0 && (
        <p className="mt-2 text-center text-xs text-ink/40">
          최소 20자 이상 입력해주세요 ({text.trim().length}/20)
        </p>
      )}
      {mode === "image" && !canSubmitImage && (
        <p className="mt-2 text-center text-xs text-ink/40">
          스크린샷을 한 장 이상 선택해주세요.
        </p>
      )}
    </div>
  );
}
