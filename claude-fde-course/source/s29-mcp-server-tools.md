---
session: S29
course: "C8 Introduction to Model Context Protocol"
official_sections: ["MCP fundamentals & server development"]
title: "서버 만들기: tools와 MCP Inspector"
minutes: 25
status: draft
---

# S29. 서버 만들기: tools와 MCP Inspector

## 오늘의 목표
- 파이썬 SDK로 도구(tool) 두 개를 가진 MCP 서버를 만들 수 있다.
- 함수의 이름, 설명글, 타입 힌트가 각각 도구 정의의 어느 부분이 되는지 설명할 수 있다.
- MCP Inspector로 서버를 띄워 도구를 호출해 보고, 오류가 났을 때 어디를 볼지 말할 수 있다.

## 핵심 정리

### 함수에 꼬리표 하나 붙이면 도구가 된다
S12에서는 도구를 쓰려면 이름, 설명, 입력 스키마를 JSON으로 직접 적었죠. MCP 파이썬 SDK에서는 평범한 함수 위에 `@mcp.tool()`이라는 꼬리표(데코레이터)만 붙이면 돼요. SDK가 함수에서 세 가지를 읽어 가요.
- 함수 **이름** → 도구 이름
- 함수 첫 줄의 **설명글**(docstring) → Claude가 읽는 도구 설명
- 인자의 **타입 힌트**(`doc_id: str`) → 입력 스키마

S28의 2번 단계(`tools/list`)에서 서버가 돌려주는 내용이 바로 이 셋이에요. 그래서 설명글은 주석이 아니라 Claude에게 주는 사용 설명서예요.

### 문서 관리 서버 (이 코스 내내 쓸 예제)
준비: 파이썬 3.11 이상과 `uv`가 필요해요. 빈 폴더에서 `uv init` 후 `uv add "mcp[cli]"`.

```python
# server.py
from mcp.server import MCPServer
from mcp.server.mcpserver.exceptions import ToolError

mcp = MCPServer("docs")

docs = {
    "report.md": "3분기 매출은 전 분기보다 12% 늘었습니다.",
    "plan.md": "파일럿은 고객지원팀 10명으로 시작합니다.",
}


@mcp.tool()
def read_doc(doc_id: str) -> str:
    """문서 ID로 문서 내용을 읽는다. 예: report.md"""
    if doc_id not in docs:
        raise ToolError(f"문서 {doc_id}가 없습니다.")
    return docs[doc_id]


@mcp.tool()
def edit_doc(doc_id: str, old_text: str, new_text: str) -> str:
    """문서에서 old_text를 찾아 new_text로 바꾼다."""
    if doc_id not in docs:
        raise ToolError(f"문서 {doc_id}가 없습니다.")
    if old_text not in docs[doc_id]:
        raise ToolError("바꿀 문장을 문서에서 찾지 못했습니다.")
    docs[doc_id] = docs[doc_id].replace(old_text, new_text)
    return f"{doc_id} 수정 완료"


if __name__ == "__main__":
    mcp.run()
```

- `mcp.run()`은 인자가 없으면 stdio로 서버를 띄워요.
- 실패는 문자열로 돌려주지 말고 `ToolError`를 **raise** 하세요. 그래야 결과에 오류 표시가 붙고, Claude가 메시지를 읽고 다른 인자로 다시 시도해요.
- stdio 서버에서는 `print()`를 쓰지 마세요. 표준 출력이 곧 통신선이라 메시지가 깨질 수 있어요. 기록은 `logging`으로 남겨요.

예전 자료에는 `from mcp.server.fastmcp import FastMCP`가 나와요. SDK v2에서 이름이 `MCPServer`로 바뀌었고 데코레이터 쓰는 법은 그대로예요. 공식 강의 영상이 어느 버전 기준인지는 (확인 필요).

### MCP Inspector로 시험하기
Inspector는 서버를 시험하는 공식 개발 도구예요. Claude 없이 서버만 따로 눌러 볼 수 있어요.

```bash
uv run mcp dev server.py
```

출력된 주소를 브라우저에서 열어요(Inspector는 Node.js 앱이라 `npx`가 깔려 있어야 해요). **Tools** 탭에서 `read_doc`을 고르면 타입 힌트로 만든 입력 폼이 보여요. `doc_id`에 `plan.md`를 넣고 실행하면 결과가 나와요. **Protocol** 탭에는 실제로 오간 JSON-RPC 메시지가 그대로 보여서, S28의 `tools/list`와 `tools/call`을 눈으로 확인할 수 있어요.

## 직접 해 보기 (5분)
1. 위 `server.py`를 만들고 `uv run mcp dev server.py`로 Inspector를 여세요. `read_doc`에 없는 문서 ID(`nope.md`)를 넣어 보고, 오류 메시지가 어떻게 돌아오는지 보세요.
2. Claude Code에 붙여 보세요: `claude mcp add docs -- uv run --with "mcp[cli]" mcp run /절대/경로/server.py`. 세션에서 `/mcp`로 연결을 확인한 뒤 "plan.md에서 10명을 20명으로 바꿔 줘"라고 해 보세요. Claude가 어떤 도구를 어떤 순서로 부르는지 관찰하세요.

## 확인 문제
1. `@mcp.tool()`을 붙인 함수에서 Claude가 읽는 "도구 설명"이 되는 것은?
   - (a) 함수 이름
   - (b) 함수의 설명글(docstring)
   - (c) 함수가 돌려주는 값
2. 도구 안에서 "문서를 찾지 못했다"는 실패를 알리는 알맞은 방법은?
   - (a) `return "오류: 문서 없음"`처럼 문자열로 돌려준다
   - (b) `print()`로 화면에 찍는다
   - (c) `ToolError`를 raise 한다
3. MCP Inspector의 쓰임으로 가장 알맞은 것은?
   - (a) 서버를 고객사에 배포하는 도구
   - (b) Claude 없이 서버의 도구를 직접 호출해 보고 오간 메시지를 확인하는 개발 도구
   - (c) Claude의 답변 품질을 채점하는 도구
4. (서술형) stdio 서버에서 `print()`를 쓰면 왜 문제가 되는지, "표준 출력"이라는 말을 넣어 두세 문장으로 설명해 보세요.
5. (상황형) 고객사 개발자가 말해요. "서버를 Claude Code에 붙였는데 Claude가 edit_doc을 불러야 할 때 자꾸 안 불러요." 무엇부터 확인하고 어떻게 고치자고 할까요?

## FDE 관점
현장에서 첫 MCP 서버는 작게 시작해요. 고객 시스템의 기능 수십 개를 다 옮기지 않고, 파일럿 유스케이스에 필요한 도구 두세 개만 만들어요. 그게 "먼저 출시할 부분"이에요. 읽기 도구와 쓰기 도구는 위험이 다르니 구분해서 이야기하세요. `read_doc`은 바로 열어 줘도 되지만 `edit_doc`은 승인 절차나 권한 범위를 고객과 먼저 합의해야 해요. 그리고 Inspector는 고객 개발자에게 넘겨주기 좋은 도구예요. "Claude가 이상해요"라는 말이 나왔을 때 서버 문제인지 모델 쪽 문제인지를 Inspector에서 도구를 직접 불러 보면 금방 가를 수 있어요.

## 복습 카드
- Q: 파이썬 SDK에서 함수를 MCP 도구로 만드는 방법은? / A: `MCPServer` 객체를 만들고 함수 위에 `@mcp.tool()`을 붙인다.
- Q: SDK가 함수에서 읽어 가는 세 가지는? / A: 이름(도구 이름), 설명글(도구 설명), 타입 힌트(입력 스키마).
- Q: 도구의 실패를 Claude에게 알리는 방법은? / A: `ToolError`를 raise 한다. 문자열로 return 하면 성공처럼 보인다.
- Q: Inspector를 여는 명령은? / A: `uv run mcp dev server.py`.
- Q: stdio 서버에서 `print()`를 피하는 이유는? / A: 표준 출력이 통신선이라 메시지가 깨질 수 있어서. 기록은 `logging`으로.

## 영상 대본

### 장면 1 · 오늘의 질문 (약 25초)
**화면:** 왼쪽에 긴 JSON 도구 정의(이름, 설명, 스키마)가 스크롤됨. 오른쪽에 네 줄짜리 파이썬 함수. 가운데에 등호와 물음표. 제목 "함수 하나가 도구가 될 수 있을까?"
**내레이션:** 지난번에 도구를 쓰려면 이름과 설명, 입력 형식을 길게 적어야 했죠. 오늘은 파이썬 함수 하나로 그걸 끝내는 방법을 볼게요. 엠씨피 서버를 직접 만들어 봅니다.

### 장면 2 · 꼬리표 하나 (약 35초)
**화면:** 평범한 함수 상자가 가운데 있음. 위에서 "@mcp.tool()" 꼬리표가 내려와 붙고, 함수 상자 테두리가 초록색으로 바뀌며 "도구"라는 배지가 달림.
**내레이션:** 방법은 간단해요. 평범한 함수 위에 꼬리표 하나를 붙여요. 그러면 에스디케이가 그 함수를 도구로 등록해요. 스키마를 따로 적을 필요가 없어요.

### 장면 3 · 세 가지를 읽어 간다 (약 40초)
**화면:** 함수의 세 부분에 화살표가 하나씩 생김. 이름 → "도구 이름", 설명글 → "도구 설명", 인자 타입 → "입력 스키마". 화살표 끝이 오른쪽의 도구 카드 한 장으로 모임.
**내레이션:** 에스디케이는 함수에서 세 가지를 읽어 가요. 함수 이름은 도구 이름이 돼요. 첫 줄의 설명글은 클로드가 읽는 도구 설명이 돼요. 인자의 타입은 입력 형식이 돼요.

### 장면 4 · 문서 관리 서버 (약 40초)
**화면:** 서버 상자 안에 서랍 두 개("report.md", "plan.md"). 서랍 위에 도구 카드 두 장 "read_doc: 문서 읽기", "edit_doc: 문서 고치기".
**내레이션:** 이번 코스에서는 문서 관리 서버를 만들어요. 문서 두 개를 가지고 있고, 도구도 두 개예요. 하나는 문서를 읽고, 하나는 문서의 문장을 바꿔요. 고객사의 문서 시스템을 아주 작게 줄인 모형이에요.

### 장면 5 · 실패는 던진다 (약 40초)
**화면:** 두 갈래 길. 위쪽 길: 도구가 "오류: 문서 없음"이라는 글자를 그냥 돌려줌 → 모델이 초록 체크로 받아들임(오해). 아래쪽 길: 도구가 빨간 깃발을 올림 → 모델이 "다른 문서 이름으로 다시 해 보자"는 말풍선.
**내레이션:** 문서를 못 찾으면 어떻게 할까요? 오류 문장을 그냥 돌려주면 모델은 성공으로 알아요. 그래서 오류를 던져야 해요. 그러면 결과에 실패 표시가 붙고, 모델이 메시지를 읽고 다시 시도해요.

### 장면 6 · 인스펙터 열기 (약 35초)
**화면:** 터미널에 명령 한 줄이 입력되고, 브라우저 창이 열림. 창 위쪽에 탭 "Tools", "Resources", "Prompts", "Protocol". Tools 탭이 선택됨.
**내레이션:** 다 만들었으면 시험해 봐야죠. 엠씨피 인스펙터라는 공식 개발 도구가 있어요. 명령 한 줄이면 브라우저에 화면이 열려요. 클로드 없이 서버만 따로 눌러 볼 수 있어요.

### 장면 7 · 도구 눌러 보기 (약 40초)
**화면:** Tools 탭 안. 왼쪽 목록에서 "read_doc" 선택 → 가운데에 입력 칸 "doc_id"가 생김 → "plan.md" 입력 → 실행 버튼 → 아래에 결과 상자 "파일럿은 고객지원팀 10명으로 시작합니다."
**내레이션:** 도구를 고르면 입력 칸이 자동으로 생겨요. 아까 적은 타입으로 만든 칸이에요. 문서 이름을 넣고 실행하면 결과가 바로 보여요. 없는 문서를 넣으면 오류가 어떻게 보이는지도 확인할 수 있어요.

### 장면 8 · 오간 메시지 보기 (약 35초)
**화면:** Protocol 탭으로 전환. 메시지 두 쌍이 차례로 쌓임: "tools/list → 도구 2개", "tools/call → 결과". 지난 세션의 7단계 그림 중 2번과 5번이 반짝임.
**내레이션:** 프로토콜 탭에는 실제로 오간 메시지가 그대로 쌓여요. 지난 시간에 본 목록 요청과 호출 요청이 여기 보여요. 문제가 생기면 이 기록부터 보면 돼요.

### 장면 9 · 고객 앞에서 (약 35초)
**화면:** 고객 시스템의 기능 목록 스무 줄 중 세 줄만 형광펜으로 칠해짐. 옆에 "읽기: 바로 허용 / 쓰기: 승인 합의" 두 칸짜리 표.
**내레이션:** 현장에서는 작게 시작해요. 기능 수십 개를 다 옮기지 않고, 파일럿에 필요한 도구 두세 개만 만들어요. 읽는 도구와 고치는 도구는 위험이 달라요. 고치는 쪽은 승인 절차를 고객과 먼저 합의하세요.

### 장면 10 · 요약과 예고 (약 25초)
**화면:** 세 줄 요약: "1. 함수 + 꼬리표 = 도구 2. 이름·설명글·타입이 도구 정의가 된다 3. Inspector로 Claude 없이 시험한다". 아래에 "다음: S30 Resources와 Prompts".
**내레이션:** 정리할게요. 함수에 꼬리표를 붙이면 도구가 돼요. 이름과 설명글, 타입이 도구 정의가 돼요. 인스펙터로 서버만 따로 시험해요. 다음 시간에는 도구 말고 서버가 내줄 수 있는 두 가지를 더 볼게요.

## 정답과 해설
1. (b). 이름은 도구 이름, 타입 힌트는 입력 스키마가 되고, 설명글이 Claude가 읽는 설명이 돼요.
2. (c). 문자열로 return 하면 오류 표시가 붙지 않아 Claude가 정상 결과로 받아들여요.
3. (b). Inspector는 서버를 시험하고 디버깅하는 개발 도구예요.
4. 예시 답: stdio 방식에서는 서버의 표준 출력이 클라이언트와 메시지를 주고받는 통신선이다. `print()`는 기본으로 표준 출력에 쓰기 때문에 프로토콜 메시지 사이에 엉뚱한 글자가 끼어들어 연결이 깨질 수 있다. 그래서 기록은 표준 오류로 나가는 `logging`을 쓴다.
5. 예시 답: 먼저 Inspector에서 `edit_doc`을 직접 불러 서버가 정상인지 확인한다. 정상이면 문제는 Claude가 도구를 고르는 단계이므로 `tools/list`에 실리는 도구 이름과 설명글을 본다. 설명글에 "언제 쓰는지"와 인자의 뜻(예: old_text는 문서에 실제로 있는 문장)을 구체적으로 적고, 비슷한 도구와 헷갈리지 않게 이름을 다듬는다. 고친 뒤 같은 요청 몇 개로 다시 시험해 호출되는 비율을 본다.

## 출처
- MCP Python SDK README (설치 명령, `MCPServer`, `mcp dev`, 파이썬 3.11 이상): https://github.com/modelcontextprotocol/python-sdk
- MCP Python SDK 문서, Tools (`@mcp.tool()`, 이름·설명글·타입 힌트 → 도구 정의): https://py.sdk.modelcontextprotocol.io/servers/tools/
- MCP Python SDK 문서, Handling errors (`ToolError`를 raise 해야 하는 이유): https://py.sdk.modelcontextprotocol.io/servers/handling-errors/
- MCP Python SDK 문서, Running your server (`mcp.run()`, stdio가 기본, `mcp dev`에 `npx` 필요): https://py.sdk.modelcontextprotocol.io/run/
- MCP Python SDK 문서, Connect to a real host (Claude Code 등록 명령): https://py.sdk.modelcontextprotocol.io/get-started/real-host/
- MCP Python SDK 문서, What's new in v2 (`FastMCP` → `MCPServer` 이름 변경): https://py.sdk.modelcontextprotocol.io/whats-new/
- Build an MCP server (stdio 서버에서 `print()` 금지, `logging` 사용): https://modelcontextprotocol.io/docs/develop/build-server
- MCP Inspector, Web client (Tools·Protocol 탭이 하는 일): https://modelcontextprotocol.io/docs/tools/inspector 와 https://modelcontextprotocol.io/docs/tools/inspector/web
- 공식 학습 경로 개요(코스 8 학습 목표): 이 폴더의 `_official-outline-2026-11-27.txt`. 원본 페이지는 직접 열지 못했어요.
- 예제 코드는 위 공식 문서의 패턴대로 썼고, 함수·클래스 이름은 SDK 2.3.0 소스와 대조했어요. 다만 이 환경에서 직접 실행해 보지는 못했어요(실행 확인 필요). 문서 내용(매출 12%, 10명)은 지어낸 예시예요.
