# Mission: Graph Engineering — 네 가지 그래프를 구분하고 설계하기

## Why
X 북마크에서 반복 등장하는 “그래프 엔지니어링”을 유행어로 암기하지 않고, 문제 분해·개선 루프 거버넌스·실행 오케스트레이션·지식/시간 기억이라는 서로 다른 구조로 분해해 실제 Aside 루틴, mystudy 제작, Trade Intel/Sales Agent 설계에 적용한다. 북마크의 좋은 프레임은 흡수하되 과장 수치와 서로 다른 사례의 혼합은 공식 문서·논문으로 검증한다.

## Success looks like
- “노드가 무엇인가?”만 물어도 문제 트리, 개선 그래프, 실행 그래프, 지식 그래프를 구분하고 서로 바꿔 말하지 않는다.
- 단일 루프의 Control/Reference/Gap/Act와 네 구조적 실패를 진단하고 Pairing/Hierarchy/Arbitration/Audit 및 현실 Anchor를 배치한다.
- 선형 작업을 노드·엣지·상태·계약으로 그린 뒤 fake edge를 제거하고 chain/router/diamond/pipeline/bounded cycle 중 적합한 토폴로지를 고른다.
- Judge·Rulebook·독립 Reviewer·Checkpoint·One-writer·Human gate를 이용해 반복 가능하고 검증 가능한 실행 그래프를 설계한다.
- GraphRAG와 temporal knowledge graph에서 ontology, entity resolution, provenance, validity window, local/global query의 역할과 비용을 설명한다.
- “그래프를 쓰지 않는 편이 낫다”는 결론도 내릴 수 있으며, X의 정량 주장에 데이터셋·대조군·기준 시점을 붙여 판단한다.

## Constraints
- 한국어, 코드보다 다이어그램·표·실제 사례 중심. 모든 레슨에 큰 인라인 SVG 1개, 회수 퀴즈 3개, 5~10분 실습을 둔다.
- X 아티클은 관점/입력 자료로, 공식 문서·논문은 사실 검증 근거로 분리한다.
- 기존 v1의 좋은 내용은 `archive-v1/`에 보존하되 공개 토픽은 중복 없는 10개 레슨 + 3개 레퍼런스로 재구성한다.
- HTML은 CSS/JS/SVG를 모두 인라인한 self-contained 파일로 만든다.

## Out of scope
- LangGraph/MAF/ADK 전체 API 튜토리얼 또는 Neo4j/Cypher 프로그래밍 강의.
- 그래프 신경망(GNN), 수학적 그래프 이론, 모델 사전학습.
- 검증되지 않은 X 수치나 GitHub stars를 성능 증거로 사용하기.
