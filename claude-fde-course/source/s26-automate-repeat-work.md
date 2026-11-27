---
session: S26
course: "C7 Claude Code in Action"
official_sections: ["Automate Repeat Work"]
title: "반복 작업 자동화: 자율 세션, worktree, routines, headless, PR 리뷰"
minutes: 25
status: draft
---

# S26. 반복 작업 자동화: 자율 세션, worktree, routines, headless, PR 리뷰

## 오늘의 목표
- `/goal`과 `/loop`의 차이를 "다음 턴을 무엇이 시작하나"로 설명하고, 평가자가 판정할 수 있는 조건을 쓸 수 있다.
- 병렬 세션을 git worktree로 격리하고, 새 체크아웃에서 생기는 함정을 말할 수 있다.
- 예약 실행, headless 실행, PR 리뷰 가운데 상황에 맞는 방식을 고르고 각각의 통제 지점을 짚을 수 있다.

## 핵심 정리

자동화는 "누가 다음 턴을 시작하게 하느냐"의 문제예요. Claude는 한번 시작한 일을 끝까지 끌고 갈 수 있지만 스스로 시작하지는 못해요. 시작은 사람, 타이머, 이벤트 가운데 하나가 해요. 오늘은 그 세 가지를 세션 안, 세션 밖, PR 위의 순서로 봐요.

### 세션 안에서 계속 돌리기: /goal과 /loop

| 방식 | 다음 턴이 시작되는 때 | 멈추는 때 |
|---|---|---|
| `/goal <조건>` | 이전 턴이 끝나면 바로 | 별도 모델이 조건이 충족됐거나 불가능하다고 판정할 때, 또는 `/goal clear` |
| `/loop <간격> <프롬프트>` | 정한 시간 간격이 지날 때 | 내가 멈추거나 loop가 스스로 끝날 때. 반복 작업은 만든 지 30일 뒤 만료 |

`/goal`은 턴이 끝날 때마다 작고 빠른 별도 모델에게 "조건이 충족됐나"를 묻고, 아니면 Claude에게 다음 턴을 시작시켜요. S25의 `Stop` hook을 세션 한정으로 간편하게 쓰는 방법이에요. 이 평가자는 명령을 실행하거나 파일을 읽지 않고 대화에 드러난 것만 봐요. 그래서 조건은 Claude의 출력이 증명할 수 있게 써요. 측정할 수 있는 끝 상태 하나, 확인 방법, 지켜야 할 제약을 넣어요.

```text
/goal all tests in test/auth pass and the lint step is clean
```

끝없이 도는 걸 막으려면 조건에 `or stop after 20 turns` 같은 절을 붙여요. goal은 권한 모드를 바꾸지 않으니, 사람 없이 돌리려면 auto mode에서 실행해요.

`/loop 5m check the deploy`처럼 간격을 주면 고정 주기로 돌고, 간격을 빼면 Claude가 대기 시간을 골라요. 세션이 열려 있을 때만 동작해요.

### 병렬은 worktree로 격리하기
두 세션이 같은 폴더를 고치면 편집이 부딪쳐요. `claude --worktree feature-auth`(짧게 `-w`)는 `.claude/worktrees/feature-auth/`에 별도 체크아웃을 만들고 `worktree-feature-auth` 브랜치에서 세션을 시작해요. Claude Code는 이 세션이 메인 체크아웃의 파일을 Edit·Write 하거나 그쪽에서 명령을 실행하는 걸 막아요. 알아 둘 함정은 세 가지예요.

- worktree는 새 체크아웃이라 `.env` 같은 gitignore 파일과 설치된 의존성이 없어요. 필요한 작은 파일은 저장소 루트의 `.worktreeinclude`에 적어 두면 복사돼요.
- `.gitignore`에 `.claude/worktrees/`를 추가해요.
- 대화형 세션은 종료할 때 변경이 없으면 worktree를 지우고, 있으면 어떻게 할지 물어요. `claude -p --worktree`로 만든 것은 직접 `git worktree remove`로 지워요.

큰 기계적 변경은 `/batch`가 작업을 5~30개 단위로 나눠 각각 worktree에서 돌려요.

### 세션 밖에서 시작하기: 예약과 headless
이름부터 정리해요. 코스 목표의 "routines"를 현재 공식 문서는 **cloud scheduled task**(예전 이름 routines)라고 불러요. 연구 프리뷰 단계이고, 주소 `claude.ai/code/routines`와 명령 별칭 `/routines`에 옛 이름이 남아 있어요.

| | 클라우드 scheduled task | Desktop scheduled task | `/loop` |
|---|---|---|---|
| 실행되는 곳 | Anthropic 클라우드 | 내 컴퓨터 | 내 컴퓨터 |
| 컴퓨터가 켜져 있어야 하나 | 아니요 | 예 | 예 |
| 열린 세션이 필요한가 | 아니요 | 아니요 | 예 |
| 로컬 파일 접근 | 없음(매번 새로 클론) | 있음 | 있음 |
| 최소 간격 | 1시간 | 1분(입력 폼에서는 1시간) | 1분 |

클라우드 task는 프롬프트, 저장소, 커넥터를 묶어 저장한 설정이에요. `/schedule daily PR review at 9am`처럼 만들고, 트리거는 일정, API 호출, GitHub 이벤트 세 가지를 붙일 수 있어요. 실행은 auto mode로 시작하고, 변경은 따로 지시하지 않으면 `claude/`로 시작하는 브랜치에 푸시해요. task는 만든 사람의 개인 계정에 속하고 커밋과 PR도 그 사람의 GitHub 신원으로 올라가요.

스크립트나 CI에서는 headless 실행인 `claude -p`를 써요. 프로그램이 읽을 결과가 필요하면 출력 형식을 정해요.

```bash
claude -p "Extract the main function names from auth.py" \
  --output-format json \
  --json-schema '{"type":"object","properties":{"functions":{"type":"array","items":{"type":"string"}}},"required":["functions"]}' \
  | jq '.structured_output'
```

`--output-format json`은 답(`result`)과 `session_id`, 비용 추정(`total_cost_usd`) 같은 메타데이터를 한 객체로 돌려줘요. `--json-schema`를 더하면 스키마에 맞는 값이 `structured_output` 필드에 담겨요. Claude가 요청을 거절하면 이 필드가 없을 수 있으니 스크립트에서 먼저 확인해요. 범위는 S25의 `--allowedTools`와 `--permission-mode dontAsk`로, 한도는 `--max-turns`와 `--max-budget-usd`로 걸어요.

### PR에 연결하기

| | Code Review (관리형 서비스) | Claude Code GitHub Action |
|---|---|---|
| 시작 | PR 생성이나 푸시(저장소별 설정), 또는 `@claude review` 코멘트 | 내 워크플로의 이벤트, 또는 `@claude` 멘션 |
| 실행되는 곳 | Anthropic 인프라 | 내 CI 러너 |
| 필요한 것 | Team·Enterprise 플랜, 조직 Owner가 켜기 | API 키나 OAuth 토큰을 GitHub Secret으로 |
| 하는 일 | 여러 에이전트가 찾고, 검증 단계가 오탐을 거르고, 심각도 순으로 인라인 코멘트. 저장소 접근은 읽기 전용 | 리뷰뿐 아니라 구현과 커밋 푸시, 프롬프트를 준 자동화 |

Code Review는 그 자체로 PR을 승인하거나 막지 않아요. 무엇을 지적할지는 저장소의 `CLAUDE.md`와 리뷰 전용 `REVIEW.md`로 조정해요. GitHub Action(`anthropics/claude-code-action@v1`)은 Claude Code에서 `/install-github-app`으로 설치하면 워크플로 파일과 시크릿을 잡아 줘요. 워크플로에 `prompt` 입력이 없으면 `@claude` 멘션을 기다리고, 있으면 멘션 없이 그 프롬프트를 실행해요. 내 브랜치를 올리기 전에 로컬에서 보는 리뷰는 `/code-review`예요.

## 직접 해 보기 (5분)
연습용 폴더에서만 해요. worktree는 커밋이 하나 이상 있어야 만들 수 있어요.

```bash
mkdir -p ~/cc-lab/s26 && cd ~/cc-lab/s26 && git init
printf '# s26 lab\n\n연습용 저장소입니다. 삭제해도 됩니다.\n' > README.md
echo '.claude/worktrees/' > .gitignore
git add . && git commit -m "start"
```

1. headless 실행을 해 봐요. 관찰: 답이 어느 필드에 들어 있는지, 비용 추정이 얼마로 나오는지.

```bash
claude -p "README.md를 한 문장으로 요약해 줘" --output-format json | jq '{result, session_id, total_cost_usd}'
```

2. 이 폴더에서 `claude`를 한 번 실행해 폴더 신뢰 대화상자를 수락하고 나온 뒤, `claude --worktree try-a`로 다시 시작해요. "NOTES.md를 만들고 한 줄 써 줘"라고 시키고, 다른 터미널에서 `git worktree list`와 `ls .claude/worktrees/`를 실행해요. 관찰: 새 파일이 메인 폴더가 아니라 worktree 안에 생기는지, 세션을 끝낼 때 Claude Code가 worktree를 어떻게 할지 묻는지.

더 해 보고 싶다면 worktree 세션에서 `/goal NOTES.md에 세 줄이 있고 cat 출력으로 확인했다, 또는 5턴 뒤에 멈춘다`를 실행하고 평가자의 판정이 대화에 어떻게 찍히는지 보세요.

## 확인 문제
1. `/goal`에서 조건이 충족됐는지는 누가, 무엇을 보고 판정하나요?
   - (a) 작업 중인 Claude가 스스로 판단한다
   - (b) 별도의 작은 모델이 대화에 드러난 내용을 보고 판정한다
   - (c) Claude Code가 테스트 명령을 직접 실행해 확인한다
2. 노트북을 닫아 둔 밤에도 매일 실행돼야 하는 저장소 점검에 맞는 방식은?
   - (a) `/loop 24h`
   - (b) 클라우드 scheduled task
   - (c) Desktop scheduled task
3. `claude -p`에 `--output-format json`과 `--json-schema`를 함께 주면 스키마에 맞춘 결과는 어디에 담기나요?
   - (a) `result` 필드
   - (b) `structured_output` 필드
   - (c) 표준 오류(stderr)
4. (서술형) 같은 저장소에서 Claude 세션 두 개를 동시에 돌리려고 해요. worktree가 왜 필요한지, 쓸 때 조심할 점 두 가지를 써 보세요.
5. (상황형) 고객사 팀장이 말해요. "모든 PR을 Claude가 자동으로 리뷰하게 해 주세요. 워크플로 파일을 우리가 관리하고 싶지는 않아요. 그리고 리뷰에서 문제가 없으면 자동으로 머지되는 거죠?" 어떤 방식을 권하고, 무엇을 바로잡아 설명할까요?

## FDE 관점
자동화는 내가 보지 않을 때 고객 저장소에서 도는 일이에요. 그래서 켜기 전에 고객과 세 가지를 정해요. 어디까지 건드릴 수 있는지(허용 목록, worktree, 푸시할 수 있는 브랜치), 무엇이 멈추는지(턴과 비용 한도), 결과가 어디로 가서 누가 승인하는지예요. 클라우드 scheduled task는 만든 사람의 개인 계정으로 돌고 그 사람 이름으로 커밋하니, 고객사에서는 누구 계정으로 돌릴지와 `main`을 보호하는 브랜치 규칙을 먼저 확인해요. 새 자동화는 처음 몇 번을 지켜본 뒤에 맡겨요. headless 실행의 JSON에는 실행마다 비용 추정이 들어 있어서, 이걸 모아 두면 파일럿의 기준선과 비교할 실행당 비용 자료가 돼요. PR 리뷰를 붙일 때는 "리뷰는 승인이 아니다"를 분명히 하고 사람의 머지 승인을 그대로 둬요.

## 복습 카드
- Q: `/goal`의 평가자는 무엇을 볼 수 있나? / A: 대화에 드러난 내용만. 명령을 실행하거나 파일을 읽지 않으므로 조건은 Claude의 출력이 증명할 수 있게 쓴다.
- Q: `claude --worktree <이름>`이 만드는 것은? / A: `.claude/worktrees/<이름>/`의 별도 체크아웃과 `worktree-<이름>` 브랜치.
- Q: routines의 현재 공식 이름은? / A: cloud scheduled task. `/schedule`로 만들고 `/routines`는 별칭이다.
- Q: headless 실행에서 스키마에 맞춘 결과가 담기는 필드는? / A: `structured_output`. `--output-format json`과 `--json-schema`를 함께 쓴다.
- Q: 관리형 Code Review가 하지 않는 일은? / A: PR을 승인하거나 막는 일, 커밋을 푸시하는 일. 인라인 코멘트와 요약, 체크 런을 남긴다.

## 영상 대본

### 장면 1 · 오늘의 질문 (약 25초)
**화면:** 밤 시간의 책상. 닫힌 노트북 옆에 "매일 밤 테스트 점검", "PR마다 리뷰", "파일 200개 이전"이라고 적힌 쪽지 세 장. 큰 글자 "같은 일을 매번 내가 시켜야 할까?"
**내레이션:** 매일 같은 점검을 시키고, 피알마다 같은 리뷰를 부탁하고 있나요? 클로드는 일을 끝까지 끌고 갈 수 있어요. 하지만 스스로 시작하지는 못해요. 오늘은 시작을 자동으로 만드는 법을 배워요.

### 장면 2 · 시작하는 세 가지 (약 30초)
**화면:** 시작 버튼 하나에 세 개의 손이 차례로 닿음: 사람 아이콘, 시계 아이콘, 번개 모양의 이벤트 아이콘. 아래에 지도처럼 세 구역: "세션 안", "세션 밖", "PR 위".
**내레이션:** 다음 턴을 시작하는 건 셋 중 하나예요. 사람, 타이머, 이벤트예요. 오늘은 이 셋을 세 곳에서 봐요. 열려 있는 세션 안, 세션 밖, 그리고 피알 위예요.

### 장면 3 · 골과 루프 (약 40초)
**화면:** 왼쪽에 결승선 깃발 "goal: 조건이 충족될 때까지", 턴이 끝날 때마다 작은 심판 아이콘이 깃발을 확인. 오른쪽에 시계 "loop: 5분마다", 시계가 돌 때마다 같은 프롬프트가 다시 실행됨.
**내레이션:** 세션 안에는 두 가지가 있어요. 골은 조건을 주면 충족될 때까지 턴을 이어 가요. 턴이 끝날 때마다 별도의 작은 모델이 심판을 봐요. 루프는 시간 간격마다 같은 프롬프트를 다시 실행해요.

### 장면 4 · 심판이 볼 수 있는 조건 (약 35초)
**화면:** 심판 아이콘 앞에 대화 기록만 놓여 있고 터미널에는 가림막. 조건 카드 두 장: 흐릿한 "잘 고쳐질 때까지"에는 엑스 표시, "테스트 통과 출력이 대화에 보인다, 20턴 뒤에는 멈춘다"에는 체크 표시.
**내레이션:** 이 심판은 명령을 직접 돌리지 않아요. 대화에 보이는 것만 봐요. 그래서 조건은 클로드의 출력으로 증명되게 써요. 측정할 수 있는 끝 상태 하나와 확인 방법을 넣고, 턴 한도도 붙여요.

### 장면 5 · 병렬은 따로 떨어진 작업대에서 (약 40초)
**화면:** 하나의 저장소 줄기에서 가지 두 개가 뻗어 각각 별도 작업대(폴더)가 됨. 작업대마다 클로드 세션 하나. 두 작업대 사이에 칸막이. 한쪽 작업대에 빈 상자 ".env 없음"과 메모 ".worktreeinclude".
**내레이션:** 두 세션이 같은 폴더를 고치면 부딪쳐요. 워크트리는 세션마다 별도의 작업 폴더와 브랜치를 줘요. 다만 새 폴더라서 환경 파일과 설치한 패키지가 없어요. 필요한 파일은 복사 목록에 적어 둬요.

### 장면 6 · 예약의 세 자리 (약 40초)
**화면:** 세 칸 비교: "클라우드 — 컴퓨터 꺼도 실행, 매번 새 클론", "데스크톱 — 내 컴퓨터, 로컬 파일 접근", "loop — 열린 세션 안에서만". 클라우드 칸 위에 작은 꼬리표 "예전 이름: routines".
**내레이션:** 세션 밖에서는 예약을 써요. 클라우드 예약 작업은 컴퓨터를 꺼도 돌아요. 예전 이름은 루틴이에요. 데스크톱 예약은 내 컴퓨터에서 돌아 로컬 파일을 쓸 수 있어요. 루프는 세션이 열려 있을 때만 돌아요.

### 장면 7 · 헤드리스와 구조화된 출력 (약 40초)
**화면:** 스크립트 상자에서 클로드 상자로 화살표, 돌아오는 화살표에 정돈된 카드: "결과", "세션 번호", "비용 추정". 카드가 다음 스크립트 단계로 들어감. 옆에 울타리 두 개: "허용 목록", "턴·비용 한도".
**내레이션:** 스크립트에서는 화면 없이 한 번 실행하고 끝내는 방식을 써요. 결과를 제이슨으로 받으면 다음 프로그램이 읽을 수 있어요. 스키마를 주면 그 모양에 맞춰 줘요. 허용 목록과 한도는 꼭 같이 걸어요.

### 장면 8 · PR에 붙이는 두 가지 (약 40초)
**화면:** PR 화면 하나. 왼쪽에서 "관리형 Code Review"가 인라인 코멘트를 붙임(꼬리표 "읽기 전용, 승인도 차단도 안 함"). 오른쪽에서 "GitHub Action"이 멘션에 답하고 커밋을 올림(꼬리표 "내 CI 러너에서 실행").
**내레이션:** 피알에는 두 가지를 붙일 수 있어요. 관리형 코드 리뷰는 피알마다 코멘트를 달아요. 읽기만 하고 승인도 차단도 하지 않아요. 깃허브 액션은 내 씨아이에서 돌고, 멘션에 답하거나 커밋까지 올려요.

### 장면 9 · 고객 저장소에서 (약 35초)
**화면:** 체크리스트 세 줄이 차례로 체크됨: "어디까지 건드리나", "무엇이 멈추나", "결과는 누가 승인하나". 옆에 보호 표시가 붙은 main 브랜치와, 실행 기록 표에 쌓이는 "실행당 비용".
**내레이션:** 자동화를 켜기 전에 고객과 세 가지를 합의해요. 어디까지 건드리는지, 무엇이 멈추는지, 결과를 누가 승인하는지예요. 처음 몇 번은 지켜보고 맡겨요. 실행마다 남는 비용 기록은 파일럿의 근거가 돼요.

### 장면 10 · 요약과 예고 (약 25초)
**화면:** 세 줄 요약: "1. 세션 안: goal은 조건, loop는 간격 2. 병렬은 worktree로 격리 3. 세션 밖: 예약·headless·PR 리뷰, 항상 범위와 한도와 승인자". 아래에 "다음: S27 검증과 공유".
**내레이션:** 정리할게요. 세션 안에서는 골과 루프로 이어 가요. 병렬은 워크트리로 나눠요. 세션 밖에서는 예약과 헤드리스, 피알 리뷰를 써요. 다음 시간에는 안 보고 돌린 일을 어떻게 믿을지 다뤄요.

## 정답과 해설
1. (b). `/goal`은 턴이 끝날 때마다 조건과 대화를 작고 빠른 모델에 보내 판정을 받아요. 이 평가자는 도구를 쓰지 않아서 (c)처럼 직접 실행하지 못해요.
2. (b). 클라우드 scheduled task는 Anthropic 클라우드에서 돌아 컴퓨터가 꺼져 있어도 실행돼요. (a)와 (c)는 내 컴퓨터가 켜져 있어야 해요.
3. (b). 메타데이터와 함께 `structured_output` 필드에 담겨요. `result`는 일반 텍스트 답이 들어가는 필드예요.
4. 예시 답: 두 세션이 같은 작업 폴더를 고치면 편집이 서로 부딪치므로, worktree로 세션마다 별도 체크아웃과 브랜치를 준다. 조심할 점은 (1) 새 체크아웃이라 `.env` 같은 gitignore 파일과 의존성이 없으니 `.worktreeinclude`와 설치 단계를 준비하는 것, (2) `.claude/worktrees/`를 `.gitignore`에 넣고, `-p --worktree`로 만든 것은 자동으로 정리되지 않으니 `git worktree remove`로 직접 지우는 것이다.
5. 예시 답: 워크플로 파일을 관리하지 않고 모든 PR을 리뷰하려면 관리형 Code Review가 맞다. Team이나 Enterprise 플랜이어야 하고, Claude 조직의 Owner가 켜야 하며, GitHub 조직 소유자가 Claude GitHub App을 설치해야 한다고 알린다. 바로잡을 점은 자동 머지다. Code Review는 그 자체로 PR을 승인하거나 막지 않고 인라인 코멘트와 요약을 남기며, 지적이 없다고 코드에 문제가 없다는 뜻도 아니다. 그래서 사람의 머지 승인과 브랜치 보호는 그대로 두고, 팀의 리뷰 기준은 `REVIEW.md`에 적자고 제안한다. 프롬프트와 트리거를 직접 통제하고 싶어지면 그때 GitHub Action을 검토한다.

## 출처
모두 2026-11-27에 마크다운판(주소 끝 `.md`)으로 열어 확인했어요.
- Claude Code Docs, Keep Claude working toward a goal (`/goal`, 평가 방식, 조건 쓰는 법): https://code.claude.com/docs/en/goal.md
- Claude Code Docs, Run prompts on a schedule (`/loop`, 예약 방식 비교표, 만료): https://code.claude.com/docs/en/scheduled-tasks.md
- Claude Code Docs, Automate work with scheduled tasks (cloud scheduled task·예전 이름 routines, 트리거, 브랜치, 권한): https://code.claude.com/docs/en/routines.md
- Claude Code Docs, Run parallel sessions with worktrees (`--worktree`, 격리 검사, `.worktreeinclude`, 정리): https://code.claude.com/docs/en/worktrees.md
- Claude Code Docs, Run agents in parallel (병렬 방식 비교, `/batch`): https://code.claude.com/docs/en/agents.md
- Claude Code Docs, Run Claude Code programmatically (`-p`, `--output-format`, `--json-schema`, `structured_output`): https://code.claude.com/docs/en/headless.md
- Claude Code Docs, CLI reference (`--max-turns`, `--max-budget-usd`, `--worktree`): https://code.claude.com/docs/en/cli-reference.md
- Claude Code Docs, Code Review (관리형 리뷰의 단계, 요건, 접근 범위, 비교표): https://code.claude.com/docs/en/code-review.md
- Claude Code Docs, Set up Code Review (리뷰 실행 시점 설정): https://code.claude.com/docs/en/code-review-setup.md
- Claude Code Docs, Customize Code Review (`CLAUDE.md`와 `REVIEW.md`): https://code.claude.com/docs/en/code-review-customize.md
- Claude Code Docs, Review locally with /code-review: https://code.claude.com/docs/en/code-review-local.md
- Claude Code Docs, Claude Code GitHub Actions (`/install-github-app`, 두 실행 모드, 워크플로 예): https://code.claude.com/docs/en/github-actions.md
- Claude Code Docs, Best practices for Claude Code (무인 실행, 예약, 병렬): https://code.claude.com/docs/en/best-practices.md
- Claude Code Docs, Common workflows (worktree에는 커밋이 하나 이상 필요): https://code.claude.com/docs/en/common-workflows.md
- 공식 학습 경로 개요(코스 7의 학습 목표와 섹션): 이 폴더의 `_official-outline-2026-11-27.txt`. 공식 사이트는 직접 열지 않았어요.
- Desktop scheduled task의 내용은 위 비교표에서만 확인했고, 전용 문서는 열지 않았어요.
