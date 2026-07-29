# ontology.slice.md — reorder-risk

> Skill: `reorder-risk`  
> Decision: 이 바이어를 이번 주 선연락 대상으로 올릴 것인가?  
> Status: draft v0  
> Domain: Trade Intel / 에바스코스메틱 B2B  
> Last updated: 2026-07-29

## 0. Boundary

- **In scope:** 단일 Buyer 계정 기준 주간 선연락 여부
- **Out of scope:** 견적 가격 결정, 신규 바이어 발굴 전체, 물류 이슈 티켓팅, 회계
- **Human gate:** 실제 메일/카톡/전화 발송, 특별 할인 언급
- **Agent may:** 신호 수집, 점수/이유 경로, 메시지 초안(staging), 유사 trace 조회

## 1. Entities (7)

| ID | 이름 | 정의 | 필수 속성 | 비고 |
|---|---|---|---|---|
| E1 | Buyer | 거래 계정 (정규화된 거래처) | `id`, `canonical_name`, `market?` | EVAS/에바스/evas.business → 동일 엔티티 해상도 |
| E2 | Person | 담당자/연락 창구 | `id`, `name`, `channel_ids?` | |
| E3 | Product | SKU 또는 라인 관심 단위 | `id`, `sku`, `name` | PDRN 등 |
| E4 | Order | 확정 주문 | `id`, `ordered_at`, `amount?`, `status` | |
| E5 | Message | 이메일/슬랙/톡 등 대화 단위 | `id`, `sent_at`, `channel`, `direction` | 본문은 chunk |
| E6 | Shipment | 출하/인도 이벤트 | `id`, `shipped_at`, `status` | 선택적이지만 공백 신호에 유용 |
| E7 | Signal | 파생 위험/기회 신호 (계산 결과) | `id`, `kind`, `score`, `as_of` | 예: days_since_order, unanswered_inquiry |

### 의도적으로 뺀 것
전체 조직도, 회계 전표, 마케팅 캠페인, 내부 HR.

## 2. Relations

| ID | from → to | 의미 | 시간 | 제약 |
|---|---|---|---|---|
| R1 | Buyer -has_contact-> Person | 담당자 | `valid_from`, `valid_to` | **현재 담당 = valid_to IS NULL** |
| R2 | Buyer -placed-> Order | 주문 | Order.ordered_at | |
| R3 | Order -for_product-> Product | 주문 상품 | | |
| R4 | Order -shipped_as-> Shipment | 출하 | | |
| R5 | Person -sent\|received-> Message | 메시지 | Message.sent_at | |
| R6 | Message -about-> Product | 문의 주제 | | 없으면 null 허용 |
| R7 | Buyer -has_signal-> Signal | 파생 신호 | Signal.as_of | 재계산 시 이전 signal invalidate |
| R8 | Decision -about_buyer-> Buyer | 트레이스 | decided_at | |

### Temporal + entity resolution (치명)
- `에바스코스메틱` / `EVAS Cosmetic` / `evas.business` → Buyer 1개로 merge (provenance 남김)
- 담당자 변경 시 옛 `has_contact` 삭제 금지 → `valid_to=now`, 새 edge
- “지금 누구에게?” 질의는 **현재 contact** 필터 필수 (CrabRAG/Graphiti 감각)

## 3. Playbook rules (actionable)

1. **IF** no Order in last X days **AND** prior Order history exists **THEN** signal `dormant_reorder` ↑
2. **IF** Message about Product P unanswered > Y days **AND** direction=inbound **THEN** signal `open_inquiry` ↑
3. **IF** current has_contact missing/invalid email **THEN** `needs_human` (자동 outreach 금지)
4. **IF** last Decision about buyer = skip with reason `churned` and no new Order/Message **THEN** default `skip`
5. **IF** open_inquiry on high-margin Product (config list) **THEN** prefer `outreach_now`
6. **IF** multiple Buyers merge-conflict (entity resolution confidence < θ) **THEN** `needs_human`
7. **IF** outreach_now **THEN** message draft must address **current** Person only

점수 가중치는 config. 이 파일에는 **규칙 형태**만 고정.

## 4. Evidence hooks

| 증거 | 엔티티 | 출처 (예) | 신선도 |
|---|---|---|---|
| 주문 행 | Order, Product | erp_sales_hx / Supabase sales | 일배치 성공 행수 anchor |
| 메시지 본문 | Message | Slack/메일/EVAS Trade | sent_at |
| 담당자 마스터 | Person, has_contact | CRM/수동 | valid window |
| 과거 선연락 결과 | Decision trace | Sales Agent 로그 | invalidate |

본문 검색은 벡터/키워드, **누가·언제·무엇** 경로는 그래프.

## 5. Decision trace shape

```
Case
  about: Buyer
  as_of: week_start
  signals: Signal[]
  current_contact: Person?
Decision
  action: outreach_now | watch | skip | needs_human
  because: rules fired + path summary
  based_on: Order[] Message[] Signal[] prior Decision[]
  draft_message_ref: staging only
  decided_by: agent|human
Outcome
  replied? ordered_within_14d? wrong_contact_incident?
```

## 6. Example path (toy)

```
Buyer:B1 -has_contact(valid_to=null)-> Person:Lee
Buyer:B1 -placed-> Order(2025-01) -for_product-> PDRN-01
Person:Kim -sent-> Message(2025-03, about PDRN)   # Kim is old contact (valid_to set)
Signal: dormant_reorder + open_inquiry(PDRN)
→ Decision: outreach_now to Lee (NOT Kim), draft in staging
```

## 7. Open questions

- [ ] X days / Y days 기본값 (도메인 합의)
- [ ] Buyer 키: 사업자번호 vs 내부 id vs 이름 정규화
- [ ] erp_sales_hx 일배치 실패(0행) 시 스킬 동작 = halt
- [ ] 메시지 채널 범위 (메일 only? Slack?)

## 8. Next files

- `tools.md` — read ERP/CRM/messages; write trace+draft only; send denied
- `checks.md` — current contact present, no stale contact, entity resolution confidence
- `examples/` — outreach_now / watch / wrong-contact catch
