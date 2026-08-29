# 너를 너무 잘 알아

카톡, 문자, 일기, 메모 같은 텍스트를 붙여넣으면 AI가 커뮤니케이션
스타일을 재미있게(그리고 살짝 아프게) 분석해주는 웹앱입니다.

## 기술 스택
- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS
- Framer Motion (카드 등장 애니메이션)
- html2canvas (결과 이미지 저장)
- Claude API (`@anthropic-ai/sdk`) — **서버(API 라우트)에서만 호출**, API 키는 클라이언트에 노출되지 않음

## 폴더 구조
```
app/
  page.tsx              # 입력 → 로딩 → 결과 상태 전환
  layout.tsx
  globals.css
  api/analyze/route.ts  # Claude API 호출 (서버 전용)
components/
  InputScreen.tsx
  LoadingScreen.tsx
  ResultScreen.tsx
  RevealCard.tsx         # 카드 등장 애니메이션 wrapper
  RadarChart.tsx          # 성향 레이더 SVG 차트
lib/
  types.ts               # 분석 결과 타입
  prompt.ts               # 시스템 프롬프트 + JSON 스키마(tool) 정의
```

## 로컬 실행 방법
1. 의존성 설치
   ```bash
   npm install
   ```
2. 환경변수 설정 — `.env.example`을 `.env.local`로 복사 후 값 입력
   ```bash
   cp .env.example .env.local
   ```
   ```
   ANTHROPIC_API_KEY=sk-ant-실제키
   # 선택: 모델을 바꾸고 싶으면
   ANTHROPIC_MODEL=claude-sonnet-4-5-20250929
   ```
3. 개발 서버 실행
   ```bash
   npm run dev
   ```
   http://localhost:3000 접속

> 이 코드는 네트워크가 차단된 샌드박스에서 작성되어 `npm install` /
> `npm run build`로 직접 검증하지 못했습니다. 로컬에서
> `npm install && npm run build`를 한 번 돌려서 타입 에러가 없는지
> 확인해 주세요. (Anthropic SDK 버전에 따라 `lib/prompt.ts`의
> `Anthropic.Tool` 타입 참조 부분만 미세하게 다를 수 있습니다 — 에러가
> 나면 그 줄만 봐주시면 됩니다.)

## Vercel 배포
1. GitHub 저장소에 푸시
2. [vercel.com](https://vercel.com)에서 New Project → 저장소 선택
3. Environment Variables에 `ANTHROPIC_API_KEY` 추가 (Production/Preview 모두)
4. Deploy

## 동작 방식 요약
1. 사용자가 텍스트(최소 20자, 최대 8000자)를 입력하고 "나 분석하기"를
   누르면 `/api/analyze`로 POST 요청을 보냅니다.
2. 서버는 `lib/prompt.ts`의 시스템 프롬프트 + `tool_choice`로 Claude가
   반드시 정해진 JSON 스키마(`submit_analysis` 도구)를 호출하도록
   강제합니다. 이렇게 하면 파싱 오류 없이 안전하게 구조화된 결과를
   받습니다.
3. 결과는 카드 단위(한 줄 요약 → 유형 → 레이더 → 팩트 폭격 → 인간관계 →
   의외의 특징 → 마지막 한마디)로 순차 애니메이션과 함께 노출됩니다.
4. "이미지 저장"은 결과 카드 영역만 캡처합니다(원문 입력 텍스트는 결과
   화면에 아예 렌더링되지 않으므로 이미지에도 포함되지 않습니다).
   "텍스트로 복사"는 헤드라인/유형/주요 점수를 클립보드에 복사합니다.

## MVP 단계에서 단순화한 부분
- **결과 저장/공유 링크**: 스펙의 "링크 복사"는 서버에 결과를 저장하고
  고유 URL을 발급해야 동작하는데, 요구사항 13번에서 "결과 저장은 첫
  버전에서 하지 않아도 됨"이라고 명시되어 있어 이번 MVP에서는 결과를
  저장하지 않았습니다. 대신 이미지 저장 + 텍스트 복사로 공유 기능을
  대체했습니다. 이후 KV/DB(Vercel KV, Supabase 등)를 붙이면 `POST
  /api/results`로 결과를 저장하고 `/r/[id]` 페이지를 만들어 실제
  공유 링크를 구현할 수 있습니다.
- **레이트 리밋**: 서버리스 인스턴스 메모리 기반의 아주 단순한
  레이트리밋만 넣었습니다(10분에 IP당 8회). 실서비스 트래픽이 커지면
  Upstash Redis 등 외부 저장소 기반으로 교체하는 것을 권장합니다.
- **안전장치**: 시스템 프롬프트에서 정신질환/성격장애 진단, 정치·종교·
  인종·성적지향 추정, 범죄 성향 판단, 인신공격성 표현을 명시적으로
  금지했습니다. 자해/위기 신호가 텍스트에서 감지되면 가볍게 놀리지
  않고 마지막 한마디에서 담백하게 주변 도움을 권하도록 지시해두었습니다.
