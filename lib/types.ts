// 분석 결과 데이터 구조.
// Claude API의 tool-use(JSON Schema)로 강제 생성되므로, 이 타입과
// lib/prompt.ts의 RESULT_TOOL.input_schema는 항상 서로 맞춰서 수정해야 한다.

export interface ScoreItem {
  name: string;
  score: number; // 0-100
  description: string;
}

export interface PersonalityType {
  name: string;
  emoji: string;
  description: string;
  traits: string[]; // 3~4개
}

export interface Relationships {
  friends: string;
  conflict: string;
  interest: string;
}

export interface AnalysisResult {
  headline: string;
  type: PersonalityType;
  scores: ScoreItem[];
  roast: string[]; // 팩트 폭격, 2~3개
  relationships: Relationships;
  surprises: string[]; // 의외의 특징, 3개
  finalMessage: string;
}

// 사용자가 업로드한 스크린샷 이미지 한 장.
// base64는 data: 접두어를 뺀 순수 base64 문자열이다.
export interface ImageInput {
  base64: string;
  mediaType: string; // 예: "image/jpeg", "image/png"
}

export interface AnalyzeRequestBody {
  // 텍스트 붙여넣기 모드에서는 text, 스크린샷 업로드 모드에서는 images를 쓴다.
  // 서버는 둘 중 최소 하나가 있어야 요청을 처리한다.
  text?: string;
  images?: ImageInput[];
  speakerName?: string;
}

export interface AnalyzeErrorResponse {
  error: string;
}

// 여러 명이 나오는 대화(카톡 등)인지 판별한 결과.
// isDialogue가 true면 speakers에 등장인물 이름(또는 "나 (오른쪽 말풍선)"처럼
// 스크린샷에서 위치/색상으로 구분한 라벨) 후보들이 담긴다.
export interface DetectSpeakersResult {
  isDialogue: boolean;
  speakers: string[]; // 최대 6명
}

export interface DetectSpeakersRequestBody {
  text?: string;
  images?: ImageInput[];
}
