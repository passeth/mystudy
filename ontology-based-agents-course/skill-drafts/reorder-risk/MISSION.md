# MISSION — reorder-risk

## Decision
**이 바이어를 이번 주 선연락(재주문/리텐션) 대상으로 올릴 것인가?**  
→ `outreach_now` | `watch` | `skip` | `needs_human`

## Why
Trade Intel / EVAS 영업에서 “누가 지금 손길이 필요한지”가 메시지·주문·담당자 변경 이력에 흩어져 있다.
벡터 요약만으로는 현재 담당자·마지막 문의 제품·주문 공백을 한 경로로 못 잇는다.

## Success (pilot)
- 주간 후보 리스트 N명 + 이유 경로
- 잘못된 담당자/폐기 계정 연락 = 0
- 사람 승인 후에만 메시지 발송

## Non-goals
- 자동 발송
- 전사 CRM 온톨로지
- 가격 협상 자동화
