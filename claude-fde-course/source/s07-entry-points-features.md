---
session: S07
course: "C3 Claude Platform and Model Foundations"
official_sections: ["(목차 비공개) 학습 목표 1: 업무에 맞는 진입점과 기능 조합 고르기"]
title: "결정 1·2: 진입점과 기능 고르기"
minutes: 20
status: draft
---

# S07. 결정 1·2: 진입점과 기능 고르기

## 오늘의 목표
- 프롬프트를 쓰기 전에 내리는 네 가지 결정(진입점, 기능, 모델, 컨텍스트)을 순서대로 말할 수 있다.
- 업무 하나를 듣고 알맞은 진입점을 고르고 이유를 말할 수 있다.
- 웹 검색, 리서치, 커넥터, 스킬, 프로젝트 가운데 그 업무에 켤 기능을 고를 수 있다.

## 핵심 정리

### 프롬프트보다 먼저 정해지는 것
요리로 치면 프롬프트는 레시피예요. 그런데 어느 주방에서, 어떤 도구로, 어떤 요리사와, 어떤 재료로 할지는 레시피보다 먼저 정해져요. 공식 코스 소개는 이 네 가지를 **진입점**(entry point), **기능**(capability features), **모델**(model), **컨텍스트**(context)라고 부르고, 이 결정들이 세션 품질의 천장을 정한다고 해요. S05의 위임이 "무엇을 맡길까"였다면 오늘은 "어디서, 무엇을 켜고 맡길까"예요. 모델과 컨텍스트는 S08에서 봅니다.

### 결정 1: 진입점, 일이 어디에 있나
진입점은 Claude와 일하는 자리예요. 공식 강의가 무엇을 진입점으로 꼽는지는 목차가 공개돼 있지 않아서(확인 필요), claude.com 제품 메뉴와 도움말을 기준으로 정리했어요.

| 진입점 | 일하는 방식 | 어울리는 일 |
|---|---|---|
| Claude 채팅 (웹·데스크톱·모바일) | 한 턴씩 주고받는 대화 | 질문, 생각 정리, 가벼운 초안 |
| Claude Cowork | 목표를 맡기고 결과물을 받는 위임 | 파일과 도구를 오가는 여러 단계 작업 |
| Claude Code | 코드베이스를 읽고 고치고 명령을 실행 | 개발, 저장소 안의 작업 (S18부터) |
| 일하던 앱 안의 Claude | Chrome 확장, Microsoft 365, Google Workspace, Slack의 Claude Tag | 자리를 옮기지 않고 그 앱 안에서 하는 일 |
| Claude Platform (API) | 내 제품과 시스템에 Claude를 넣기 | 직접 만드는 서비스와 자동화 (S10부터) |

채팅과 Cowork는 이렇게 갈라요. 목표가 아직 정리 중이면 채팅, 결과물이 분명하고 파일이나 도구를 건드려야 하면 Cowork예요. 둘을 한 대화로 합친 새 Claude 경험도 단계적으로 나오고 있어요. 그 화면에서는 모드를 고르지 않지만, "대화로 풀 일인가, 통째로 맡길 일인가"라는 판단은 그대로 남아요.

### 결정 2: 기능, 무엇을 켤까
기능은 그 자리에서 켜고 끄는 능력이에요. S01~S04에서 본 한계와 짝을 지으면 고르기 쉬워요.

- **최신 정보가 필요하다** (S02의 지식 컷오프): 웹 검색(web search)이나 리서치(Research). 검색 한두 번으로 풀리는 사실 확인은 웹 검색, 여러 출처를 찾아 종합하는 보고서는 리서치예요. 웹이 필요 없고 깊이 따져야 하는 문제는 확장 사고(S13)가 맞아요.
- **우리 회사 정보를 모른다**: 커넥터(connectors). Claude를 회사 앱과 서비스에 연결해요. 접근 범위는 연결된 서비스에서 그 사람이 가진 권한 그대로예요.
- **매번 같은 방식을 설명한다**: 스킬(skills)은 지시, 스크립트, 자료를 묶어 두고 필요할 때만 불러오는 꾸러미이고, 프로젝트(projects)는 자료와 지시를 담아 두는 작업 공간이에요.
- **결과물이 파일이어야 한다**: 아티팩트(artifacts)와 파일 만들기로 문서, 스프레드시트, 발표 자료를 받아요.

원칙은 "다 켜지 않기"예요. 도구와 커넥터는 토큰을 많이 써서 S03의 작업 기억을 차지해요. 쓸 수 있는 진입점과 기능은 플랜마다 달라요(예: Cowork와 리서치는 유료 플랜). Team·Enterprise 플랜에서는 웹 검색처럼 조직 소유자가 먼저 켜 줘야 쓸 수 있는 기능도 있어요.

## 직접 해 보기 (5분)
1. 이번 주에 한 일 세 가지를 적고, 각각 옆에 "진입점 / 켤 기능"을 한 줄로 적어 보세요. 예: "경쟁사 가격 조사 → 채팅 / 리서치". 고르기 어려웠던 일이 있다면 무엇 때문에 망설였는지 적어 두세요.
2. Claude.ai에서 최근 소식이 필요한 질문을 하나 골라, 입력창의 "+" 메뉴에서 웹 검색을 끈 대화와 켠 대화에 똑같이 물어보세요. 출처 인용이 붙는지, 답의 날짜가 어떻게 다른지 보세요. (새 Claude 경험에서는 이 토글이 없고 Claude가 필요할 때 검색해요.)

## 확인 문제
1. 프롬프트를 쓰기 전의 네 가지 결정에 들지 않는 것은?
   - (a) 진입점
   - (b) 컨텍스트
   - (c) 프롬프트 문장의 말투 다듬기
2. "폴더에 있는 계약서 30개를 읽고 조항 비교표를 스프레드시트로 만들어 줘." 가장 알맞은 진입점은?
   - (a) 한 턴씩 주고받는 채팅
   - (b) Claude Cowork
   - (c) Slack의 Claude Tag
3. "어제 그 회사 실적 발표에서 매출이 얼마였지?"처럼 검색 한두 번으로 끝나는 사실 확인에 맞는 기능은?
   - (a) 웹 검색
   - (b) 리서치
   - (c) 스킬
4. (서술형) 커넥터와 스킬은 각각 무엇을 Claude에게 더해 주나요? 두세 문장으로 구분해 보세요.
5. (상황형) 고객사 영업팀장이 말해요. "Claude한테 우리 거래처에 대해 물어봤는데 하나도 몰라요. 업무에는 못 쓰겠네요." 어떻게 답하고, 무엇을 제안할까요?

## FDE 관점
고객이 "Claude가 못해요"라고 할 때, 프롬프트 문제가 아니라 진입점이나 기능 문제인 경우가 많아요. 그래서 FDE는 프롬프트를 고치기 전에 "어디서 하셨어요? 무엇이 켜져 있었어요?"를 먼저 물어요. 파일럿을 시작할 때는 고객 조직에서 어떤 진입점이 열려 있는지, 웹 검색이나 커넥터 같은 기능을 관리자가 켜 두었는지부터 확인해요. 이 목록이 곧 첫 출시 범위의 재료예요. 파일럿 계획서에는 "첫 사용자는 이 진입점 하나에서, 이 기능 조합으로 시작한다"를 한 줄로 적어 두세요. 범위가 좁아야 기준선과 비교하기도 쉬워요.

## 복습 카드
- Q: 프롬프트를 쓰기 전에 내리는 네 가지 결정은? / A: 진입점, 기능, 모델, 컨텍스트.
- Q: 채팅과 Cowork를 가르는 기준은? / A: 주고받으며 풀 일은 채팅, 결과물이 분명하고 파일·도구를 건드리는 일은 Cowork.
- Q: 웹 검색과 리서치의 차이는? / A: 웹 검색은 검색 한두 번으로 끝나는 사실 확인, 리서치는 여러 출처를 여러 번 찾아 종합하는 보고서.
- Q: 커넥터는 어떤 권한으로 데이터에 접근하나? / A: 연결된 서비스에서 그 사람이 가진 권한 그대로.
- Q: 기능을 다 켜 두면 안 되는 이유는? / A: 도구와 커넥터가 토큰을 많이 써서 컨텍스트를 차지하기 때문.

## 영상 대본

### 장면 1 · 오늘의 질문 (약 25초)
**화면:** 똑같은 프롬프트 문장이 적힌 카드 두 장. 왼쪽 카드 아래에는 흐릿한 결과물, 오른쪽 카드 아래에는 또렷한 결과물. 가운데에 물음표와 제목 "프롬프트는 같은데 왜 다를까?"
**내레이션:** 같은 프롬프트인데 결과가 달라요. 왜일까요? 프롬프트를 쓰기 전에 이미 정해진 게 있어서예요. 오늘은 그 결정들을 볼게요.

### 장면 2 · 네 가지 결정 (약 35초)
**화면:** 계단 네 칸이 아래에서 위로 쌓임: 진입점, 기능, 모델, 컨텍스트. 맨 위에 작은 종이 한 장 "프롬프트". 아래 두 칸만 밝게 강조.
**내레이션:** 프롬프트 아래에는 네 가지 결정이 깔려 있어요. 진입점, 기능, 모델, 컨텍스트예요. 이 넷이 결과의 천장을 정해요. 오늘은 앞의 두 가지, 진입점과 기능이에요.

### 장면 3 · 진입점은 일하는 자리 (약 40초)
**화면:** 문 다섯 개가 가로로 놓임. 문패: "채팅", "코워크", "클로드 코드", "일하던 앱 안", "플랫폼". 문마다 작은 아이콘(말풍선, 서류 묶음, 터미널, 브라우저 창, 톱니바퀴).
**내레이션:** 진입점은 클로드와 일하는 자리예요. 대화하는 채팅, 일을 통째로 맡기는 코워크, 코드를 다루는 클로드 코드가 있어요. 일하던 앱 안에서 부르거나, 플랫폼으로 내 제품에 넣을 수도 있어요.

### 장면 4 · 대화냐 위임이냐 (약 40초)
**화면:** 화면이 좌우로 나뉨. 왼쪽 "채팅": 말풍선이 탁구공처럼 오감. 오른쪽 "코워크": 서류 상자 하나가 들어가고, 잠시 뒤 완성된 스프레드시트가 나옴. 아래 자막 "정리 중인 생각 → 대화 / 분명한 결과물 → 위임".
**내레이션:** 채팅과 코워크는 이렇게 갈라요. 생각이 아직 정리 중이면 대화가 맞아요. 결과물이 분명하고 파일을 건드려야 하면 맡기는 쪽이에요. 요즘은 한 대화에서 둘 다 되는 화면도 나오고 있어요.

### 장면 5 · 일이 있는 곳에서 부른다 (약 35초)
**화면:** 브라우저 창, 문서 편집기, 메신저 채널 그림이 차례로 나타나고, 각 창 구석에 같은 작은 별 모양 아이콘이 켜짐. 마지막에 서버 상자가 나타나 "내 서비스"라는 이름표가 붙음.
**내레이션:** 꼭 자리를 옮길 필요는 없어요. 브라우저에서도, 문서 프로그램에서도, 메신저에서도 클로드를 부를 수 있어요. 사람이 아니라 내 시스템이 불러야 한다면 플랫폼이 맞는 문이에요.

### 장면 6 · 기능은 한계를 메우는 스위치 (약 40초)
**화면:** 스위치 패널. 첫 번째 스위치 "웹 검색"이 켜지면 달력 아이콘이 오늘 날짜로 넘어감. 두 번째 스위치 "리서치"가 켜지면 돋보기 여러 개가 흩어졌다가 보고서 한 장으로 모임.
**내레이션:** 두 번째 결정은 기능이에요. 한계를 메우는 스위치라고 보면 돼요. 최신 정보가 필요하면 웹 검색을 켜요. 여러 출처를 모아 보고서를 만들 때는 리서치가 맞아요.

### 장면 7 · 커넥터, 스킬, 프로젝트 (약 40초)
**화면:** 세 개의 상자가 차례로 등장. "커넥터": 클로드와 회사 앱 아이콘 사이에 선이 연결됨. "스킬": 작업 설명서 꾸러미가 필요할 때만 펼쳐짐. "프로젝트": 서랍 안에 자료와 지시가 들어 있음.
**내레이션:** 회사 자료를 몰라서 막히면 커넥터로 연결해요. 접근 범위는 그 사람의 권한 그대로예요. 매번 같은 방식을 설명하고 있다면 스킬로 묶어요. 자료와 지시는 프로젝트에 담아 둬요.

### 장면 8 · 다 켜지 않는다 (약 35초)
**화면:** 스위치를 전부 켜자 책상 그림 위에 도구가 잔뜩 쌓여 작업 공간이 좁아짐. 스위치 두 개만 남기자 책상이 넓어짐. 구석에 자물쇠가 달린 스위치 하나와 "관리자 설정" 표시.
**내레이션:** 그렇다고 전부 켜 두면 안 돼요. 도구와 커넥터는 작업 기억을 차지하거든요. 일에 필요한 것만 켜세요. 회사에서는 관리자가 먼저 열어 줘야 쓸 수 있는 기능도 있어요.

### 장면 9 · 고객 앞에서 (약 35초)
**화면:** 회의실 그림. 고객 말풍선 "우리 거래처를 하나도 몰라요." 에프디이 말풍선 "어디서 물으셨어요? 무엇이 켜져 있었나요?" 아래에 점검표: "진입점 확인, 기능 확인, 그다음 프롬프트".
**내레이션:** 고객이 못 쓰겠다고 할 때 프롬프트부터 고치지 마세요. 어디서 했는지, 무엇이 켜져 있었는지 먼저 물어요. 회사 자료가 필요한 일이면 커넥터나 프로젝트가 답이에요.

### 장면 10 · 요약과 예고 (약 25초)
**화면:** 세 줄 요약이 한 줄씩 나타남: "1. 프롬프트 전에 네 가지 결정 2. 진입점은 일이 있는 자리 3. 기능은 필요한 것만". 아래에 "다음: S08 모델과 컨텍스트".
**내레이션:** 정리할게요. 프롬프트 전에 네 가지 결정이 있어요. 진입점은 일이 있는 자리에서 골라요. 기능은 필요한 것만 켜요. 다음 시간에는 남은 두 결정, 모델과 컨텍스트를 볼게요.

## 정답과 해설
1. (c). 네 가지 결정은 진입점, 기능, 모델, 컨텍스트예요. 문장 다듬기는 그다음 일이에요.
2. (b). 결과물이 분명하고 여러 파일을 읽어야 하는 여러 단계 작업이라 위임이 맞아요.
3. (a). 검색 한두 번으로 풀리는 사실 확인은 웹 검색이에요. 리서치는 여러 출처를 종합하는 긴 조사에 써요.
4. 예시 답: 커넥터는 Claude가 회사 앱과 서비스의 데이터에 닿고 그 안에서 작업하게 해 주는 연결이다. 스킬은 일을 하는 방법(지시, 스크립트, 자료)을 묶어 둔 것으로, 관련된 일이 나올 때 불러와 같은 방식으로 반복하게 해 준다. 하나는 "무엇에 닿을 수 있나", 다른 하나는 "어떻게 하나"를 더한다.
5. 예시 답: "Claude는 학습한 내용과 지금 대화에 들어온 내용만 알아요. 거래처 정보는 어느 쪽에도 없었던 거예요"라고 설명한다. 그다음 거래처 정보가 어디에 있는지 묻고, CRM이나 문서 저장소라면 커넥터 연결을, 정리된 자료 묶음이라면 프로젝트에 올리는 방법을 제안한다. 조직 관리자가 해당 기능을 켜 두었는지도 함께 확인한다.

## 출처
- Claude Forward Deployed Engineer 학습 경로, 코스 3 소개와 학습 목표(개요 사본 `_official-outline-2026-11-27.txt`): https://anthropic-partners.skilljar.com/path/claude-fde
- Claude 제품 개요(제품·기능 메뉴): https://claude.com/product/overview
- Claude Academy, Choosing between Claude Cowork or Chat: https://academy.claude.com/tutorials/choosing-between-claude-cowork-or-chat
- Claude Help Center, Claude Cowork and chat are one Claude: https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude
- Claude Help Center, Get started with Claude Cowork: https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork
- Claude Help Center, Get started with Claude in Chrome: https://support.claude.com/en/articles/12012173-get-started-with-claude-in-chrome
- Claude Help Center, What is Claude Tag?: https://support.claude.com/en/articles/15594475-what-is-claude-tag
- Claude for Microsoft 365: https://claude.com/claude-for-microsoft-365
- Claude for Google Workspace: https://claude.com/claude-for-google-workspace
- Claude Code 문서, Overview: https://code.claude.com/docs/en/overview
- Claude Help Center, When should I use web search, extended thinking, and research?: https://support.claude.com/en/articles/11095361-when-should-i-use-web-search-extended-thinking-and-research
- Claude Help Center, Enable and use web search: https://support.claude.com/en/articles/10684626-enable-and-use-web-search
- Claude Help Center, Use connectors to extend Claude's capabilities: https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities
- Claude Help Center, What are skills?: https://support.claude.com/en/articles/12512176-what-are-skills
- Claude Help Center, What are projects?: https://support.claude.com/en/articles/9517075-what-are-projects
- Claude Help Center, What are artifacts and how do I use them?: https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them
- Claude Help Center, Create and edit files with Claude: https://support.claude.com/en/articles/12111783-create-and-edit-files-with-claude
- Claude Help Center, How large is the context window on paid Claude plans?(도구와 커넥터가 토큰을 많이 쓴다는 안내): https://support.claude.com/en/articles/8606394-how-large-is-the-context-window-on-paid-claude-plans
