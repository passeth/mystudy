# 지식 그래프(Knowledge Graph) 계열 X 북마크 종합 정리

> 출처: X 북마크 3건 (@0x_rody "How to Do Graph Engineering With Opus 5", @undefinedKi "Seven repos" 스레드, @Sprytixl "Graph Engineering replaced RAG") + 인접 자료 1건(@nurijanian "mckinsey-issue-tree"). 아래 내용은 각 게시글이 **주장한** 내용을 정리한 것이며, 별도로 검증하지 않은 수치·사례는 모두 "(원문 주장, 미검증)"으로 표시한다. X 게시글은 대부분 팔로워/구독 유도를 목적으로 한 마케팅성 글이므로, 학습 자료로 쓸 때는 반드시 이 표시를 유지해야 한다.

---

## 1. 지식 그래프 기초 개념: 엔티티/관계/트리플, 온톨로지/스키마, 엔티티 해상도, 출처·신뢰도, 시간적 유효성

### 1-1. 트리플(Triple) — 지식 그래프의 최소 단위

Sprytix 글이 제시하는 핵심 정의는 단순하다.

```
Subject → Relation → Object
```

예시:
```
Anthropic → created → Claude
Claude → supports → MCP
MCP → connects → external tools
```

일반 관계형 데이터베이스와의 차이를 원문은 이렇게 대비한다.

```
일반 DB:
회사 테이블 / 제품 테이블 — 테이블 사이에 명시적 관계 없음

지식 그래프:
회사 → created → 제품
제품 → competes with → 다른 제품
다른 제품 → owned by → 다른 회사
회사 → invested in → 다른 회사
```

즉 지식 그래프는 "사실을 저장하는 것"이 아니라 **"사실들이 서로 어떻게 연결되는지"**를 저장한다는 것이 핵심 주장이다. 이 연결 구조가 있어야 다단계 추론(multi-hop reasoning)이 가능해진다는 논리다.

### 1-2. 온톨로지/스키마 — 엔티티 타입과 관계 타입의 사전 정의

Sprytix가 제시한 9단계 파이프라인 중 4단계가 "스키마 구축"이다: 엔티티 타입(사람/회사/제품/이벤트/개념)과 관계 타입을 먼저 정의해야, 이후 추출 단계가 일관된 구조로 결과를 낸다는 것. Opus 5 아티클(rody)의 추출 프롬프트도 스키마를 고정된 시스템 프롬프트로 박아두고 있다:

```json
{
  "entities": [{"name", "type", "description"}],
  "edges": [{"source", "target", "relation", "valid_from"}]
}
```

두 글 모두 "스키마는 매 호출마다 동일해야 한다"는 원칙을 강조하는데, 이는 뒤에 나올 **캐싱 경제성**과 직결된다 (3절 참고).

### 1-3. 엔티티 해상도(Entity Resolution) — 같은 대상을 하나로 합치기

Sprytix의 9단계 파이프라인 5단계가 "중복 제거 및 정규화": "Microsoft Corp"와 "MSFT"가 같은 엔티티임을 판별하는 작업이다. 원문이 제시하는 정규화 프롬프트:

```
Compare the following entities.
Determine whether they refer to:
- the same entity
- related but different entities
- unrelated entities

Return canonical name and explanation.
Do not merge entities without clear evidence.
```

seven-repos 스레드에 달린 답글(@Vincent_Po_Li)이 정확히 이 지점을 취약점으로 지목한다: "memory graphs at entity resolution ('Acme Inc' = 'acme.com' — who decides?)" — 즉 엔티티 해상도는 자동화하기 어렵고, "누가 최종 판단하는가"의 문제가 실무에서 반복적으로 걸린다는 지적이다. 이 답글은 원 게시물보다 신뢰도 있는 실무 경고로 보인다 (단, 이것 역시 X 댓글이라 1차 자료는 아니다).

### 1-4. 출처(Provenance)·신뢰도(Confidence)

Sprytix의 추출 프롬프트는 관계마다 `evidence`, `confidence_score` 필드를 요구한다:

```
For each relationship return:
- source_entity
- relation_type
- target_entity
- evidence
- confidence_score
```

또한 "그래프 유지보수" 프롬프트는 새 사실을 기존 그래프와 비교해 `new / duplicate / contradiction / update / uncertain`으로 분류하고, "증거 없이 기존 사실을 덮어쓰지 말 것"을 규칙으로 건다. 이는 지식 그래프가 정적 데이터베이스가 아니라 **지속적으로 검증·갱신되는 시스템**이어야 함을 시사한다.

### 1-5. 시간적 유효성(Temporal Validity) — "언제 참이었는가"

seven-repos 스레드의 6번째 저장소 설명(getzep/graphiti)이 이 개념을 가장 압축적으로 표현한다: "사실이 언제 참이었는지 아는 메모리입니다. 2월에 계좌 소유자가 누구였는지 물어보면 오늘날이 아니라 2월이라고 답합니다." rody의 Opus 5 글도 추출 스키마에 `valid_from` 필드를 명시하고, "Skipping reference_time" 을 5대 실수 중 하나로 꼽으며 "시간 레이어가 없으면 임베딩 대비 지식 그래프를 쓸 이유가 없다"고 강조한다. 즉 **일반 지식 그래프와 시간형(temporal) 지식 그래프의 차이는 "사실 자체"가 아니라 "그 사실이 언제부터 언제까지 유효했는가"를 추적하느냐**에 있다는 것이 이 계열 글들의 공통 주장이다.

---

## 2. GraphRAG 파이프라인: local/global search, community reports, 일반 RAG 대비 장점

### 2-1. 일반 RAG가 막히는 지점 (Sprytix 주장)

```
일반 RAG:
질문 → 문서에서 매칭 텍스트 검색 → 관련 청크 반환 → 모델이 청크로 답 생성
```

"왜 3월에 매출이 떨어졌나?"라는 질문에 일반 RAG는 "매출", "3월"이라는 단어가 들어간 문서를 찾을 뿐, 인과관계 사슬은 찾지 못한다는 것이 원문의 핵심 대비다:

```
RAG 답변: 3월 매출을 언급하는 문서 5개가 있습니다.

Graph Engineering 답변: 매출이 떨어진 이유는 출시 지연 때문이고,
  → 이는 공급업체 의존성 문제 때문이었고
  → 이는 창고 문제를 유발했고
  → 이는 부정적 리뷰를 만들었고
  → 이는 전환율을 23% 낮췄다.
```

(이 "23%" 수치는 예시로 제시된 것으로 보이며 실제 GraphRAG 벤치마크 수치가 아니다. 원문에 출처가 없다 — 미검증.)

### 2-2. Microsoft GraphRAG의 실제 파이프라인 (원문이 인용하는 구조)

```
문서 로드 → 문서 청킹 → 엔티티·관계 추출 → 그래프 구축
→ 커뮤니티 탐지 → 커뮤니티 리포트 생성 → 엔티티·리포트 임베딩
→ 로컬 검색 / 글로벌 검색
```

- **로컬 검색(Local Search)**: "3월에 공급업체 X에 무슨 일이 있었나" 같이 특정 노드와 그 연결을 찾는 질문.
- **글로벌 검색(Global Search)**: "전체 공급업체 관계에서 반복되는 위험 패턴은 무엇인가" 같이 그래프 전체에서 패턴을 찾는 질문.

Sprytix 원문의 핵심 주장은 "일반 RAG는 로컬 질문엔 강하지만 글로벌 질문(전체 데이터셋의 주제/패턴)에는 취약하고, GraphRAG는 커뮤니티 탐지+리포트 생성 덕분에 글로벌 질문에도 답할 수 있다"는 것이다. 이는 Microsoft GraphRAG 공식 자료의 실제 설계 의도와 방향이 일치하지만, 본 정리에서는 원문 인용 그대로 소개하고 세부 수치(아래 2-3)는 별도로 미검증 표시한다.

### 2-3. 원문이 제시하는 수치 (미검증)

> "18% higher accuracy, 85% lower token cost than [기존 방식]" — 원문은 이 수치의 출처를 "ChatP&ID paper, arxiv.org/abs/2603.22528"라고 명시하며, "산업 엔지니어링 도면(P&ID)에 GraphRAG를 적용한 논문"이라고 설명한다.

**주의할 점**: 이 수치는 GraphRAG 일반의 성능이 아니라 **특정 도메인(산업 배관·계장 다이어그램 문서)에 적용한 한 논문의 결과**라고 원문 스스로 밝히고 있다. 그런데 글의 도입부는 이 수치를 "Microsoft, Stanford, Anthropic이 독립적으로 발견한 결론"이라며 일반화해서 제시한다 — **도메인 특정 결과를 일반 결론처럼 포장하는 전형적인 과장 패턴**이다. 학습자에게는 "특정 논문의 특정 도메인 결과이지, GraphRAG를 쓰면 항상 18%/85%가 나온다는 뜻이 아니다"라고 명확히 짚어줘야 한다.

같은 논리로 LaunchNotes 사례의 "5x faster incident detection, 50% reduction in meeting time"도 Anthropic 고객 사례 페이지(anthropic.com/customers/graph)에서 나온 것으로 원문은 밝히고 있으나, 이 역시 **하나의 고객사 사례**이지 GraphRAG/그래프 엔지니어링 일반의 보장된 효과가 아니다.

### 2-4. Community Report란 무엇인가

Sprytix 원문 파이프라인에 "Detect Communities → Generate Community Reports" 단계가 명시되어 있다. 이는 그래프 안에서 밀접하게 연결된 노드 집합(커뮤니티)을 찾아내고, 그 커뮤니티 전체를 요약한 리포트를 미리 생성해두는 것을 의미한다 — 글로벌 검색 시 그래프 전체를 순회하지 않고 이 요약 리포트들을 먼저 훑을 수 있게 하는 장치로 보인다. (이 부분은 원문의 파이프라인 다이어그램에만 등장하고 상세 설명은 없어, Microsoft GraphRAG 공식 문서를 별도로 확인해야 완전히 이해할 수 있는 지점이다.)

---

## 3. Graphiti/시간형 메모리: 에피소드→추출→엔티티 해상도→시간 엣지→다단계 순회, 추출/순회 분리

### 3-1. Graphiti의 정체성 (seven-repos 스레드 기준)

> "getzep/graphiti — 사실이 언제 참이었는지 아는 메모리. 2월에 계좌 소유자가 누구였는지 물어보면 오늘날이 아니라 2월이라고 답합니다. 29k 스타, Apache 2.0." (원문 주장, 스타 수는 게시 시점 기준 미검증)

rody의 글은 Graphiti가 "MCP 서버를 제공해 Claude Code가 별도 글루 코드 없이 그래프를 읽고 쓸 수 있다"고 설명하며, 구체적 MCP 설정 예시를 제시한다:

```json
{
  "mcpServers": {
    "graphiti": {
      "command": "uvx",
      "args": ["graphiti-mcp"],
      "env": {
        "NEO4J_URI": "bolt://localhost:7687",
        "NEO4J_PASSWORD": "${NEO4J_PASSWORD}",
        "MODEL_NAME": "claude-opus-5",
        "MODEL_EFFORT": "low"
      }
    }
  }
}
```

### 3-2. 추출(Extraction) vs 순회(Traversal) — "이 스킬의 전부"라고 원문이 부르는 분리

rody 글의 핵심 주장은 그래프 엔지니어링에서 모델이 하는 일이 **성격이 정반대인 두 가지 작업**으로 나뉜다는 것이다.

| 구분 | 추출(Extraction) | 순회(Traversal) |
|---|---|---|
| 빈도 | 에피소드마다, 수천 번 | 드물게, 질문 있을 때만 |
| 성격 | 기계적 패턴 매칭 (낮은 판단력 요구) | 다단계 추론·종합 (높은 판단력 요구) |
| 권장 설정 | effort: low, 캐시된 안정 프리픽스 | effort: high/max, 서브그래프 우선 검색 후 추론 |
| 원문 표현 | "high volume, low judgment" | "low volume, high judgment" |

원문은 "추출을 high effort로 돌리면 기계적 작업에 프론티어 토큰을 낭비하는 것이고, 순회를 low effort로 돌리면 답이 게을러진다(lazy multi-hop answers)"고 표현한다. 그리고 **"effort는 프롬프트 캐시 키의 일부이므로, 세션 중간에 effort를 바꾸면 캐시가 깨지고 다음 턴이 전체 재계산된다"**는 경고를 원문 스스로의 "가장 흔한 실수 5가지" 중 하나로 꼽는다 — 이는 학습자에게 실무적으로 유용한 경고이지만, **Opus 5, effort 파라미터, 캐시 요금 수치($0.50/$5, 512 토큰 최소 캐시 프리픽스 등)는 모두 미검증 상태**임을 분명히 해야 한다 (아래 5절 참고).

### 3-3. 파이프라인 전체 흐름 (rody 원문 재구성)

```
[Ingestion 경로 — 자주, 기계적]
대화/문서 에피소드
  → (고정 스키마 프리픽스 + effort:low로) 엔티티/관계 추출
  → 시간 정보(valid_from) 포함한 JSON 트리플
  → 그래프에 기록 (Neo4j 등)

[Traversal 경로 — 드물게, 판단력 필요]
사용자의 실제 질문
  → (effort:high/max로) 관련 서브그래프 먼저 검색
  → 그 사실들만 근거로 추론
  → 답변에 사용한 구체적 엣지를 인용
```

원문은 이 두 경로를 **별도 세션으로 분리**할 것을 권장한다 — 하나의 세션 안에서 effort를 토글하지 말라는 것.

### 3-4. 배치(Batch) 백필

rody 글은 "1년치 히스토리를 그래프에 채워 넣는 것은 교과서적인 배치 작업 — 시간에 민감하지 않고, 물량이 많고, 완벽하게 캐시 가능하다"고 주장하며, 동기(synchronous) 백필을 5대 실수 중 하나로 지적한다. "배치 API 50% 할인 + 캐시 90% 할인이 누적된다"는 계산 예시가 있으나, 이 요금 구조 자체가 미검증이므로 **"두 가지 별도 할인이 함께 적용될 수 있다는 아이디어"** 정도로만 소개하고, 정확한 요율은 실제 사용 시점의 공식 가격표로 확인해야 한다.

---

## 4. 7-repo 지도: 실행 측(LangGraph/Microsoft Agent Framework/Temporal) vs 지도 측(Graphify/GitNexus/Graphiti/Cognee) + 이음매 리스크 + 결정/출처 그래프라는 세 번째 층

### 4-1. 원문의 7개 저장소 분류 (seven-repos 스레드, 원문 그대로 요약, 스타 수·라이선스는 게시 시점 주장이며 미검증)

**"작업을 실행하는 그래프" (실행/오케스트레이션 그래프)**

1. `langchain-ai/langgraph` — 단계를 다이어그램으로 그리면 실행하고, 각 단계 후 진행 상황 저장. 40번째 단계에서 크래시해도 처음부터가 아니라 40번째부터 재개. 실행 중간에 사람 승인을 기다리다 며칠 후 재개도 가능. (원문 주장: 38k star, MIT)
2. `microsoft/agent-framework` — .NET/Python 팀을 위한 동일 기능. Microsoft가 AutoGen과 Semantic Kernel을 이것으로 통합하겠다고 발표했다는 주장. (원문 주장: 12k star, MIT)
3. `temporalio/temporal` — 위 두 도구가 딛고 서는 기반. 서버 크래시, 재시작, 3일간 응답 대기 같은 상황에서도 프로세스를 생존시킨다. "AI를 위해 만들어진 것이 아니라는 점이 바로 작동하는 이유"라는 것이 원문의 핵심 통찰 — 즉 AI 특화 도구가 아니라 범용 내구성 실행 엔진이라 안정적이라는 논리.

**"작업이 조회하는 그래프" (지식/메모리 그래프)**

4. `Graphify-Labs/graphify` — 폴더를 가리키면 내부의 모든 것(노트, PDF, 코드, 이미지, 스프레드시트)을 하나의 연결된 그래프로 매핑. 에이전트가 파일을 하나씩 열지 않고 이 맵을 쿼리. (원문 주장: 97k star, Apache 2.0)
5. `abhigyanpatwari/GitNexus` — 같은 아이디어를 코드에 특화. 저장소 전체에서 함수 호출·import·클래스 상속을 추적해, 에이전트가 의존성을 읽지 않은 파일을 편집하지 못하게 한다. (원문 주장: 45k star)
6. `getzep/graphiti` — 시간형 메모리 (3절 참고). (원문 주장: 29k star, Apache 2.0)
7. `topoteretes/cognee` — 문서 더미를 로컬 호스팅 단일 Postgres에서 실행되는 쿼리 가능 그래프로 변환. 데이터가 로컬을 벗어나지 않음. (원문 주장: 29k star, Apache 2.0)

원 게시자의 결론: **"프로세스를 구축한다면 첫 번째 그룹을, 맵을 구축한다면 두 번째 그룹을 선택하라"** — 즉 이 스레드 자체가 "실행 그래프"와 "지식 그래프"를 서로 다른 도구군으로 명확히 구분하고 있다는 점이 이 코스의 기존 혼동(실행 그래프 vs 개선 루프 그래프 vs 지식 그래프)을 보강하는 근거가 된다.

### 4-2. 이음매(seam) 리스크 — 댓글이 지적한 실무적 함정

이 스레드에 달린 두 댓글이 원 게시물보다 더 신중하고 구체적인 지적을 한다.

- `@Vincent_Po_Li`: "both halves die the same way: at the seams no repo handles. memory graphs at entity resolution ('Acme Inc' = 'acme.com' — who decides?). execution graphs at unowned merges: 17.2× error amplification vs 4.4× with one owner. the repos are the easy 20%." — 번역: "두 절반 모두 저장소가 다루지 않는 이음매에서 죽는다. 메모리 그래프는 엔티티 해상도에서(누가 결정하는가?), 실행 그래프는 소유자 없는 병합에서(단일 소유자 대비 17.2배 오류 증폭). 저장소는 쉬운 20%일 뿐이다." **이 17.2배/4.4배 수치의 출처는 댓글에 없으며 완전히 미검증이다** — 다만 "병합 지점에 명확한 단일 소유자가 없으면 오류가 증폭된다"는 정성적 주장 자체는 (앞서 확보한) execution-graph 계열 자료(codez의 "diamond" 패턴, "one agent writes, others only read")의 원칙과 방향이 일치하므로, 수치는 버리고 원칙만 취할 가치가 있다.
- `@Truntr_`: "Two groups is right and there is a third nobody ships. The graph that runs the work, the graph that stores the facts, and nothing that stores the decisions. Graphiti gets closest and still only answers when, not why." — 번역: "두 그룹 구분은 맞다. 그런데 아무도 만들지 않는 세 번째가 있다. 작업을 실행하는 그래프, 사실을 저장하는 그래프, 그리고 결정을 저장하는 것은 없다. Graphiti가 가장 가깝지만 그것도 '언제'만 답할 뿐 '왜'는 답하지 못한다."

### 4-3. 제안: 세 번째 층 — "결정/출처 그래프(Decision/Provenance Graph)"

`@Truntr_`의 지적은 이 코스에 중요한 시사점을 준다. 지금까지 확보한 세 갈래(실행 그래프 / 지식 그래프 / 개선 루프 그래프)에 더해, **"왜 이 결정을 내렸는가"를 추적하는 층이 따로 필요하다**는 통찰이다. 이는:

- 실행 그래프가 기록하는 것: 무엇이 실행됐는가, 상태가 어떻게 흘렀는가 (When/What)
- 지식 그래프(Graphiti류)가 기록하는 것: 어떤 사실이 언제 참이었는가 (When)
- 아직 아무도 표준 도구로 만들지 않은 것: 왜 그 결정을 내렸는가, 그 판단의 근거는 무엇이었는가 (Why)

이는 앞서 확보한 execution-graph 자료(undefinedKi, "Anthropic Method")의 "rulebook.md" 개념 — 즉 "규칙이 갱신될 때마다 그 이유를 한 줄로 기록하는 곳" — 과 연결되는 지점이다. 지식 그래프와 실행 그래프 사이의 빈 공간을 사용자의 실제 운영에서는 "규칙 파일 + 결정 로그"로 메우고 있다는 뜻이며, 이는 5절의 실무 연결에서 구체화한다.

---

## 5. 비용/캐싱/배치 주장과 GraphRAG 정확도/비용 주장 — 독립 검증이 필요한 항목

아래 표는 이 세 게시글이 제시한 수치성 주장을 모아, 검증 상태를 명시한 것이다. **이 코스에서는 아래 항목 전부를 "검증되지 않은 홍보성 수치"로 다루고, 학습자에게 사실이 아니라 주장으로 제시해야 한다.**

| 주장 | 출처 게시글 | 검증 상태 |
|---|---|---|
| Opus 5 캐시 읽기 $0.50/M (기본 $5의 90% 할인) | rody | 미검증 — "Opus 5"라는 모델명 자체가 이 코스 작성 시점(2026-07) 기준 공식 확인 안 됨. 실제 사용 시 Anthropic 공식 가격표로 재확인 필수 |
| 최소 캐시 가능 프리픽스 512 토큰 (Opus 4.8의 절반) | rody | 미검증, 위와 동일한 이유 |
| Batch API 50% 할인, 캐싱과 중첩 | rody | 프롬프트 캐싱과 배치 API가 별도 할인으로 존재한다는 "구조" 자체는 여러 LLM 제공사에서 흔한 패턴이지만, 정확한 %와 이름은 미검증 |
| "effort는 프롬프트 캐시 키의 일부" | rody | 미검증. effort라는 파라미터명·동작 자체가 확인되지 않음 |
| $35.00 vs $10.30 비용 비교 예시 | rody | 예시 계산이며, 위 단가 주장에 의존하므로 단가가 미검증이면 결과도 미검증 |
| GraphRAG 정확도 +18%, 비용 -85% | Sprytix (arxiv 2603.22528 인용) | **도메인 한정**(원문이 스스로 "ChatP&ID paper, 산업 도면 특화"라 명시) — 일반화 금지. 논문 자체의 존재/정확한 수치는 별도 확인 필요 |
| LaunchNotes 사례 5x/50% | Sprytix (anthropic.com/customers/graph 인용) | 단일 고객 사례. 일반화 금지 |
| DSPy/STORM/스케일링 논문 인용 | Sprytix | 논문 존재 자체는 이 코스의 다른 트랙(예: STORM 코스)에서 이미 확인된 바 있으나, 이 글이 그 논문들을 "그래프 엔지니어링"이라는 동일 개념으로 묶는 것은 저자의 해석이지 논문 저자들의 주장이 아님 |
| KEPLER, MIT Press 관계형 메모리 논문 | Sprytix | 존재 여부 자체를 별도 검증해야 신뢰 가능 |
| 17.2× vs 4.4× 오류 증폭 (병합 소유권) | @Vincent_Po_Li 댓글 | 출처 전무, 완전 미검증 — 수치는 버리고 "병합에 단일 소유자가 필요하다"는 정성적 원칙만 채택 |

**교육적 결론**: 이 세 게시글은 "숫자로 신뢰를 만드는" 전형적인 그로스 마케팅 문체를 쓴다 (정확한 %, "Microsoft/Stanford/Anthropic이 독립적으로 발견"이라는 3자 동시 발견 서사, "Bookmark this and follow" 유도 문구). 학습자에게는 **개념 구조(트리플, 엔티티 해상도, 시간적 유효성, local/global search, 추출/순회 분리)는 실무적으로 유용하지만, 첨부된 모든 수치는 그 자체로 신뢰하지 말고 반드시 원 논문/공식 문서에서 재확인하라**는 메시지를 명시적으로 줘야 한다.

---

## 6. 인접 개념과의 명시적 구분: 이슈 트리 vs 지식 그래프 vs 실행 그래프

### 6-1. 이슈 트리(Issue Tree) — 이것은 "그래프 엔지니어링"이 아니라 "문제 분해 트리"

`@nurijanian`(mckinsey-issue-tree) 글은 맥킨지식 이슈 트리 방법론을 다룬다: Why-tree(원인 찾기) / What-tree(작업 분해) / How-tree(경로 나열)의 세 갈래, 그리고 MECE(Mutually Exclusive, Collectively Exhaustive) 원칙으로 각 트리의 가지가 겹치지 않고 빠짐없이 커버하는지 검증한다.

이 자료를 지식 그래프/실행 그래프와 **명확히 구분해야 하는 이유**:

- 이슈 트리는 **사람(제품 관리자)의 사고를 구조화하는 정적 다이어그램**이다. 노드 사이에 데이터가 실제로 흐르지 않고, 실행되지도 않으며, 시간에 따라 갱신되는 그래프도 아니다.
- 지식 그래프는 **세계에 대한 사실의 네트워크**(엔티티-관계-시간)이고, 실행 그래프는 **작업의 제어 흐름**(노드-엣지-상태가 실제로 실행됨)이다.
- 다만 구조적 공통점은 있다: 셋 다 "트리/그래프로 그리면 애매함이 줄어든다"는 원리를 공유하고, MECE 같은 구조적 검증 원칙("가지가 겹치지 않고 빠짐없다")은 이 코스의 다른 두 그래프(실행 그래프의 "state schema 검증", 지식 그래프의 "엔티티 중복 제거") 원칙과 유사한 패밀리에 속한다.
- 따라서 레슨에서는 이슈 트리를 "그래프 엔지니어링의 네 번째 갈래"로 넣지 않고, **"그래프적 사고의 가장 단순한 입문 형태 — 정적, 사람 중심, 문제 분해용"**으로 짧게 소개하고 지나가는 것이 정확하다.

### 6-2. 지식 그래프 vs 실행 그래프 — 원문 자체가 이미 구분한 것

akshay_pachaar 글(별도 확보 자료, execution-graphs.md 참고)의 정의를 재인용하면: "A workflow graph represents control and state transitions... It is not the same as knowledge graph engineering, where the graph represents entities and relationships in data." 이는 이번 지식 그래프 계열 자료(seven-repos 스레드의 "두 그룹" 분류)와 정확히 일치한다 — 즉 **두 개의 독립된 X 스레드가 서로 참고 없이도 동일한 이분법에 도달**했다는 점이 이 구분의 신뢰도를 높인다.

---

## 7. 제안: 레슨 다이어그램 3개 + 실습

### 다이어그램 1 — "트리플에서 시간형 그래프까지" (개념 계층 다이어그램)

```
[텍스트 문서/대화]
      ↓ 추출 (effort: low, 고정 스키마 프리픽스)
[엔티티 + 관계 (트리플)]
      ↓ 엔티티 해상도 (같은 대상 병합)
[정규화된 그래프]
      ↓ + valid_from/valid_to
[시간형 그래프 (Graphiti류)]
      ↓ 순회 (effort: high, 서브그래프 우선 검색)
[다단계 추론 답변 + 인용 엣지]
```

이 다이어그램으로 "추출은 자주·기계적, 순회는 드물게·판단력 필요"라는 3-2절의 핵심 구분을 시각화한다.

### 다이어그램 2 — "로컬 검색 vs 글로벌 검색" (GraphRAG 두 질문 유형)

```
질문: "3월에 공급업체 X에 무슨 일이 있었나?"
  → 로컬 검색 → 특정 노드 + 그 연결만 조회

질문: "전체 공급업체 관계에서 반복되는 위험 패턴은?"
  → 글로벌 검색 → 커뮤니티 리포트 순회 → 패턴 종합
```

두 화살표를 나란히 배치해 "같은 그래프, 다른 질문 유형에 다른 검색 전략"임을 보여준다.

### 다이어그램 3 — "세 개의 그래프 지도" (7-repo 스레드 + Truntr 제안 통합)

```
실행 그래프          지식 그래프           결정/출처 그래프
(무엇을 언제        (어떤 사실이           (왜 그렇게 판단했나 —
 실행했는가)          언제 참이었는가)        아직 표준 도구 없음)

LangGraph            Graphiti              (사용자의 rulebook.md /
Microsoft Agent      Graphify              결정 로그로 임시 대체)
Framework            GitNexus
Temporal             Cognee
```

이 지도는 학습자가 "지금 내가 쓰려는 도구가 어느 축에 속하는지" 스스로 분류하게 하는 진단 도구로 쓴다.

### 실습 제안 (trade-intel/RISELAB 메모리 연결)

1. **엔티티 해상도 실습**: trade-intel(에바스코스메틱 B2B 주문 관리)의 거래처명 표기 변형("에바스코스메틱" vs "EVAS Cosmetic" vs "evas.business" 등)을 놓고, Sprytix의 정규화 프롬프트 형식을 그대로 적용해 "같은 엔티티인지" 직접 판정해본다 — 자동화 이전에 판단 기준을 언어로 명시하는 연습.
2. **시간적 유효성 실습**: RISELAB의 PIF 담당자/거래처 정보 중 "그 시점에는 맞았지만 지금은 바뀐" 사실이 있는지 찾아보고, `valid_from`/`valid_to` 필드로 표현한다면 어떤 모습일지 스케치해본다.
3. **로컬 vs 글로벌 질문 분류 실습**: 본인의 메모리(`memory/` 폴더) 파일들에서 "로컬 질문"(특정 프로젝트 하나에 대한 사실)과 "글로벌 질문"(여러 프로젝트를 관통하는 패턴, 예: "내가 반복적으로 겪는 실패 유형은?")을 각각 하나씩 적어보고, 지금의 memory_search 도구가 둘 중 어느 쪽에 강한지 스스로 평가한다.

---

## 요약 한 줄

지식 그래프 계열 X 글들의 **개념 골격**(트리플, 엔티티 해상도, 시간적 유효성, local/global search, 추출/순회 분리, 실행-그래프와의 명시적 구분)은 학습 가치가 있지만, **첨부된 모든 정량적 수치(18%/85%, $0.50/$5, 5x/50%, 17.2×/4.4× 등)는 근거가 부실하거나 도메인 한정적이므로 사실이 아니라 "검증이 필요한 주장"으로만 가르쳐야 한다.**
