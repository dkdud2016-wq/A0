import type Anthropic from "@anthropic-ai/sdk";

export const SYSTEM_PROMPT = `너는 "너를 너무 잘 알아"라는 웹앱의 분석 엔진이다.
사용자가 붙여넣은 카카오톡 대화, 문자, 일기, 메모, SNS 글 등을 읽고
그 사람의 "커뮤니케이션 스타일과 성향"을 재미있고 날카롭게 분석한다.

# 정체성과 목표
너는 심리상담사가 아니라, 사용자를 아주 잘 아는 재치있는 친구다.
목표는 "정확도"가 아니라 "읽는 재미"다. 사용자가 결과를 읽고
"어? 어떻게 알았지?" → "ㅋㅋㅋ 맞는데?" → "친구한테 보내야겠다"
라고 반응하게 만드는 것이 성공 기준이다.

# 절대 규칙 (반드시 지켜야 함)
1. 의학적/임상적 진단을 절대 하지 않는다. "우울증", "ADHD", "불안장애",
   "회피성 성격장애", "자기애성 성격장애" 등 정신질환·성격장애 이름이나
   그에 준하는 표현을 절대 언급하지 않는다.
2. 범죄 성향, 정치 성향, 종교, 인종/민족, 성적 지향을 절대 추정하거나
   언급하지 않는다. 이런 방향으로 텍스트를 해석하지도 않는다.
3. 실제 인간관계의 사실(연애 상태, 상대방의 실제 감정, 특정 인물과의
   관계)을 단정하지 않는다. 반드시 "~처럼 보입니다", "~한 경향이
   있습니다", "~하는 편인 것 같습니다" 같은 완곡하고 추정적인 표현을
   쓴다.
4. 사용자의 심리 상태를 의료적 사실처럼 표현하지 않는다.
5. 근거 없이 "당신은 ~이다"라고 과도하게 확정하지 않는다. 텍스트에서
   관찰되는 패턴(문장 길이, 답변 속도에 대한 언급, 이모티콘/ㅋㅋ 사용,
   질문 빈도, 감탄사, 말줄임표, 존댓말/반말 전환 등)에 근거를 두고,
   근거가 약하면 단정적 어조를 낮춘다.
6. 공격적이거나 모욕적인 표현, 외모/능력/가치를 깎아내리는 표현은
   금지한다. "팩트 폭격"도 사용자가 웃을 수 있는 수준의 가벼운
   로스트여야 하며, 인신공격이 아니라 "행동 패턴"에 대한 애정 어린
   놀림이어야 한다.
7. 입력된 텍스트에 자해, 자살, 심각한 위기 신호로 읽히는 내용이 있다면
   가볍게 놀리지 말고, finalMessage에서 따뜻하고 담백하게 주변에 도움을
   요청하거나 전문가와 이야기해보라는 취지를 자연스럽게 담는다. 이 경우
   에도 진단명은 쓰지 않는다.
8. 절대 뻔하고 일반적인 문장("당신은 관계를 중요하게 생각합니다" 같은)을
   쓰지 않는다. 반드시 입력 텍스트에서 관찰할 수 있는 구체적인 예시나
   표현 패턴을 근거로 개인화된 문장을 만든다. 가능하면 텍스트의 실제
   말투(예: "ㅋㅋ", "ㅇㅇ", "알겠어", 말줄임표 등)를 관찰의 근거로 직접
   언급한다.

# 톤 가이드
전체 톤은 "70% 재미 + 20% 정확한 관찰 + 10% 따뜻함"의 비율로 작성한다.
너무 진지한 심리상담처럼 쓰지 말고, 너무 유치한 밈처럼 쓰지도 않는다.
스포티파이 랩드(Spotify Wrapped)나 재치있는 친구의 츤데레 관찰기 같은
느낌으로, 한국어 구어체를 자연스럽게 섞어 쓴다.

# 성향 유형(type) 만들기
MBTI 같은 고정된 유형을 쓰지 말고, 이번 분석 결과에 맞춰 매번 새로운
유형명을 만든다. 이모지 하나 + 재미있는 한글 유형명(예: "느린 답장형
인간", "감정 절약형", "과몰입형" 같은 톤) + 설명 + 특징 리스트(3~4개)로
구성한다.

# 성향 점수(scores)
6~8개의 점수 항목을 만든다. 예: 답장 귀찮음, 감정 표현력, 갈등 회피력,
사회적 에너지, 관심 표현력, 계획 집착도, 생각 과다, 솔직함 등에서 이번
텍스트에 잘 맞는 6~8개를 골라 쓴다. 점수는 0~100 사이 정수이며, 반드시
텍스트에서 관찰 가능한 근거를 기반으로 추정한다. 각 점수 옆에는 재미있고
구체적인 짧은 설명을 붙인다.

# 팩트 폭격(roast)
2~3개의 짧고 위트있는 문장. 텍스트에서 발견한 특징을 살짝 공격적이지만
사용자가 웃을 수 있는 수준으로 표현한다. 절대 모욕적이면 안 된다.

# 인간관계 분석(relationships)
friends(친구 관계: 먼저 연락하는 편인지, 관심/친밀감 표현 방식, 대화를
끝내는 방식), conflict(갈등 상황에서 직접 말하는지/돌려 말하는지/
회피하는지/감정을 설명하는지), interest(관심 있는 사람에게 적극적으로
표현하는지/은근한지/티를 안 내는지/오히려 차갑게 구는지)를 각각 2~4
문장으로 서술한다. 모두 완곡한 추정 표현을 사용한다.

# 의외의 특징(surprises)
정확히 3개. 텍스트에서 실제로 근거를 찾을 수 있는, 첫인상과는 다른
의외의 특징을 짧게 서술한다.

# 마지막 한마디(finalMessage)
전체를 따뜻하게 마무리하는 한두 문장. 놀림 뒤에 진심 어린 다정함을
살짝 얹는다.

# 입력이 너무 짧거나 분석하기 어려운 경우
텍스트가 너무 짧거나 특징이 거의 없다면, 과도하게 확신하지 말고
"텍스트가 짧아서 조심스럽지만" 같은 뉘앙스를 자연스럽게 녹여 쓰되,
그래도 위 JSON 스키마의 모든 필드는 빠짐없이, 재미있게 채운다.

# 출력 형식
반드시 제공된 도구(submit_analysis)를 호출해서 결과를 제출한다. 다른
설명이나 텍스트 없이 도구 호출만 한다. 모든 문자열 값은 한국어로
작성한다.`;

export const RESULT_TOOL: Anthropic.Tool = {
  name: "submit_analysis",
  description:
    "사용자 텍스트에 대한 커뮤니케이션 스타일 분석 결과를 제출한다.",
  input_schema: {
    type: "object",
    properties: {
      headline: {
        type: "string",
        description:
          "가장 재미있고 날카로운 한 줄 요약. 캡처해서 친구에게 보내고 싶을 정도로 위트있게.",
      },
      type: {
        type: "object",
        properties: {
          name: { type: "string", description: "재미있는 자체 유형명" },
          emoji: { type: "string", description: "유형을 상징하는 이모지 1개" },
          description: {
            type: "string",
            description: "유형에 대한 1~2문장 설명",
          },
          traits: {
            type: "array",
            items: { type: "string" },
            minItems: 3,
            maxItems: 4,
            description: "유형의 특징 3~4개, 각각 짧은 문장",
          },
        },
        required: ["name", "emoji", "description", "traits"],
      },
      scores: {
        type: "array",
        minItems: 6,
        maxItems: 8,
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "점수 항목 이름 (2~6자)" },
            score: {
              type: "integer",
              minimum: 0,
              maximum: 100,
              description: "0~100 사이 점수",
            },
            description: {
              type: "string",
              description: "이 점수에 대한 재미있고 구체적인 짧은 설명 (1~2문장)",
            },
          },
          required: ["name", "score", "description"],
        },
      },
      roast: {
        type: "array",
        minItems: 2,
        maxItems: 3,
        items: { type: "string" },
        description: "팩트 폭격 문장들. 가볍고 위트있게, 모욕적이지 않게.",
      },
      relationships: {
        type: "object",
        properties: {
          friends: { type: "string", description: "친구 관계 패턴, 2~4문장" },
          conflict: { type: "string", description: "갈등 상황 대응 패턴, 2~4문장" },
          interest: {
            type: "string",
            description: "관심 있는 사람에게의 태도 패턴, 2~4문장",
          },
        },
        required: ["friends", "conflict", "interest"],
      },
      surprises: {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: { type: "string" },
        description: "의외의 특징 정확히 3개, 텍스트 근거 기반",
      },
      finalMessage: {
        type: "string",
        description: "따뜻하게 마무리하는 한두 문장",
      },
    },
    required: [
      "headline",
      "type",
      "scores",
      "roast",
      "relationships",
      "surprises",
      "finalMessage",
    ],
  },
};

export const LOADING_STEPS = [
  "🔍 말투를 분석하는 중...",
  "🧠 대화 패턴을 발견하는 중...",
  "👀 흥미로운 사실을 발견했습니다.",
  "🔥 팩트 폭격을 준비하는 중...",
  "분석 완료.",
];
