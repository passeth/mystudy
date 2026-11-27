---
session: S25
course: "C7 Claude Code in Action"
official_sections: ["Configure Claude"]   # 이 섹션(레슨 4개)을 S24와 S25가 나눠 다뤄요
title: "권한 모드와 hooks로 규칙 강제하기"
minutes: 25
status: draft
---

# S25. 권한 모드와 hooks로 규칙 강제하기

## 오늘의 목표
- 여섯 가지 권한 모드를, 직접 검토하는 작업부터 무인 파이프라인까지 일에 맞게 고를 수 있다.
- deny·ask·allow 규칙의 평가 순서와, 규칙이 모드보다 앞선다는 점을 설명할 수 있다.
- hook이 종료 코드와 결정 JSON으로 도구 호출과 턴 종료를 막는 방식을 읽고 쓸 수 있다.

## 핵심 정리

권한 모드는 "얼마나 자주 물어볼지"를 정하는 다이얼이고, deny 규칙과 hook은 다이얼을 어디에 두든 서 있는 가드레일이에요. S24에서 지시의 자리를 나눴으니, 오늘은 Claude Code가 강제하는 쪽을 다뤄요.

### 일에 맞는 권한 모드
S19에서는 네 가지 모드(Manual, Accept edits, Plan, Auto)를 써 봤어요. 전체는 여섯 가지이고, 나머지 둘이 사람 없는 실행과 관련돼요.

| 모드 | 묻지 않고 하는 일 | 맞는 일 |
|---|---|---|
| `default` (화면 표시는 Manual) | 작업 폴더 안의 파일 읽기 | 민감한 작업, 낯선 코드 |
| `acceptEdits` | 읽기, 파일 편집, 흔한 파일 명령(`mkdir`, `mv`, `cp` 등) | 내가 검토하면서 반복할 때 |
| `plan` | 읽기. auto mode를 쓸 수 있으면 분류기가 승인한 탐색 명령도 | 바꾸기 전에 살펴볼 때 |
| `auto` | 전부. 별도의 분류기(classifier) 모델이 실행 전에 검사 | 긴 작업, 프롬프트 피로 줄이기 |
| `dontAsk` | 읽기와 미리 허용한 도구만. 물어봐야 할 호출은 거부 | 잠가 둔 CI와 스크립트 |
| `bypassPermissions` | 전부 | 격리된 컨테이너와 VM에서만 |

알아 둘 점이 세 가지 있어요.

- 시작 모드: v2.1.283 이상에서 대화형 터미널과 VS Code 세션은 기본적으로 auto mode로 시작해요. `claude -p` 실행은 Manual로 시작하고(v2.1.302 이상), 승인이 필요한 호출은 허용 규칙이나 hook이 없으면 거부돼요.
- 전환: 세션 중에는 `Shift+Tab`, 시작할 때는 `claude --permission-mode <모드>`예요. `dontAsk`는 순환에 나오지 않아 직접 지정해요.
- auto mode의 분류기는 판단이지 규칙이 아니에요. `curl | bash`나 force push 같은 것을 기본으로 막지만 틀릴 수 있어요. "절대 안 됨"은 deny 규칙이나 hook에 둬요.

무인 파이프라인의 기본형은 허용 목록과 `dontAsk`의 조합이에요.

```bash
claude -p "run the test suite" --permission-mode dontAsk --allowedTools "Bash(npm test)" "Read"
```

### 권한 규칙: deny가 먼저다
`permissions`의 규칙은 deny, ask, allow 순서로 평가하고 먼저 맞은 것이 결과예요. deny 규칙은 auto와 `bypassPermissions`를 포함한 모든 모드에서 유지돼요.

```json
{
  "permissions": {
    "allow": ["Bash(pnpm tsc --noEmit)"],
    "ask": ["Bash(git push *)"],
    "deny": ["Read(./.env)", "Read(./secrets/**)"]
  }
}
```

규칙은 의도가 아니라 도구 호출에 맞춰져요. 위의 `Read` 규칙은 `cat .env`까지는 잡지만, 그 파일을 여는 스크립트는 잡지 못해요. 파일과 네트워크를 운영체제 수준에서 막으려면 `/sandbox`를 함께 켜요.

### hook: 건너뛸 수 없는 규칙
S22에서 hook이 종료 코드 2로 행동을 막는 것까지 봤어요. 오늘은 그 안을 들여다봐요. hook의 설정은 세 겹이에요. 이벤트(`PreToolUse`, `PostToolUse`, `Stop` 등)를 고르고, matcher로 어떤 도구인지 거르고, 실행할 핸들러를 적어요. 명령 hook은 이벤트 정보를 stdin의 JSON으로 받고(`tool_name`, `tool_input` 등), 결과를 두 방식 중 하나로 돌려줘요.

방식 1, 종료 코드예요.

| 종료 코드 | 뜻 |
|---|---|
| 0 | 성공. 출력한 JSON이 있으면 적용하고, 아무것도 없으면 "결정 없음"이라 평소 권한 흐름을 따름 |
| 2 | 차단. stderr에 쓴 글이 이유로 Claude에게 전달됨 |
| 그 밖(1 포함) | 비차단 오류. 동작은 그대로 진행됨 |

그래서 정책을 강제하는 hook은 반드시 `exit 2`를 써요. 경로 오타나 충돌로 hook 자체가 실패해도 막고 싶다면 핸들러에 `"onFailure": "block"`을 붙여요(v2.1.295 이상).

방식 2, 종료 코드 0과 함께 stdout에 결정 JSON을 출력해요.

- `PreToolUse`: `hookSpecificOutput` 안의 `permissionDecision`에 `allow`, `deny`, `ask`, `defer` 중 하나를, `permissionDecisionReason`에 이유를 써요. 여러 hook의 결정이 엇갈리면 deny > defer > ask > allow 순으로 이겨요.
- `Stop`, `PostToolUse` 등: 최상위에 `"decision": "block"`과 `"reason"`을 써요.

한 hook에서는 두 방식 중 하나만 써요. `PreToolUse` hook이 편집을 거부할 때 출력하는 JSON은 이런 모양이에요. 이 hook을 거는 설정과 스크립트 전체는 아래 "직접 해 보기"에 있어요.

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "protected/ 폴더는 hook이 막았어요."
  }
}
```

`Stop` 이벤트에 걸면 루프를 제어해요. Claude가 턴을 끝내려 할 때 hook이 `exit 2`를 내면 턴이 끝나지 않고, stderr의 내용이 "아직 끝낼 수 없는 이유"로 돌아가요. 아래는 타입체크가 통과할 때까지 끝내지 못하게 하는 공식 문서의 예예요.

```json
{
  "hooks": {
    "Stop": [
      { "hooks": [ { "type": "command", "command": "pnpm tsc --noEmit 1>&2 || exit 2" } ] }
    ]
  }
}
```

도구 호출 없이 여덟 번 연속으로 막으면 Claude Code가 다음 차단을 무시하고 턴을 끝내요. 무한 반복을 막는 안전장치예요.

우선순위도 기억해요. hook의 deny는 `bypassPermissions`를 포함한 모든 모드에서 유지돼요. 반대로 hook의 allow는 설정의 deny 규칙과 ask 규칙을 넘지 못해요. 그리고 `Edit|Write`에 건 hook은 셸 명령으로 하는 변경까지는 막지 못하니, 중요한 경로는 deny 규칙과 sandbox를 겹쳐요. 등록된 hook은 `/hooks`로 확인해요.

## 직접 해 보기 (5분)
연습용 폴더에서만 해요. `jq`가 설치돼 있어야 해요.

```bash
mkdir -p ~/cc-lab/s25/.claude/hooks ~/cc-lab/s25/protected && cd ~/cc-lab/s25 && git init
echo keep > protected/keep.txt && echo draft > notes.txt
```

1. 아래 설정을 `.claude/settings.json`으로, 스크립트를 `.claude/hooks/protect.sh`로 저장하고 `chmod +x .claude/hooks/protect.sh`를 실행해요. `Edit`나 `Write` 도구가 호출되기 전에 스크립트가 실행되고, 경로에 `protected/`가 있으면 거부 결정을 돌려줘요.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/protect.sh" }
        ]
      }
    ]
  }
}
```

```bash
#!/bin/bash
# .claude/hooks/protect.sh
FILE_PATH=$(jq -r '.tool_input.file_path // empty')

if [[ "$FILE_PATH" == *"protected/"* ]]; then
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "protected/ 폴더는 hook이 막았어요."
    }
  }'
else
  exit 0   # 결정 없음: 평소 권한 흐름대로
fi
```

Claude를 띄우기 전에 터미널에서 스크립트만 먼저 시험해요. 관찰: 아래 첫 줄은 deny JSON을 출력하고, 둘째 줄은 아무것도 출력하지 않는지.

```bash
echo '{"tool_input":{"file_path":"protected/keep.txt"}}' | .claude/hooks/protect.sh
echo '{"tool_input":{"file_path":"notes.txt"}}' | .claude/hooks/protect.sh; echo "exit=$?"
```

2. `claude`를 시작해 폴더 신뢰 대화상자를 수락하고 `/hooks`로 등록을 확인해요. "notes.txt에 한 줄 추가해 줘"와 "protected/keep.txt에 한 줄 추가해 줘"를 차례로 시켜요. 관찰: 두 번째 요청에서 Claude가 어떤 이유를 전달받았다고 말하는지. `Shift+Tab`으로 모드를 바꿔도 결과가 같은지.

## 확인 문제
1. 고객사 CI에서 사람 없이 테스트만 돌리게 할 때 가장 알맞은 설정은?
   - (a) `--dangerously-skip-permissions`로 모든 확인을 끈다
   - (b) `--permission-mode dontAsk`에 `--allowedTools`로 필요한 명령만 허용한다
   - (c) `--permission-mode acceptEdits`만 준다
2. 정책을 강제하려던 `PreToolUse` hook이 아무 출력 없이 `exit 1`로 끝났어요. 어떻게 되나요?
   - (a) 도구 호출이 차단된다
   - (b) 비차단 오류로 처리되어 도구 호출은 진행된다
   - (c) 세션이 종료된다
3. 같은 도구 호출에 `PreToolUse` hook 하나는 `allow`를, 다른 하나는 `deny`를 돌려줬어요. 결과는?
   - (a) 먼저 실행된 hook의 결정을 따른다
   - (b) `allow`가 이겨 실행된다
   - (c) `deny`가 이겨 차단된다
4. (서술형) "`.env`는 읽지 않는다"를 CLAUDE.md에 쓰는 것, deny 규칙으로 두는 것, `PreToolUse` hook으로 거는 것의 차이를 두세 문장으로 설명해 보세요.
5. (상황형) 고객사 보안 담당자가 물어요. "auto mode가 위험한 건 알아서 막는다면서요. 그럼 프로덕션 마이그레이션 폴더 금지 같은 규칙은 따로 안 만들어도 되죠?" 어떻게 답하고 무엇을 제안할까요?

## FDE 관점
고객 저장소에서는 신뢰가 쌓이는 만큼만 다이얼을 올려요. 첫날은 Manual이나 plan mode로 코드를 익히고, 검토하며 반복할 때는 acceptEdits, 긴 작업은 auto mode, 사람이 없는 실행은 허용 목록을 둔 dontAsk, `bypassPermissions`는 버려도 되는 컨테이너에서만 써요. 킥오프에서 고객의 "절대 안 됨" 목록을 받아 deny 규칙과 hook으로 옮기고 PR로 올리면 보안팀이 리뷰할 수 있는 통제가 돼요. 이 목록이 파일럿의 위험 관리 항목이기도 해요. 반대 방향의 안전도 챙겨요. command hook은 내 사용자 권한으로 실행되고, `claude -p`는 폴더 신뢰 대화상자 없이 저장소에 커밋된 hook을 실행해요. 그래서 남의 저장소에서 `-p`를 돌리기 전에는 `.claude/` 폴더의 설정을 먼저 읽고, 필요하면 `--bare`로 시작하거나 `--settings '{"disableAllHooks": true}'`로 hook을 꺼요.

## 복습 카드
- Q: 권한 모드 여섯 가지는? / A: `default`(Manual), `acceptEdits`, `plan`, `auto`, `dontAsk`, `bypassPermissions`.
- Q: 권한 규칙의 평가 순서는? / A: deny, ask, allow 순서. 먼저 맞은 것이 결과이고 deny는 모든 모드에서 유지된다.
- Q: hook에서 동작을 막는 종료 코드는? / A: 2. stderr가 이유로 전달된다. 1은 비차단 오류라 동작이 진행된다.
- Q: `PreToolUse` hook이 결정을 돌려주는 JSON 필드는? / A: `hookSpecificOutput.permissionDecision`(allow·deny·ask·defer)과 `permissionDecisionReason`.
- Q: `Stop` hook이 `exit 2`를 내면? / A: Claude가 턴을 끝내지 못하고 계속 일한다. 도구 호출 없이 8번 연속이면 Claude Code가 턴을 끝낸다.

## 영상 대본

### 장면 1 · 오늘의 질문 (약 25초)
**화면:** 도로 위를 달리는 자동차. 운전석 옆에 "묻는 빈도" 다이얼, 도로 양옆에 가드레일. 큰 글자 "맡기는 만큼, 무엇으로 막을까?"
**내레이션:** 클로드에게 더 많이 맡길수록 궁금해져요. 정말 안 되는 일은 무엇이 막아 줄까요? 오늘은 묻는 빈도를 정하는 권한 모드와, 건너뛸 수 없는 규칙인 훅을 배워요.

### 장면 2 · 다이얼과 가드레일 (약 30초)
**화면:** 다이얼이 "자주 묻기"에서 "거의 안 묻기"로 돌아감. 다이얼이 어디에 있든 양옆 가드레일은 그대로 서 있음. 가드레일에 이름표 두 개: "deny 규칙", "hook".
**내레이션:** 권한 모드는 얼마나 자주 물어볼지 정하는 다이얼이에요. 거부 규칙과 훅은 가드레일이에요. 다이얼을 어디에 두든 가드레일은 그 자리에 서 있어요. 둘은 역할이 달라요.

### 장면 3 · 여섯 가지 모드 (약 45초)
**화면:** 눈금 여섯 칸이 왼쪽부터 켜짐: "Manual — 매번 묻기", "acceptEdits — 편집은 통과", "plan — 읽기만", "auto — 분류기가 검사", "dontAsk — 허용한 것만", "bypassPermissions — 전부 통과(컨테이너 전용)".
**내레이션:** 모드는 여섯 가지예요. 매번 묻는 수동, 편집은 통과시키는 모드, 읽기만 하는 플랜 모드가 있어요. 오토 모드는 별도의 모델이 실행 전에 검사해요. 허용한 것만 하는 모드와 전부 통과시키는 모드도 있어요.

### 장면 4 · 일에 맞게 고르기 (약 40초)
**화면:** 상황 카드 네 장과 모드가 선으로 이어짐: "낯선 저장소 첫날 → Manual·plan", "검토하며 반복 → acceptEdits", "긴 작업 → auto", "사람 없는 CI → dontAsk + 허용 목록". 맨 끝에 빨간 테두리 "bypassPermissions → 격리된 컨테이너에서만".
**내레이션:** 기준은 일이에요. 낯선 저장소의 첫날은 수동이나 플랜 모드, 긴 작업은 오토 모드가 맞아요. 사람이 없는 씨아이에서는 허용 목록만 주고 나머지는 거부해요. 전부 통과는 버려도 되는 컨테이너에서만 써요.

### 장면 5 · 거부가 먼저다 (약 35초)
**화면:** 도구 호출 하나가 세 개의 문을 차례로 지남: "deny", "ask", "allow". 첫 문에서 맞으면 바로 멈춤. 아래에 "deny는 모든 모드에서 유지".
**내레이션:** 권한 규칙은 거부, 묻기, 허용 순서로 확인해요. 먼저 맞은 것이 결과예요. 거부 규칙은 어떤 모드에서도 유지돼요. 오토 모드의 검사는 판단이라 틀릴 수 있으니, 절대 안 되는 일은 거부 규칙에 둬요.

### 장면 6 · 훅이 끼어드는 지점 (약 35초)
**화면:** 에이전트 루프 원 위에 표시 세 곳: "도구 실행 전 (PreToolUse)", "도구 실행 후 (PostToolUse)", "멈추려 할 때 (Stop)". 각 표시에서 작은 스크립트 아이콘이 튀어나옴.
**내레이션:** 훅은 정해진 순간에 내 스크립트를 실행해요. 도구를 실행하기 전, 실행한 뒤, 그리고 클로드가 멈추려 할 때예요. 클로드가 기억하든 말든 상관없어요. 실행하는 쪽이 클로드 코드니까요.

### 장면 7 · 종료 코드 세 가지 (약 40초)
**화면:** 스크립트 상자에서 출구 세 개: "0 — 통과(결정 없음)", "2 — 차단, 이유 전달", "1 — 오류지만 그냥 진행". 세 번째 출구에 경고 표시 "정책 훅은 2를 써야 함".
**내레이션:** 스크립트는 종료 코드로 답해요. 영 번은 통과, 이 번은 차단이에요. 이 번이면 이유가 클로드에게 전달돼요. 조심할 건 일 번이에요. 오류로만 기록되고 동작은 그대로 진행돼요. 막으려면 이 번을 써요.

### 장면 8 · 결정을 글로 돌려주기 (약 40초)
**화면:** 스크립트가 종이 한 장을 내밈. 종이에 "결정: 거부 / 이유: 보호된 폴더". 옆에 결정 네 가지가 세로로: "deny > defer > ask > allow". 아래 원형 루프에서 "멈춤" 표지가 "검사 실패, 계속"으로 바뀜.
**내레이션:** 더 세밀하게는 결정을 제이슨으로 돌려줘요. 허용, 거부, 사람에게 묻기 중에 고르고 이유를 적어요. 결정이 엇갈리면 거부가 이겨요. 멈추려 할 때 거는 훅은 검사가 실패하면 클로드를 다시 일하게 해요.

### 장면 9 · 고객 저장소에서 (약 35초)
**화면:** 고객이 건넨 "절대 안 됨" 목록이 두 갈래로 나뉘어 "deny 규칙"과 "hook" 파일이 되고, PR 창에서 보안팀 승인 표시. 구석에 돋보기가 저장소의 ".claude" 폴더를 살핌.
**내레이션:** 고객에게서 절대 안 되는 일의 목록을 받아 거부 규칙과 훅으로 옮겨요. 피알로 올리면 보안팀이 검토할 수 있어요. 남의 저장소에 이미 있는 훅은 내 권한으로 실행되니 먼저 읽어 보고 돌려요.

### 장면 10 · 요약과 예고 (약 25초)
**화면:** 세 줄 요약: "1. 모드는 일에 맞춰 고르는 다이얼 2. deny와 hook은 모든 모드에서 서 있는 가드레일 3. 차단은 종료 코드 2 또는 결정 JSON". 아래에 "다음: S26 반복 작업 자동화".
**내레이션:** 정리할게요. 모드는 일에 맞춰 고르는 다이얼이에요. 거부 규칙과 훅은 어느 모드에서나 서 있는 가드레일이에요. 차단은 종료 코드 이 번이나 결정 제이슨으로 해요. 다음 시간에는 반복 작업을 자동화해요.

## 정답과 해설
1. (b). `dontAsk`는 물어봐야 할 호출을 거부하고, `--allowedTools`에 적은 것만 실행해요. (a)는 격리된 컨테이너에서만 쓰는 모드예요.
2. (b). 종료 코드 1은 유닉스의 관례적인 실패 코드지만 hook에서는 비차단 오류예요. 막으려면 `exit 2`를 쓰거나 `"onFailure": "block"`을 붙여요.
3. (c). 여러 `PreToolUse` hook의 결정은 deny > defer > ask > allow 순으로 우선해요.
4. 예시 답: CLAUDE.md의 줄은 Claude가 읽고 판단하는 지침이라 대부분 따르지만 보장은 없다. deny 규칙은 Claude Code가 도구 호출마다 적용하므로 모든 권한 모드에서 유지되지만, 규칙이 인식하는 호출 형태만 잡는다. `PreToolUse` hook은 내 스크립트가 입력을 직접 검사해 차단하므로 더 세밀한 조건을 걸 수 있고, 그 deny도 모든 모드에서 유지된다.
5. 예시 답: "auto mode는 별도 모델이 행동을 하나씩 판단하는 방식이라 대체로 잘 막지만, 판단이라서 틀릴 수 있고 조직 설정으로 꺼지거나 조정될 수도 있어요. 그래서 문서도 '절대' 규칙은 deny 규칙이나 hook에 두라고 해요"라고 답한다. 제안은 (1) 마이그레이션 폴더에 편집 deny 규칙과 `PreToolUse` hook을 걸어 `.claude/settings.json`에 커밋하고, (2) 조직 전체에 강제해야 하면 managed settings로 배포하고, (3) 셸 명령을 통한 우회까지 막아야 하면 sandbox를 함께 켜는 것이다.

## 출처
모두 2026-11-27에 마크다운판(주소 끝 `.md`)으로 열어 확인했어요.
- Claude Code Docs, Choose a permission mode (여섯 모드 표, 시작 모드, `Shift+Tab` 순환, auto mode가 막는 것, `dontAsk`·`bypassPermissions`): https://code.claude.com/docs/en/permission-modes.md
- Claude Code Docs, Configure permissions (deny → ask → allow, 규칙과 hook의 우선순위, 신뢰 전에 실행되는 것): https://code.claude.com/docs/en/permissions.md
- Claude Code Docs, Hooks reference (이벤트 목록, 종료 코드, 결정 JSON, `PreToolUse`·`Stop` 결정 제어, `onFailure`, workspace trust): https://code.claude.com/docs/en/hooks.md
- Claude Code Docs, Automate actions with hooks (보호 파일 차단 예, hook과 권한 모드의 관계, 한계): https://code.claude.com/docs/en/hooks-guide.md
- Claude Code Docs, Best practices for Claude Code (deny 규칙 예, Stop hook 예, auto mode 경고, `/sandbox`): https://code.claude.com/docs/en/best-practices.md
- Claude Code Docs, Run Claude Code programmatically (`--allowedTools`, `--permission-mode`, `--bare`): https://code.claude.com/docs/en/headless.md
- 공식 학습 경로 개요(코스 7의 학습 목표와 섹션): 이 폴더의 `_official-outline-2026-11-27.txt`. 공식 사이트는 직접 열지 않았어요.
- 본문의 `protect.sh`는 공식 예제를 줄여 고친 학습용 스크립트예요. 터미널에서 JSON을 넣어 출력과 종료 코드만 시험했고, 실제 Claude Code 세션 안에서 돌려 보지는 않았어요.
