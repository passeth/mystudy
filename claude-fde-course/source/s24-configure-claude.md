---
session: S24
course: "C7 Claude Code in Action"
official_sections: ["Configure Claude"]   # 이 섹션(레슨 4개)을 S24와 S25가 나눠 다뤄요
title: "설정: 간결한 CLAUDE.md, 지시를 둘 자리, 검증 skill"
minutes: 22
status: draft
---

# S24. 설정: 간결한 CLAUDE.md, 지시를 둘 자리, 검증 skill

## 오늘의 목표
- CLAUDE.md에 남길 줄과 뺄 줄을 두 가지 질문으로 가를 수 있다.
- 규칙 하나를 CLAUDE.md, rules, skill, hook, settings 중 맞는 자리에 놓고 이유를 말할 수 있다.
- 반복하는 절차를 skill로 포장하고, 첫 skill로 검증 skill을 만드는 이유를 설명할 수 있다.

## 핵심 정리

CLAUDE.md는 새로 온 동료의 책상에 붙여 두는 메모 한 장과 같아요. 한 장일 때는 다 읽지만, 열 장이 되면 중요한 줄이 묻혀요. S21에서 CLAUDE.md가 무엇인지 봤으니, 오늘은 "Claude가 실제로 따르는" 설정으로 다듬어요.

### 줄이는 기준: Claude가 볼 수 없는 것만
CLAUDE.md는 매 세션에 통째로 로드돼요. 그래서 모든 줄이, 관계없는 작업에서도 Claude의 주의를 조금씩 가져가요. 공식 문서가 권하는 시험은 질문 두 개예요. 코드를 읽으면 찾을 수 있나? 실제로 찾아볼까? 둘 다 "예"면 빼요. 남길 것은 이런 줄이에요.

- 이 저장소에서 작업을 확인하는 명령: 테스트, 타입체크, 린트, 파일 하나만 테스트하는 법
- 코드가 오해를 부르는 곳: 곳곳에 있지만 새 코드가 따라 하면 안 되는 옛 패턴
- 저장소에 없는 결정: 배포 방식, 리뷰가 필요한 변경
- 이미 두 번 고쳐 준 것

```markdown
# Commands
- Run one test file: pnpm vitest run path/to/file.test.ts
- Typecheck: pnpm tsc --noEmit

# Conventions
- src/legacy/ is still live but don't copy its patterns into new code

# Gotchas
- Integration tests need DATABASE_URL set, see .env.example
```

(공식 문서의 예를 줄인 거예요.) 길이는 파일당 200줄 미만이 목표예요. `/init`으로 초안을 만들면 그 뒤의 일은 대부분 줄을 지우는 거예요. `/doctor`는 코드에서 알 수 있는 내용을 덜어내자고 제안하고, `/doctor prompt-audit`은 낡았거나 서로 부딪치는 지시를 찾아 줘요. 파일이 실제로 로드됐는지는 `/context all`로 확인해요. 어떤 줄을 계속 놓친다면 IMPORTANT를 덧붙일 게 아니라 파일을 줄이거나 그 줄의 자리를 옮겨요.

### 지시를 둘 자리 고르기
지시는 두 종류예요. Claude가 읽고 판단하는 지시(비결정적)와 Claude Code가 반드시 실행하는 설정(결정적)이에요.

| 자리 | 언제 적용되나 | 누가 지키나 | 맞는 내용 |
|---|---|---|---|
| `CLAUDE.md` | 매 세션 로드 | Claude가 판단 | 검증 명령, 핵심 관례 |
| `.claude/rules/` | 매 세션. `paths:`를 붙이면 일치하는 파일을 다룰 때만 | Claude가 판단 | 한 폴더나 언어에만 해당하는 규칙 |
| skill | 설명만 늘 보이고, 본문은 호출되거나 관련 있을 때 로드 | Claude가 판단 | 여러 단계 절차, 참고 자료 |
| hook | 정해진 이벤트마다 | Claude Code가 강제 | 예외 없는 단계(편집 뒤 포매터) |
| settings의 권한 규칙 | 도구를 호출할 때마다 | Claude Code가 강제 | 읽기나 실행 금지(`.env` 읽기 금지) |

고르는 요령은 이래요. "거의 항상"이면 충분한 지침은 위 세 줄에, "한 번도 어기면 안 되는" 규칙은 아래 두 줄에 둬요. 반대도 마찬가지예요. 취향일 뿐인 것을 hook으로 걸어 놨다면 지우고 Claude에게 맡겨요.

파일 위치는 적용 대상도 정해요. `~/.claude/settings.json`과 `.claude/settings.local.json`은 나에게만, 커밋한 `.claude/settings.json`은 그 저장소에서 일하는 모두에게, managed settings는 조직 전체에 적용돼요. hook과 권한 규칙을 쓰는 법은 S25에서 다뤄요.

### 반복 절차는 skill로, 첫 skill은 검증
같은 절차를 채팅에 세 번째 붙여 넣고 있다면 skill로 옮길 때예요. S22에서 본 대로 skill은 `.claude/skills/<이름>/SKILL.md` 파일이에요. 설명(description)만 매 세션 컨텍스트에 있고 본문은 쓸 때만 읽히니까, 긴 절차도 다른 작업에 부담을 주지 않아요. 릴리스처럼 부작용이 있는 절차에는 `disable-model-invocation: true`를 넣어서 사람이 `/이름`을 쳐야만 실행되게 해요.

왜 검증부터일까요? Claude는 일이 "끝난 것처럼 보일 때" 멈춰요. 통과인지 실패인지 돌려주는 검사가 있으면 Claude가 고치고, 돌리고, 다시 고치는 고리를 스스로 닫아요. Claude Code에는 번들 skill `/verify`가 있어요. 앱을 빌드하고 실행해서 변경이 실제로 동작하는지 확인하고, 통한 방법을 `.claude/skills/verify/SKILL.md`에 기록할 수 있어요. 또 세션을 시작할 때 프로젝트나 개인 위치에 `verify`라는 이름의 skill이 있으면, Claude Code의 커밋 지침이 커밋 직전에 그 skill을 실행하라고 Claude에게 알려 줘요(v2.1.286 이상, 문서나 테스트만 바꾼 경우는 제외).

직접 쓴다면 이런 모양이에요. 형식은 공식 문서를 따랐고 본문은 학습용 예시예요.

```markdown
---
name: verify
description: 코드 변경을 마친 뒤 이 저장소의 검사를 실행하고 증거를 보고한다. 변경을 끝냈을 때와 커밋하기 전에 사용한다.
---
1. README에 적힌 테스트 명령을 실행한다.
2. 실패하면 출력을 읽고 고친 뒤 다시 실행한다.
3. 실행한 명령과 출력의 끝부분을 그대로 보고한다. "통과했다"는 말만 쓰지 않는다.
```

skill의 frontmatter와 여러 파일 구성은 S32~S34에서 깊이 다뤄요.

## 직접 해 보기 (5분)
연습용 폴더에서만 해요.

```bash
mkdir -p ~/cc-lab/s24/.claude/skills/verify && cd ~/cc-lab/s24 && git init
echo hello > hello.txt
printf '[ "$(cat hello.txt)" = "hello" ] && echo PASS || { echo FAIL; exit 1; }\n' > test.sh
printf '# s24 lab\n\n테스트: sh test.sh\n' > README.md
```

1. 위의 verify 예시를 `.claude/skills/verify/SKILL.md`로 저장하고 `claude`를 시작해요. "hello.txt의 내용을 hi로 바꿔 줘"라고 한 뒤 `/verify`를 실행해요. 문서는 저장소 루트에 기록된 verify skill이 번들 `/verify`를 대신한다고 해요. 손으로 쓴 파일도 똑같이 대신하는지는 이 실습에서 직접 확인해 보세요(확인 필요). 관찰: Claude가 `sh test.sh`를 돌리는지, 실패를 보고 변경을 되돌리는지 테스트를 고치는지, 마지막에 명령과 출력을 증거로 보여 주는지. 어느 쪽이 옳은지는 사람이 정해 줘야 한다는 점도 느껴 보세요.
2. 같은 세션에서 `/init`을 실행해 CLAUDE.md 초안을 받아요. 줄마다 두 질문("코드를 읽으면 찾을 수 있나? 실제로 찾아볼까?")을 던져 지울 줄에 표시해 보세요. 그다음 `/context all`에서 Memory files 목록에 파일이 보이는지 확인해요.

## 확인 문제
1. CLAUDE.md에 남기기에 가장 알맞은 줄은?
   - (a) 디렉터리 구조 전체를 설명하는 문단
   - (b) 테스트 파일 하나만 실행하는 정확한 명령
   - (c) "코드를 깔끔하게 정리할 것"
2. "generated 폴더의 파일은 절대 편집하지 않는다"처럼 예외가 하나도 없어야 하는 규칙을 둘 자리는?
   - (a) CLAUDE.md에 IMPORTANT를 붙여서
   - (b) hook이나 deny 권한 규칙
   - (c) skill 본문
3. skill의 frontmatter에 `disable-model-invocation: true`를 넣으면?
   - (a) Claude는 스스로 실행하지 못하고, 사용자가 `/이름`으로 실행한다
   - (b) 사용자는 실행하지 못하고 Claude만 실행한다
   - (c) skill 본문이 매 세션 처음부터 로드된다
4. (서술형) `src/api/` 아래 파일을 고칠 때만 필요한 규칙이 열두 줄 있어요. 어디에 두고, 왜 그 자리가 CLAUDE.md보다 나은지 써 보세요.
5. (상황형) 고객사 리드 개발자가 말해요. "우리 CLAUDE.md가 600줄인데 Claude가 규칙을 자꾸 무시해요. 중요한 건 대문자로 다 강조해 놨는데도요." 무엇이 문제라고 설명하고, 어떤 순서로 고치자고 제안할까요?

## FDE 관점
고객 저장소에 들어가서 첫 주에 하는 일 중 하나가 설정 정리예요. 고객팀이 이미 만든 CLAUDE.md가 길다면 함께 줄이고, 팀의 "작업을 확인하는 명령"을 찾아 검증 skill로 만들어 두면 이후의 긴 세션이 스스로 검사하며 굴러가요. `.claude/settings.json`과 `.claude/skills/`는 커밋하는 순간 그 저장소의 모든 사람에게 적용되니, 남의 저장소에서는 반드시 PR로 올려 고객 엔지니어의 리뷰를 받아요. 검증 skill이 확인하는 기준은 파일럿 계획과도 이어져요. "이 검사를 통과하면 완료"라는 합의가 곧 만들기 전에 정하는 성공 지표의 작은 판이에요. 그리고 어떤 규칙이 "예외 없음"인지 고객에게 물어 두면 S25에서 그 규칙을 hook과 deny 규칙으로 옮길 수 있어요.

## 복습 카드
- Q: CLAUDE.md에 줄을 남길지 정하는 두 질문은? / A: 코드를 읽으면 찾을 수 있나? 실제로 찾아볼까? 둘 다 "예"면 뺀다.
- Q: CLAUDE.md의 권장 길이는? / A: 파일당 200줄 미만. 길수록 컨텍스트를 쓰고 따르는 정도가 떨어진다.
- Q: Claude가 판단하는 자리와 Claude Code가 강제하는 자리는? / A: 판단은 CLAUDE.md·rules·skill, 강제는 hook·권한 규칙·managed settings.
- Q: 한 폴더에만 해당하는 규칙을 두는 곳은? / A: `.claude/rules/`의 파일에 `paths:`를 붙인다. 일치하는 파일을 다룰 때만 로드된다.
- Q: 첫 skill로 검증 skill을 권하는 이유는? / A: Claude는 끝난 것처럼 보이면 멈춘다. 통과·실패를 돌려주는 검사가 있어야 스스로 고리를 닫는다.

## 영상 대본

### 장면 1 · 오늘의 질문 (약 25초)
**화면:** 길게 스크롤되는 문서 "CLAUDE.md — 600줄". 중간의 한 줄 "generated 폴더 편집 금지"가 다른 줄들에 묻혀 흐려짐. 큰 글자 "적어 놨는데 왜 안 따를까?"
**내레이션:** 규칙을 분명히 적어 놨는데 클로드가 따르지 않아요. 더 크게 강조하면 될까요? 아니에요. 오늘은 클로드가 실제로 따르는 설정을 만드는 법을 배워요.

### 장면 2 · 메모 한 장의 원리 (약 30초)
**화면:** 책상 위 메모 한 장에서 모든 줄이 또렷함. 메모가 열 장으로 늘어나면서 글자가 작아지고 흐려짐. 아래에 "매 세션, 모든 줄이 함께 로드됨".
**내레이션:** 클로드 엠디는 세션마다 통째로 읽혀요. 그래서 모든 줄이 매번 주의를 조금씩 가져가요. 한 장짜리 메모는 다 읽지만 열 장이 되면 중요한 줄이 묻혀요. 짧을수록 잘 따라요.

### 장면 3 · 남길 줄, 뺄 줄 (약 40초)
**화면:** 줄 하나가 관문 두 개를 지나감: "코드를 읽으면 찾을 수 있나?", "실제로 찾아볼까?". 둘 다 "예"면 휴지통으로. 통과해 남는 줄 네 개: "확인 명령", "오해하기 쉬운 곳", "저장소에 없는 결정", "두 번 고쳐 준 것".
**내레이션:** 기준은 질문 두 개예요. 코드를 읽으면 찾을 수 있나요? 실제로 찾아볼까요? 둘 다 그렇다면 빼요. 남는 건 확인 명령, 오해하기 쉬운 곳, 저장소에 없는 결정 같은 것이에요.

### 장면 4 · 두 종류의 지시 (약 35초)
**화면:** 화면이 좌우로 나뉨. 왼쪽 "Claude가 읽고 판단" 아래 말풍선 아이콘. 오른쪽 "Claude Code가 반드시 실행" 아래 톱니바퀴 아이콘. 가운데 저울이 "거의 항상"과 "예외 없음"을 가리킴.
**내레이션:** 지시는 두 종류예요. 클로드가 읽고 판단하는 지시는 대부분 따르지만 보장은 없어요. 클로드 코드가 실행하는 설정은 반드시 지켜져요. 거의 항상이면 되는지, 예외가 없어야 하는지부터 물어요.

### 장면 5 · 다섯 자리 (약 45초)
**화면:** 선반 다섯 칸이 차례로 켜짐. 위 세 칸(판단): "CLAUDE.md — 매 세션", "rules — 해당 파일을 다룰 때", "skill — 필요할 때". 아래 두 칸(강제): "hook — 이벤트마다", "권한 규칙 — 도구 호출마다". 규칙 카드 세 장이 각자 맞는 칸으로 날아감.
**내레이션:** 자리는 다섯 곳이에요. 매번 알아야 하면 클로드 엠디, 한 폴더에만 해당하면 규칙 파일, 여러 단계 절차는 스킬이에요. 예외 없는 단계는 훅으로, 금지는 권한 규칙으로 강제해요.

### 장면 6 · 강조 대신 자리 옮기기 (약 30초)
**화면:** "편집 금지!!!"에 느낌표가 계속 붙다가 멈추고, 그 줄이 CLAUDE.md에서 빠져 아래 칸 "hook"으로 이동. 반대로 "이름 붙이기 취향" 카드가 hook 칸에서 CLAUDE.md로 올라감.
**내레이션:** 강조를 덧붙여도 클로드가 놓친다면 그 줄은 자리가 틀린 거예요. 강제하는 자리로 옮겨요. 반대도 있어요. 취향일 뿐인 걸 훅으로 걸어 놨다면 지우고 클로드에게 맡겨요.

### 장면 7 · 절차는 스킬로 (약 35초)
**화면:** 채팅창에 같은 긴 절차가 세 번 붙여 넣어짐. 세 번째에 그 절차가 접혀 파일 아이콘 "SKILL.md"가 됨. 파일 겉면에는 설명 한 줄만 보이고, 호출될 때 본문이 펼쳐짐.
**내레이션:** 같은 절차를 세 번째 붙여 넣고 있다면 스킬로 옮길 때예요. 스킬은 평소에 설명 한 줄만 보이고 본문은 쓸 때만 읽혀요. 그래서 긴 절차를 담아도 다른 작업에 부담이 없어요.

### 장면 8 · 첫 스킬은 검증 (약 40초)
**화면:** 원형 고리: "고친다 → 검사 실행 → 실패 출력 읽기 → 다시 고친다 → 통과". 고리 가운데 "verify". 고리 밖에 사람 아이콘이 처음엔 가까이 있다가 뒤로 물러남.
**내레이션:** 클로드는 일이 끝난 것처럼 보이면 멈춰요. 통과인지 실패인지 알려 주는 검사가 있어야 스스로 고치고 다시 확인해요. 그래서 첫 스킬은 검증 스킬이에요. 검사를 돌리고 그 출력을 증거로 보고하게 해요.

### 장면 9 · 고객 저장소에서 (약 35초)
**화면:** 고객 저장소 그림 위에 PR 창. 변경 파일 세 개: "CLAUDE.md (600줄 → 80줄)", ".claude/skills/verify/SKILL.md", ".claude/settings.json". 아래에 고객 엔지니어의 승인 표시.
**내레이션:** 고객 저장소에서는 설정도 코드처럼 다뤄요. 커밋한 설정은 그 저장소의 모든 사람에게 적용되니까요. 그래서 줄인 클로드 엠디와 검증 스킬을 피알로 올려 고객 엔지니어의 리뷰를 받아요.

### 장면 10 · 요약과 예고 (약 25초)
**화면:** 세 줄 요약: "1. Claude가 볼 수 없는 것만 남긴다 2. 지침은 판단의 자리, 예외 없는 규칙은 강제의 자리 3. 절차는 skill로, 첫 skill은 검증". 아래에 "다음: S25 권한 모드와 hooks".
**내레이션:** 정리할게요. 클로드 엠디에는 클로드가 볼 수 없는 것만 남겨요. 지침과 예외 없는 규칙은 자리가 달라요. 절차는 스킬로, 검증부터 만들어요. 다음 시간에는 권한 모드와 훅을 다뤄요.

## 정답과 해설
1. (b). Claude가 코드에서 바로 알기 어렵고 매번 필요한 정보예요. (a)는 저장소를 읽으면 알 수 있고, (c)는 확인할 수 없을 만큼 모호해요.
2. (b). CLAUDE.md는 컨텍스트일 뿐 강제되는 설정이 아니에요. 예외가 없어야 하면 Claude Code가 실행하는 hook이나 deny 규칙에 둬요.
3. (a). Claude가 스스로 호출하지 못하고 사용자가 `/이름`으로만 실행해요. (b)는 `user-invocable: false`의 설명이에요.
4. 예시 답: `.claude/rules/api.md`를 만들고 frontmatter의 `paths:`에 `src/api/**` 같은 패턴을 적는다. 일치하는 파일을 다룰 때만 로드되므로, 관계없는 작업에서는 컨텍스트와 주의를 쓰지 않고 CLAUDE.md는 짧게 유지된다.
5. 예시 답: 문제는 강조가 부족해서가 아니라 길이와 자리다. 매 세션 600줄이 로드되면 줄마다 주의가 흩어지고, 대문자 강조는 규칙을 과하게 적용하게 만들 뿐이다. 순서는 (1) `/doctor`와 두 질문으로 코드에서 알 수 있는 내용을 지워 200줄 아래로 줄이고, (2) 특정 폴더용 규칙은 `.claude/rules/`에 `paths:`를 붙여 옮기고, (3) 긴 절차는 skill로 옮기고, (4) 예외가 없어야 하는 규칙은 hook이나 deny 규칙으로 옮긴다. 마지막으로 `/doctor prompt-audit`으로 서로 부딪치는 지시를 확인한다.

## 출처
모두 2026-11-27에 마크다운판(주소 끝 `.md`)으로 열어 확인했어요.
- Claude Code Docs, Best practices for Claude Code (두 질문, 짧은 CLAUDE.md 예, 결정적·비결정적 지시, skill과 검사): https://code.claude.com/docs/en/best-practices.md
- Claude Code Docs, How Claude remembers your project (CLAUDE.md 위치, 200줄 기준, `.claude/rules/`, `/doctor prompt-audit`): https://code.claude.com/docs/en/memory.md
- Claude Code Docs, Extend Claude Code (CLAUDE.md·rules·skill·hook 비교표): https://code.claude.com/docs/en/features-overview.md
- Claude Code Docs, Extend Claude with skills (SKILL.md 형식, frontmatter, `/verify`, 커밋 전 verify 실행): https://code.claude.com/docs/en/skills.md
- Claude Code Docs, Settings files and precedence (설정 파일별 적용 대상): https://code.claude.com/docs/en/settings.md
- Claude Code Docs, Commands (`/init`, `/doctor`, `/context`, `/verify`): https://code.claude.com/docs/en/commands.md
- 공식 학습 경로 개요(코스 7의 학습 목표와 섹션): 이 폴더의 `_official-outline-2026-11-27.txt`. 공식 사이트는 직접 열지 않았어요.
- 본문의 verify skill 본문과 영상의 "600줄 → 80줄"은 설명용 예시예요.
