# skill-drafts

코스 레슨에서 말한 **Skill 패키지** 초안 자리.

```
skill/
  MISSION.md           # 닫을 결정 한 줄
  ontology.slice.md    # ← 이 폴더의 핵심. 최소 엔티티·관계·제약
  tools.md             # 허용 도구·쓰기 권한
  checks.md            # judge / 금지 패턴
  examples/            # decision traces 샘플
  prompts/             # 고정 시스템 지침
```

## ontology.slice.md 가 뭔가?

전사 온톨로지 문서가 **아닙니다**.

한 스킬(한 업무 결정)이 **알아도 되는 세계의 최소 조각**입니다.

| 넣을 것 | 안 넣을 것 |
|---|---|
| 이 결정에 필요한 엔티티 ≤ 7 | 회사 전체 ERD |
| 관계 + 시간 유효성 | 미래 확장용 “있으면 좋은” 노드 |
| 허용/금지 제약 (playbook rules) | 마케팅 카피, UI 스펙 |
| 증거(document)가 붙는 자리 | 벤더 데모 스키마 복붙 |

Barrasa 토크의 “ontology as playbook”을 파일 하나로 고정한 것입니다.
