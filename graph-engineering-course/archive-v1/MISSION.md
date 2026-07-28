# Mission: Loop → Graph Engineering

## Why
에이전트·자동화·운영에서 “루프 하나 잘 돌리기”를 넘어, 루프들이 서로 감시·제약·교정하는 구조(그래프)로 설계하는 감각을 기르기 위해 학습한다. 최근 바이럴된 논의(Steinberger의 한 줄, Perez의 에세이)를 계기로, 내가 만들고 있는 에이전트/스킬/운영 시스템에 바로 적용 가능한 판단 틀을 원한다.

## Success looks like
- 단일 개선 루프(4행정: 측정 대상·목표·갭·조치)를 설명할 수 있다.
- 단일 루프의 네 가지 구조적 실패(Goodhart, 목표 맹목, 루프 충돌, 측정 부패)를 사례로 짚을 수 있다.
- 그래프 엔지니어링을 “루프들의 네트워크 + 엣지 설계”로 정의하고, pairing / hierarchy / arbitration / audit를 말할 수 있다.
- 그래프만으로 부족할 때 필요한 것(anchors, frozen rules, 외부 판단)을 설명할 수 있다.
- 에이전트 오케스트레이션 그래프(LangGraph 등)와 “개선 루프의 그래프”를 혼동하지 않고 구분할 수 있다.
- 내 실제 시스템(에이전트, 매출/ERP 동기화, PATHY 루틴 등)에 최소 그래프 스케치를 그릴 수 있다.

## Constraints
- 한국어. 1차 출처는 Carlos E. Perez 에세이와 원 트윗/관련 1차 논의.
- 매 레슨은 짧고 퀴즈·스케치 과제를 포함한다.
- HTML은 자체 CSS 인라인, mystudy 배포 가능 형태.

## Out of scope
- LangGraph/CrewAI API 튜토리얼 전부.
- 제어이론 수식 전체.
- “루프는 죽었다” 식 이분법 마케팅.
