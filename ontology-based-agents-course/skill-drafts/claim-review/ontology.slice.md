# ontology.slice.md — claim-review

> Skill: `claim-review`  
> Decision: 이 제품 클레임을 이 국가에 이 표현 그대로 써도 되는가?  
> Status: draft v0  
> Domain: RISELAB / cosmetics regulatory  
> Last updated: 2026-07-29

## 0. Boundary

- **In scope:** 단일 Product + 단일 Claim 문구 + 단일 Country 조합의 허용 여부
- **Out of scope:** 풀 PIF 작성, 라벨 전체 디자인, 모든 국가 일괄 심사, 공급망
- **Human gate:** `allow`/`restrict` 최종 확정, 대외 문서 반영, CPNP 제출류 side effect
- **Agent may:** 초안 판정, 근거 경로 제시, 수정 제안 문구, 유사 과거 거절 trace 조회

## 1. Entities (7)

| ID | 이름 | 정의 | 필수 속성 | 비고 |
|---|---|---|---|---|
| E1 | Product | 판매/등록 단위 SKU 또는 제형 제품 | `id`, `name`, `product_type` | 라인 전체가 아님 |
| E2 | Formula | 그 제품의 처방 스냅샷 | `id`, `version`, `valid_from` | 버전 바뀌면 새 노드 또는 새 버전 |
| E3 | Ingredient | 처방 구성 성분 | `id`, `inn_or_name`, `cas?` | 동의어는 alias로 |
| E4 | Country | 시장/관할 | `iso`, `name` | EU는 별도 규칙 묶음 가능 |
| E5 | RegulationRef | 판단에 쓰는 규정·가이드 조항 | `id`, `title`, `jurisdiction`, `effective_from` | 문서 전체가 아니라 **조항 단위** 선호 |
| E6 | Claim | 검토 대상 표현 | `id`, `text`, `claim_type` | 예: moisturizing / free-from / clinical |
| E7 | Evidence | 클레임을 뒷받침하거나 금지 근거가 되는 자료 | `id`, `kind`, `source_uri` | study, CPSR 발췌, 가이드 문구 |

### 의도적으로 뺀 것
Brand, Factory, Full PIF binder, Marketing campaign, Influencer — 이 결정에 직접 불필요.

## 2. Relations

| ID | from → to | 의미 | 시간 | 제약 |
|---|---|---|---|---|
| R1 | Product -has_formula-> Formula | 제품의 현재/특정 처방 | Formula.valid_from / superseded_by | 한 시점에 active formula 1 |
| R2 | Formula -contains-> Ingredient | 처방 내 포함 | 없음(처방 버전에 귀속) | props: `concentration`, `role`, `unit` |
| R3 | Ingredient -restricted_in-> Country | 국가별 제한/금지 신호 | `valid_from`, `valid_to` | props: `limit`, `rule_level` |
| R4 | RegulationRef -governs-> Country | 규정의 관할 | effective window | |
| R5 | RegulationRef -mentions-> Ingredient | 규정이 성분/군을 다룸 | | |
| R6 | Product -makes_claim-> Claim | 제품이 해당 표현 사용 시도 | proposed_at | |
| R7 | Claim -status_in-> Country | **결정 결과 상태** | `valid_from`, `valid_to`, `status` | status ∈ allow\|restrict\|forbid |
| R8 | Claim -requires_evidence-> Evidence | 필요 증거 | | |
| R9 | Claim -supported_by\|contradicted_by-> Evidence | 실제 연결 | | |
| R10 | Decision -about_claim-> Claim | 트레이스 연결 | decided_at | Decision은 트레이스 저장소 |

### Temporal rule
- 과거 상태 삭제 금지. `status_in` / `restricted_in` 은 **invalidate** (`valid_to=now`) 후 새 edge.
- “지금 써도 되나?” 질의는 `valid_to IS NULL` (또는 now ∈ range) 필터 필수.

## 3. Playbook rules (actionable)

1. **IF** Claim.claim_type 이 therapeutic/drug-like **AND** Country 가 cosmetic-only 관할 **THEN** `forbid` 또는 `needs_human` (자동 allow 금지)
2. **IF** any Formula.contains.Ingredient 이 Country 에서 `restricted_in` 이고 concentration > limit **THEN** Claim.status 후보 = `forbid` (다른 증거로 override 불가 without human)
3. **IF** Claim 이 free-from(X) **AND** Formula.contains X (또는 잔류 가능 성분 그룹) **THEN** `forbid`
4. **IF** Claim 이 clinical/performance **AND** requires_evidence 미연결 **THEN** `restrict` (증거 요청)
5. **IF** 유사 Claim trace 에 동일 Country+Ingredient 조합 `forbid` 이력 **THEN** escalate `needs_human` + trace 제시
6. **IF** RegulationRef.effective_from > today 적용 대기 **THEN** 현재 상태와 예정 상태를 둘 다 보고, 대외 확정은 human

> 규칙은 코드/쿼리로 옮길 수 있어야 한다. 산문 가이드 전문을 여기 붙여 넣지 않는다. 전문은 Evidence/RegulationRef.

## 4. Evidence hooks (chunks ↔ entities)

| 증거 종류 | 붙는 엔티티 | 출처 (예) | 신선도 |
|---|---|---|---|
| 규정 조항 텍스트 | RegulationRef | EU 1223/2009 annex, 국가 고시, SCCS opinion | effective_from 필수 |
| 처방 원문/ERP | Formula, Ingredient | 내부 처방 DB | formula version lock |
| 기존 CPSR/클레임 메모 | Evidence, Claim | RISELAB 문서 | 버전·날짜 |
| 과거 심사 결과 | Decision trace | 내부 로그 | 삭제 말고 invalidate |

GraphRAG 패턴: **항법 = 위 엔티티/엣지**, **인용문 = chunk → entity**.

## 5. Decision trace shape

```
Case
  about: Product + Claim + Country
  inputs: Formula version, Ingredient concentrations
Decision
  status: allow | restrict | forbid | needs_human
  because: Rule IDs fired + short reason
  based_on: RegulationRef[] Evidence[] prior Decision[]
  suggested_fix: optional rewritten claim text (if restrict)
  decided_by: agent|human
  decided_at: ts
Outcome (later)
  shipped_claim_text / withdrawn / incident?
```

## 6. Example instance (toy)

```
Product:FJMK011 Glow Pack
  -has_formula-> Formula:v3
       -contains-> Ingredient:RiceExtract {concentration:2%, role:active}
Claim:"모공을 없애준다" {claim_type:performance}
Country:KR
RegulationRef: cosmetic advertising guide …
→ rules: therapeutic-ish performance without evidence → restrict
→ trace stored for next similar claim
```

## 7. Open questions

- [ ] EU vs KR vs UA 중 파일럿 국가 1곳 고정
- [ ] Ingredient 마스터 키 (INCI vs 내부 ID)
- [ ] “free-from 그룹” 동의어/잔류 규칙 데이터 출처
- [ ] RISELAB 어디에 Decision trace 저장? (DB 테이블 vs 파일)

## 8. Next files in this skill

- `tools.md` — 처방 조회(read), 규정 검색(read), trace 쓰기(staging), 대외 쓰기 금지
- `checks.md` — judge: rule fire coverage, missing evidence, contradiction
- `examples/` — 허용 1 / 제한 1 / 금지 1 trace
