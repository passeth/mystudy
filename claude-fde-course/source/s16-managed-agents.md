---
session: S16
course: "C5 Claude Platform 101"
official_sections: ["Managed Agents: What are managed agents?", "Managed Agents: Building your first managed agent"]
title: "Managed Agents"
minutes: 25
status: draft
---

# S16. Managed Agents

## 오늘의 목표
- Claude Managed Agents가 무엇이고 Messages API로 직접 만드는 에이전트와 무엇이 다른지 설명할 수 있다.
- 네 가지 개념(Agent, Environment, Session, Events)과 만드는 순서를 말할 수 있다.
- 첫 managed agent를 TypeScript로 만들고, 세션 상태와 과금 방식을 읽을 수 있다.

## 핵심 정리

### 직접 차린 주방과 맡긴 주방
S11~S15에서는 주방을 직접 차렸어요. 루프를 돌리고, 도구를 실행하고, 컨텍스트를 관리하는 코드가 전부 내 서버에 있었어요. **Claude Managed Agents**는 그 주방을 Anthropic이 운영해 주는 방식이에요. 공식 문서는 "관리형 인프라에서 돌아가는, 미리 만들어진 설정형 에이전트 하네스(harness)"라고 해요. 하네스는 에이전트 루프와 도구 실행을 맡는 틀이에요.

| | Messages API | Claude Managed Agents |
|---|---|---|
| 무엇인가 | 모델에 직접 요청 | Anthropic이 운영하는 에이전트 하네스와 실행 환경 |
| 루프와 도구 실행 | 내 코드, 내 서버 | Anthropic 쪽 (세션마다 샌드박스) |
| 대화 기록 | 내가 보관하고 매번 다시 보냄 | 세션이 서버에 보관 |
| 맞는 일 | 세밀하게 통제하는 맞춤 루프 | 몇 분~몇 시간 걸리는 작업, 비동기 작업 |

S13의 사고, S15의 프롬프트 캐싱과 압축은 Managed Agents에서 항상 켜져 있어요. 직접 설정하지 않아요.

### 네 가지 개념
- **Agent**: 모델, 시스템 프롬프트, 도구, MCP 서버, skill을 묶은 설정이에요. 한 번 만들고 ID로 재사용해요. 고칠 때마다 버전이 올라가요.
- **Environment**: 세션이 돌아갈 곳의 설정이에요. Anthropic이 관리하는 클라우드 샌드박스이거나, 내 인프라의 셀프호스팅 샌드박스예요. 네트워크 접근 범위도 여기서 정해요.
- **Session**: 한 환경 안에서 실제로 일하는 에이전트 인스턴스예요. 세션마다 자기 샌드박스를 받아요.
- **Events**: 내 앱과 에이전트가 주고받는 메시지예요. 사용자 메시지, 도구 결과, 상태 변화가 모두 이벤트예요.

순서는 Agent 만들기(한 번) → Environment 만들기 → Session 시작 → 이벤트 보내고 스트림으로 받기 → 필요하면 방향을 바꾸거나 중단하기예요.

내장 도구는 `agent_toolset_20260401` 한 줄로 켜요. bash, 파일 읽기·쓰기·편집, glob, grep, 웹 검색, 웹 페치가 들어 있고 필요 없는 건 꺼요. 내 시스템에서 실행할 일은 커스텀 도구로 정의하고, 호출이 오면 결과를 이벤트로 돌려줘요.

### 세션 상태와 과금
세션 상태는 네 가지예요. `running`(일하는 중), `idle`(멈춰서 입력을 기다림), `rescheduling`(오류 뒤 재시도 대기), `terminated`(끝남). 에이전트가 멈추면 `session.status_idle` 이벤트가 오고 `stop_reason`이 이유를 알려 줘요. `end_turn`은 차례가 끝난 것, `requires_action`은 내 답(커스텀 도구 결과나 도구 승인)을 기다리는 거예요.

과금은 두 갈래예요. 토큰은 모델 요금 그대로이고, 세션 실행 시간이 세션-시간당 0.08달러로 더해져요. 실행 시간은 `running` 상태일 때만 쌓여요.

아직 베타예요. 모든 요청에 `managed-agents-2026-04-01` 베타 헤더가 필요한데 SDK가 자동으로 붙여요. 세션이 기록을 서버에 보관하는 구조라서 Zero Data Retention과 HIPAA BAA 대상이 아니에요(셀프호스팅 Managed Agents의 Zero Data Retention은 예외).

### 첫 managed agent
```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// 1) 에이전트: 한 번 만들고 ID를 저장해 두고 재사용해요
const agent = await client.beta.agents.create({
  name: "Coding Assistant",
  model: "claude-opus-5-5",
  system: "You are a helpful coding assistant. Write clean, well-documented code.",
  tools: [
    {
      type: "agent_toolset_20260401",
      configs: [
        { name: "web_search", enabled: false },
        { name: "web_fetch", enabled: false },
      ],
    },
  ],
});

// 2) 환경: 세션이 돌아갈 샌드박스 설정
const environment = await client.beta.environments.create({
  name: "quickstart-env",
  config: { type: "cloud", networking: { type: "limited", allow_package_managers: true } },
});

// 3) 세션: 에이전트 + 환경으로 실행 한 번
const session = await client.beta.sessions.create({
  agent: agent.id,
  environment_id: environment.id,
  title: "Quickstart session",
});

// 4) 스트림을 먼저 열고, 사용자 메시지를 이벤트로 보내요
const stream = await client.beta.sessions.events.stream(session.id);
await client.beta.sessions.events.send(session.id, {
  events: [
    {
      type: "user.message",
      content: [{ type: "text", text: "피보나치 수 20개를 만드는 파이썬 스크립트를 쓰고 fibonacci.txt로 저장해 줘." }],
    },
  ],
});

loop: for await (const event of stream) {
  switch (event.type) {
    case "agent.message":
      for (const block of event.content) {
        if (block.type === "text") process.stdout.write(block.text);
      }
      break;
    case "agent.tool_use":
      console.log(`\n[도구 사용: ${event.name}]`);
      break;
    case "session.status_idle":
      console.log("\n\n에이전트가 일을 마쳤어요.");
      break loop;
  }
}
```

S11과 비교해 보세요. `while` 루프도, 도구 실행 코드도, 대화 기록 배열도 없어요. 이 스크립트는 연습용이라 실행할 때마다 에이전트와 환경을 새로 만들어요. 실제 서비스에서는 둘을 한 번만 만들어 ID를 저장하고, 요청이 올 때는 세션만 만들어요.

## 직접 해 보기 (5분)
1. 위 코드를 S10의 프로젝트에 `managed.ts`로 저장하고 `npx tsx managed.ts`로 실행하세요. `[도구 사용: ...]` 줄에 어떤 도구가 어떤 순서로 찍히나요? 내 컴퓨터에는 `fibonacci.txt`가 생기지 않아요. 파일은 어디에 있을까요?
2. Claude Console에서 방금 만든 세션을 열어 기록을 살펴보세요. 그리고 `networking`을 지우면 어떤 값이 되는지 Environments 문서에서 찾아보세요. (힌트: API 요청에서 생략하면 `unrestricted`가 돼요. 왜 명시하라고 할까요?)

## 확인 문제
1. Claude Managed Agents에서 에이전트 루프와 도구 실행은 어디서 돌아가나요?
   - (a) 내 서버의 `while` 루프
   - (b) Anthropic이 운영하는 하네스와 세션별 샌드박스
   - (c) 사용자의 브라우저
2. 네 가지 개념 중 "모델, 시스템 프롬프트, 도구를 묶어 한 번 만들고 ID로 재사용하는 것"은?
   - (a) Session
   - (b) Environment
   - (c) Agent
3. 세션 실행 시간 요금이 쌓이는 때는?
   - (a) 세션이 존재하는 모든 시간
   - (b) 세션 상태가 `running`일 때만
   - (c) `idle` 상태로 기다릴 때만
4. (서술형) 에이전트(Agent)와 세션(Session)을 왜 따로 만들게 되어 있을까요? 버전과 재사용 관점에서 두세 문장으로 설명해 보세요.
5. (상황형) 고객사 CTO가 물어요. "우리 팀은 에이전트 인프라를 운영할 사람이 없어요. Managed Agents로 가면 되나요? 그런데 우리는 환자 정보를 다루고, 사내망 시스템에도 붙어야 해요." 무엇을 확인하고 어떻게 답할까요?

## FDE 관점
FDE에게 Managed Agents는 "첫 파일럿을 인프라 없이 띄우는 길"이에요. 고객 팀에 에이전트 루프와 샌드박스를 운영할 사람이 없을 때, 설정 몇 개로 오래 도는 작업을 시연할 수 있어요. 대신 첫 미팅에서 세 가지를 확인해요. 데이터가 Anthropic 쪽 세션에 보관되어도 되는지(Zero Data Retention이나 HIPAA BAA가 필요한 고객이면 대상이 아니에요), 고객이 쓰는 클라우드에서 제공되는지, 에이전트가 닿아야 하는 시스템이 공개 주소인지 사내망인지예요. 사내망이라면 커스텀 도구나 셀프호스팅 샌드박스처럼 고객 인프라에서 실행하는 구성을 따로 검토해요. 네트워크는 `limited`로 시작해 필요한 호스트만 열고, 되돌리기 어려운 행동은 커스텀 도구나 승인 정책으로 사람 확인을 거치게 해요. 비용 기준선은 토큰과 실행 시간 두 줄로 잡아 두세요.

## 복습 카드
- Q: Claude Managed Agents란? / A: Anthropic이 에이전트 루프(하네스)와 세션별 샌드박스를 운영해 주는 방식. 내 코드는 이벤트를 보내고 받는다.
- Q: 네 가지 개념은? / A: Agent(설정), Environment(실행 환경 설정), Session(실행 중인 인스턴스), Events(주고받는 메시지).
- Q: 만드는 순서는? / A: Agent 만들기(한 번) → Environment → Session → 이벤트 보내고 스트림 받기.
- Q: 세션 상태 네 가지는? / A: `running`, `idle`, `rescheduling`, `terminated`.
- Q: 과금은? / A: 토큰 요금 + `running` 상태 동안의 세션 실행 시간(세션-시간당 0.08달러).

## 영상 대본

### 장면 1 · 오늘의 질문 (약 25초)
**화면:** 왼쪽에 혼자 요리하고 설거지하고 재료까지 나르는 사람. 오른쪽에 주문서만 건네면 요리가 나오는 창구. 제목 "에이전트를 직접 운영하지 않아도 될까?"
**내레이션:** 지금까지는 에이전트를 직접 운영했어요. 루프도 돌리고 도구도 실행했죠. 이 일을 통째로 맡길 수는 없을까요? 오늘은 매니지드 에이전트를 볼게요.

### 장면 2 · 무엇을 맡기나 (약 40초)
**화면:** S11의 루프 그림이 내 노트북 위에 있다가 통째로 구름 쪽으로 옮겨감. 구름 안에 "루프", "도구 실행", "대화 기록" 상자가 자리 잡음. 내 노트북에는 "이벤트 보내기, 받기"만 남음.
**내레이션:** 매니지드 에이전트는 앤트로픽이 운영해 주는 에이전트예요. 루프와 도구 실행, 대화 기록 보관을 서버가 맡아요. 내 프로그램은 이벤트를 보내고 받기만 해요.

### 장면 3 · 언제 쓰나 (약 35초)
**화면:** 두 갈래 길 표지판. 왼쪽 "직접 만든 루프: 세밀한 통제". 오른쪽 "매니지드 에이전트: 오래 걸리는 일, 비동기 작업, 인프라 최소". 오른쪽 길에 시계와 달 아이콘.
**내레이션:** 세밀하게 통제하려면 직접 만든 루프가 맞아요. 몇 분에서 몇 시간씩 걸리는 일이 있죠. 맡겨 두고 나중에 확인하는 일도 있고요. 그럴 땐 매니지드 에이전트가 잘 맞아요.

### 장면 4 · 네 가지 개념 (약 45초)
**화면:** 카드 네 장이 차례로 놓임: "에이전트: 설정 묶음", "환경: 일할 장소", "세션: 실제로 일하는 한 번", "이벤트: 주고받는 메시지". 카드 사이에 순서 화살표.
**내레이션:** 개념은 네 가지예요. 에이전트는 모델과 지시, 도구를 묶은 설정이에요. 환경은 일할 장소예요. 세션은 실제로 일하는 한 번이고, 이벤트는 주고받는 메시지예요.

### 장면 5 · 한 번 만들고 여러 번 쓴다 (약 35초)
**화면:** "에이전트" 도장 하나가 찍히고 그 아래 버전 숫자 1이 2로 바뀜. 도장 하나에서 세션 상자 여러 개가 가지처럼 뻗어 나감. 각 세션에는 자기만의 작은 유리 상자.
**내레이션:** 에이전트는 한 번 만들고 아이디로 다시 써요. 고치면 버전이 올라가요. 세션은 일이 생길 때마다 새로 만들어요. 세션마다 격리된 작업 공간을 따로 받아요.

### 장면 6 · 코드의 흐름 (약 45초)
**화면:** 네 단계가 세로로 나타남: "1 에이전트 만들기", "2 환경 만들기", "3 세션 시작", "4 스트림 열고 메시지 보내기". 4단계에서 오른쪽으로 이벤트가 흘러나옴: "글", "도구 사용", "도구 사용", "대기 상태".
**내레이션:** 코드는 네 단계예요. 에이전트를 만들고, 환경을 만들고, 세션을 시작해요. 그다음 스트림을 열고 메시지를 보내요. 에이전트가 일하는 과정이 이벤트로 흘러와요.

### 장면 7 · 상태와 과금 (약 40초)
**화면:** 상태 표시등 네 개: "실행 중", "대기", "재시도 대기", "종료". "실행 중"에만 불이 들어오고 그 옆 요금 미터가 돌아감. "대기"로 바뀌면 미터가 멈춤. 아래에 "요금 = 토큰 + 실행 시간".
**내레이션:** 세션에는 상태가 있어요. 실행 중, 대기, 재시도 대기, 종료예요. 요금은 토큰에 실행 시간이 더해져요. 실행 시간은 실행 중일 때만 쌓이고, 기다리는 동안은 멈춰요.

### 장면 8 · 안전 장치 (약 35초)
**화면:** 유리 상자 둘레에 울타리가 쳐지고 문 몇 개만 열림, 라벨 "네트워크: 필요한 곳만". 상자 앞에 손바닥 아이콘과 "되돌리기 어려운 일은 사람 확인".
**내레이션:** 맡긴다고 통제를 놓는 건 아니에요. 네트워크는 필요한 곳만 열어 두세요. 되돌리기 어려운 행동은 사람의 확인을 거치게 설정할 수 있어요.

### 장면 9 · 고객 앞에서 (약 40초)
**화면:** 회의실 그림. 고객 말풍선 "운영할 사람이 없어요." FDE의 체크리스트 세 줄: "데이터가 세션에 보관돼도 되는가", "우리 클라우드에서 되는가", "닿아야 할 시스템이 사내망인가".
**내레이션:** 운영할 사람이 없는 고객에게 좋은 출발점이에요. 다만 세 가지를 먼저 확인해요. 데이터가 서버에 보관돼도 되는지 봐요. 고객의 클라우드에서 쓸 수 있는지도요. 사내망 시스템에 닿아야 하는지도 물어봐요.

### 장면 10 · 요약과 예고 (약 25초)
**화면:** 세 줄 요약이 한 줄씩 나타남: "1. 루프와 실행 환경을 맡긴다 2. 에이전트, 환경, 세션, 이벤트 3. 요금은 토큰과 실행 시간". 아래에 "다음: S17 Claude Code로 만들기 + 코스 5 총정리".
**내레이션:** 정리할게요. 매니지드 에이전트는 루프와 실행 환경을 맡기는 방식이에요. 개념은 에이전트, 환경, 세션, 이벤트예요. 요금은 토큰과 실행 시간이에요. 다음 시간에는 클로드 코드로 만드는 법과 코스 전체를 정리할게요.

## 정답과 해설
1. (b). 루프는 Anthropic의 하네스가 돌리고, 도구는 세션마다 주어지는 샌드박스에서 실행돼요.
2. (c). Agent는 재사용하는 버전 있는 설정이에요. Session은 그 설정으로 실제 일하는 인스턴스예요.
3. (b). 실행 시간은 `running` 상태일 때만 쌓여요. `idle`, `rescheduling`, `terminated`는 세지 않아요.
4. 예시 답: 에이전트는 "어떻게 일할지"의 설정이라 한 번 만들어 여러 세션이 함께 쓴다. 고칠 때마다 버전이 올라가서, 무엇이 언제 바뀌었는지 추적하고 세션이 어떤 버전으로 돌았는지 알 수 있다. 세션은 "이번 일"이라서 일마다 새로 만들고 각자 샌드박스와 기록을 가진다.
5. 예시 답: 인프라 운영 부담을 줄이는 데는 맞는 선택이라고 답하되, 두 가지를 확인한다. (1) 환자 정보: Managed Agents는 세션 기록을 서버에 보관하는 구조라 Zero Data Retention과 HIPAA BAA 대상이 아니다. 규제 요건이 있으면 그 데이터를 다루는 부분은 Messages API로 직접 만든 루프 등 다른 구성을 검토하고, 고객의 법무·보안 담당과 Anthropic 계정 팀에 확인한다. (2) 사내망: Anthropic 쪽 클라우드 샌드박스에서 고객 사내망에 바로 닿을 수 있는지는 이 노트에서 확인하지 못했다(확인 필요). 공식 문서가 안내하는, 내 인프라에서 실행하는 방법은 커스텀 도구(실행은 고객 쪽 코드)와 셀프호스팅 샌드박스이니 이 둘을 먼저 검토한다. 파일럿은 민감 정보가 없는 업무부터 시작하자고 제안한다.

## 출처
- Anthropic, Claude Managed Agents overview (Messages API와의 비교, 네 가지 개념, 동작 순서, 내장 도구, 베타 헤더, 제공 플랫폼, 데이터 보관): https://platform.claude.com/docs/en/managed-agents/overview
- Anthropic, Managed Agents quickstart (TypeScript 예시, 실행 흐름): https://platform.claude.com/docs/en/managed-agents/quickstart
- Anthropic, Managed Agents sessions (세션 만들기와 시작): https://platform.claude.com/docs/en/managed-agents/sessions
- Anthropic, Managed Agents environments (네트워크 `limited`·`unrestricted`, 생략 시 기본값, 세션별 샌드박스): https://platform.claude.com/docs/en/managed-agents/environments
- Anthropic, Managed Agents tools (`agent_toolset_20260401`의 도구 목록, 커스텀 도구): https://platform.claude.com/docs/en/managed-agents/tools
- Anthropic, Managed Agents events and streaming (이벤트 종류, `session.status_idle`의 `stop_reason`, 중단): https://platform.claude.com/docs/en/managed-agents/events-and-streaming
- Anthropic, Managed Agents agent setup (에이전트 버전): https://platform.claude.com/docs/en/managed-agents/agent-setup
- Anthropic, Pricing (Managed Agents 과금: 토큰 + 세션 실행 시간, 상태별 계산): https://platform.claude.com/docs/en/about-claude/pricing
- Anthropic, Thinking / Prompt caching / Compaction at a token threshold (Managed Agents에서 항상 켜져 있다는 안내): https://platform.claude.com/docs/en/build-with-claude/thinking , https://platform.claude.com/docs/en/build-with-claude/prompt-caching , https://platform.claude.com/docs/en/build-with-claude/compaction-threshold
- Claude Code에 포함된 `claude-api` skill의 Managed Agents 참고 자료 (세션 상태 네 가지의 뜻)
- Claude Forward Deployed Engineer 학습 경로, 코스 5 목차(`_official-outline-2026-11-27.txt`): https://anthropic-partners.skilljar.com/path/claude-fde
- 예시 코드는 공식 quickstart의 TypeScript 예시를 이어 붙인 것이고, `@anthropic-ai/sdk` 1.14.0에서 타입 검사만 통과시켰어요. 실제 호출은 해 보지 않았어요.
