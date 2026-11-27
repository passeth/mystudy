---
session: S11
course: "C5 Claude Platform 101"
official_sections: ["Teaching your Agent > The agent loop explained"]
title: "에이전트 루프"
minutes: 25
status: draft
---

# S11. 에이전트 루프

## 오늘의 목표
- 에이전트 루프의 한 바퀴(요청, 도구 요청, 실행, 결과 돌려주기)를 그림으로 그리고 설명할 수 있다.
- `stop_reason`을 보고 루프를 계속할지 멈출지 정하는 코드를 읽을 수 있다.
- 손으로 짠 루프와 SDK Tool Runner의 차이를 말하고, 각각 언제 쓸지 고를 수 있다.

## 핵심 정리

### 한 번 묻고 끝나는 호출, 끝날 때까지 도는 루프
Claude에게는 손이 없어요. 전화로 일을 부탁받은 사람처럼, "주문 시스템에서 이 번호 좀 조회해 주세요"라고 **요청**만 할 수 있어요. 내 코드가 대신 조회해서 결과를 알려 주면, Claude는 그걸 보고 다음에 무엇을 할지 정해요. 이 왕복을 Claude가 "다 됐어요"라고 할 때까지 되풀이하는 구조가 **에이전트 루프**(agent loop)예요. S10의 호출이 편지 한 통이었다면, 루프는 일이 끝날 때까지 오가는 편지예요. 중요한 건 다음에 무엇을 할지를 내 코드가 아니라 모델이 정한다는 점이에요.

### 루프의 모양
공식 문서는 이 루프를 `stop_reason`을 기준으로 도는 반복문이라고 설명해요.

1. 쓸 수 있는 도구 목록(`tools`)과 사용자 메시지를 담아 요청해요.
2. Claude가 도구를 쓰기로 하면 `stop_reason`이 `tool_use`인 응답이 오고, 그 안에 어떤 도구를 어떤 입력으로 부를지 적힌 `tool_use` 블록이 있어요.
3. 내 코드가 그 도구를 실행하고, 결과를 `tool_result` 블록으로 만들어요.
4. 지금까지의 메시지, Claude의 응답, 도구 결과를 모두 담아 다시 요청해요.
5. `stop_reason`이 `tool_use`인 동안 2~4를 되풀이해요. 다른 값이 오면 루프를 나와요. `end_turn`이면 최종 답이고, `max_tokens`나 `refusal`이면 따로 처리해야 해요.

### 손으로 짜 보기
S10의 프로젝트에 `loop.ts`를 만들어요. 주문 상태를 알려 주는 가짜 도구 하나를 붙인 루프예요.

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const tools: Anthropic.Tool[] = [
  {
    name: "get_order_status",
    description:
      "주문 번호로 현재 배송 상태를 조회한다. 사용자가 특정 주문의 배송이나 도착 여부를 물을 때 쓴다.",
    input_schema: {
      type: "object",
      properties: {
        order_id: { type: "string", description: "주문 번호. 예: A-1001" },
      },
      required: ["order_id"],
    },
  },
];

// 실제로는 사내 주문 시스템을 부르는 자리예요.
function getOrderStatus(orderId: string): string {
  return orderId === "A-1001" ? "배송 중, 내일 도착 예정" : "주문을 찾을 수 없음";
}

const messages: Anthropic.MessageParam[] = [
  { role: "user", content: "주문 A-1001 어디쯤 왔어?" },
];

while (true) {
  const response = await client.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 4096,
    tools,
    messages,
  });
  // 응답 content를 고치지 않고 그대로 기록에 붙여요.
  messages.push({ role: "assistant", content: response.content });

  if (response.stop_reason !== "tool_use") {
    for (const block of response.content) {
      if (block.type === "text") console.log(block.text);
    }
    break;
  }

  const results: Anthropic.ToolResultBlockParam[] = [];
  for (const block of response.content) {
    if (block.type === "tool_use") {
      const input = block.input as { order_id: string };
      results.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: getOrderStatus(input.order_id),
      });
    }
  }
  messages.push({ role: "user", content: results });
}
```

눈여겨볼 곳은 세 군데예요. 첫째, Claude의 응답 `content`를 **고치지 않고 그대로** 기록에 붙여요. API가 상태를 저장하지 않으니(S10) 이 기록이 Claude의 유일한 기억이에요. 둘째, 결과의 `tool_use_id`를 요청의 `id`와 맞춰요. 어느 요청에 대한 답인지 알려 주는 꼬리표예요. 셋째, 도구 요청마다 결과를 하나씩 꼭 돌려줘요. 실패했을 때도요(S12).

### SDK Tool Runner에게 맡기기
같은 일을 SDK의 **Tool Runner**로 하면 반복문이 사라져요. 도구를 설명, 입력 스키마, 실행 함수로 정의해 넘기면 SDK가 호출, 실행, 결과 전달, 반복을 대신 해요. 입력 스키마에 Zod를 쓰니 `npm install zod`를 먼저 해요.

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

const client = new Anthropic();

const getOrderStatus = betaZodTool({
  name: "get_order_status",
  description:
    "주문 번호로 현재 배송 상태를 조회한다. 사용자가 특정 주문의 배송이나 도착 여부를 물을 때 쓴다.",
  inputSchema: z.object({
    order_id: z.string().describe("주문 번호. 예: A-1001"),
  }),
  run: async (input) =>
    input.order_id === "A-1001" ? "배송 중, 내일 도착 예정" : "주문을 찾을 수 없음",
});

const finalMessage = await client.beta.messages.toolRunner({
  model: "claude-opus-5-5",
  max_tokens: 4096,
  tools: [getOrderStatus],
  messages: [{ role: "user", content: "주문 A-1001 어디쯤 왔어?" }],
});

for (const block of finalMessage.content) {
  if (block.type === "text") console.log(block.text);
}
```

Tool Runner는 아직 베타예요. Claude가 더는 도구를 부르지 않을 때까지 돌고, `max_iterations`를 정해 두면 그 횟수에서 멈춰요. 공식 문서는 사람의 승인, 별도 로깅, 조건부 실행처럼 세밀한 제어가 필요하면 손으로 짠 루프를 쓰라고 안내해요. 그래도 손으로 한 번 짜 보는 이유는, Tool Runner가 무엇을 대신해 주는지 알아야 문제가 생겼을 때 어디를 볼지 알기 때문이에요.

## 직접 해 보기 (5분)
1. `loop.ts`의 요청 바로 아래에 `console.log(response.stop_reason)`을 넣고 `npx tsx loop.ts`로 실행하세요. `tool_use` 다음에 `end_turn`이 찍히는지 보세요. 찍힌 줄 수가 곧 API 요청 횟수이고, 비용이에요.
2. 질문을 "안녕, 오늘 기분 어때?"로 바꿔 실행하세요. 도구를 부르지 않고 한 번에 끝나는지 보세요. 도구를 쓸지 말지를 모델이 정한다는 걸 확인하는 실습이에요.
3. 질문을 "주문 B-2002 어디쯤 왔어?"로 바꿔 보세요. "주문을 찾을 수 없음"이라는 결과를 받은 Claude가 사용자에게 어떻게 전하는지 읽어 보세요.

## 확인 문제
1. 에이전트 루프에서 `get_order_status` 같은 사용자 정의 도구를 실제로 실행하는 쪽은?
   - (a) Claude 모델
   - (b) 내 애플리케이션 코드
   - (c) Claude Console
2. 루프를 한 바퀴 더 돌려야 하는 `stop_reason`은?
   - (a) `end_turn`
   - (b) `tool_use`
   - (c) `max_tokens`
3. Tool Runner가 대신해 주지 않는 것은?
   - (a) Claude가 요청한 도구 함수를 실행하기
   - (b) 실행 결과를 Claude에게 돌려주고 다시 요청하기
   - (c) 도구가 실제로 하는 일(업무 로직)을 작성하기
4. (서술형) 다음 요청을 보낼 때 Claude의 응답 `content`를 고치지 않고 그대로 기록에 붙여야 하는 이유를 두세 문장으로 설명해 보세요.
5. (상황형) 고객사 재무 담당자가 걱정해요. "에이전트가 혼자 계속 돌다가 비용이 폭주하면 어떡하죠?" 어떻게 답하고, 어떤 안전장치를 제안할까요?

## FDE 관점
"에이전트"라는 말은 고객마다 다르게 들어요. 누군가는 마법을, 누군가는 통제 불능을 떠올려요. FDE는 오늘 배운 그림 한 장으로 둘 다 바로잡아요. 에이전트는 모델, 도구, 루프이고, 루프를 돌리는 건 우리 코드예요. 보안팀이 "Claude가 우리 시스템에 직접 들어오나요?"라고 물으면 "Claude는 요청만 하고, 실행은 우리가 만든 도구가 해요"라고 답할 수 있어요. 파일럿 범위도 이 그림으로 정해요. 첫 출시는 읽기 전용 도구 한두 개와 반복 상한으로 시작하고, 요청마다 왕복 횟수와 토큰을 기록해요. 그 기록이 "작업당 비용"과 "끝까지 해낸 비율" 같은 성공 지표가 돼요.

## 복습 카드
- Q: 에이전트 루프의 한 바퀴는? / A: 요청, Claude의 도구 요청, 내 코드의 실행, 결과를 담아 다시 요청.
- Q: 루프를 계속 돌리는 신호는? / A: `stop_reason`이 `tool_use`일 때. 다른 값이면 루프를 나온다.
- Q: 사용자 정의 도구는 누가 실행하나? / A: 내 코드. Claude는 어떤 도구를 어떤 입력으로 부를지 요청만 한다.
- Q: 도구 결과가 어느 요청에 대한 것인지 맞추는 값은? / A: `tool_use_id`. 요청 블록의 `id`와 같게 적는다.
- Q: Tool Runner가 해 주는 일은? / A: 호출, 도구 실행, 결과 전달, 반복. 도구가 하는 일 자체는 내가 쓴다.

## 영상 대본

### 장면 1 · 오늘의 질문 (약 25초)
**화면:** 말풍선 속 클로드 아이콘. 그 앞에 주문 시스템 컴퓨터가 놓여 있지만 아이콘에는 손이 없음. 제목 "손이 없는데 어떻게 일을 할까?"
**내레이션:** 클로드는 글을 쓰는 모델이에요. 손이 없어요. 그런데 어떻게 주문을 조회하고 일을 끝낼까요? 오늘은 그 비밀인 에이전트 루프를 볼게요.

### 장면 2 · 편지 한 통과 오가는 편지 (약 35초)
**화면:** 위쪽: 편지 한 통이 갔다가 답장 한 통이 돌아오고 끝. 아래쪽: 편지가 여러 번 오가다가 마지막에 "완료" 도장이 찍힘.
**내레이션:** 지난 시간의 호출은 편지 한 통이었어요. 묻고, 답을 받고, 끝이죠. 에이전트 루프는 달라요. 일이 끝날 때까지 편지가 오가요. 그리고 언제 끝낼지는 모델이 정해요.

### 장면 3 · 한 바퀴 (약 45초)
**화면:** 원형 화살표 위에 네 정거장: "1 요청", "2 도구 요청", "3 실행", "4 결과 돌려주기". 점 하나가 원을 따라 돎. 2번 정거장에는 클로드 아이콘, 3번 정거장에는 "내 코드" 아이콘.
**내레이션:** 한 바퀴는 네 걸음이에요. 내 코드가 요청을 보내요. 클로드가 이 도구를 써 달라고 요청해요. 내 코드가 그 도구를 실행해요. 결과를 담아 다시 보내요. 실행하는 쪽은 언제나 내 코드예요.

### 장면 4 · 신호등 (약 35초)
**화면:** 신호등 하나. 초록불 옆에 "도구를 써 주세요: 한 바퀴 더", 빨간불 옆에 "다 됐어요: 멈춤". 구석에 작은 노란불 "상한에 걸림, 거절: 따로 처리".
**내레이션:** 계속 돌지 멈출지는 신호 하나로 정해요. 응답에 멈춘 이유가 적혀 와요. 도구를 써 달라는 신호면 한 바퀴 더 돌아요. 다 됐다는 신호면 멈춰요. 그 밖의 신호는 따로 처리해요.

### 장면 5 · 주문 조회 한 바퀴 (약 45초)
**화면:** 사용자 말풍선 "주문 에이 천일 번 어디쯤 왔어?" → 클로드 쪽지 "주문 조회 도구, 번호 에이 천일" → 내 코드가 주문 시스템을 두드림 → 쪽지 "배송 중, 내일 도착" → 클로드 말풍선 "내일 도착할 예정이에요."
**내레이션:** 예를 볼게요. 사용자가 주문이 어디쯤 왔는지 물어요. 클로드는 주문 조회 도구를 이 번호로 불러 달라고 해요. 내 코드가 조회해서 결과를 돌려줘요. 클로드가 그걸 읽고 사용자에게 답해요.

### 장면 6 · 기록은 그대로 쌓는다 (약 40초)
**화면:** 세로로 쌓이는 블록 탑: "사용자 질문", "클로드의 도구 요청", "도구 결과", "클로드의 답". 도구 요청 블록과 도구 결과 블록에 같은 번호표가 붙어 선으로 이어짐. 가위가 블록을 자르려다 금지 표시.
**내레이션:** 이때 기록을 고치면 안 돼요. 클로드의 응답을 받은 그대로 쌓아요. 서버는 대화를 기억하지 않으니까요. 도구 결과에는 요청과 같은 번호표를 붙여요. 어느 요청의 답인지 알려 주는 표예요.

### 장면 7 · 손으로 짠 루프 (약 40초)
**화면:** 코드 편집기 그림. 줄글 대신 덩어리 네 개에 이름표: "도구 설명서", "계속 반복", "멈춘 이유 확인", "도구 실행 후 결과 추가". 덩어리 사이를 화살표가 순서대로 돎.
**내레이션:** 코드로는 네 덩어리예요. 도구 설명서를 적어요. 반복문을 열어요. 응답이 오면 멈춘 이유를 확인해요. 도구 요청이면 실행해서 결과를 기록에 붙이고 다시 돌아요. 반복문 자체는 서른 줄이 안 돼요.

### 장면 8 · 툴 러너 (약 40초)
**화면:** 앞 장면의 반복 화살표가 상자 하나 속으로 접혀 들어감. 상자 이름 "툴 러너". 상자 밖에는 "도구 함수"만 남음. 상자 옆에 "베타" 딱지와 "반복 상한" 다이얼.
**내레이션:** 에스디케이의 툴 러너는 이 반복을 대신 해 줘요. 나는 도구가 하는 일만 함수로 적으면 돼요. 아직 베타이고, 반복 횟수의 상한도 정할 수 있어요. 세밀하게 제어해야 할 때는 손으로 짠 루프를 써요.

### 장면 9 · 고객 앞에서 (약 35초)
**화면:** 회의실 그림. 고객 말풍선 "혼자 돌다가 비용이 폭주하면요?" 에프디이가 루프 그림을 가리킴. 루프 위에 자물쇠 세 개: "반복 상한", "지출 한도", "기록".
**내레이션:** 고객은 비용이 폭주할까 걱정해요. 이렇게 답하세요. 루프를 돌리는 건 우리 코드예요. 그래서 반복 상한을 두고, 지출 한도를 걸고, 매 바퀴를 기록할 수 있어요.

### 장면 10 · 요약과 예고 (약 25초)
**화면:** 세 줄 요약이 한 줄씩 나타남: "1. 요청, 도구 요청, 실행, 결과 2. 멈춘 이유가 신호등 3. 실행은 언제나 내 코드". 아래에 "다음: S12 도구 사용".
**내레이션:** 정리할게요. 루프는 요청, 도구 요청, 실행, 결과로 돌아요. 멈춘 이유가 신호등이에요. 실행은 언제나 내 코드가 해요. 다음 시간에는 루프 안의 주인공, 도구를 자세히 볼게요.

## 정답과 해설
1. (b). Claude는 `tool_use` 블록으로 요청만 하고, 실행은 내 코드가 해요.
2. (b). `tool_use`일 때만 도구를 실행하고 다시 요청해요. `end_turn`은 끝났다는 뜻이고, `max_tokens`는 잘렸다는 뜻이라 상한을 올리는 식으로 따로 처리해요.
3. (c). Tool Runner는 루프를 대신 돌릴 뿐, 주문을 어떻게 조회할지 같은 도구의 내용은 내가 써야 해요.
4. 예시 답: Messages API는 대화를 기억하지 않아서, 내가 보내는 기록이 Claude가 아는 전부다. 응답에는 글 말고도 `tool_use` 블록 같은 것이 들어 있고, 뒤따르는 `tool_result`는 그 블록의 `id`와 짝이 맞아야 한다. 응답을 고치거나 일부만 붙이면 짝이 깨져 오류가 나거나 Claude가 자기가 무엇을 요청했는지 모르게 된다.
5. 예시 답: "루프는 저절로 도는 게 아니라 우리 코드가 돌려요. 그래서 멈추는 조건도 우리가 정해요"라고 설명한다. 안전장치로는 (1) 반복 횟수 상한(Tool Runner의 `max_iterations` 또는 직접 세는 카운터), (2) 요청마다 `max_tokens`, (3) Console의 지출 한도, (4) 요청별 왕복 횟수와 토큰 사용량 기록과 알림, (5) 돈이나 데이터가 바뀌는 도구에는 사람의 승인 단계를 제안한다.

## 출처
- Claude 문서, How tool use works(에이전트 루프, 도구가 실행되는 곳): https://platform.claude.com/docs/en/agents-and-tools/tool-use/how-tool-use-works
- Claude 문서, Tool use with Claude(왕복 예제): https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview
- Claude 문서, Handle tool calls(`tool_use`와 `tool_result` 형식): https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls
- Claude 문서, Tool runner (SDK)(`betaZodTool`, `toolRunner`, `max_iterations`, 베타): https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-runner
- Claude 문서, Stop reasons and fallback: https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons
- Claude 문서, Using the Messages API(stateless): https://platform.claude.com/docs/en/build-with-claude/working-with-messages
- Claude 문서, Rate limits(지출 한도): https://platform.claude.com/docs/en/api/rate-limits
- Claude Forward Deployed Engineer 학습 경로, 코스 5 소개와 목차(개요 사본 `_official-outline-2026-11-27.txt`): https://anthropic-partners.skilljar.com/path/claude-fde
- 예제 코드는 공식 문서의 예를 주문 조회 상황으로 바꿔 쓴 것이에요. `@anthropic-ai/sdk` 1.14.0과 `zod` 4.6.7 기준으로 타입 검사는 통과했고, 실제 API 호출은 이 노트를 쓰면서 실행하지 않았어요. 주문 번호와 배송 상태는 지어낸 예시예요.
