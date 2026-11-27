---
session: S22
course: "C6 Claude Code 101"
official_sections: ["Customizing Claude Code (Skills, MCP, Hooks)"]
title: "커스터마이즈 2: skills, MCP, hooks"
minutes: 22
status: draft
---

# S22. 커스터마이즈 2: skills, MCP, hooks

## 오늘의 목표
- skill, MCP 서버, hook이 Claude Code에서 각각 어떤 문제를 푸는지 한 문장씩 말할 수 있다.
- 각 기능의 파일이나 설정이 어디에 놓이고, 무엇으로 확인하는지(`/skills`, `/mcp`, `/hooks`) 안다.
- "이건 CLAUDE.md, 이건 skill, 이건 MCP, 이건 hook"을 상황을 보고 고를 수 있다.

## 핵심 정리

### 세 가지 확장, 세 가지 질문
S21의 CLAUDE.md가 "항상 알아야 할 것"이라면, 오늘의 세 가지는 각각 다른 질문에 답해요. skill은 **어떻게 하는지**, MCP는 **어디에 닿는지**, hook은 **무엇이 반드시 일어나야 하는지**예요. 셋 다 S18에서 본 에이전트 루프 위에 얹는 층이고, 필요가 생길 때 하나씩 더해요.

| 이런 일이 생기면 | 쓸 것 |
|---|---|
| Claude가 같은 규칙이나 명령을 두 번 틀린다 | CLAUDE.md |
| 같은 절차를 세 번째 붙여 넣고 있다 | skill |
| Claude가 못 보는 화면에서 자료를 복사해 오고 있다 | MCP 서버 |
| 곁가지 작업의 출력이 대화를 뒤덮는다 | 서브에이전트 |
| 묻지 않아도 매번 일어나야 하는 일이 있다 | hook |

### Skills: 절차를 한 번 적어 두고 필요할 때만 꺼낸다
S14에서 본 skill을 Claude Code에서는 `SKILL.md` 파일이 든 폴더로 만들어요.

- 위치: `~/.claude/skills/<이름>/SKILL.md`(나만, 모든 프로젝트), `.claude/skills/<이름>/SKILL.md`(이 저장소, 커밋하면 팀 공유)
- Claude는 `description`을 보고 언제 쓸지 판단하고, 사용자는 `/이름`으로 직접 부를 수 있어요.
- 세션에는 이름과 설명만 올라가고 본문은 쓸 때만 읽혀요. 긴 절차를 CLAUDE.md에 두는 것보다 컨텍스트가 가벼워요.
- 예전의 커스텀 명령(`.claude/commands/`)은 skill로 합쳐졌어요. 배포처럼 부작용이 있는 절차는 `disable-model-invocation: true`로 Claude가 스스로 실행하지 못하게 해요.

만들고 공유하는 법은 코스 9(S32~S34)에서 봐요.

### MCP: 저장소 밖의 시스템에 닿는다
이슈 트래커, 데이터베이스, 문서처럼 필요한 맥락의 많은 부분은 저장소 밖에 있어요. S15에서 본 MCP 서버를 붙이면 Claude가 그 시스템의 도구를 쓸 수 있어요.

```bash
# 원격(HTTP) 서버
claude mcp add --transport http claude-code-docs https://code.claude.com/docs/mcp
# 내 컴퓨터에서 도는 로컬(stdio) 서버: -- 뒤가 실행 명령
claude mcp add playwright -- npx -y @playwright/mcp@latest
```

| 범위(`--scope`) | 누구에게 | 저장 위치 |
|---|---|---|
| `local` (기본) | 나만, 이 프로젝트 | `~/.claude.json` |
| `project` | 저장소를 받는 모두 | 프로젝트 루트의 `.mcp.json` |
| `user` | 나만, 모든 프로젝트 | `~/.claude.json` |

터미널에서는 `claude mcp list`와 `claude mcp remove <이름>`, 세션 안에서는 `/mcp`로 상태 확인과 로그인을 해요. 도구 정의는 필요할 때 불러오는 방식(tool search)이 기본이라, 시작할 때는 도구 이름과 서버 안내만 컨텍스트에 올라가요. 서버는 믿을 수 있는 것만 연결하세요. 외부 내용을 가져오는 서버에는 프롬프트 인젝션 위험이 있어요. 서버를 만드는 법은 코스 8(S28~S31)에서 봐요.

### Hooks: 반드시 일어나야 하는 일
**hook**은 Claude Code가 정해진 시점마다 자동으로 실행하는 사용자 정의 셸 명령이에요. 앞의 것들과 달리 **Claude의 판단을 거치지 않아요.** CLAUDE.md의 "수정 후엔 포매터를 돌려"는 대부분 지켜지지만, hook은 매번 실행돼요.

- 설정: 설정 파일의 `hooks` 블록. `~/.claude/settings.json`(내 모든 프로젝트), `.claude/settings.json`(프로젝트, 커밋 가능)
- 자주 쓰는 이벤트: `PreToolUse`(도구 실행 전, 막을 수 있음), `PostToolUse`(도구 성공 후), `UserPromptSubmit`, `Stop`, `Notification`
- 막는 법: `PreToolUse` hook이 종료 코드 2로 끝나면 그 행동이 차단되고, stderr에 쓴 이유가 Claude에게 전달돼요. 0이면 평소의 권한 흐름대로 가요.
- 확인: `/hooks`는 설정된 hook을 보여 주는 읽기 전용 목록이에요.

hook으로 규칙을 강제하는 법은 S25에서 깊게 봐요.

## 직접 해 보기 (5분)
1. 내 환경 살펴보기: 평소 쓰는 프로젝트에서 `claude`를 열고 `/skills`, `/mcp`, `/hooks`를 차례로 실행해 보세요. 아무것도 바꾸지 않고 보기만 해요.
   - 관찰: skill과 MCP 서버가 몇 개인가요? `/context`에서 그것들이 차지하는 양은 어느 정도인가요? 쓰지 않는 서버가 있나요?
2. 버리는 폴더에서 hook 하나: `~/cc-playground/.claude/settings.json`을 아래 내용으로 만든 뒤 그 폴더에서 `claude`를 실행하세요. `/hooks`에 `PostToolUse` 항목이 보이는지 확인하고, "test.txt 파일을 만들어 줘"라고 하세요.

   ```json
   {
     "hooks": {
       "PostToolUse": [
         {
           "matcher": "Edit|Write",
           "hooks": [
             { "type": "command", "command": "date >> \"$CLAUDE_PROJECT_DIR\"/hook-log.txt" }
           ]
         }
       ]
     }
   }
   ```
   - 관찰: `hook-log.txt`에 시각이 한 줄 찍혔나요? Claude에게 부탁하지 않았는데도 실행됐다는 점이 핵심이에요. 끝나면 `settings.json`의 `hooks` 블록을 지우세요.

## 확인 문제
1. 세션을 시작할 때 skill에서 컨텍스트에 올라가는 것은?
   - (a) 모든 skill의 본문 전체
   - (b) 이름과 설명. 본문은 쓸 때 읽힌다
   - (c) 아무것도 올라가지 않는다
2. 저장소를 받는 팀원 모두가 같은 MCP 서버를 쓰게 하려면?
   - (a) `--scope local`로 추가한다
   - (b) `--scope project`로 추가해 `.mcp.json`을 커밋한다
   - (c) `--scope user`로 추가한다
3. hook이 CLAUDE.md의 지시와 결정적으로 다른 점은?
   - (a) Claude가 읽고 따를지 판단한다
   - (b) Claude Code가 해당 이벤트마다 반드시 실행한다
   - (c) 세션을 시작할 때 한 번만 읽힌다
4. (서술형) "운영 설정 폴더는 절대 수정하지 않는다"는 규칙을 CLAUDE.md에 적는 것과 `PreToolUse` hook으로 만드는 것의 차이를 두세 문장으로 설명해 보세요.
5. (상황형) 고객사가 말해요. "Claude가 우리 이슈 트래커를 보고 일했으면 좋겠고, 릴리스 절차도 우리 방식대로 따랐으면 하고, 운영 DB에는 절대 쓰지 못했으면 해요." 세 가지 요구를 각각 어떤 기능으로 풀지 제안해 보세요.

## FDE 관점
공식 경로는 MCP 코스를 "Claude를 고객의 시스템에 연결하기", skills 코스를 "잘 되는 것을 고객 팀이 재사용하게 포장하기"라고 소개해요. 그래서 FDE에게 이 세 가지는 기능 목록이 아니라 고객 요구를 받아 적는 세 칸이에요. "우리 시스템을 봤으면"은 MCP, "우리 방식대로"는 skill, "절대 안 된다"는 hook과 권한 규칙이에요. 순서도 중요해요. 프로토타입 초반에는 CLAUDE.md와 프롬프트로 충분한지 먼저 보고, 반복이 눈에 보일 때 하나씩 더해요. 처음부터 다 깔면 컨텍스트만 무거워지고 무엇이 효과를 냈는지 알 수 없어요. 파일럿 계획서에는 연결할 시스템(MCP)과 강제할 규칙(hook)을 "먼저 출시할 부분"의 전제 조건으로 적고, 고객 보안 담당자가 서버 목록과 `.mcp.json`을 미리 검토하게 하세요.

## 복습 카드
- Q: skill, MCP, hook이 답하는 질문은 각각? / A: 어떻게 하는지, 어디에 닿는지, 무엇이 반드시 일어나야 하는지.
- Q: 프로젝트 skill의 위치는? / A: `.claude/skills/<이름>/SKILL.md`. 개인용은 `~/.claude/skills/` 아래.
- Q: MCP 서버를 팀과 공유하는 범위와 파일은? / A: `--scope project`, 프로젝트 루트의 `.mcp.json`.
- Q: `PreToolUse` hook이 행동을 막는 방법은? / A: 종료 코드 2로 끝낸다. stderr에 쓴 이유가 Claude에게 전달된다.
- Q: hook이 CLAUDE.md와 다른 점은? / A: Claude의 판단을 거치지 않고 Claude Code가 이벤트마다 반드시 실행한다.

## 영상 대본

### 장면 1 · 오늘의 질문 (약 25초)
**화면:** Claude 아이콘 앞에 요청 세 개가 말풍선으로 뜸: "우리 방식대로 해 줘", "우리 시스템도 봐 줘", "이건 절대 하지 마". 제목 "셋은 같은 방법으로 풀릴까?"
**내레이션:** 우리 방식대로 해 줘. 우리 시스템도 봐 줘. 이건 절대 하지 마. 세 가지 요청이에요. 풀어 주는 기능이 서로 달라요. 오늘은 그 셋을 볼게요.

### 장면 2 · 세 가지 질문 (약 30초)
**화면:** 카드 세 장: "skill = 어떻게 하는지", "MCP = 어디에 닿는지", "hook = 무엇이 반드시 일어나는지". 뒤에 S18의 루프 원이 옅게 깔리고 카드들이 그 위에 얹힘.
**내레이션:** 스킬은 어떻게 하는지를 알려 줘요. 엠씨피는 어디에 닿는지를 넓혀요. 훅은 무엇이 반드시 일어나야 하는지를 정해요. 셋 다 에이전트 루프 위에 얹는 층이에요.

### 장면 3 · 스킬 (약 40초)
**화면:** 책장에 얇은 책등 여러 개(이름과 설명만 보임). 사용자가 "PR 리뷰해 줘"라고 하자 책 한 권만 뽑혀 펼쳐짐. 책 표지에 "SKILL.md".
**내레이션:** 스킬은 절차를 적어 둔 파일이에요. 평소에는 이름과 설명만 올라가 있어요. 맞는 요청이 오면 클로드가 그 스킬의 본문을 꺼내 읽어요. 그래서 긴 절차도 컨텍스트를 거의 차지하지 않아요.

### 장면 4 · 스킬을 두는 곳 (약 30초)
**화면:** 폴더 두 개: 홈의 "~/.claude/skills/"(사람 하나), 저장소의 ".claude/skills/"(사람 여럿). 프롬프트에 "/이름"이 입력되어 스킬이 바로 실행됨.
**내레이션:** 홈 폴더에 두면 나만 쓰고, 저장소에 두면 팀이 같이 써요. 슬래시와 이름을 치면 직접 부를 수도 있어요. 같은 지시를 자꾸 붙여 넣고 있다면 스킬로 옮길 때예요.

### 장면 5 · 엠씨피 (약 40초)
**화면:** 가운데 저장소 섬. 바다 건너에 섬 세 개: "이슈 트래커", "데이터베이스", "문서". 다리("MCP 서버")가 하나씩 놓이고 Claude 아이콘이 건너감.
**내레이션:** 필요한 맥락은 저장소 밖에도 많아요. 이슈 트래커, 데이터베이스, 문서 같은 곳이죠. 엠씨피 서버는 그곳으로 가는 다리예요. 연결하면 클로드가 그 시스템의 도구를 쓸 수 있어요.

### 장면 6 · 범위와 주의 (약 35초)
**화면:** 다리 옆 표지판 세 개: "local: 나만, 이 프로젝트", "project: .mcp.json, 팀 공유", "user: 나만, 모든 프로젝트". 아래 경고 표지 "믿을 수 있는 서버만".
**내레이션:** 서버는 범위를 정해서 붙여요. 나만 쓸지, 팀과 나눌지, 모든 프로젝트에서 쓸지요. 팀과 나누려면 프로젝트 범위로 붙이고 설정 파일을 커밋해요. 그리고 믿을 수 있는 서버만 연결하세요.

### 장면 7 · 훅 (약 40초)
**화면:** 루프 원 위에 검문소 두 개가 세워짐: 행동 앞 "PreToolUse", 행동 뒤 "PostToolUse". Claude가 지날 때마다 검문소의 톱니바퀴가 자동으로 돎. 옆에 "Claude의 판단을 거치지 않음".
**내레이션:** 훅은 정해진 시점마다 자동으로 실행되는 명령이에요. 가장 큰 차이는 클로드의 판단을 거치지 않는다는 거예요. 클로드 엠디의 지시는 대부분 지켜지지만, 훅은 매번 실행돼요.

### 장면 8 · 막는 훅 (약 35초)
**화면:** "PreToolUse" 검문소에 "운영 설정 수정" 화살표가 다가옴. 차단기가 내려가고 "exit 2" 표시. 차단 사유가 적힌 쪽지가 Claude에게 되돌아가고 Claude가 다른 길로 감.
**내레이션:** 도구 실행 전 훅은 행동을 막을 수 있어요. 종료 코드 이로 끝나면 차단돼요. 막힌 이유는 클로드에게 전달돼서, 클로드가 다른 방법을 찾아요.

### 장면 9 · 고객 앞에서 (약 40초)
**화면:** 고객 요구 메모지 세 장이 세 칸으로 분류됨: "우리 시스템을 봤으면 → MCP", "우리 방식대로 → skill", "절대 안 된다 → hook". 아래 계단: "프롬프트·CLAUDE.md 먼저 → 반복이 보이면 하나씩".
**내레이션:** 고객의 요구는 이 세 칸에 받아 적어요. 우리 시스템을 봤으면은 엠씨피, 우리 방식대로는 스킬, 절대 안 된다는 훅이에요. 처음부터 다 깔지 말고, 반복이 보일 때 하나씩 더하세요.

### 장면 10 · 요약과 예고 (약 30초)
**화면:** 세 줄 요약: "1. skill은 절차, 필요할 때만 읽힌다 2. MCP는 바깥 시스템으로 가는 다리 3. hook은 판단 없이 반드시 실행". 아래에 "다음: S23 작업 조종 — plan mode, 압축, 되감기".
**내레이션:** 정리할게요. 스킬은 필요할 때만 꺼내는 절차예요. 엠씨피는 바깥 시스템으로 가는 다리예요. 훅은 반드시 실행되는 규칙이에요. 이것으로 클로드 코드 기초를 마쳤어요. 다음 시간부터는 길고 손이 덜 가는 세션을 조종하는 법을 배워요. 플랜 모드와 압축, 되감기부터 시작할게요.

## 정답과 해설
1. (b). 설명은 Claude가 언제 쓸지 판단하는 데 쓰이고, 본문은 skill이 실제로 호출될 때 읽혀요.
2. (b). project 범위는 프로젝트 루트의 `.mcp.json`에 저장돼요. 팀원은 저장소를 받은 뒤 서버 승인 창을 거쳐 쓰게 돼요.
3. (b). (a)는 CLAUDE.md와 skill의 방식이에요. hook은 Claude Code(하네스)가 실행해요.
4. 예시 답: CLAUDE.md에 적으면 Claude가 읽고 따르려고 하지만, 매번 지킨다는 보장은 없다. `PreToolUse` hook으로 만들면 Claude가 그 폴더를 고치려는 순간 Claude Code가 hook을 실행해 종료 코드 2로 막으므로, Claude의 판단과 상관없이 차단된다. 예외가 없어야 하는 규칙은 hook이나 권한의 deny 규칙에 둔다.
5. 예시 답: (1) 이슈 트래커는 그 서비스의 MCP 서버를 project 범위로 연결하고 `.mcp.json`을 보안 담당자가 검토한 뒤 커밋한다. (2) 릴리스 절차는 저장소의 `.claude/skills/`에 skill로 적고, 실제 배포처럼 부작용이 있는 단계는 사람이 직접 부를 때만 실행되게 한다. (3) 운영 DB 쓰기 금지는 CLAUDE.md의 문장이 아니라 `PreToolUse` hook이나 deny 규칙으로 강제하고, 애초에 쓰기 권한이 없는 계정으로 연결한다. 세 가지를 한꺼번에 깔지 않고 파일럿 범위에 필요한 것부터 넣자고 제안한다.

## 출처
- Claude Code Docs, Extend Claude Code (기능 비교 표, "Build your setup over time" 표): https://code.claude.com/docs/en/features-overview
- Claude Code Docs, Extend Claude with skills (SKILL.md, 위치 표, 호출 방식, 커스텀 명령 통합, `disable-model-invocation`): https://code.claude.com/docs/en/skills
- Claude Code Docs, Connect to MCP servers (`claude mcp add`, `claude mcp list`, `claude mcp remove`, 범위와 저장 파일): https://code.claude.com/docs/en/mcp-quickstart
- Claude Code Docs, Connect Claude Code to tools via MCP (범위 표, `.mcp.json` 승인, tool search, 신뢰 경고): https://code.claude.com/docs/en/mcp
- Claude Code Docs, Automate actions with hooks (정의, 이벤트 표, 종료 코드, 설정 위치, `PostToolUse` 예시 구조): https://code.claude.com/docs/en/hooks-guide
- Claude Code Docs, Hooks reference (`/hooks` 읽기 전용 메뉴, 종료 코드별 결과): https://code.claude.com/docs/en/hooks
- Claude Code Docs, Best practices (결정적·비결정적 지시의 구분): https://code.claude.com/docs/en/best-practices
- Claude Code Docs, Commands (`/skills`, `/mcp`, `/hooks`): https://code.claude.com/docs/en/commands
- Claude Academy, Claude Code 101 공개 레슨 요약(Skills, MCP, Hooks): https://academy.claude.com/courses/claude-code-101
- Claude Forward Deployed Engineer 학습 경로 개요, 코스 8·9 소개 문구: 이 폴더의 `_official-outline-2026-11-27.txt`로 확인했어요. 원 페이지는 직접 열지 못했어요.
- "직접 해 보기"의 hook 설정은 문서의 `PostToolUse` 예시 구조에 로그를 남기는 셸 명령을 넣은 거예요. 2026-11-27에 Claude Code 2.1.332의 임시 폴더에서 `claude -p`로 한 번 실행해 `hook-log.txt`에 시각이 찍히는 것을 확인했어요. 대화형 세션에서는 폴더 신뢰 창을 먼저 수락해야 해요.
