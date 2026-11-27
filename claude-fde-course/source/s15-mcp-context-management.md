---
session: S15
course: "C5 Claude Platform 101"
official_sections: ["Extending your Agent: MCP", "Extending your Agent: Context management"]
title: "MCP와 컨텍스트 관리"
minutes: 25
status: draft
---

# S15. MCP와 컨텍스트 관리

## 오늘의 목표
- MCP가 무엇이고, API의 MCP 커넥터로 원격 MCP 서버를 붙이는 방법과 한계를 설명할 수 있다.
- 긴 에이전트 실행에서 컨텍스트가 왜 문제가 되는지 말하고, 다섯 가지 관리 수단을 상황에 맞게 고를 수 있다.
- 압축(compaction)을 켠 대화에서 응답을 어떻게 이어 붙여야 하는지 말할 수 있다.

## 핵심 정리

### MCP: 도구를 꽂는 표준 콘센트
S12에서는 도구마다 스키마와 실행 코드를 직접 썼어요. 가전제품마다 전선을 새로 까는 셈이에요. **MCP**(Model Context Protocol)는 AI 애플리케이션과 외부 도구·데이터를 잇는 개방형 표준이에요. 규격이 하나라서, 누가 만든 MCP 서버든 꽂으면 그 서버의 도구를 쓸 수 있어요.

API에는 **MCP 커넥터**가 있어요. MCP 클라이언트를 직접 구현하지 않고, Messages API 요청 안에서 원격 MCP 서버에 연결해요. 요청에 두 가지를 적어요.
- `mcp_servers`: 서버 주소(`url`), 이름(`name`), 필요하면 인증 토큰(`authorization_token`)
- `tools` 안의 `mcp_toolset`: 어느 서버의 도구를 켤지(`mcp_server_name`)

베타 기능이라 베타 헤더(`mcp-client-2025-11-20`)가 필요해요. 호출과 결과는 응답에 `mcp_tool_use`, `mcp_tool_result` 블록으로 나타나요.

한계도 있어요. MCP 기능 가운데 도구 호출만 지원해요. 서버는 `https://` 주소로 공개되어 있어야 해서, 내 컴퓨터에서만 도는 로컬(STDIO) 서버는 직접 붙일 수 없어요. OAuth 토큰은 내가 받아서 넣고 갱신해요. MCP의 구조와 서버 만들기는 S28~S31에서 다뤄요.

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const response = await client.beta.messages.create({
  model: "claude-opus-5-5",
  max_tokens: 1000,
  betas: ["mcp-client-2025-11-20"],
  mcp_servers: [
    { type: "url", url: "https://example-server.modelcontextprotocol.io/sse", name: "example-mcp" },
  ],
  tools: [{ type: "mcp_toolset", mcp_server_name: "example-mcp" }],
  messages: [{ role: "user", content: "어떤 도구를 쓸 수 있어?" }],
});

for (const block of response.content) {
  if (block.type === "mcp_tool_use") console.log("[MCP 도구 호출]", block.server_name, block.name);
  if (block.type === "text") console.log(block.text);
}
```

### 컨텍스트 관리: 책상이 넘치기 전에
S03에서 컨텍스트 윈도우를 작업 기억이라고 했어요. S11의 에이전트 루프는 돌 때마다 도구 결과가 대화에 쌓여요. 요즘 모델은 창이 100만 토큰까지 되지만, 토큰이 늘수록 정확도와 기억이 떨어져요. 공식 문서는 이걸 context rot이라고 불러요. 그래서 무엇을 책상에 올려 둘지 관리해요.

| 수단 | 하는 일 | 상태 |
|---|---|---|
| 토큰 세기 `messages.countTokens` | 보내기 전에 입력 토큰 수를 추정해요. 무료예요 | 정식 |
| 프롬프트 캐싱 `cache_control` | 반복되는 앞부분을 싸고 빠르게 재사용해요 | 정식 |
| 압축(compaction) | 오래된 대화를 서버가 요약으로 바꿔요 | 베타 |
| 컨텍스트 편집(context editing) | 오래된 도구 결과와 thinking 블록을 규칙대로 비워요 | 베타 |
| 메모리 도구 `memory_20250818` | 파일에 적어 두고 다음 세션에서 다시 읽어요 | 정식 |

- **프롬프트 캐싱**은 자리를 줄여 주지 않아요. 캐시된 토큰도 창을 차지해요. 바뀌는 건 값과 속도예요. 기본 수명은 5분이고, 캐시 읽기는 기본 입력가의 0.1배(일부 모델은 더 낮음)예요. 앞부분(tools → system → messages 순서)이 그대로일 때만 맞아요.
- **압축**은 공식 문서가 긴 대화의 1차 수단으로 권해요. 입력 토큰이 임계값(기본 150,000)에 닿으면 자동으로 요약하는 방식과, 내가 요청할 때 요약하는 방식이 있고 베타 헤더가 서로 달라요.
- **컨텍스트 편집**은 요약하지 않고 지워요. 기본값은 입력 10만 토큰을 넘으면 오래된 도구 결과부터 비우고 최근 3개만 남기는 거예요.
- **메모리 도구**는 클라이언트 도구예요. Claude가 `/memories` 폴더의 파일 작업을 요청하고 저장은 내 애플리케이션이 해요. 다섯 가지 가운데 대화가 끝나도 남는 유일한 수단이에요.

압축에서 꼭 지킬 것이 하나 있어요. 응답에서 글만 뽑아 붙이지 말고 `response.content` 전체를 붙여요. 요약이 담긴 압축 블록이 그 안에 있어요.

```typescript
// 위 예시의 import와 client를 그대로 써요
const messages: Anthropic.Beta.Messages.BetaMessageParam[] = [
  { role: "user", content: "웹사이트 만드는 걸 도와줘." },
];

const response = await client.beta.messages.create({
  model: "claude-opus-5-5",
  max_tokens: 4096,
  betas: ["compact-2026-01-12"],
  context_management: { edits: [{ type: "compact_20260112" }] },
  messages,
});

// 글만 뽑아 넣지 말고 content 전체를 붙여요. 압축 블록이 여기 들어 있어요.
messages.push({ role: "assistant", content: response.content });
```

## 직접 해 보기 (5분)
1. 토큰을 세어 보세요. 아래 코드에 긴 글(회의록 등)을 넣고 `input_tokens`를 확인한 뒤, 같은 글로 실제 요청을 보내 `usage.input_tokens`와 비교해요. 왜 "추정"이라고 부르는지 볼 수 있어요.
   ```typescript
   const count = await client.messages.countTokens({
     model: "claude-opus-5-5",
     messages: [{ role: "user", content: "여기에 긴 글을 붙여 넣어요." }],
   });
   console.log(count.input_tokens);
   ```
2. MCP 커넥터 예시를 실행하고 `response.content`의 블록 종류를 출력해 보세요. S14의 서버 도구 응답과 어떤 점이 닮았나요? (힌트: 누가 실행했나) 예시의 서버 주소는 공식 문서에 나오는 예시 주소인데, 지금 실제로 응답하는지는 확인하지 못했어요(확인 필요). 연결 오류가 나면 쓸 수 있는 원격 MCP 서버 주소로 바꾸세요.

## 확인 문제
1. API의 MCP 커넥터에 대한 설명으로 맞는 것은?
   - (a) 내 컴퓨터의 로컬 STDIO 서버에 바로 연결할 수 있다
   - (b) 요청에 `mcp_servers`와 `mcp_toolset`을 함께 적어 원격 MCP 서버의 도구를 쓴다
   - (c) MCP의 도구, 리소스, 프롬프트를 모두 지원한다
2. 프롬프트 캐싱의 효과로 맞는 것은?
   - (a) 캐시된 토큰은 컨텍스트 윈도우를 차지하지 않는다
   - (b) 대화를 요약해서 토큰 수를 줄인다
   - (c) 반복되는 앞부분의 비용과 처리 시간을 줄이지만, 창에서 차지하는 자리는 그대로다
3. 세션이 끝난 뒤에도 정보가 남는 수단은?
   - (a) 메모리 도구
   - (b) 컨텍스트 편집
   - (c) 압축
4. (서술형) 압축과 컨텍스트 편집은 둘 다 긴 대화를 줄여 줘요. 방식의 차이와, 각각 어떤 상황에 맞는지 두세 문장으로 설명해 보세요.
5. (상황형) 고객사 담당자가 말해요. "에이전트가 처음 30분은 잘하다가, 한 시간쯤 지나면 앞에서 정한 규칙을 잊고 엉뚱한 일을 해요. 창이 100만 토큰이라면서요?" 원인을 어떻게 설명하고, 무엇을 측정하고, 어떤 조치를 제안할까요?

## FDE 관점
공식 경로는 MCP 코스를 "Claude를 고객의 시스템에 연결하기"라고 소개해요. 현장에서 MCP 커넥터가 좋은 건, 고객이 이미 쓰는 서비스의 MCP 서버가 있으면 연동 코드를 거의 쓰지 않고 시연할 수 있다는 점이에요. 다만 서버가 공개 주소여야 하고 토큰을 내가 관리해야 하니, 사내망 안의 시스템이라면 커스텀 도구나 클라이언트 쪽 MCP 연결을 따로 설계해요. 컨텍스트 관리는 파일럿 후반에 터지는 문제를 미리 막는 일이에요. 짧은 시연은 잘 되다가 실제 업무 길이에서 품질이 떨어지는 경우가 많아요. 그래서 기준선을 잴 때 "가장 긴 실제 작업"을 표본에 넣고, 작업당 토큰 수와 캐시 적중을 성공 지표와 함께 기록해 두세요.

## 복습 카드
- Q: MCP란? / A: AI 애플리케이션과 외부 도구·데이터를 잇는 개방형 표준(Model Context Protocol).
- Q: MCP 커넥터 요청에 필요한 두 가지는? / A: `mcp_servers`(서버 주소와 이름)와 `tools`의 `mcp_toolset`. 베타 헤더도 필요하다.
- Q: 프롬프트 캐싱이 줄여 주는 것과 못 줄이는 것은? / A: 비용과 처리 시간은 줄이고, 컨텍스트 윈도우에서 차지하는 자리는 못 줄인다.
- Q: 압축과 컨텍스트 편집의 차이는? / A: 압축은 오래된 대화를 요약으로 바꾸고, 컨텍스트 편집은 오래된 도구 결과나 thinking 블록을 지운다.
- Q: 압축을 켠 대화에서 응답을 붙이는 규칙은? / A: 글만이 아니라 `response.content` 전체를 붙인다. 압축 블록이 그 안에 있다.

## 영상 대본

### 장면 1 · 오늘의 질문 (약 25초)
**화면:** 왼쪽에 제각각 모양의 플러그 여러 개와 엉킨 전선. 오른쪽에 서류가 산더미처럼 쌓여 넘치려는 책상. 가운데 제목 "더 많이 연결하고, 더 오래 일하게 하려면?"
**내레이션:** 에이전트가 쓸모 있으려면 두 가지가 필요해요. 고객의 시스템에 연결돼야 하고, 오래 일해도 흐트러지지 않아야 해요. 오늘은 그 두 가지를 볼게요.

### 장면 2 · 엠씨피는 표준 콘센트 (약 35초)
**화면:** 엉킨 전선이 사라지고 벽에 똑같은 모양의 콘센트가 줄지어 나타남. 서로 다른 서비스 아이콘이 달린 플러그들이 같은 콘센트에 하나씩 꽂힘.
**내레이션:** 지난번에는 도구마다 연결을 새로 만들었어요. 엠씨피는 그 연결의 표준 규격이에요. 규격이 하나라서, 누가 만든 서버든 꽂으면 그 도구를 쓸 수 있어요.

### 장면 3 · 커넥터로 붙이기 (약 40초)
**화면:** 요청 상자에 두 줄이 강조됨: "서버: 주소와 이름", "도구 묶음: 이 서버 것을 켠다". 요청 상자에서 구름 서버를 거쳐 원격 서버로 화살표가 이어지고, 결과 블록이 응답으로 돌아옴.
**내레이션:** 에이피아이에는 엠씨피 커넥터가 있어요. 요청에 서버 주소와, 그 서버의 도구를 켠다는 표시를 적어요. 그러면 연결과 호출을 서버 쪽에서 해 주고 결과가 응답에 담겨 와요.

### 장면 4 · 커넥터의 한계 (약 35초)
**화면:** 체크 표시와 엑스 표시가 붙은 세 줄: "공개된 주소의 서버 (O)", "내 컴퓨터 안의 서버 (X)", "도구 호출만 지원". 열쇠 아이콘 옆에 "토큰은 내가 관리".
**내레이션:** 한계도 있어요. 서버가 공개된 주소에 있어야 해요. 내 컴퓨터 안에서만 도는 서버는 바로 못 붙여요. 인증 토큰도 내가 받아서 넣고 갱신해야 해요.

### 장면 5 · 책상이 넘친다 (약 40초)
**화면:** S11의 루프가 한 바퀴 돌 때마다 책상 위에 서류가 한 장씩 쌓임. 책상이 아주 넓어지지만, 서류가 늘수록 맨 아래 서류의 글자가 흐려짐. 옆에 "크다고 끝이 아니다".
**내레이션:** 에이전트 루프는 돌 때마다 도구 결과가 쌓여요. 창이 백만 토큰이어도 안심할 수 없어요. 쌓일수록 정확도와 기억이 떨어지거든요. 그래서 책상을 관리해야 해요.

### 장면 6 · 세기와 캐싱 (약 40초)
**화면:** 왼쪽에 저울이 서류 묶음의 무게를 재고 숫자를 표시. 오른쪽에 서류 묶음 앞부분에 "재사용" 도장이 찍히고, 동전과 시계 아이콘은 작아지지만 책상 위 서류 높이는 그대로.
**내레이션:** 먼저 보내기 전에 토큰을 세어 볼 수 있어요. 무료예요. 캐싱은 반복되는 앞부분을 싸고 빠르게 해 줘요. 하지만 자리는 줄여 주지 않아요. 값과 속도만 바뀌어요.

### 장면 7 · 압축과 편집 (약 40초)
**화면:** 위쪽: 오래된 서류 더미가 한 장짜리 요약지로 바뀜, 라벨 "압축". 아래쪽: 오래된 도구 결과 서류만 골라 휴지통으로 가고 최근 세 장은 남음, 라벨 "컨텍스트 편집".
**내레이션:** 압축은 오래된 대화를 요약 한 장으로 바꿔요. 긴 대화의 기본 수단이에요. 컨텍스트 편집은 요약하지 않고 오래된 도구 결과를 지워요. 최근 것은 남겨 두고요.

### 장면 8 · 메모리 도구 (약 35초)
**화면:** 책상 옆에 서랍장이 등장. 클로드가 메모지를 서랍에 넣고, 화면이 "다음 날"로 바뀐 뒤 새 책상에서 같은 서랍을 열어 메모지를 꺼냄. 서랍에 "내 저장소" 라벨.
**내레이션:** 앞의 방법은 모두 한 대화 안의 이야기예요. 메모리 도구는 달라요. 파일에 적어 두고 다음 대화에서 다시 읽어요. 저장은 내 프로그램이 맡아요.

### 장면 9 · 고객 앞에서 (약 35초)
**화면:** 회의실 그림. 고객 말풍선 "한 시간 지나면 규칙을 잊어요." FDE가 그래프를 가리킴: 가로축 시간, 세로축 토큰 수가 계속 올라가는 선. 옆에 "가장 긴 실제 작업으로 측정".
**내레이션:** 고객이 오래 돌리면 규칙을 잊는다고 하면 토큰이 얼마나 쌓이는지부터 재요. 시연이 아니라 가장 긴 실제 작업으로요. 그다음 압축과 메모리를 붙여요.

### 장면 10 · 요약과 예고 (약 25초)
**화면:** 세 줄 요약이 한 줄씩 나타남: "1. 엠씨피는 표준 콘센트, 커넥터로 원격 서버를 붙인다 2. 캐싱은 값과 속도, 압축과 편집은 자리 3. 메모리는 대화를 넘어 남는다". 아래에 "다음: S16 Managed Agents".
**내레이션:** 정리할게요. 엠씨피는 표준 콘센트예요. 캐싱은 값과 속도를, 압축과 편집은 자리를 관리해요. 메모리는 대화를 넘어 남아요. 다음 시간에는 이 모든 걸 대신 운영해 주는 매니지드 에이전트를 볼게요.

## 정답과 해설
1. (b). 커넥터는 `mcp_servers`와 `mcp_toolset` 두 부분으로 원격 서버에 연결해요. 로컬 STDIO 서버는 직접 붙일 수 없고, MCP 기능 중 도구 호출만 지원해요.
2. (c). 캐시된 앞부분도 컨텍스트 윈도우를 차지해요. 달라지는 건 그 토큰의 값과 처리 시간이에요.
3. (a). 메모리 도구는 파일로 남겨 다음 대화에서 읽어요. 압축과 컨텍스트 편집은 한 대화 안에서 쓰는 수단이에요.
4. 예시 답: 압축은 오래된 대화 전체를 요약으로 바꿔서 흐름은 남기고 양을 줄인다. 컨텍스트 편집은 요약 없이 오래된 도구 결과나 thinking 블록만 골라 지운다. 대화가 창 한계에 가까워지는 긴 작업에는 압축이 기본이고, 도구 결과가 크고 한 번 읽으면 다시 필요 없는 작업에는 컨텍스트 편집이 맞는다. 둘을 같이 쓸 수도 있다.
5. 예시 답: "창이 크다고 다 기억하는 건 아니에요. 도구 결과가 쌓여 토큰이 늘면 정확도와 기억이 떨어져요"라고 설명한다. 측정은 (1) 실제 긴 작업에서 턴마다 `usage`의 입력 토큰이 어떻게 늘어나는지, (2) 어느 시점부터 품질이 떨어지는지를 본다. 조치는 (1) 압축을 켜서 오래된 대화를 요약으로 바꾸고, (2) 큰 도구 결과는 컨텍스트 편집으로 비우고, (3) 꼭 지켜야 할 규칙과 진행 상황은 메모리 도구로 파일에 남기고, (4) 변하지 않는 지시문은 시스템 프롬프트 앞부분에 두고 캐싱한다. 파일럿의 기준선 표본에 가장 긴 작업을 넣자고 제안한다.

## 출처
- Anthropic, MCP connector (`mcp_servers`·`mcp_toolset`, 베타 헤더, 한계, 인증, 응답 블록): https://platform.claude.com/docs/en/agents-and-tools/mcp-connector
- Anthropic, Context windows (컨텍스트 윈도우 크기, context rot, 캐시된 토큰과 창의 관계): https://platform.claude.com/docs/en/build-with-claude/context-windows
- Anthropic, Token counting (`countTokens`, 추정치, 무료): https://platform.claude.com/docs/en/build-with-claude/token-counting
- Anthropic, Prompt caching (동작, 수명, 캐시 읽기 가격 배수, 앞부분 순서): https://platform.claude.com/docs/en/build-with-claude/prompt-caching
- Anthropic, Compaction overview (두 가지 압축 방식 비교): https://platform.claude.com/docs/en/build-with-claude/compaction
- Anthropic, Compaction at a token threshold (`compact_20260112`, `compact-2026-01-12`, 기본 임계값, 응답 이어 붙이기): https://platform.claude.com/docs/en/build-with-claude/compaction-threshold
- Anthropic, Compaction on demand (`compact-2026-09-04`, `compaction` 파라미터): https://platform.claude.com/docs/en/build-with-claude/compaction-on-demand
- Anthropic, Context editing (도구 결과·thinking 블록 비우기, 베타 헤더, 기본값): https://platform.claude.com/docs/en/build-with-claude/context-editing
- Anthropic, Memory tool (클라이언트 도구, `/memories`, 세션을 넘는 저장): https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool
- Claude Code Docs, Overview (MCP를 개방형 표준으로 소개하는 문장): https://code.claude.com/docs/en/overview
- Claude Forward Deployed Engineer 학습 경로, 코스 5·코스 8 소개(`_official-outline-2026-11-27.txt`): https://anthropic-partners.skilljar.com/path/claude-fde
- 예시 코드는 공식 문서의 TypeScript 예시를 줄인 것이고, `@anthropic-ai/sdk` 1.14.0에서 타입 검사만 통과시켰어요. 실제 호출은 해 보지 않았어요. 예시의 MCP 서버 주소는 공식 문서에 나오는 예시 주소예요.
