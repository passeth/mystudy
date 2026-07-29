# MISSION — claim-review

## Decision
**이 제품 클레임을 이 국가(시장)에 이 표현 그대로 써도 되는가?**  
→ `allow` | `restrict` (수정 필요) | `forbid` | `needs_human`

## Why
RISELAB/규제 업무에서 가장 비싼 실수는 “써도 되는 줄 알고 쓴 클레임”.
평문 RAG 요약만으로는 성분·농도·국가·제품유형 조합(reference class)을 놓친다.

## Success (pilot)
- 주 N건 초안에 대해 judge + 사람 승인
- 오판(allow였는데 실제 금지) = 0 목표
- 사람이 수정하는 비율 기록 (과신 탐지)

## Non-goals
- 전사 규제 온톨로지 플랫폼
- 자동 대외 제출
