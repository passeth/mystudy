---
session: S10
course: "C5 Claude Platform 101"
official_sections: ["What is the Claude Platform? > What is the Claude Platform?", "What is the Claude Platform? > Your first API call", "What is the Claude Platform? > Choosing the right model"]
title: "Claude Platform이란, 첫 API 호출, 모델 고르기"
minutes: 25
status: draft
---

# S10. Claude Platform이란, 첫 API 호출, 모델 고르기

## 오늘의 목표
- Claude Platform을 이루는 것(API, Console, SDK)을 말하고 Claude 앱과의 차이를 설명할 수 있다.
- TypeScript SDK로 첫 요청을 보내고, 응답의 `content`, `stop_reason`, `usage`를 읽을 수 있다.
- API에서 모델과 노력 수준(effort)을 정하는 자리를 알고 시작 모델을 고를 수 있다.

## 핵심 정리

### Claude Platform: 완성된 식당이 아니라 내 주방
Claude 앱이 완성된 식당이라면, Claude Platform은 같은 요리사를 내 주방으로 모셔 오는 길이에요. S07에서 본 마지막 진입점으로, 내 제품이나 사내 시스템이 Claude를 부르게 만들 때 써요. 구성은 세 가지예요.

- **Claude API**: `https://api.anthropic.com`에 있는 REST API. 요청을 보내면 응답이 와요.
- **Claude Console**(platform.claude.com): API 키, 사용량과 한도, 환경을 나누는 워크스페이스(workspace), 브라우저에서 시험해 보는 플레이그라운드(playground). 공식 코스 설명의 Workbench가 이 플레이그라운드를 가리키는지는 확인하지 못했어요(확인 필요).
- **SDK와 CLI**: Python, TypeScript, C#, Go, Java, PHP, Ruby용 공식 SDK와 `ant` 명령줄 도구.

만드는 길은 두 갈래예요. **Messages API**는 모델을 직접 부르고 흐름을 내가 짜는 길, **Claude Managed Agents**는 Anthropic이 운영하는 환경에서 에이전트를 돌리는 길이에요(S16). AWS, Google Cloud, Microsoft Foundry를 거쳐 쓸 수도 있고, 기능 범위는 플랫폼마다 달라요.

### 첫 API 호출
준비물은 Console 계정, API 키, 약간의 선불 크레딧, 그리고 Node.js(SDK 문서 기준 20 LTS 이상)예요. 키는 Console의 API keys 화면에서 만들어요. 전체 값은 만들 때 한 번만 보이니 안전하게 보관하고, 코드에 적지 말고 환경 변수로 넘겨요.

```bash
mkdir claude-quickstart && cd claude-quickstart
npm init -y
npm pkg set type=module
npm install @anthropic-ai/sdk
export ANTHROPIC_API_KEY="여기에-내-키"
```

`quickstart.ts` 파일을 만들어요.

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic(); // ANTHROPIC_API_KEY 환경 변수를 읽어요

const message = await client.messages.create({
  model: "claude-opus-5-5",
  max_tokens: 1000,
  messages: [{ role: "user", content: "Claude Platform을 한 문장으로 소개해 줘." }],
});

for (const block of message.content) {
  if (block.type === "text") console.log(block.text);
}
console.log(message.stop_reason, message.usage);
```

`npx tsx quickstart.ts`로 실행해요. 요청에 꼭 들어가는 건 모델(`model`), 출력 상한(`max_tokens`), 대화 내용(`messages`) 세 가지예요. 응답에서 볼 것도 세 가지예요.

- `content`: 답이 블록의 배열로 와요. 종류가 `text`인 블록을 골라 읽어요.
- `stop_reason`: 왜 멈췄는지. `end_turn`이면 자연스럽게 끝난 것, `max_tokens`면 상한에 걸려 잘린 거예요.
- `usage`: 입력과 출력에 쓴 토큰 수. 비용 계산의 근거예요.

하나 더. Messages API는 **상태를 저장하지 않아요**(stateless). 이어서 물으려면 지금까지의 대화 전체를 `messages`에 다시 담아 보내요. S03의 작업 기억에 무엇을 올릴지를 이제 내 코드가 정하는 거예요.

### 모델 고르기 (API편)
S09가 앱의 모델 메뉴였다면, API에서는 모델 ID 문자열을 적어요. 2026년 11월 문서 기준 최신 모델은 이래요.

| 모델 | API ID | 입력 / 출력 (100만 토큰당) | 기본 effort |
|---|---|---|---|
| Claude Fable 5.2 | `claude-fable-5-2` | $8 / $40 | high |
| Claude Opus 5.5 | `claude-opus-5-5` | $4 / $20 | medium |
| Claude Sonnet 5.5 | `claude-sonnet-5-5` | $2 / $10 | high |
| Claude Haiku 5.5 | `claude-haiku-5-5` | $0.10부터 / $0.50부터 | medium |

네 모델 모두 컨텍스트 윈도우는 100만 토큰이에요. 문서의 권장은 "잘 모르겠으면 Opus 5.5로 시작"이고, 양이 많고 빨라야 하는 일은 Haiku 5.5로 시작해 부족할 때만 올려요(S08의 효율 우선). effort는 요청에 `output_config: { effort: "low" }`처럼 적고, 안 적으면 표의 기본값이 적용돼요. 가격과 ID는 바뀌니 쓰기 전에 Models overview 문서를 다시 확인하세요.

## 직접 해 보기 (5분)
1. 위 코드를 실행해 마지막 줄의 출력을 보세요. `stop_reason`은 무엇이고, 입력과 출력 토큰은 몇 개인가요? 그다음 `max_tokens`를 아주 작게(예: 50) 바꿔 다시 실행하고 `stop_reason`이 어떻게 달라지는지 보세요.
2. `model`만 `claude-haiku-5-5`로 바꿔 같은 질문을 보내 보세요. 답이 오는 속도와 `usage`를 비교하고, 위 표의 가격으로 두 요청의 비용을 대략 계산해 보세요.

## 확인 문제
1. Messages API 요청에 꼭 들어가는 세 가지는?
   - (a) `model`, `max_tokens`, `messages`
   - (b) `model`, `system`, `tools`
   - (c) `api_key`, `prompt`, `stream`
2. Messages API가 상태를 저장하지 않는다(stateless)는 말의 뜻은?
   - (a) 서버가 대화를 기억하므로 새 메시지만 보내면 된다
   - (b) 요청마다 지금까지의 대화 전체를 보내야 한다
   - (c) 하루에 한 번만 요청할 수 있다
3. 응답의 `stop_reason`이 `max_tokens`라면?
   - (a) 답이 자연스럽게 끝났다
   - (b) 출력이 상한에 걸려 잘렸다
   - (c) API 키가 만료됐다
4. (서술형) Claude 앱과 Claude Platform은 무엇이 다른가요? 고객이 어느 쪽을 써야 할지 판단하는 기준을 두세 문장으로 써 보세요.
5. (상황형) 고객사 개발자가 말해요. "API 키를 웹 페이지 자바스크립트에 넣어서 브라우저에서 바로 호출하면 간단하겠네요." 어떻게 답하고, 어떤 구조를 제안할까요?

## FDE 관점
고객 환경에서 첫 API 호출이 성공하는 순간이 파일럿의 실제 출발점이에요. 그런데 그 한 번을 막는 건 대개 코드가 아니라 절차예요. 누가 Console 조직과 워크스페이스를 만들고 키를 발급하는지, 지출 한도는 얼마로 둘지, 회사 정책상 AWS나 Google Cloud, Azure를 거쳐야 하는지, 보안 검토는 누가 하는지. FDE는 킥오프 전에 이 목록을 먼저 풀어요. 그리고 `usage` 필드는 기준선의 재료예요. 대표 작업을 돌릴 때마다 토큰 수와 모델 ID를 기록해 두면, 파일럿 계획서의 "작업당 비용"이 추정이 아니라 측정값이 돼요.

## 복습 카드
- Q: Claude Platform의 세 구성은? / A: Claude API, Claude Console, SDK와 CLI.
- Q: Messages API 요청의 필수 세 가지는? / A: `model`, `max_tokens`, `messages`.
- Q: 응답에서 먼저 볼 세 가지는? / A: `content`(답 블록), `stop_reason`(멈춘 이유), `usage`(쓴 토큰).
- Q: stateless라서 내 코드가 해야 하는 일은? / A: 요청마다 지금까지의 대화 전체를 `messages`에 담아 보내기.
- Q: API에서 어떤 모델로 시작할지 모르겠다면? / A: Claude Opus 5.5(`claude-opus-5-5`). 대량이고 빨라야 하면 Haiku 5.5부터.

## 영상 대본

### 장면 1 · 오늘의 질문 (약 25초)
**화면:** 채팅 창 그림. 창 테두리 바깥에 회사 시스템 아이콘 세 개(주문 시스템, 고객센터, 사내 앱)가 서 있고 창 안쪽을 바라봄. 제목 "채팅창 밖에서 클로드를 쓰려면?"
**내레이션:** 지금까지는 채팅창 안에서 클로드를 썼어요. 그런데 내 서비스가 클로드를 부르게 하려면 어떻게 할까요? 오늘은 그 문, 클로드 플랫폼을 열어 볼게요.

### 장면 2 · 식당과 내 주방 (약 35초)
**화면:** 왼쪽 "앱": 차려진 식탁과 메뉴판. 오른쪽 "플랫폼": 빈 주방에 요리사가 걸어 들어옴. 가운데 화살표 "같은 요리사".
**내레이션:** 앱은 완성된 식당이에요. 앉으면 바로 먹을 수 있죠. 플랫폼은 같은 요리사를 내 주방으로 모셔 오는 길이에요. 무엇을 어떻게 만들지는 내가 정해요.

### 장면 3 · 세 가지 구성 (약 40초)
**화면:** 상자 세 개가 차례로 등장. "에이피아이: 요청과 응답이 오가는 창구", "콘솔: 키, 사용량, 시험장", "에스디케이: 일곱 언어의 도구 상자". 세 상자가 선으로 이어짐.
**내레이션:** 플랫폼은 세 가지로 이루어져요. 요청을 주고받는 에이피아이가 있어요. 키와 사용량을 관리하는 콘솔이 있어요. 코드에서 쉽게 부르게 해 주는 에스디케이가 있어요.

### 장면 4 · 만드는 두 길 (약 35초)
**화면:** 갈림길. 왼쪽 길 "메시지스 에이피아이: 내가 직접 흐름을 짠다", 오른쪽 길 "매니지드 에이전트: 운영되는 환경에서 돌린다". 왼쪽 길이 밝게 강조되고 "오늘과 다음 두 시간"이라는 표지판.
**내레이션:** 만드는 길은 두 갈래예요. 모델을 직접 부르고 흐름을 내가 짜는 길이 있어요. 운영되는 환경에 에이전트를 맡기는 길도 있어요. 우리는 먼저 직접 짜는 길로 가요.

### 장면 5 · 열쇠 챙기기 (약 35초)
**화면:** 콘솔 화면에서 열쇠 하나가 만들어짐. "한 번만 보여 줌" 딱지. 열쇠가 코드 파일 쪽으로 가려다 금지 표시에 막히고, 대신 "환경 변수" 금고로 들어감.
**내레이션:** 먼저 콘솔에서 에이피아이 키를 만들어요. 전체 값은 한 번만 보여 주니 잘 보관하세요. 키는 코드에 적지 않아요. 환경 변수에 넣어 두면 에스디케이가 알아서 읽어요.

### 장면 6 · 첫 요청 (약 40초)
**화면:** 편지 봉투 하나. 겉면에 세 칸: "어떤 모델", "최대 몇 토큰", "대화 내용". 칸이 하나씩 채워진 뒤 봉투가 서버 쪽으로 날아감.
**내레이션:** 요청은 편지 한 통이에요. 꼭 적을 게 세 가지예요. 어떤 모델에게 보낼지, 답을 최대 몇 토큰까지 쓸지, 그리고 대화 내용이에요. 코드로는 이 셋을 담아 한 번 보내는 게 전부예요.

### 장면 7 · 응답 읽기 (약 40초)
**화면:** 돌아온 봉투가 열리며 종이 세 장이 나옴: "답 블록", "멈춘 이유: 자연스럽게 끝남", "쓴 토큰: 입력과 출력". 두 번째 종이가 "상한에 걸려 잘림"으로 한 번 바뀌었다가 돌아옴.
**내레이션:** 답장에서도 세 가지를 봐요. 답은 블록으로 와요. 멈춘 이유도 같이 와요. 자연스럽게 끝났는지, 상한에 걸려 잘렸는지 알 수 있어요. 쓴 토큰 수는 비용의 근거예요.

### 장면 8 · 기억하지 않는다 (약 40초)
**화면:** 첫 번째 봉투는 얇음. 두 번째 봉투에는 앞선 질문과 답이 함께 들어가 두꺼워짐. 세 번째는 더 두꺼움. 서버 쪽에는 "기록 보관 없음" 표시.
**내레이션:** 중요한 점이 있어요. 이 에이피아이는 앞 대화를 기억하지 않아요. 이어서 물으려면 지금까지의 대화를 통째로 다시 보내요. 작업 기억에 무엇을 올릴지를 내 코드가 정하는 거예요.

### 장면 9 · 모델 고르기 (약 40초)
**화면:** 이름표 네 개가 세로로: 페이블, 오퍼스, 소넷, 하이쿠. 이름표마다 가격 눈금이 위에서 아래로 줄어듦. 오퍼스에 "잘 모르겠으면 여기", 하이쿠에 "많고 빨라야 하면 여기" 깃발. 옆에 "노력 수준" 다이얼.
**내레이션:** 에이피아이에서는 모델을 아이디로 적어요. 잘 모르겠으면 오퍼스로 시작해요. 양이 많고 빨라야 하면 하이쿠부터 시험해요. 노력 수준도 요청에 함께 적을 수 있어요.

### 장면 10 · 요약과 예고 (약 25초)
**화면:** 세 줄 요약이 한 줄씩 나타남: "1. 플랫폼 = 에이피아이, 콘솔, 에스디케이 2. 요청 세 가지, 응답 세 가지 3. 기억은 내 코드의 몫". 아래에 "다음: S11 에이전트 루프".
**내레이션:** 정리할게요. 플랫폼은 에이피아이, 콘솔, 에스디케이예요. 요청에 세 가지를 적고 응답에서 세 가지를 읽어요. 기억은 내 코드의 몫이에요. 다음 시간에는 이 호출을 반복해 일을 끝내는 에이전트 루프를 볼게요.

## 정답과 해설
1. (a). `system`과 `tools`는 필요할 때 더하는 선택 항목이에요. API 키는 요청 본문이 아니라 인증 헤더로 가고, SDK가 대신 넣어 줘요.
2. (b). 서버가 대화를 보관하지 않으니, 이어지는 대화는 내 코드가 전체 기록을 다시 보내야 해요.
3. (b). `max_tokens`에 걸려 잘린 거예요. 상한을 올리거나 이어서 쓰게 해요. 자연스럽게 끝나면 `end_turn`이에요.
4. 예시 답: Claude 앱은 사람이 직접 쓰는 완성된 제품이고, Claude Platform은 내 제품이나 시스템이 Claude를 부르게 만드는 개발자용 창구다. 사람이 대화하며 하는 일이면 앱(또는 Cowork, Claude Code)으로 충분하다. 고객의 서비스 안에 기능으로 넣거나, 사람 없이 시스템이 자동으로 돌려야 하면 Platform을 쓴다.
5. 예시 답: "브라우저에 넣은 키는 페이지를 여는 누구나 볼 수 있어서, 남이 우리 비용으로 API를 쓸 수 있어요"라고 설명한다. 키는 서버 쪽 환경 변수나 비밀 관리 도구에만 두고, 브라우저는 우리 서버를 부르고 서버가 Claude API를 부르는 구조를 제안한다. 키에는 만료를 걸고 워크스페이스로 범위를 나누며 지출 한도를 설정한다. 이미 노출된 키가 있으면 바로 폐기하고 새로 만든다.

## 출처
- Claude 문서, Intro to Claude(Messages API와 Managed Agents, 권장 학습 순서): https://platform.claude.com/docs/en/intro
- Claude 문서, Get started with Claude(TypeScript 퀵스타트): https://platform.claude.com/docs/en/get-started
- Claude 문서, API overview(엔드포인트, 인증, Console, 클라우드 플랫폼): https://platform.claude.com/docs/en/api/overview
- Claude 문서, Get your Claude API key: https://platform.claude.com/docs/en/get-api-key
- Claude 문서, Using the Messages API(stateless, 기본 요청): https://platform.claude.com/docs/en/build-with-claude/working-with-messages
- Claude API 레퍼런스, Create a Message(필수 파라미터): https://platform.claude.com/docs/en/api/messages/create
- Claude 문서, Stop reasons and fallback: https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons
- Claude 문서, Models overview(모델 ID, 가격, 기본 effort, 컨텍스트): https://platform.claude.com/docs/en/about-claude/models/overview
- Claude 문서, Choosing the right model: https://platform.claude.com/docs/en/about-claude/models/choosing-a-model
- Claude 문서, Effort(`output_config.effort`): https://platform.claude.com/docs/en/build-with-claude/effort
- Claude 문서, SDKs, CLI, and libraries: https://platform.claude.com/docs/en/cli-sdks-libraries/overview
- Claude 문서, TypeScript SDK(Node.js 요구 사항): https://platform.claude.com/docs/en/cli-sdks-libraries/sdks/typescript
- Claude 문서, Rate limits(지출 한도와 사용 등급): https://platform.claude.com/docs/en/api/rate-limits
- Claude Platform 제품 페이지: https://claude.com/platform/api
- Claude Forward Deployed Engineer 학습 경로, 코스 5 소개·준비물·목차(개요 사본 `_official-outline-2026-11-27.txt`): https://anthropic-partners.skilljar.com/path/claude-fde
- 예제 코드는 공식 퀵스타트의 TypeScript 예를 바탕으로 질문만 바꾼 것이에요. `@anthropic-ai/sdk` 1.14.0 기준으로 타입 검사는 통과했고, 실제 API 호출은 이 노트를 쓰면서 실행하지 않았어요.
