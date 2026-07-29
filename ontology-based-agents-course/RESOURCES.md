# Ontology-based Domain Agents Resources

선별 기준: AI Engineer 채널 토크 중 **온톨로지·지식/컨텍스트 그래프·decision trace·에이전트 메모리·스킬/하네스/루프**가 슬기의 RISELAB/Trade Intel 구축에 직접 연결되는 것만. (조회일 2026-07-29)

## Knowledge

### Tier S — 지금 바로 볼 것 (온톨로지 에이전트 핵심)

- [Talk: Why Your Agent’s Brain Needs a Playbook: Practical Wins from Using Ontologies — Jesús Barrasa, Neo4j](https://www.youtube.com/watch?v=CbiR9xS2skQ) · 14분 · AI Engineer
  코드 오케스트레이션(너무 경직) vs LLM 자율(너무 혼돈) 사이의 **ontology-as-playbook**. domain graph + chunk 연결 GraphRAG 흐름. Use for: RISELAB/Trade Intel 최소 온톨로지 설계 출발점.

- [Talk: Why your agents need decision traces, not just documents — Zach Blumenfeld, Neo4j](https://www.youtube.com/watch?v=B9h9ovW5H9U) · 20분 · AI Engineer
  KB(위험 요인 문서) vs **context graph(과거 결정·이유·유사 케이스 결과)**. Use for: Sales Agent "왜 이 바이어를 재주문 위험으로 봤는지" provenance 설계.

- [Talk: Context Graphs for Explainable, Decision-Aware AI Agents — Andreas Kollegger & Zaid Zaim, Neo4j](https://www.youtube.com/watch?v=abvQEhvRI_c) · 17분 · AI Engineer
  reference class validation — 행동 전 "어느 집단에 속하는지" 확인. short/long/reasoning memory. Use for: 클레임 검토 시 1% 치명 예외 케이스 모델링.

- [Talk: CrabRAG: Why Automated Assistants Need Graph Memory, Not More Tokens — Stephen Chin, Neo4j](https://www.youtube.com/watch?v=Q0VkgCyNVUg) · 21분 · AI Engineer
  동일 사실을 벡터 vs 그래프에 넣고 multi-hop 질의 비교. Use for: "토큰/벡터 더 넣기" 대신 관계 메모리 정당화. Trade Intel 담당자·제품·시점 질의.

- [Talk: Connecting the Dots with Context Graphs — Stephen Chin, Neo4j](https://www.youtube.com/watch?v=eW_vxrjvERk) · 18분 · AI Engineer
  환자 이력 비유: 일반 조언 vs 개인 이력 그래프. Use for: 제품/바이어 개인화된 컨텍스트 설계 설명용.

- [Talk: Agentic GraphRAG: AI’s Logical Edge — Stephen Chin, Neo4j](https://www.youtube.com/watch?v=AvVoJBxgSQk) · 15분 · AI Engineer
  도메인 특화 태스크에서 retrieval 방식별 정확도·설명가능성·비용. Use for: GraphRAG를 언제 agent tool로 붙일지.

### Tier A — GraphRAG / 지식그래프 기반 (선수 심화)

- [Talk: GraphRAG: The Marriage of Knowledge Graphs and RAG — Emil Eifrem](https://www.youtube.com/watch?v=knDDGYHnnSI) · 19분 · AI Engineer
  KG+RAG 고전 프레이밍. Use for: Graph Engineering 0009와 교차 검증.

- [Talk: Practical GraphRAG — Michael, Jesús, Stephen, Neo4j](https://www.youtube.com/watch?v=XNneh6-eyPg) · 20분 · AI Engineer
  실무 GraphRAG 패턴. Use for: 구현 체크리스트.

- [Talk: Knowledge Graphs & GraphRAG (workshop) — Zach Blumenthal](https://www.youtube.com/watch?v=2DyHW23L6Cs) · 100분 · AI Engineer
  긴 워크숍. Use for: 주말에 깊게 파고들 때.

- [Talk: The Knowledge Graph Mullet: Trimming GraphRAG Complexity — William Lyon](https://www.youtube.com/watch?v=tYCu_57jzL8) · 33분 · AI Engineer
  property graph + RDF 하이브리드, 복잡도 줄이기. Use for: 과도한 온톨로지 설계 경계.

- [Talk: Context Engineering: Connecting the Dots with Graphs — Stephen Chin](https://www.youtube.com/watch?v=LLuKshphGOE) · 27분 · AI Engineer
  context engineering as discipline. Use for: AI Agents 코스의 context 레슨 연결.

- [Workshop: Memory Masterclass — Mark Bain (Neo4j, Cognee, Graphiti, Mem0)](https://www.youtube.com/watch?v=gsedOXz8FX4) · 51분 · AI Engineer
  **Graphiti 포함** 메모리 툴 실습. Use for: Trade Intel phase-2 (Graphiti+Neo4j) 직접 매핑.

### Tier A — 에이전트 골격 (온톨로지를 감싸는 실행층)

- [Talk: Don't Build Agents, Build Skills Instead — Barry Zhang & Mahesh Murag, Anthropic](https://www.youtube.com/watch?v=CEvIs9y1uog) · 16분 · 1.4M views · AI Engineer
  에이전트 스캐폴딩 수렴 후 부족한 것은 **도메인 전문성 → Skills**. Use for: 온톨로지 지식을 스킬 패키지로 포장하는 설계.

- [Talk: How We Build Effective Agents — Barry Zhang, Anthropic](https://www.youtube.com/watch?v=D7_ipDqhtwk) · 15분 · AI Engineer
  "모든 것에 에이전트 만들지 말 것", workflow vs agent. Use for: 첫 에이전트 scope 절제.

- [Talk: 12-Factor Agents — Dex Horthy, HumanLayer](https://www.youtube.com/watch?v=8kMaTybvDUw) · 17분 · AI Engineer
  신뢰 가능한 LLM 앱 패턴. Use for: production 체크리스트.

- [Talk: No Vibes Allowed — Dex Horthy, HumanLayer](https://www.youtube.com/watch?v=rmvDxxNubIg) · 21분 · AI Engineer
  복잡한 코드베이스에서 에이전트가 실패하는 이유. Use for: RISELAB/trade-intel 실코드 작업 규율.

- [Talk: Harness Engineering is not Enough — Dex Horthy, HumanLayer](https://www.youtube.com/watch?v=Ib5GBkD555M) · 19분 · AI Engineer
  소프트웨어 팩토리 실패 사례. Use for: 자동화 과신 경계.

- [Talk: Loop Engineering from First Principles — Kyle Mistele, HumanLayer](https://www.youtube.com/watch?v=xIt_mTQp6mY) · 18분 · AI Engineer
  control theory 루프(목표-오차-보정). Use for: Graph Engineering 개선 루프 감각과 연결, ERP 0행 같은 현실 anchor.

- [Talk: Harnesses in AI — Tejas Kumar, IBM](https://www.youtube.com/watch?v=C_GG5g38vLU) · 20분 · AI Engineer
  하네스가 에이전트 "성공 오보"를 만드는 사례. Use for: 도구/상태 계층 설계.

- [Talk: Your Agent Didn't Fail. Your Harness Did. — Vinoth Govindarajan, OpenAI](https://www.youtube.com/watch?v=BInpv7lGp1o) · premiere/최신 · AI Engineer
  세션 상태 race, stale state. Use for: 멀티 세션/루틴 하네스 버그 패턴. (업로드 직후 재확인)

- [Talk: The Multi-Agent Architecture That Actually Ships — Luke Alvoeiro, Factory](https://www.youtube.com/watch?v=ow1we5PzK-o) · 19분 · AI Engineer
  프로덕션 multi-agent taxonomy. Use for: 나중에 역할 분리할 때만.

- [Talk: Multi-Agent Orchestration Patterns — Sandipan Bhaumik](https://www.youtube.com/watch?v=2czYyrTzILg) · 26분 · AI Engineer
  handoff/stale data/untraceable decisions. Use for: one-writer / provenance 규칙 재확인.

- [Talk: RAG Agents in Prod: 10 Lessons — Douwe Kiela](https://www.youtube.com/watch?v=kPL-6-9MVyA) · 17분 · AI Engineer
  엔터프라이즈 데이터에 agentic RAG. Use for: 문서+그래프 하이브리드 현실 체크.

### Tier B — 참고 (시간 남을 때)

- [Talk: Ralph Loops — Chris Parsons](https://www.youtube.com/watch?v=2TLXsxkz0zI) · 108분 · AI Engineer — 단순 루프 철학 심화
- [Talk: From Signal to PR: Self-Improving Agent — Jason Lopatecki, Arize](https://www.youtube.com/watch?v=9HbzAWnKbo4) · 21분 — eval→fix 루프
- [Talk: Building Closed-Loop Evals — Uber](https://www.youtube.com/watch?v=31GUkCBD-Uc) · 22분 — 프로덕션 eval 사례 (도메인 다름)
- [Talk: Building Production-Ready RAG — Jerry Liu](https://www.youtube.com/watch?v=TRjq7t2Ms5I) · 19분 · 2023 — 역사적 맥락

## Already internalized (선수 코스)

- mystudy `ai-agents-in-depth-course` — agent anatomy, context, tools, evals
- mystudy `graph-engineering-course` v2 — 네 그래프 감각, 지식/시간 그래프, GraphRAG 과장 교정

## Wisdom (Communities)

- [AI Engineer](https://www.youtube.com/@aiDotEngineer) — 컨퍼런스 토크 1차 소스 채널. Use for: 분기별 큐레이션 재실행.
- Neo4j GraphRAG / context graph 세션 묶음 — 위 Tier S 토크들이 같은 트랙. Use for: 용어 정렬.
- (커뮤니티 가입 강요 금지 — 슬기 선호에 따라 옵트인만)

## Gaps

- RISELAB/화장품 규제 도메인 전용 ontology 사례 토크는 AI Engineer에 거의 없음 → CosIng/SCCS/CPNP 1차 문서 + 자체 미니 온톨로지 설계가 필요
- Graphiti bi-temporal 공식 딥다이브 토크는 Memory Masterclass에 부분만 → Graphiti docs/GitHub를 별도 1차 소스로 추가해야 함
- "claim-review agent" 엔드투엔드 공개 사례 부족 → 직접 구축이 학습 경로

## Suggested watch order (≈2.5h first pass)

1. Barrasa ontology playbook (14)
2. Blumenfeld decision traces (20)
3. Kollegger context graphs (17)
4. Chin CrabRAG (21)
5. Anthropic Skills (16)
6. Anthropic Effective Agents (15)
7. Mistele Loop Engineering (18)
8. Bain Memory Masterclass — Graphiti 구간 위주 (선택 51)
