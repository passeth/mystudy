# STORM Resources

## Knowledge

- [Paper: Assisting in Writing Wikipedia-like Articles From Scratch with Large Language Models (STORM) — Shao et al., NAACL 2024](https://arxiv.org/abs/2402.14207)
  STORM의 정의, pre-writing(관점 발견 + 시뮬레이션 대화 + 개요), FreshWiki 평가, Wikipedia editor 피드백. Use for: 핵심 메커니즘과 한계(source bias, over-association).

- [Paper: Into the Unknown Unknowns (Co-STORM) — Jiang et al., EMNLP 2024](https://arxiv.org/abs/2408.15232)
  사람-에이전트 협업 담화, mind map, WildSeek, 검색엔진/RAG 대비 인간 평가. Use for: Co-STORM 역할 설계와 unknown unknowns.

- [GitHub: stanford-oval/storm](https://github.com/stanford-oval/storm)
  `knowledge-storm` 패키지, STORMWikiRunner / CoStormRunner API, 모듈 인터페이스, retriever 목록. Use for: 실제 코드 구조와 설치.

- [Live research preview](https://storm.genie.stanford.edu/)
  주제 입력 후 조사·개요·글 생성 체감. Use for: 논문 읽기 전/후 직관 확인.

- [Project site: storm-project.stanford.edu](https://storm-project.stanford.edu/)
  프로젝트 개요와 관련 자료 허브. Use for: 공식 포지셔닝 확인.

- [DSPy (Stanford NLP)](https://github.com/stanfordnlp/dspy)
  STORM/Co-STORM이 모듈형 LM 파이프라인을 짜는 기반. Use for: “모델 하나가 아니라 모듈 그래프” 관점.

- [PATHY video: 스탠퍼드 STORM — 검색만으로 위키 같은 보고서를 쓰는 법](https://youtu.be/-GdWCma6_vo)
  오늘 만든 개요 영상. Use for: 빠른 재진입 복습.

## Wisdom (Communities)

- [GitHub Issues · stanford-oval/storm](https://github.com/stanford-oval/storm/issues)
  설치, retriever, litellm, 실제 실패 모드 논의. Use for: 구현 트러블슈팅.
- [Hugging Face · FreshWiki](https://huggingface.co/datasets/EchoShao8899/FreshWiki)
  평가 데이터셋. Use for: “좋은 개요/기사” 기준을 데이터로 확인.
- [Hugging Face · WildSeek](https://huggingface.co/datasets/YuchengJiang/WildSeek)
  실제 정보 탐색 목표 데이터. Use for: Co-STORM 평가 감각.

## Gaps

- 화장품/규제 도메인에 STORM을 붙인 공식 가이드는 없음 → 자체 가드레일 설계 필요.
- 한국어 전용 평가 벤치마크는 약함 → 실무 적용 시 자체 루브릭이 필요.
