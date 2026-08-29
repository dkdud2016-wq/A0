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

export interface AnalyzeRequestBody {
  text: string;
}

export interface AnalyzeErrorResponse {
  error: string;
}
