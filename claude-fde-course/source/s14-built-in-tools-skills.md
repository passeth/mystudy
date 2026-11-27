---
session: S14
course: "C5 Claude Platform 101"
official_sections: ["Extending your Agent: Built-in tools", "Extending your Agent: Skills"]
title: "내장 도구와 Skills"
minutes: 20
status: draft
---

# S14. 내장 도구와 Skills

## 오늘의 목표
- Anthropic이 제공하는 도구를 "누가 실행하나"로 나누고, 서버 도구와 클라이언트 도구의 차이를 설명할 수 있다.
- 웹 검색, 웹 페치, 코드 실행이 각각 언제 필요한지 고르고, 요청에 한 줄로 붙일 수 있다.
- Skill이 무엇이고 API에서 어떻게 불러 쓰는지, 도구와 무엇이 다른지 말할 수 있다.

## 핵심 정리

### 직접 만들기 전에, 이미 있는 연장통
S12에서는 도구의 스키마도 쓰고 실행 코드도 직접 짰어요. 그런데 검색이나 코드 실행처럼 누구나 필요한 도구는 Anthropic이 이미 만들어 뒀어요. 구분 기준은 S12에서 본 그대로 **누가 실행하나**예요. 오늘은 Anthropic이 제공하는 두 종류를 자세히 봐요.

| 종류 | 실행하는 곳 | 예 |
|---|---|---|
| 서버 도구(server tools) | Anthropic 서버 | 웹 검색, 웹 페치, 코드 실행, 도구 검색(tool search), advisor, MCP 커넥터 |
| Anthropic 스키마 클라이언트 도구 | 내 애플리케이션 | bash, 텍스트 편집기, 메모리, 컴퓨터 사용, 브라우저 사용 |

서버 도구는 `tools`에 한 줄 선언하면 끝이에요. S11의 루프에서 하던 "실행하고 `tool_result` 돌려주기"를 Anthropic이 대신 해서, 결과가 같은 응답 안에 블록으로 들어와요. 클라이언트 도구는 스키마만 Anthropic이 정해 줬을 뿐, 실행은 S12처럼 내 코드가 해요.

### 자주 쓰는 서버 도구 세 가지
- **웹 검색**(`web_search`): S02의 지식 컷오프 이후 정보가 필요할 때 써요. 답에 출처 인용이 항상 붙고, 토큰 비용 외에 검색 1,000회당 10달러가 들어요. `max_uses`로 횟수를, 도메인 필터로 사이트를 제한해요.
- **웹 페치**(`web_fetch`): 특정 URL의 본문이나 PDF를 통째로 읽어요. 추가 요금은 없어요. 보안상 대화에 이미 나온 URL만 가져올 수 있어요.
- **코드 실행**(`code_execution`): 격리된 컨테이너에서 명령을 실행하고 파일을 만들어요. 정확한 계산과 데이터 분석에 써요. 컨테이너는 인터넷이 막혀 있고, 실행 시간으로 과금돼요(조직마다 매달 1,550시간 무료).

도구의 `type`에는 `web_search_20260209`처럼 날짜가 붙고 새 버전이 계속 나와요. 쓰기 전에 Tool reference를 확인하세요. 서버 도구가 오래 걸려 응답이 `stop_reason: "pause_turn"`으로 멈추면, 그 assistant 메시지를 그대로 다시 보내 이어 가요.

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const response = await client.messages.create({
  model: "claude-opus-5-5",
  max_tokens: 4096,
  tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 3 }],
  messages: [{ role: "user", content: "이번 주 서울 날씨 전망을 출처와 함께 알려 줘." }],
});

for (const block of response.content) {
  if (block.type === "text") process.stdout.write(block.text);
}
console.log("\n", response.stop_reason, response.usage.server_tool_use);
```

### Skills: 필요할 때만 펼치는 업무 매뉴얼
**Skill**은 지시문, 스크립트, 참고 자료를 담은 폴더예요. 맨 위에 `SKILL.md`가 있고, 그 머리말(frontmatter)에 `name`과 `description`을 적어요. 핵심은 불러오는 방식이에요. 처음에는 이름과 설명만 Claude에게 보이고, 요청이 그 설명과 맞을 때만 본문 전체를 읽어요. 긴 매뉴얼이 있어도 S03의 작업 기억을 거의 차지하지 않는 이유예요.

API에서 skill은 코드 실행 컨테이너 안에서 돌아가요. 그래서 요청에 두 가지가 필요해요. `container.skills`에 쓸 skill을 적고, `tools`에 코드 실행 도구를 넣어요.

- Anthropic이 제공하는 skill: `pptx`, `xlsx`, `docx`, `pdf` (문서 만들기)
- 커스텀 skill: 직접 만들어 Skills API(`/v1/skills`)로 올려요. 올린 skill은 워크스페이스 전체가 쓸 수 있어요.

skill이 만든 파일은 응답에 `file_id`로 나오고 Files API로 내려받아요.

```typescript
// 위 예시의 import와 client를 그대로 쓰고, 요청 부분만 바꿔요
const response = await client.messages.create({
  model: "claude-opus-5-5",
  max_tokens: 4096,
  container: {
    skills: [{ type: "anthropic", skill_id: "xlsx", version: "latest" }],
  },
  tools: [{ type: "code_execution_20250825", name: "code_execution" }],
  messages: [{ role: "user", content: "월별 예산표를 엑셀 파일로 만들어 줘." }],
});
```

도구와 skill은 역할이 달라요. 도구는 "할 수 있는 행동"을 늘리고, skill은 "그 일을 하는 방법"을 알려 줘요. skill을 직접 만드는 법은 S32~S34에서 다뤄요.

## 직접 해 보기 (5분)
1. 웹 검색 예시를 실행하고 `response.content`의 블록 종류를 전부 출력해 보세요(`block.type`). 내 코드는 아무 도구도 실행하지 않았는데 어떤 블록이 들어 있나요? `usage.server_tool_use`의 검색 횟수도 확인하세요.
2. 같은 질문에서 `tools`를 빼고 다시 실행해 보세요. 답이 어떻게 달라지나요? S02의 지식 컷오프와 연결해 보세요.

## 확인 문제
1. 서버 도구에 대한 설명으로 맞는 것은?
   - (a) 내 코드가 실행하고 `tool_result`를 돌려줘야 한다
   - (b) `tools`에 선언하면 Anthropic 서버가 실행하고 결과가 응답에 들어온다
   - (c) 스키마를 내가 직접 써야 한다
2. 웹 페치 도구가 가져올 수 있는 URL은?
   - (a) 대화에 이미 나온 URL (사용자 메시지, 클라이언트 도구 결과, 이전 검색·페치 결과)
   - (b) Claude가 스스로 떠올린 URL이면 무엇이든
   - (c) 시스템 프롬프트에만 적힌 URL
3. API에서 Anthropic의 `xlsx` skill을 쓰려면 꼭 필요한 조합은?
   - (a) `container.skills`에 skill 지정 + 코드 실행 도구
   - (b) 웹 검색 도구 + 메모리 도구
   - (c) 시스템 프롬프트에 SKILL.md 전문을 붙여 넣기
4. (서술형) Skill이 컨텍스트 윈도우를 아끼는 원리를 두세 문장으로 설명해 보세요.
5. (상황형) 고객사 개발자가 말해요. "최신 환율을 찾아서 견적서 엑셀 파일을 만드는 에이전트가 필요해요. 검색 API 연동이랑 엑셀 생성 코드부터 짜야겠죠?" 어떻게 답할까요? 비용과 통제 면에서 미리 알려 줄 것도 적어 보세요.

## FDE 관점
현장에서 FDE가 시간을 가장 많이 아끼는 순간은 "이건 안 만들어도 됩니다"라고 말할 때예요. 검색, 문서 읽기, 계산, 문서 생성은 내장 도구와 제공 skill로 첫 주에 시연할 수 있어요. 대신 미리 확인할 것이 있어요. 웹 검색은 조직 관리자가 Claude Console에서 끄거나 도메인을 제한할 수 있고, 검색 횟수만큼 별도 요금이 붙어요. 코드 실행 컨테이너는 인터넷이 안 되니 사내 시스템에 직접 붙을 수 없어요. 그 부분은 S12의 커스텀 도구나 S15의 MCP로 이어야 해요. 그리고 파일럿에서 잘 통한 절차는 skill로 묶어 두면 고객 팀이 다시 쓸 수 있어요. 첫 출시 범위를 "내장 도구로 되는 부분"으로 잡으면 일정이 가벼워져요.

## 복습 카드
- Q: 서버 도구와 클라이언트 도구를 가르는 기준은? / A: 누가 실행하나. 서버 도구는 Anthropic 서버가, 클라이언트 도구는 내 애플리케이션이 실행한다.
- Q: 대표적인 서버 도구 세 가지는? / A: 웹 검색, 웹 페치, 코드 실행.
- Q: 웹 검색의 추가 요금은? / A: 토큰 비용에 더해 검색 1,000회당 10달러.
- Q: Skill이란? / A: `SKILL.md`와 스크립트·자료를 담은 폴더. 이름과 설명만 먼저 보이고, 필요할 때만 본문을 읽는다.
- Q: API에서 skill을 쓰려면? / A: `container.skills`에 지정하고 `tools`에 코드 실행 도구를 넣는다.

## 영상 대본

### 장면 1 · 오늘의 질문 (약 25초)
**화면:** 작업대 위에 직접 깎아 만든 망치 하나. 옆에서 뚜껑이 열리며 이미 채워진 연장통이 등장. 제목 "도구를 전부 직접 만들어야 할까?"
**내레이션:** 지난 시간에는 도구를 직접 만들었죠. 그런데 검색이나 계산처럼 누구나 쓰는 도구도 매번 만들어야 할까요? 오늘은 이미 준비된 연장통을 열어 볼게요.

### 장면 2 · 누가 실행하나 (약 40초)
**화면:** 화면이 세로선으로 둘로 나뉨. 왼쪽 "서버 도구" 아래 구름 모양 서버에서 톱니바퀴가 돎. 오른쪽 "클라이언트 도구" 아래 내 노트북에서 톱니바퀴가 돎.
**내레이션:** 기준은 지난 시간에 본 그대로예요. 누가 실행하느냐예요. 서버 도구는 앤트로픽 서버가 실행해요. 클라이언트 도구는 설계도만 받고 실행은 내 프로그램이 해요.

### 장면 3 · 한 줄 선언 (약 35초)
**화면:** S11의 루프 그림에서 "내가 실행" 단계와 "결과 돌려주기" 단계가 흐려지며 사라짐. 요청 상자에 "도구: 웹 검색" 한 줄만 남고, 응답 상자에 결과 블록이 바로 들어옴.
**내레이션:** 서버 도구는 요청에 한 줄만 적으면 돼요. 실행하고 결과를 돌려주는 일을 서버가 대신해요. 결과는 같은 응답 안에 담겨 와요.

### 장면 4 · 웹 검색 (약 35초)
**화면:** 달력 위에 "지식 컷오프" 선이 그어져 있고, 선 오른쪽 영역에 돋보기가 움직임. 답 말풍선 아래에 출처 링크 세 개가 붙음. 구석에 동전 아이콘과 "검색 횟수만큼 추가 요금".
**내레이션:** 웹 검색은 학습 이후의 최신 정보를 찾아요. 답에는 출처가 항상 붙어요. 토큰 비용 말고 검색 횟수만큼 요금이 더 붙으니 횟수를 제한해 두면 좋아요.

### 장면 5 · 웹 페치와 코드 실행 (약 40초)
**화면:** 왼쪽에 주소창에서 문서 한 장이 통째로 빨려 들어오는 그림과 "이미 나온 주소만". 오른쪽에 유리 상자 안에서 계산기와 그래프가 움직이는 그림과 "인터넷 차단".
**내레이션:** 웹 페치는 주소 하나의 내용을 통째로 읽어요. 대화에 이미 나온 주소만 가져와요. 코드 실행은 격리된 상자 안에서 계산하고 파일을 만들어요. 상자 안은 인터넷이 막혀 있어요.

### 장면 6 · 스킬이란 (약 40초)
**화면:** 책장에 얇은 책등 여러 권이 꽂혀 있음. 책등에는 이름과 한 줄 설명만 보임. 질문 말풍선이 나타나자 그중 한 권만 빠져나와 펼쳐짐.
**내레이션:** 스킬은 업무 매뉴얼을 담은 폴더예요. 평소에는 이름과 설명만 보여요. 요청이 그 설명과 맞을 때만 본문을 펼쳐 읽어요. 그래서 작업 기억을 거의 차지하지 않아요.

### 장면 7 · 에이피아이에서 쓰는 법 (약 40초)
**화면:** 요청 상자에 두 줄이 강조됨: "컨테이너: 엑셀 스킬", "도구: 코드 실행". 두 줄이 유리 상자로 연결되고, 상자에서 엑셀 파일 아이콘이 나와 "파일 아이디"라는 꼬리표가 붙음.
**내레이션:** 에이피아이에서 스킬은 코드 실행 상자 안에서 돌아가요. 그래서 스킬 지정과 코드 실행 도구가 함께 필요해요. 만든 파일은 파일 아이디로 받아서 내려받아요.

### 장면 8 · 도구와 스킬의 차이 (약 30초)
**화면:** 왼쪽에 손 아이콘과 "도구: 할 수 있는 행동", 오른쪽에 책 아이콘과 "스킬: 일하는 방법". 가운데에서 둘이 합쳐져 완성된 문서가 나옴.
**내레이션:** 둘은 역할이 달라요. 도구는 할 수 있는 행동을 늘려 줘요. 스킬은 그 일을 어떻게 하는지 알려 줘요. 함께 쓰면 결과물이 안정돼요.

### 장면 9 · 고객 앞에서 (약 35초)
**화면:** 회의실 그림. 고객 말풍선 "검색 연동부터 짜야죠?" FDE 말풍선 "이미 있어요. 첫 주에 보여 드릴게요." 아래 체크리스트: "관리자 설정", "검색 요금", "사내 시스템은 따로 연결".
**내레이션:** 고객이 검색 연동부터 짜자고 하면 이미 있다고 알려 주세요. 대신 세 가지를 미리 확인해요. 관리자 설정과 검색 요금이에요. 그리고 사내 시스템은 따로 연결해야 해요.

### 장면 10 · 요약과 예고 (약 25초)
**화면:** 세 줄 요약이 한 줄씩 나타남: "1. 기준은 누가 실행하나 2. 서버 도구는 한 줄 선언 3. 스킬은 필요할 때만 펼치는 매뉴얼". 아래에 "다음: S15 MCP와 컨텍스트 관리".
**내레이션:** 정리할게요. 기준은 누가 실행하느냐예요. 서버 도구는 한 줄로 붙여요. 스킬은 필요할 때만 펼치는 매뉴얼이에요. 다음 시간에는 엠씨피와 컨텍스트 관리를 볼게요.

## 정답과 해설
1. (b). 서버 도구는 Anthropic 인프라에서 실행되고, 내 코드가 `tool_result`를 돌려줄 필요가 없어요. (a)와 (c)는 S12의 커스텀 도구 이야기예요.
2. (a). 보안상 대화 컨텍스트에 이미 나온 URL만 가져와요. Claude의 출력에만 있거나 시스템 프롬프트에만 있는 URL은 가져오지 못해요.
3. (a). skill은 코드 실행 환경에서 동작하므로 `container.skills`와 코드 실행 도구가 함께 필요해요.
4. 예시 답: 처음에는 skill의 이름과 설명만 시스템 프롬프트에 들어간다. 요청이 설명과 맞을 때만 Claude가 본문과 딸린 파일을 읽는다. 그래서 skill을 여러 개 붙여도 쓰지 않는 skill의 긴 내용은 컨텍스트를 차지하지 않는다.
5. 예시 답: "둘 다 이미 있어요. 웹 검색 도구로 환율을 찾고, `xlsx` skill과 코드 실행 도구로 엑셀 파일을 만들 수 있으니 먼저 그걸로 시연해 볼게요"라고 답한다. 미리 알릴 것은 (1) 웹 검색은 토큰 외에 검색 1,000회당 10달러가 붙고 `max_uses`로 횟수를 제한할 수 있다. (2) 조직 관리자가 Console에서 웹 검색을 끄거나 도메인을 제한할 수 있으니 설정을 확인한다. (3) 검색 결과는 출처와 함께 나오지만, 견적에 쓰는 환율처럼 정확해야 하는 값은 믿을 만한 도메인으로 제한하고 사람이 확인하는 절차를 둔다. (4) 코드 실행 컨테이너는 인터넷이 막혀 있어 사내 시스템 연동은 커스텀 도구나 MCP로 따로 한다.

## 출처
- Anthropic, Tool use with Claude (클라이언트 도구와 서버 도구의 구분, 제공 도구 목록, 요금 구조): https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview
- Anthropic, Tool reference (도구별 `type` 문자열과 버전, 실행 위치): https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-reference
- Anthropic, Web search tool (동작, 인용, `max_uses`, 도메인 필터, 요금, 조직 설정, `pause_turn`): https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool
- Anthropic, Web fetch tool (URL 검증 규칙, 요금): https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-fetch-tool
- Anthropic, Code execution tool (컨테이너, 네트워크 차단, 버전, 실행 시간 과금과 무료 한도): https://platform.claude.com/docs/en/agents-and-tools/tool-use/code-execution-tool
- Anthropic, Server tools (`pause_turn` 이어 가기): https://platform.claude.com/docs/en/agents-and-tools/tool-use/server-tools
- Anthropic, Using Agent Skills with the API (`container.skills`, 제공 skill과 커스텀 skill, 불러오는 방식, 제한): https://platform.claude.com/docs/en/build-with-claude/skills-guide
- Claude Code Docs, Extend Claude with skills (`SKILL.md` 구조, 설명으로 자동 로드): https://code.claude.com/docs/en/skills
- Claude Forward Deployed Engineer 학습 경로, 코스 5·코스 9 소개(`_official-outline-2026-11-27.txt`): https://anthropic-partners.skilljar.com/path/claude-fde
- 예시 코드는 공식 문서의 TypeScript 예시를 줄인 것이고, `@anthropic-ai/sdk` 1.14.0에서 타입 검사만 통과시켰어요. 실제 호출은 해 보지 않았어요.
