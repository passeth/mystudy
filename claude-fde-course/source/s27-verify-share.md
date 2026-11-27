---
session: S27
course: "C7 Claude Code in Action"
official_sections: ["Verify and Share"]
title: "검증과 공유: 무감독 실행 검증, plugin"
minutes: 22
status: draft
---

# S27. 검증과 공유: 무감독 실행 검증, plugin

## 오늘의 목표
- 실행을 덜 지켜봤을수록 더 강한 검증을 붙인다는 원칙으로 검증 수단을 고를 수 있다.
- 무감독 실행을 켜기 전의 다섯 질문을 점검하고, 돌아와서 무엇을 증거로 볼지 말할 수 있다.
- 믿게 된 설정을 plugin으로 묶어 검사하고 팀이 설치하게 하는 흐름과, 설치 전에 읽어야 할 파일을 설명할 수 있다.

## 핵심 정리

무감독 실행의 검증은 야간 근무 인수인계와 같아요. 옆에서 같이 본 일은 한 번 훑으면 되지만, 내가 자는 동안 일어난 일은 기록과 증거로 확인해야 해요. 코스 7의 마지막 세션인 오늘은 S23~S26에서 만든 것을 믿는 법과 나누는 법을 다뤄요.

### 덜 볼수록 더 검증한다
지켜보는 세션에서는 Claude가 맥락을 놓쳐도 한두 메시지 안에 알아채고 말해 줘요. 자기 전에 켜 둔 실행에서는 아무도 말해 주지 않아서, 틀린 가정 위에 밤새 쌓은 결과를 아침에 발견하게 돼요. 그래서 검증의 세기는 지켜본 정도와 반대로 가야 해요. 공식 문서가 드는 검증 수단을 약한 것부터 세워 보면 이래요.

1. 프롬프트로 부탁: "테스트를 돌리고 통과할 때까지 계속해." Claude가 스스로 만족을 판단해요.
2. `/goal`: 별도의 모델이 턴마다 조건을 판정해요(S26).
3. `Stop` hook: Claude Code가 강제해요. 검사가 실패하면 턴이 끝나지 않아요(S25).
4. 코드를 쓰지 않은 리뷰어: `/code-review`는 내 대화를 보지 못한 새 서브에이전트가 diff를 봐요. 두 번째 세션이나 PR의 Code Review도 같은 역할이에요.
5. 사람: 머지 승인과 브랜치 보호예요. 마지막 말은 Claude의 요약이 아니라 여기서 나와요.

| 실행 방식 | 내가 본 정도 | 최소한 붙일 검증 |
|---|---|---|
| 대화형, 단계마다 확인 | 많이 | 증거 요청, diff 훑어보기 |
| auto mode로 긴 작업, 가끔 확인 | 조금 | 검증 skill이나 `/goal`, 끝에 `/code-review` |
| `-p`, 예약, 백그라운드 | 거의 못 봄 | `Stop` hook이나 CI, 독립 리뷰, 사람의 머지 승인 |

이 표는 공식 표가 아니라, 문서의 수단들을 코스 목표에 맞춰 정리한 학습용 표예요.

어느 단계든 **증거**를 요구해요. "모든 테스트 통과"라는 말만으로는 알 수 있는 게 거의 없어요. 실행한 명령과 그 출력, 또는 스크린샷을 받아요. 출력을 읽는 편이 직접 다시 돌리는 것보다 빠르고, 보지 않은 세션에서는 그게 유일한 증거예요. 리뷰어에게는 "정확성에 영향을 주는 것만, 스타일은 건너뛰어"라고 범위를 줘요. 문제를 찾으라고 하면 항상 무언가를 찾아내기 때문이에요.

### 떠나기 전 다섯 질문
공식 문서는 작업을 혼자 돌려 두기 전에 그 작업을 놓고 다섯 가지를 물으라고 해요.

1. 끝이 무엇인지 아는가? goal 조건, 스펙 파일, 통과시켜야 할 실패 테스트.
2. 스스로 검사할 수 있는가? 테스트, `Stop` hook, 리뷰 단계.
3. 무엇을 건드릴 수 있는가? 권한 규칙, `dontAsk`, sandbox, worktree, 푸시해도 되는 브랜치 하나.
4. 무엇이 멈추는가? `--max-turns`, `--max-budget-usd`, 지출 한도.
5. 결과가 어디로 가고 누가 승인하는가? PR이나 코멘트, 요약. 그리고 되돌릴 수 없는 일은 사람이 승인.

새 자동화는 작게 시작해요. 파일 세 개로 먼저 돌려 무엇이 틀어지는지 보고 프롬프트를 고친 다음 나머지를 돌려요. 돌아와서는 PR의 diff, 검사 출력, 비용을 봐요. `--permission-prompts none`과 `--output-format stream-json`으로 돌린 실행이라면 마지막 result 메시지의 `permission_denials`에서 거부된 호출도 확인할 수 있어요.

### 믿게 된 설정은 plugin으로
믿게 된 skill, hook, 서브에이전트가 `.claude/`에 쌓이면 다른 저장소와 동료에게도 필요해져요. plugin은 이런 구성 요소를 한 단위로 설치하게 묶은 디렉터리예요.

```text
team-setup/
├── .claude-plugin/
│   └── plugin.json        # 매니페스트. name이 필수
├── skills/verify/SKILL.md # /team-setup:verify 로 실행
├── agents/reviewer.md
├── hooks/hooks.json       # settings 파일의 hooks와 같은 모양
└── .mcp.json
```

규칙 두 가지를 기억해요. skill과 agent 같은 구성 요소는 `.claude-plugin/` 안이 아니라 plugin 루트에 둬요. 그리고 plugin의 skill은 `/플러그인이름:skill이름`으로 불러요. 여러 plugin이 같은 이름의 skill을 가져도 부딪치지 않게 하기 위해서예요.

흐름은 네 걸음이에요.

1. 옮기기: `.claude/skills`와 `.claude/agents`를 plugin 루트로 복사하고, settings의 `hooks` 객체는 `hooks/hooks.json`으로 옮겨요.
2. 검사: `claude plugin validate ./team-setup`
3. 한 세션 시험: `claude --plugin-dir ./team-setup`
4. 배포: 저장소에 `.claude-plugin/marketplace.json`을 두면 그 저장소가 marketplace(설치 목록)가 돼요. 팀원은 `claude plugin marketplace add <조직>/<저장소>` 다음에 `claude plugin install team-setup@<marketplace 이름>`을 실행해요.

설치 범위(scope)는 셋이에요. user는 나의 모든 프로젝트, project는 그 저장소에서 일하는 모두(커밋하는 `.claude/settings.json`에 기록되고, 각자 자기 컴퓨터에 설치는 한 번 해야 해요), local은 그 저장소의 나만이에요.

받는 쪽의 안전도 중요해요. plugin의 hook과 MCP 서버는 설치한 사람의 사용자 권한으로, sandbox 밖에서 실행돼요. 그래서 설치하기 전에 `hooks/hooks.json`, `.mcp.json`, `bin/` 폴더를 직접 읽어요. `claude plugin details <이름>`은 plugin에 들어 있는 구성 요소 목록을 보여 줘요.

## 직접 해 보기 (5분)
연습용 폴더에서만 해요. S24에서 만든 verify skill을 plugin으로 옮겨 봐요.

```bash
mkdir -p ~/cc-lab/s27/team-setup/.claude-plugin ~/cc-lab/s27/team-setup/skills/verify && cd ~/cc-lab/s27
echo hello > hello.txt
printf '[ "$(cat hello.txt)" = "hello" ] && echo PASS || { echo FAIL; exit 1; }\n' > test.sh
printf '# s27 lab\n\n테스트: sh test.sh\n' > README.md
```

1. 아래 매니페스트를 `team-setup/.claude-plugin/plugin.json`으로, S24의 verify 예시를 `team-setup/skills/verify/SKILL.md`로 저장하고 검사해요. 관찰: 출력의 "Provides" 아래에 `team-setup:verify`가 보이는지, 마지막 줄이 `✔ Validation passed`인지. README·LICENSE·아이콘이 없다는 안내는 Anthropic 디렉터리에 제출할 때의 점검이라 결과를 바꾸지 않아요(v2.1.332에서 직접 확인).

```json
{
  "name": "team-setup",
  "description": "우리 팀이 검증한 Claude Code 설정",
  "version": "0.1.0",
  "author": { "name": "Study FDE" }
}
```

```bash
claude plugin validate ./team-setup
```

2. `claude --plugin-dir ./team-setup`으로 시작해 `/team-setup:verify`를 실행해요. 관찰: skill 이름 앞에 plugin 이름이 붙는지, Claude가 `sh test.sh`의 출력을 증거로 보고하는지. 끝나면 "방금 실행에서 내가 직접 본 것과 Claude의 보고로만 아는 것"을 한 줄씩 적어 보세요.

## 확인 문제
1. 다음 중 가장 강한 검증을 붙여야 하는 실행은?
   - (a) 편집마다 승인하며 진행한 대화형 세션
   - (b) plan mode로 계획을 검토한 뒤 지켜보며 진행한 세션
   - (c) 예약으로 밤사이 실행된 `claude -p` 작업
2. 이름이 `team-setup`인 plugin 안의 `verify` skill을 실행하는 명령은?
   - (a) `/verify`
   - (b) `/team-setup:verify`
   - (c) `/plugin verify`
3. plugin의 `skills/` 폴더를 두는 올바른 위치는?
   - (a) `.claude-plugin/skills/`
   - (b) plugin 루트 바로 아래의 `skills/`
   - (c) `~/.claude/` 바로 아래
4. (서술형) Claude가 긴 무감독 실행 끝에 "모든 테스트가 통과했습니다"라고만 보고했어요. 이 보고가 왜 부족한지, 무엇을 요구할지 써 보세요.
5. (상황형) 고객사 팀장이 말해요. "FDE님이 쓰는 설정이 좋던데 우리 개발자 마흔 명이 다 쓰게 해 주세요. 그런데 보안팀은 외부 plugin 설치를 걱정해요." 어떤 순서로 진행하고 보안팀에는 무엇을 보여 줄까요?

## FDE 관점
FDE의 일은 내가 떠난 뒤에도 고객팀이 같은 품질로 일하게 만드는 거예요. 파일럿 동안 고객 저장소에서 다듬은 CLAUDE.md, 검증 skill, 금지 규칙 hook은 plugin으로 묶는 순간 "설치 한 줄"이 되고, 이게 파일럿 계획의 "첫 사용자 그룹을 들이는 방법"에 그대로 들어가요. 검증 쪽은 성공 지표와 이어져요. 무감독 실행의 결과를 고객에게 보고할 때 "Claude가 됐다고 했어요"가 아니라 검사 출력, 리뷰 결과, 사람이 승인한 PR을 보여 줘야 지표가 믿을 만해져요. 고객의 저장소에서는 마지막 승인자를 항상 고객 쪽 사람으로 두고, 자동화가 손댈 수 있는 범위와 한도를 문서로 남겨요. plugin을 넘길 때는 보안팀이 읽을 수 있게 hook이 실행하는 명령과 MCP 서버의 주소를 README에 적어 둬요.

## 복습 카드
- Q: 검증의 세기를 정하는 원칙은? / A: 실행을 덜 지켜봤을수록 더 강하게. 무감독 실행에는 강제되는 검사, 독립 리뷰, 사람의 승인을 붙인다.
- Q: 무감독 실행 전 다섯 질문은? / A: 끝을 아는가, 스스로 검사하는가, 무엇을 건드리는가, 무엇이 멈추는가, 결과가 어디로 가고 누가 승인하는가.
- Q: Claude의 보고에서 요구할 증거는? / A: 실행한 명령과 그 출력, 또는 스크린샷. "통과했다"는 말만으로는 부족하다.
- Q: plugin 매니페스트의 위치와 필수 필드는? / A: `.claude-plugin/plugin.json`, 필수는 `name`. 구성 요소는 plugin 루트에 둔다.
- Q: plugin을 설치하기 전에 읽을 파일은? / A: `hooks/hooks.json`, `.mcp.json`, `bin/`. hook과 MCP 서버는 내 사용자 권한으로 sandbox 밖에서 실행된다.

## 영상 대본

### 장면 1 · 오늘의 질문 (약 25초)
**화면:** 아침 책상. 노트북 화면에 메시지 한 줄 "작업 완료. 모든 테스트 통과." 그 옆에 밤새 쌓인 변경 파일 40개 아이콘. 큰 글자 "안 보고 돌린 일, 무엇으로 믿을까?"
**내레이션:** 밤새 돌려 둔 작업이 끝났다고 해요. 테스트도 다 통과했대요. 그런데 나는 한 줄도 지켜보지 않았어요. 이 말을 어디까지 믿어야 할까요? 오늘은 검증하는 법과 나누는 법을 배워요.

### 장면 2 · 덜 볼수록 더 검증 (약 35초)
**화면:** 시소 하나. 왼쪽 "내가 지켜본 정도"가 내려가면 오른쪽 "검증의 세기"가 올라감. 왼쪽이 "옆에서 봄 → 가끔 봄 → 못 봄"으로 바뀔 때마다 오른쪽에 추가 올려짐.
**내레이션:** 원칙은 하나예요. 덜 지켜봤을수록 더 강하게 검증해요. 옆에서 보는 동안에는 틀리면 바로 알아채요. 자는 동안에는 아무도 말해 주지 않아요. 그 빈자리를 검증으로 채워요.

### 장면 3 · 검증의 사다리 (약 40초)
**화면:** 다섯 칸 사다리가 아래부터 켜짐: "1 프롬프트로 부탁", "2 goal — 다른 모델이 판정", "3 Stop hook — 강제", "4 쓰지 않은 리뷰어", "5 사람의 승인". 사다리 옆에 "Claude가 판단 → Claude Code가 강제 → 사람이 결정".
**내레이션:** 검증 수단을 약한 것부터 세워 볼게요. 프롬프트로 부탁하기, 다른 모델의 판정, 훅으로 강제하기예요. 그 위에 코드를 쓰지 않은 리뷰어, 맨 위에 사람의 승인이 있어요. 위로 갈수록 클로드의 말에 덜 기대요.

### 장면 4 · 말이 아니라 증거 (약 35초)
**화면:** 말풍선 "모든 테스트 통과"에 물음표. 그 옆에 터미널 조각: 실행한 명령 한 줄과 통과 개수가 찍힌 출력. 터미널 조각에 체크 표시.
**내레이션:** 어느 단계에서든 증거를 받아요. 통과했다는 말만으로는 알 수 있는 게 거의 없어요. 실행한 명령과 그 출력을 보여 달라고 해요. 보지 않은 실행에서는 그게 유일한 증거예요.

### 장면 5 · 떠나기 전 다섯 질문 (약 40초)
**화면:** 문 앞에 체크리스트 다섯 줄이 차례로 체크됨: "끝이 무엇인가", "스스로 검사하나", "무엇을 건드리나", "무엇이 멈추나", "누가 승인하나". 다 체크되면 문이 열림.
**내레이션:** 떠나기 전에 다섯 가지를 물어요. 끝이 무엇인가. 스스로 검사하는가. 무엇을 건드리는가. 무엇이 멈추는가. 결과를 누가 승인하는가. 하나라도 비면 아직 떠날 때가 아니에요.

### 장면 6 · 작게 시작하기 (약 30초)
**화면:** 파일 200개 더미에서 3개만 꺼내 먼저 실행. 결과 하나에 엑스 표시가 뜨고 프롬프트가 고쳐진 뒤 나머지 197개가 흘러감.
**내레이션:** 새 자동화는 작게 시작해요. 파일 세 개로 먼저 돌려 보고, 무엇이 틀어지는지 본 다음 프롬프트를 고쳐요. 그러고 나서 나머지를 돌려요. 처음 몇 번은 지켜본 뒤에 맡겨요.

### 장면 7 · 믿게 된 설정을 상자에 (약 40초)
**화면:** ".claude" 폴더에서 카드 네 장이 나와 상자 하나로 들어감: "skills", "agents", "hooks", "MCP 서버". 상자 겉면에 이름표 "plugin.json — team-setup". 상자가 닫힘.
**내레이션:** 믿게 된 설정은 나눌 차례예요. 스킬, 서브에이전트, 훅, 엠씨피 서버를 한 상자에 담은 것이 플러그인이에요. 상자에는 이름표 파일이 붙고, 그 이름이 스킬을 부를 때 앞에 붙어요.

### 장면 8 · 검사하고, 시험하고, 올리기 (약 40초)
**화면:** 컨베이어 벨트 세 단계: "검사(validate)" 도장, "한 세션 시험", "marketplace에 등록". 벨트 끝에서 팀원 아이콘 여러 명이 같은 상자를 하나씩 받아 감.
**내레이션:** 순서는 세 단계예요. 먼저 검사 명령으로 형식을 확인해요. 다음에 한 세션에만 불러서 시험해요. 마지막으로 설치 목록인 마켓플레이스에 올려요. 그러면 팀원은 명령 한 줄로 같은 설정을 받아요.

### 장면 9 · 받는 쪽의 안전과 고객 현장 (약 35초)
**화면:** 상자를 받는 사람이 돋보기로 안의 파일 세 개를 봄: "hooks.json", ".mcp.json", "bin". 옆에 경고 꼬리표 "내 권한으로 실행됨". 화면이 고객사 회의실로 바뀌고 보안팀 앞에 같은 세 파일이 펼쳐짐.
**내레이션:** 플러그인의 훅은 설치한 사람의 권한으로 실행돼요. 그래서 설치 전에 훅과 서버 설정 파일을 직접 읽어요. 고객사에 넘길 때는 무엇이 실행되는지 적어서 보안팀에 함께 건네요.

### 장면 10 · 요약과 예고 (약 30초)
**화면:** 세 줄 요약: "1. 덜 볼수록 더 검증 2. 말이 아니라 증거, 마지막 승인은 사람 3. 믿게 된 설정은 plugin으로". 아래에 "다음: S28 MCP 구조 — 클라이언트와 서버". 배경에 클로드 상자와 바깥 시스템 상자들이 선으로 이어지는 그림이 흐릿하게 나타남.
**내레이션:** 정리할게요. 덜 볼수록 더 검증해요. 말이 아니라 증거를 받고, 마지막 승인은 사람이 해요. 믿게 된 설정은 플러그인으로 나눠요. 다음 시간에는 클로드를 고객의 시스템에 잇는 엠씨피의 구조를 배워요.

## 정답과 해설
1. (c). 사람이 한 단계도 지켜보지 않았으니 강제되는 검사, 독립 리뷰, 사람의 승인이 필요해요. (a)와 (b)는 진행 중에 사람이 이미 걸러 냈어요.
2. (b). plugin의 skill에는 plugin 이름이 접두사로 붙어요.
3. (b). `.claude-plugin/` 안에 넣은 구성 요소는 로드되지 않아요. 그 폴더에는 매니페스트(배포할 때는 marketplace 파일도)만 두고 구성 요소는 plugin 루트에 둬요.
4. 예시 답: 보지 않은 실행에서 Claude의 요약은 주장일 뿐이라 어떤 명령을 돌렸는지, 몇 개가 통과했는지, 건너뛴 테스트가 있는지 알 수 없다. 실행한 명령과 그 출력을 그대로 붙이게 하고, 가능하면 Claude가 아닌 쪽의 확인을 더한다. 예를 들어 CI의 실행 결과, `/code-review` 같은 독립 리뷰, 그리고 사람의 머지 승인이다.
5. 예시 답: 순서는 (1) 검증된 설정을 plugin으로 묶어 `claude plugin validate`로 검사하고, (2) 고객사의 비공개 저장소에 `marketplace.json`과 함께 올려 고객이 소유하는 marketplace로 만들고, (3) 몇 명의 첫 사용자 그룹이 먼저 설치해 써 본 뒤, (4) 저장소 단위의 project 범위 설치나 조직의 managed settings로 넓힌다. 보안팀에는 plugin이 "외부 것"이 아니라 고객 저장소 안의 읽을 수 있는 파일이라는 점을 설명하고, `hooks/hooks.json`이 실행하는 명령, `.mcp.json`의 서버, `claude plugin details`의 구성 요소 목록을 보여 준다. 조직이 marketplace를 허용 목록으로 제한할 수 있다는 점도 알린다.

## 출처
모두 2026-11-27에 마크다운판(주소 끝 `.md`)으로 열어 확인했어요.
- Claude Code Docs, Best practices for Claude Code (검사 수단의 단계, 증거 요구, 무감독 실행 전 다섯 질문, 작게 시작하기): https://code.claude.com/docs/en/best-practices.md
- Claude Code Docs, Keep Claude working toward a goal (별도 평가 모델): https://code.claude.com/docs/en/goal.md
- Claude Code Docs, Hooks reference (`Stop` hook): https://code.claude.com/docs/en/hooks.md
- Claude Code Docs, Review locally with /code-review (대화를 보지 않은 서브에이전트의 리뷰): https://code.claude.com/docs/en/code-review-local.md
- Claude Code Docs, Code Review (PR 리뷰, 승인·차단을 하지 않음): https://code.claude.com/docs/en/code-review.md
- Claude Code Docs, Run Claude Code programmatically (`--permission-prompts none`, `permission_denials`): https://code.claude.com/docs/en/headless.md
- Claude Code Docs, Plugins overview (plugin의 정의, marketplace, 설치 범위, 조직 통제): https://code.claude.com/docs/en/plugins/overview.md
- Claude Code Docs, Create a Claude Code plugin (매니페스트, 레이아웃, `validate`, `--plugin-dir`, 기존 `.claude/` 옮기기): https://code.claude.com/docs/en/plugins/create.md
- Claude Code Docs, Install and manage plugins (marketplace 추가, 설치 명령, scope): https://code.claude.com/docs/en/plugins/install.md
- Claude Code Docs, Publish and distribute a plugin (자체 marketplace, 설치 안내): https://code.claude.com/docs/en/plugins/publish.md
- Claude Code Docs, Plugin security and trust (plugin이 할 수 있는 일, 설치 전 검토): https://code.claude.com/docs/en/plugins/security.md
- 공식 학습 경로 개요(코스 7의 학습 목표와 섹션): 이 폴더의 `_official-outline-2026-11-27.txt`. 공식 사이트는 직접 열지 않았어요.
- "실행 방식별 최소 검증" 표와 영상의 숫자(파일 40개, 200개)는 설명용으로 만든 것이에요. `claude plugin validate`의 출력은 Claude Code v2.1.332에서 예시 plugin으로 직접 실행해 확인했어요.
