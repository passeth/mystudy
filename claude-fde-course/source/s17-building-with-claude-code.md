---
session: S17
course: "C5 Claude Platform 101"
official_sections: ["Building with Claude Code: Building with Claude Code"]
title: "Claude Code로 만들기 + 코스 5 총정리"
minutes: 25
status: draft
---

# S17. Claude Code로 만들기 + 코스 5 총정리

## 오늘의 목표
- Claude Code가 S11~S15에서 배운 부품들로 만들어진 에이전트라는 것을 설명할 수 있다.
- Claude Code로 플랫폼 앱을 만들 때 쓰는 방법(`/claude-api` skill, `claude -p`, Agent SDK)을 고를 수 있다.
- 코스 5의 일곱 세션(S10~S16)을 한 장 지도로 정리하고, 유스케이스에 맞는 조합을 말할 수 있다.

## 핵심 정리

### 같은 부품으로 만든 에이전트
코스 5 내내 부품을 하나씩 조립했어요. 루프(S11), 도구(S12), 사고(S13), 내장 도구와 skill(S14), MCP와 컨텍스트 관리(S15)예요. **Claude Code**는 이 부품들이 이미 조립된 완성품이에요. 공식 문서는 "코드베이스를 읽고, 파일을 고치고, 명령을 실행하고, 개발 도구와 연결되는 에이전트형 코딩 도구"라고 소개해요. 터미널, IDE, 데스크톱 앱, 브라우저에서 써요. 그래서 코스 5의 개념이 그대로 통해요. Claude Code가 파일을 읽는 것은 도구 호출이고, 긴 작업에서 대화를 압축하는 것은 컨텍스트 관리예요.

### Claude Code로 플랫폼 앱 만들기
Claude Code는 플랫폼 코드를 짜는 사람의 도구이기도 해요. 프로젝트 폴더에서 `claude`를 실행하고 만들고 싶은 것을 말로 설명하면, 계획을 세우고 여러 파일에 코드를 쓰고 실행해서 확인해요.

여기서 쓸모 있는 것이 기본으로 들어 있는 `/claude-api` skill이에요. 프로젝트 언어에 맞는 Claude API와 Managed Agents 참고 자료를 불러와요. 코드가 `anthropic`이나 `@anthropic-ai/sdk`를 import하면 Claude가 알아서 켜기도 해요. 모델 이름과 파라미터는 자주 바뀌는데 모델의 지식에는 컷오프(S02)가 있어서, 최신 자료를 읽고 쓰게 하는 게 중요해요. `/claude-api managed-agents-onboard`는 S16의 managed agent 만들기를 단계별로 안내해 줘요.

### 내 프로그램 안에서 Claude Code 돌리기
대화형으로만 쓰는 게 아니에요.
- `claude -p "질문"`: 대화 창 없이 한 번 실행하고 결과를 출력해요. 스크립트나 CI에 넣을 때 써요. `--allowedTools`로 허용할 도구를, `--output-format json`으로 출력 형식을 정해요.
- **Agent SDK**: Claude Code를 라이브러리로 쓰는 방법이에요. Claude Code와 같은 도구, 에이전트 루프, 컨텍스트 관리를 Python과 TypeScript 코드에서 불러 써요.

이제 에이전트를 만드는 길이 네 가지가 됐어요.

| 하고 싶은 일 | 쓰는 것 | 누가 돌리나 |
|---|---|---|
| 터미널에서 대화하며 개발하기 | Claude Code CLI | 내 컴퓨터 |
| Claude Code의 에이전트를 내 앱에 넣기 | Agent SDK | 내가 운영하는 프로세스 |
| 내 코드에서 Claude API를 직접 부르기 (루프는 직접 짜거나 Tool Runner) | Client SDK (S10~S15) | 내 서버 |
| Anthropic이 에이전트를 운영하게 하기 | Managed Agents (S16) | Anthropic |

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

// Claude Code의 에이전트 루프를 내 프로그램 안에서 돌려요
for await (const message of query({
  prompt: "이 폴더의 코드가 무슨 일을 하는지 다섯 줄로 요약해 줘.",
  options: { allowedTools: ["Read", "Glob", "Grep"] }, // 읽기 도구만 미리 허용
})) {
  if (message.type === "assistant" && message.message?.content) {
    for (const block of message.message.content) {
      if ("text" in block) console.log(block.text);
      else if ("name" in block) console.log(`[도구: ${block.name}]`);
    }
  } else if (message.type === "result") {
    console.log(`끝: ${message.subtype}`);
  }
}
```

실행하려면 `npm install @anthropic-ai/claude-agent-sdk`로 패키지를 먼저 설치해요. S11에서 손으로 짠 루프와 비교해 보세요. 도구 정의도 실행 코드도 없어요. 파일을 읽는 도구가 이미 들어 있기 때문이에요.

### 코스 5 한 장 지도

| 세션 | 주제 | 한 줄 | 기억할 이름 |
|---|---|---|---|
| S10 | 플랫폼과 첫 API 호출 | 요청 하나에 응답 하나. API는 상태가 없어서 대화 기록을 매번 다시 보내요 | `client.messages.create` |
| S11 | 에이전트 루프 | `stop_reason`이 `tool_use`인 동안 실행하고 결과를 돌려주며 반복해요 | `while` 루프, Tool Runner |
| S12 | 도구 사용 | 도구는 이름·설명·입력 스키마예요. Claude는 요청하고 실행은 내 코드가 해요 | `tool_use`, `tool_result` |
| S13 | 사고 | 답하기 전의 연습장이에요. 깊이는 effort로, 비용은 출력 토큰으로 | `thinking`, `output_config.effort` |
| S14 | 내장 도구와 Skills | 서버 도구는 한 줄 선언, skill은 필요할 때만 펼치는 매뉴얼이에요 | `web_search`, `code_execution`, `container.skills` |
| S15 | MCP와 컨텍스트 관리 | 표준 콘센트로 연결해요. 캐싱은 값과 속도, 압축과 편집은 자리, 메모리는 세션 너머 | `mcp_servers`, `cache_control`, compaction |
| S16 | Managed Agents | 루프와 실행 환경을 맡겨요. Agent → Environment → Session → Events | `client.beta.agents`, `client.beta.sessions` |

고를 때는 가장 단순한 단계에서 시작해요. 호출 한 번으로 되는 일인지 먼저 보고, 안 되면 도구와 루프를 붙이고, 오래 도는 작업이면 누가 운영할지를 정해요.

## 직접 해 보기 (5분)
1. S10~S16에서 만든 프로젝트 폴더에서 `claude`를 실행하고 이렇게 요청해 보세요. "S13에서 만든 thinking.ts에 웹 검색 도구를 추가해 줘. 고치기 전에 계획부터 보여 줘." Claude Code가 `/claude-api` skill을 불러오는지, 어떤 파일을 읽고 무엇을 바꾸려 하는지 관찰하세요.
2. 같은 폴더에서 `claude -p "이 프로젝트의 파일들이 각각 무슨 일을 하는지 표로 정리해 줘"`를 실행해 보세요. 대화형 실행과 무엇이 다른가요?

## 확인 문제
1. Messages API로 여러 턴의 대화를 이어 가는 방법은?
   - (a) 서버가 대화를 기억하므로 새 메시지만 보낸다
   - (b) API는 상태가 없으므로 대화 기록 전체를 매번 다시 보낸다
   - (c) 세션 ID를 헤더에 넣는다
2. 직접 짠 에이전트 루프가 한 바퀴 더 돌아야 하는 신호는?
   - (a) 응답의 `stop_reason`이 `tool_use`일 때
   - (b) 응답의 `stop_reason`이 `end_turn`일 때
   - (c) 응답에 `text` 블록이 있을 때
3. 내가 정의한 커스텀 도구를 실제로 실행하는 것은?
   - (a) Claude가 Anthropic 서버에서 직접 실행한다
   - (b) Claude는 `tool_use` 블록으로 요청만 하고, 내 코드가 실행해서 `tool_result`로 돌려준다
   - (c) SDK가 인터넷에서 구현을 찾아 실행한다
4. 사고(thinking)에 대한 설명으로 맞는 것은?
   - (a) 사고 토큰은 무료다
   - (b) `display`를 `"omitted"`로 두면 사고 비용이 청구되지 않는다
   - (c) 사고 토큰은 출력 토큰으로 청구되고, 깊이는 effort로 조절한다
5. "한 시간짜리 에이전트 작업이 뒤로 갈수록 앞의 내용을 놓친다"에 가장 직접 맞는 수단은?
   - (a) 프롬프트 캐싱만 켠다
   - (b) 압축(compaction)으로 오래된 대화를 요약하고, 남겨야 할 것은 메모리 도구에 적는다
   - (c) `max_tokens`를 올린다
6. "에이전트 루프와 샌드박스를 Anthropic이 운영하고, 세션 기록도 서버에 보관되는" 방식은?
   - (a) Client SDK로 직접 짠 루프
   - (b) Agent SDK
   - (c) Claude Managed Agents
7. (서술형) S11에서 직접 짠 루프와 S16의 Managed Agents를 비교해, 각각을 고를 이유를 한 가지씩 적어 보세요.
8. (서술형) Claude Code로 Claude API 코드를 짤 때 `/claude-api` skill이 왜 도움이 될까요? S02에서 배운 내용과 연결해 설명해 보세요.
9. (상황형) 고객사 팀장이 말해요. "매일 아침 경쟁사 가격을 찾아서 엑셀 보고서로 만들고, 우리 사내 재고 시스템 숫자랑 비교해 주면 좋겠어요." 코스 5에서 배운 것 가운데 무엇을 어떻게 조합할지, 그리고 파일럿에서 먼저 출시할 부분을 제안해 보세요.
10. (상황형) 고객사 개발자가 말해요. "Claude Code가 써 준 API 코드에서 모델 이름이 틀려서 에러가 났어요. 이거 믿고 써도 되나요?" 어떻게 설명하고, 팀의 작업 방식으로 무엇을 제안할까요?

## FDE 관점
공식 경로는 다음 코스의 Claude Code를 "고객의 저장소에서 프로토타입을 만드는 도구"라고 소개해요. FDE의 하루로 보면 이래요. 코스 5의 지식으로 "이 유스케이스는 호출 한 번이면 되는지, 도구와 루프가 필요한지, 누가 운영할지"를 정하고, Claude Code로 고객 저장소에서 그 설계를 빠르게 작동하는 코드로 만들어요. 고객 개발자 앞에서 중요한 건 두 가지예요. Claude Code가 쓴 코드도 사람이 실행해서 확인한다는 것, 그리고 `/claude-api` skill처럼 최신 참고 자료를 읽게 해서 오래된 기억으로 쓰는 일을 줄인다는 것이에요. 파일럿 계획서의 "먼저 출시할 부분"은 한 장 지도에서 가장 단순한 단계로 풀리는 조각부터 고르면 돼요.

## 복습 카드
- Q: Claude Code란? / A: 코드베이스를 읽고, 파일을 고치고, 명령을 실행하는 에이전트형 코딩 도구. 코스 5의 부품(루프, 도구, 컨텍스트 관리, skill, MCP)이 조립된 완성품.
- Q: `/claude-api` skill은 무엇을 하나? / A: 프로젝트 언어에 맞는 Claude API와 Managed Agents 참고 자료를 불러온다.
- Q: `claude -p`는? / A: 대화 창 없이 한 번 실행하고 결과를 출력하는 방식. 스크립트와 CI에 쓴다.
- Q: Agent SDK란? / A: Claude Code를 라이브러리로 써서, 같은 도구와 에이전트 루프를 내 Python·TypeScript 프로그램 안에서 돌리는 방법.
- Q: 에이전트를 만드는 네 가지 길은? / A: Claude Code CLI, Agent SDK, Client SDK(직접 짠 루프나 Tool Runner), Managed Agents.

## 영상 대본

### 장면 1 · 오늘의 질문 (약 25초)
**화면:** 작업대 위에 부품 다섯 개가 흩어져 있음: "루프", "도구", "사고", "스킬", "컨텍스트 관리". 옆에 물음표와 제목 "이 부품을 다 조립하면 무엇이 될까?"
**내레이션:** 코스 다섯에서 부품을 하나씩 만들었어요. 루프, 도구, 사고, 스킬, 컨텍스트 관리예요. 이걸 다 조립하면 무엇이 될까요? 오늘은 그 답과 코스 전체를 정리해요.

### 장면 2 · 클로드 코드란 (약 35초)
**화면:** 흩어진 부품들이 가운데로 모여 하나의 상자로 조립됨. 상자에 "Claude Code" 이름표. 상자에서 네 방향으로 선이 뻗음: 터미널, 편집기, 데스크톱 앱, 브라우저.
**내레이션:** 답은 클로드 코드예요. 코드를 읽고, 파일을 고치고, 명령을 실행하는 코딩 에이전트예요. 우리가 배운 부품이 이미 조립돼 있어요. 터미널에서도, 편집기에서도 쓸 수 있어요.

### 장면 3 · 플랫폼 앱을 만드는 도구 (약 40초)
**화면:** 사람이 말풍선으로 "웹 검색을 추가해 줘"라고 말함. 상자 안에서 "계획", "코드 쓰기", "실행해서 확인" 세 단계가 차례로 켜짐. 폴더 속 파일 두 개에 수정 표시가 붙음.
**내레이션:** 클로드 코드는 플랫폼 앱을 만드는 도구이기도 해요. 만들고 싶은 걸 말로 설명하면 계획을 세워요. 여러 파일에 코드를 쓰고, 직접 실행해서 확인까지 해요.

### 장면 4 · 최신 설명서를 읽게 하기 (약 40초)
**화면:** 달력에 "지식 컷오프" 선. 선 오른쪽에 "새 모델 이름", "새 파라미터" 메모지가 붙어 있음. 상자가 책장에서 "Claude API 참고 자료" 책을 꺼내 펼치자 메모지 내용이 책으로 연결됨.
**내레이션:** 모델 이름이나 파라미터는 자주 바뀌어요. 그런데 모델의 지식에는 컷오프가 있죠. 그래서 클로드 코드에는 스킬이 하나 들어 있어요. 최신 에이피아이 참고 자료를 불러오는 스킬이에요. 기억이 아니라 설명서를 보고 쓰게 하는 거예요.

### 장면 5 · 프로그램 안에서 돌리기 (약 40초)
**화면:** 왼쪽에 대화 창 없는 터미널 한 줄이 실행되고 결과 문서가 나옴, 라벨 "한 번 실행". 오른쪽에 내 프로그램 상자 안에 작은 클로드 코드 상자가 들어감, 라벨 "라이브러리로 쓰기".
**내레이션:** 대화형으로만 쓰는 건 아니에요. 대화 창 없이 한 번 실행해서 스크립트에 넣을 수 있어요. 에이전트 에스디케이도 있어요. 같은 에이전트를 내 프로그램 안에서 돌려요.

### 장면 6 · 네 가지 길 (약 40초)
**화면:** 네 칸짜리 표가 한 줄씩 채워짐: "대화하며 개발: Claude Code", "내 앱에 넣기: Agent SDK", "API 직접 호출: Client SDK", "운영을 맡기기: Managed Agents". 오른쪽 열에 "누가 돌리나" 아이콘(노트북, 내 서버, 구름).
**내레이션:** 이제 길이 네 가지예요. 대화하며 개발하는 클로드 코드가 있어요. 내 앱에 넣는 에이전트 에스디케이도 있죠. 에이피아이를 직접 부르거나, 매니지드 에이전트에 운영을 맡길 수도 있어요. 누가 돌리느냐가 달라요.

### 장면 7 · 지도 앞부분 (약 40초)
**화면:** 가로로 긴 길 위에 표지판 세 개가 차례로 섬: "S10 첫 호출: 요청 하나, 응답 하나", "S11 루프: 도구를 부르는 동안 반복", "S12 도구: 요청은 클로드, 실행은 내 코드".
**내레이션:** 지도를 그려 볼게요. 처음엔 요청 하나에 응답 하나였어요. 그다음 도구를 부르는 동안 반복하는 루프를 만들었죠. 도구는 클로드가 요청하고 내 코드가 실행했어요.

### 장면 8 · 지도 뒷부분 (약 45초)
**화면:** 같은 길이 이어지며 표지판 네 개가 더 섬: "S13 사고: 답하기 전의 연습장", "S14 내장 도구와 스킬: 이미 있는 연장통", "S15 연결과 컨텍스트: 표준 콘센트, 책상 정리", "S16 매니지드 에이전트: 운영을 맡김".
**내레이션:** 사고는 답하기 전의 연습장이었어요. 내장 도구와 스킬은 이미 있는 연장통이고요. 엠씨피로 연결하고 컨텍스트를 정리했어요. 마지막으로 운영 자체를 맡기는 방법을 봤어요.

### 장면 9 · 고객 앞에서 (약 40초)
**화면:** 회의실 그림. 고객 말풍선 "매일 아침 가격 보고서가 필요해요." FDE가 지도 위에서 표지판 몇 개에 동그라미를 침. 아래에 "가장 단순한 단계부터 출시".
**내레이션:** 고객의 요청을 들으면 이 지도에서 필요한 조각을 골라요. 그리고 가장 단순한 단계로 풀리는 부분부터 출시해요. 설계는 지도로, 구현은 클로드 코드로 빠르게 해요.

### 장면 10 · 요약과 예고 (약 30초)
**화면:** 세 줄 요약이 한 줄씩 나타남: "1. 클로드 코드는 같은 부품의 완성품 2. 길은 네 가지, 누가 돌리느냐가 다르다 3. 가장 단순한 단계부터". 아래에 "다음: S18 Claude Code란 (코스 6 시작)".
**내레이션:** 정리할게요. 클로드 코드는 같은 부품으로 만든 완성품이에요. 에이전트를 만드는 길은 네 가지고, 가장 단순한 단계부터 시작해요. 다음 시간부터는 새 코스예요. 클로드 코드가 어떻게 일하는지 볼게요. 루프와 컨텍스트, 도구와 권한, 설치까지요.

## 정답과 해설
1. (b). Messages API는 상태가 없어서 대화 기록 전체를 매번 보내요. 기록을 서버가 보관하는 건 S16의 세션이에요.
2. (a). `stop_reason`이 `tool_use`면 Claude가 도구 결과를 기다리는 중이에요. 실행하고 `tool_result`를 돌려준 뒤 다시 요청해요.
3. (b). 커스텀 도구는 클라이언트 도구예요. Claude는 호출을 요청할 뿐이고 실행은 내 애플리케이션이 해요.
4. (c). 사고 토큰은 출력 토큰으로 청구되고 숨겨도 같아요. 깊이는 `output_config.effort`로 조절해요.
5. (b). 압축은 오래된 대화를 요약으로 바꿔 자리를 만들고, 메모리 도구는 꼭 남겨야 할 것을 파일로 보존해요. 캐싱은 값과 속도만 바꾸고, `max_tokens`는 출력 상한이에요.
6. (c). Managed Agents는 하네스와 샌드박스를 Anthropic이 운영하고 세션이 기록을 보관해요. Agent SDK와 직접 짠 루프는 내가 운영해요.
7. 예시 답: 직접 짠 루프는 매 단계를 내 코드가 통제하므로, 승인 절차나 기록 방식 같은 흐름을 원하는 대로 만들어야 할 때 고른다. Managed Agents는 루프와 샌드박스, 기록 보관을 Anthropic이 맡으므로, 오래 걸리는 작업을 인프라 없이 빨리 돌려야 할 때 고른다. (데이터 보관 요건이 엄격하면 직접 짠 루프 쪽이 맞을 수 있다는 점도 좋은 답이에요.)
8. 예시 답: 모델은 학습 시점 이후의 변화를 모른다(S02의 지식 컷오프). API의 모델 이름, 파라미터, 베타 헤더는 그 뒤에도 바뀐다. `/claude-api` skill은 현재의 참고 자료를 컨텍스트에 불러와서, Claude Code가 기억이 아니라 자료를 보고 코드를 쓰게 한다.
9. 예시 답: 조합은 (1) 경쟁사 가격은 웹 검색·웹 페치(S14), (2) 엑셀 보고서는 `xlsx` skill과 코드 실행(S14), (3) 사내 재고 숫자는 커스텀 도구(S12)나 MCP 서버(S15), (4) 매일 아침 실행은 내 서버의 예약 작업에서 루프를 돌리거나 Managed Agents(S16)에 맡긴다. 먼저 출시할 부분은 사내 시스템 연동이 필요 없는 "경쟁사 가격 수집 + 엑셀 보고서"로 하고, 사람이 지금 만드는 보고서의 소요 시간과 오류를 기준선으로 잰다. 재고 비교는 연동 방식과 권한이 정해진 뒤 2단계로 붙인다. 가격처럼 정확해야 하는 값은 출처 도메인을 제한하고 표본을 사람이 확인한다.
10. 예시 답: "Claude Code도 모델이라 학습 이후에 바뀐 이름을 틀릴 수 있어요. 그래서 기억 대신 최신 자료를 읽게 하고, 쓴 코드는 실행해서 확인하는 게 기본이에요"라고 설명한다. 제안은 (1) `/claude-api` skill이 켜진 상태로 작업하고, 모델 이름과 파라미터는 공식 문서에서 확인하게 지시한다. (2) "코드를 쓴 뒤 실제로 실행해 결과를 보여 줘"를 요청에 넣는다. (3) 사람이 변경 내용을 검토하고 테스트를 통과한 것만 반영한다. 믿을지 말지가 아니라 검증 절차를 갖추는 문제라고 정리한다.

## 출처
- Claude Code Docs, Overview (Claude Code의 정의, 쓸 수 있는 곳, 실행 방법, 할 수 있는 일): https://code.claude.com/docs/en/overview
- Claude Code Docs, Extend Claude with skills (기본 포함된 `/claude-api` skill, 자동 활성화 조건, `managed-agents-onboard`): https://code.claude.com/docs/en/skills
- Claude Code Docs, Run Claude Code programmatically (`claude -p`, `--allowedTools`, `--output-format`): https://code.claude.com/docs/en/headless
- Claude Code Docs, Agent SDK overview (Agent SDK의 정의, CLI·Client SDK·Managed Agents와의 비교 표): https://code.claude.com/docs/en/agent-sdk/overview
- Claude Code Docs, Agent SDK quickstart (TypeScript `query` 예시): https://code.claude.com/docs/en/agent-sdk/quickstart
- Anthropic, Working with the Messages API (API가 상태를 갖지 않는다는 설명): https://platform.claude.com/docs/en/build-with-claude/working-with-messages
- Anthropic, How tool use works (`stop_reason`으로 도는 에이전트 루프, 클라이언트 도구의 실행 주체): https://platform.claude.com/docs/en/agents-and-tools/tool-use/how-tool-use-works
- Anthropic, Tool runner (SDK가 루프를 대신 돌려 주는 베타 도우미): https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-runner
- S13~S16 노트의 출처에 적은 문서들 (지도 표의 S13~S16 줄)
- Claude Forward Deployed Engineer 학습 경로, 코스 5·코스 6 소개와 목차(`_official-outline-2026-11-27.txt`): https://anthropic-partners.skilljar.com/path/claude-fde
- 지도 표의 S10~S12 줄은 공식 목차의 주제와 위 공개 문서를 바탕으로 쓴 요약이고, S10~S12 노트의 표현과 맞춰 봤어요.
- 예시 코드는 공식 Agent SDK quickstart의 TypeScript 예시를 읽기 전용으로 줄인 것이고, `@anthropic-ai/claude-agent-sdk` 0.3.332에서 타입 검사만 통과시켰어요. 실제 실행은 해 보지 않았어요.
