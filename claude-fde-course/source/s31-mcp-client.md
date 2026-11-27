---
session: S31
course: "C8 Introduction to Model Context Protocol"
official_sections: ["MCP client implementation & advanced features"]
title: "클라이언트 구현: 연결, 비동기, 정리"
minutes: 25
status: draft
---

# S31. 클라이언트 구현: 연결, 비동기, 정리

## 오늘의 목표
- 파이썬 SDK의 `Client`로 MCP 서버에 연결해 도구 목록을 받고 도구를 호출할 수 있다.
- `async`/`await`와 `async with`가 왜 필요한지, 연결 정리(cleanup)를 누가 해 주는지 설명할 수 있다.
- 클라이언트가 받은 도구 목록이 어떻게 Claude API의 `tools`로 넘어가고, Claude의 도구 요청이 어떻게 서버로 돌아가는지 순서대로 말할 수 있다.

## 핵심 정리

### 이제 우리 앱이 호스트가 된다
지금까지는 Claude Code와 Inspector가 클라이언트 노릇을 대신 해 줬어요. 하지만 고객사의 사내 챗봇이나 업무 화면에 Claude와 MCP 서버를 함께 넣으려면, 그 앱이 **호스트**가 되고 안에 **클라이언트**를 직접 둬야 해요. 클라이언트는 서버 앞에 선 창구 직원 같아요. 앱이 "도구 목록 줘", "이 도구 실행해 줘"라고 하면 MCP 말로 바꿔 서버에 전해요. S15에서 API 쪽에서 MCP를 봤다면, 오늘은 연결을 우리 코드 안에서 직접 다루는 쪽이에요.

### 연결하고, 묻고, 닫기
S29의 `server.py`와 같은 폴더에 만들어요.

```python
# client.py
import asyncio

from mcp import Client, StdioServerParameters
from mcp.types import TextContent

server = StdioServerParameters(command="uv", args=["run", "server.py"])


async def main() -> None:
    async with Client(server) as client:
        listed = await client.list_tools()
        print([tool.name for tool in listed.tools])

        result = await client.call_tool("read_doc", {"doc_id": "plan.md"})
        for block in result.content:
            if isinstance(block, TextContent):
                print(block.text)


asyncio.run(main())
```

- **비동기**: `await`는 "답이 올 때까지 이 줄에서 기다리되, 그동안 프로그램 전체를 멈춰 세우지는 않겠다"는 표시예요. `await`를 쓰는 함수 앞에는 `async`를 붙여요. 서버의 응답은 언제 올지 모르니 `Client`의 메서드는 전부 이 방식이에요.
- `Client(...)`를 만드는 것만으로는 연결되지 않아요. `async with`에 **들어갈 때** 서버 프로세스를 띄우고 프로토콜 버전을 맞춰요.
- 리소스와 프롬프트도 같은 식이에요: `read_resource("docs://documents/plan.md")`, `get_prompt("summarize_doc", {"doc_id": "plan.md"})`.
- 주소(URL) 문자열을 주면 Streamable HTTP로 원격 서버에 연결해요: `Client("http://localhost:8000/mcp")`.

### 정리(cleanup)는 `async with`가 한다
stdio 서버는 내 컴퓨터에 뜬 하위 프로세스예요. 닫지 않고 앱이 끝나면 프로세스가 남을 수 있어요. `async with` 블록을 **벗어날 때** SDK가 연결을 끊고 서버 프로세스를 종료해요(입력을 닫고, 기다리고, 안 끝나면 강제 종료). 중간에 오류가 나서 빠져나가도 마찬가지예요. 그래서 따로 부를 닫기 함수가 없고, 블록이 끝난 `Client`는 다시 쓸 수 없어요. 다만 인증 헤더를 넣으려고 HTTP 클라이언트를 직접 만들어 넘겼다면, 그건 만든 사람이 닫아야 해요. 예전 자료에는 `ClientSession`을 만들고 `session.initialize()`를 직접 부르는 더 긴 방식이 나와요. 공식 강의 영상이 어느 방식인지는 (확인 필요).

### 도구를 Claude에게 건네기
여기서 S12의 도구 사용과 MCP가 만나요.

```python
listed = await client.list_tools()
tools = [
    {"name": t.name, "description": t.description, "input_schema": t.input_schema}
    for t in listed.tools
]
# 1) tools를 Claude API의 tools 파라미터로 보낸다
# 2) 응답에 tool_use 블록이 있으면 서버에 전달한다
result = await client.call_tool(tool_use.name, tool_use.input)
# 3) result.content의 글과 result.is_error를 tool_result로 Claude에게 돌려준다
```

MCP의 도구 정의(이름, 설명, 입력 스키마)가 Claude API의 도구 정의와 모양이 거의 같아서 옮겨 담기만 하면 돼요. 주의할 점 세 가지:
- 도구가 실패해도 `call_tool`은 예외를 던지지 않아요. `result.is_error`가 `True`로 와요. 이 값을 그대로 Claude에게 넘기면 Claude가 읽고 다시 시도해요.
- Claude가 도구를 계속 부를 수 있으니 반복 횟수에 상한을 두세요.
- stdio 서버 프로세스는 내 환경 변수를 물려받지 않아요. 서버에 API 키가 필요하면 `StdioServerParameters(env={...})`로 명시해서 넘겨요.

## 직접 해 보기 (5분)
1. `client.py`를 만들고 `uv run client.py`를 실행하세요. 도구 이름 두 개와 `plan.md` 내용이 찍히는지 보세요. 프로그램이 끝난 뒤 `ps aux | grep server.py`로 서버 프로세스가 남아 있지 않은지 확인하세요.
2. `doc_id`를 `nope.md`로 바꾸고 `print(result.is_error)`를 추가하세요. 프로그램이 오류로 죽지 않고 `True`가 찍히는 걸 확인하세요. 이게 왜 Claude에게 유리한지 생각해 보세요.

## 확인 문제
1. 파이썬 SDK에서 서버와의 연결이 실제로 열리는 때는?
   - (a) `Client(server)`로 객체를 만든 순간
   - (b) `async with Client(server) as client:` 블록에 들어갈 때
   - (c) 처음 `call_tool`을 부를 때
2. 서버의 도구가 `ToolError`를 냈을 때 클라이언트의 `call_tool`은?
   - (a) 파이썬 예외를 던져 프로그램이 멈춘다
   - (b) 아무것도 돌려주지 않는다
   - (c) `is_error`가 `True`인 결과를 정상적으로 돌려준다
3. 클라이언트가 받은 MCP 도구를 Claude에게 건네는 방법은?
   - (a) 도구의 이름, 설명, 입력 스키마를 Claude API의 `tools`에 옮겨 담는다
   - (b) 서버 주소를 시스템 프롬프트에 적는다
   - (c) 서버가 Claude에게 직접 도구 목록을 보낸다
4. (서술형) `async with`를 쓰면 연결 정리를 잊을 수 없는 이유를 "들어갈 때"와 "벗어날 때"라는 말을 넣어 설명해 보세요.
5. (상황형) 고객사 개발자가 물어요. "우리 사내 챗봇에 문서 서버를 붙였는데, 서버에서 쓰는 DB 비밀번호 환경 변수를 서버가 못 읽어요. 제 터미널에서는 잘 되는데요." 원인과 해결 방법을 어떻게 설명할까요?

## FDE 관점
파일럿 초반에는 Claude Code나 Claude Desktop 같은 기성 호스트에 서버만 꽂아도 충분해요. 클라이언트를 직접 만드는 건 고객이 "우리 앱 안에서 쓰고 싶다"고 할 때예요. 그때부터는 연결 수명, 오류 처리, 도구 호출 상한, 로그가 전부 고객사 코드의 책임이 돼요. 그래서 계획서에 "첫 출시는 기성 호스트로, 자체 앱 통합은 다음 단계로"처럼 범위를 나눠 적어 두면 좋아요. 자체 통합으로 넘어갈 때 고객 개발팀에 넘길 점검표도 오늘 내용에서 나와요. 연결은 `async with`로 감쌌는가, `is_error`를 Claude에게 전달하는가, 반복 상한이 있는가, 비밀 값은 `env`로 명시해 넘기는가.

## 복습 카드
- Q: 파이썬 SDK에서 서버에 연결하는 한 줄은? / A: `async with Client(StdioServerParameters(...)) as client:` (원격은 URL 문자열).
- Q: `await`를 쉬운 말로? / A: 답이 올 때까지 그 줄에서 기다리되, 프로그램 전체를 멈추지는 않는다는 표시.
- Q: stdio 서버 프로세스를 누가 종료하는가? / A: `async with` 블록을 벗어날 때 SDK가 종료한다.
- Q: MCP 도구를 Claude API에 넘길 때 옮기는 세 가지는? / A: `name`, `description`, `input_schema`.
- Q: 도구가 실패하면 `call_tool`은? / A: 예외 없이 `is_error=True`인 결과를 돌려준다.

## 영상 대본

### 장면 1 · 오늘의 질문 (약 25초)
**화면:** 왼쪽에 고객사 앱 화면(사내 챗봇), 오른쪽에 지난 시간에 만든 문서 서버. 둘 사이가 비어 있고 점선과 물음표. 제목 "우리 앱은 서버와 어떻게 대화할까?"
**내레이션:** 서버는 만들었어요. 지금까지는 클로드 코드가 대신 연결해 줬죠. 그런데 고객사 앱 안에서 쓰려면 어떻게 할까요? 오늘은 연결하는 쪽, 클라이언트를 만들어 볼게요.

### 장면 2 · 창구 직원 (약 35초)
**화면:** 앱 상자 안에 창구 직원 캐릭터("클라이언트")가 서 있음. 앱이 쪽지 "도구 목록 줘"를 건네면 직원이 봉투에 넣어 서버로 보내고, 답장을 받아 앱에 돌려줌.
**내레이션:** 클라이언트는 서버 앞에 선 창구 직원 같아요. 앱이 도구 목록을 달라고 하면, 엠씨피 말로 바꿔서 서버에 전해요. 답이 오면 다시 앱에 돌려줘요. 서버 하나에 직원 한 명이에요.

### 장면 3 · 세 걸음 (약 35초)
**화면:** 가로로 세 단계가 차례로 켜짐: "1. 연결하기", "2. 묻고 시키기", "3. 닫기". 각 단계 아래에 문, 말풍선, 자물쇠 아이콘.
**내레이션:** 클라이언트가 하는 일은 세 걸음이에요. 연결하고, 묻고 시키고, 닫아요. 연결할 때 서버를 띄우고 서로 버전을 맞춰요. 그다음 목록을 받고 도구를 불러요. 끝나면 깨끗이 닫아요.

### 장면 4 · 기다리되 멈추지 않는다 (약 40초)
**화면:** 식당 카운터 그림. 손님이 주문하고 진동벨을 받아 자리에 앉아 다른 일을 함. 벨이 울리면 음식을 받으러 감. 벨에 "await"라고 적혀 있음.
**내레이션:** 서버의 답은 언제 올지 몰라요. 그래서 비동기라는 방식을 써요. 진동벨을 떠올려 보세요. 주문하고 카운터 앞에 서 있지 않아요. 벨이 울릴 때까지 다른 일을 하죠. 기다리되, 전체를 멈추지는 않는 거예요.

### 장면 5 · 들어가면 열리고 나오면 닫힌다 (약 40초)
**화면:** 방 하나. 문을 열고 들어가면 방 안에 서버 불빛이 켜짐. 안에서 요청 화살표들이 오감. 문을 나서면 불빛이 꺼지고 문이 잠김. 방 위에 "async with" 팻말.
**내레이션:** 연결은 방에 들어가는 것과 같아요. 방에 들어가면 서버가 켜져요. 방 안에서만 서버와 대화할 수 있어요. 방을 나서면 연결이 끊기고 서버도 꺼져요. 따로 끄는 걸 기억할 필요가 없어요.

### 장면 6 · 정리를 안 하면 (약 35초)
**화면:** 왼쪽: 닫지 않고 끝난 앱 뒤에 유령 같은 서버 프로세스 다섯 개가 떠다님. 오른쪽: 방을 나서는 그림 옆에 프로세스 0개, 초록 체크. 아래에 "오류로 나가도 닫힌다".
**내레이션:** 정리가 왜 중요할까요? 로컬 서버는 내 컴퓨터에 뜬 프로그램이에요. 닫지 않으면 뒤에 남아서 쌓여요. 방식대로 쓰면 중간에 오류가 나서 빠져나가도 서버가 꺼져요.

### 장면 7 · 도구를 클로드에게 (약 40초)
**화면:** 서버에서 도구 카드 두 장이 클라이언트로 옴. 카드의 세 칸(이름, 설명, 입력 형식)이 그대로 다른 봉투("Claude API tools")로 옮겨져 모델에게 감.
**내레이션:** 이제 클로드와 이어 볼게요. 클라이언트가 서버에서 도구 목록을 받아요. 카드마다 이름, 설명, 입력 형식이 있죠. 이 셋을 그대로 옮겨 담아 질문과 함께 클로드에게 보내요.

### 장면 8 · 요청이 돌아오는 길 (약 40초)
**화면:** 모델 → 앱: "read_doc을 불러 줘" 카드. 앱 → 클라이언트 → 서버로 전달. 서버 → 결과 카드가 돌아와 모델에게 감. 결과 카드 귀퉁이에 "성공/실패" 표시등. 순환 화살표 옆에 "최대 10번" 표지.
**내레이션:** 클로드가 도구를 불러 달라고 하면, 클라이언트가 그 요청을 서버에 전해요. 결과가 오면 성공인지 실패인지 표시와 함께 클로드에게 돌려줘요. 실패해도 프로그램은 멈추지 않아요. 클로드가 읽고 다시 시도하죠. 반복 횟수에는 상한을 두세요.

### 장면 9 · 고객 앞에서 (약 35초)
**화면:** 두 단계 로드맵. "1단계: 기성 앱에 서버 꽂기"(짧은 막대), "2단계: 우리 앱에 통합"(긴 막대). 2단계 아래 점검표 네 줄: 연결 감싸기, 실패 전달, 반복 상한, 비밀 값 넘기기.
**내레이션:** 파일럿 초반에는 이미 있는 앱에 서버만 꽂아도 충분해요. 클라이언트를 직접 만드는 건 고객이 자기 앱 안에서 쓰고 싶어 할 때예요. 그때는 연결과 오류 처리가 고객 코드의 책임이 돼요. 계획서에 단계를 나눠 적어 두세요.

### 장면 10 · 요약과 예고 (약 30초)
**화면:** 세 줄 요약: "1. 클라이언트는 서버 앞 창구 직원 2. 들어가면 열리고 나오면 닫힌다 3. 도구 카드를 옮겨 담아 Claude에게". 아래에 "다음: S32 Skill이란" 과 작은 문서 아이콘.
**내레이션:** 정리할게요. 클라이언트는 서버 앞의 창구 직원이에요. 방에 들어가면 연결되고 나오면 닫혀요. 도구 카드를 옮겨 담아 클로드에게 건네요. 이걸로 연결하는 법은 끝났어요. 다음 시간부터는 잘되는 방법을 포장하는 법, 스킬을 배워요.

## 정답과 해설
1. (b). 객체를 만드는 건 전송 방식을 고르는 것뿐이고, `async with`에 들어갈 때 연결이 열려요.
2. (c). 도구 오류는 대화의 일부로 취급돼 결과로 돌아와요. 그래서 `is_error`를 확인해야 해요.
3. (a). 서버는 모델과 직접 대화하지 않아요(S28). 호스트가 도구 정의를 옮겨 담아 보내요.
4. 예시 답: `async with` 블록에 들어갈 때 SDK가 서버를 띄우고 연결을 연다. 블록을 벗어날 때는 정상 종료든 오류든 SDK가 연결을 끊고 서버 프로세스를 종료한다. 여는 일과 닫는 일이 한 묶음이라 닫기 함수를 따로 불러야 할 일이 없다.
5. 예시 답: "stdio 방식에서는 클라이언트가 서버를 하위 프로세스로 띄우는데, 이때 서버는 띄운 쪽의 환경 변수를 전부 물려받지 않고 최소한의 값만 받아요. 터미널에서 직접 돌릴 때는 터미널의 환경 변수가 있어서 됐던 거예요." 해결: `StdioServerParameters(env={...})`에 서버가 필요한 값을 명시해서 넘긴다. 비밀번호를 코드에 적지 말고 앱의 비밀 저장소에서 읽어 넘기라고 덧붙인다.

## 출처
- Build an MCP client, Python (`Client`, `stdio_client`, 도구를 Claude API에 넘기는 반복문, `is_error`, 반복 상한): https://modelcontextprotocol.io/docs/develop/build-client
- MCP Python SDK 문서, The Client (`async with`가 한살이, `list_tools`·`call_tool`·`read_resource`·`get_prompt`, `is_error`): https://py.sdk.modelcontextprotocol.io/client/
- MCP Python SDK 문서, Client transports (`StdioServerParameters`, 블록을 벗어나면 프로세스 종료, 환경 변수를 물려받지 않음, 직접 만든 HTTP 클라이언트는 직접 닫기): https://py.sdk.modelcontextprotocol.io/client/transports/
- MCP Python SDK README ("A client in 10 lines"): https://github.com/modelcontextprotocol/python-sdk
- MCP Python SDK 문서, Migration Guide (예전 방식 `ClientSession`과 `session.initialize()`): https://py.sdk.modelcontextprotocol.io/migration/
- Architecture overview (호스트가 도구 목록을 모아 모델에 넘기는 흐름): https://modelcontextprotocol.io/docs/learn/architecture
- 공식 학습 경로 개요(코스 8 학습 목표): 이 폴더의 `_official-outline-2026-11-27.txt`. 원본 페이지는 직접 열지 못했어요.
- 진동벨 비유와 "최대 10번"은 설명용 예시예요(공식 튜토리얼의 예제 상한값이 10이에요). 예제 코드는 공식 문서의 패턴대로 썼고 SDK 2.3.0 소스와 이름을 대조했지만, 이 환경에서 직접 실행해 보지는 못했어요(실행 확인 필요).
