# ontology.slice.md (template)

> Skill: `{skill-id}`  
> Decision: `{한 줄 예/아니오/보류 질문}`  
> Status: draft  
> Owner:  
> Last updated:

## 0. Boundary

- **In scope:** 이 결정을 내리기 위해 반드시 알아야 할 것만
- **Out of scope:** 
- **Human gate (side effects):** 

## 1. Entities (≤ 7)

| ID | 이름 | 정의 (한 줄) | 필수 속성 | 비고 |
|---|---|---|---|---|
| E1 |  |  |  |  |

## 2. Relations

| ID | from → to | 의미 | 시간? | 제약 |
|---|---|---|---|---|
| R1 |  |  | valid_from/to 또는 event_at |  |

## 3. Playbook rules (actionable)

규칙을 “문서 문장”이 아니라 **검사 가능한 형태**로.

1. IF … THEN allow|restrict|forbid|escalate
2. 
3. 

## 4. Evidence hooks (chunks ↔ entities)

| 증거 종류 | 붙는 엔티티 | 출처 시스템 | 신선도 규칙 |
|---|---|---|---|
|  |  |  |  |

## 5. Decision trace shape

이 슬라이스로 남을 최소 트레이스:

```
Case -about-> (primary entity)
Case -has_decision-> Decision
Decision -because-> Reason[]
Decision -based_on-> Evidence[] | Rule[]
Decision -resulted_in-> Outcome
Decision -valid_at-> Time
Decision -decided_by-> Human|Agent
```

## 6. Open questions

- 
