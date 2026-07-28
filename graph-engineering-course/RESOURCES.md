# Graph Engineering Resources

## X Bookmarks — Input / Perspective

- [Carlos E. Perez, “From Loop Engineering to Graph Engineering?”](https://x.com/IntuitMachine/article/2078419526354378975)
  개선 루프 그래프: 4행정, 네 실패, pairing/hierarchy/arbitration/audit, anchors. Use for: 0002-0003.
- [Akshay, “Graph Engineering Clearly Explained”](https://x.com/akshay_pachaar/article/2081089131808243999)
  실행 그래프의 nodes/edges/state와 네 난제, 언제 그래프가 과한지. Use for: 0001, 0004, 0007, 0010.
- [beamnxw, “Agent Harness Engineering vs. Loop Engineering vs. Graph Engineering”](https://x.com/beamnxw/article/2081022966645535079)
  environment→feedback→flow 레이어 구분과 증상-처방 표. Use for: 0001, 0004, 0010.
- [Yarchi, “Graph Engineering: an Agent That Reviews Its Own Work”](https://x.com/undefinedKi/article/2080992300893675775)
  judge-first, rulebook, disk state, 독립 reviewer, 검사비용 배치, 단일 daemon. Use for: 0006.
- [Codez, “Graph Engineering with Claude: 14-Step Roadmap”](https://x.com/0xCodez/article/2079165300625330317)
  fan-out/fan-in, diamond, pipeline/barrier, bounded cycle, dynamic workflows. 공식 문서 검증 후 사용. Use for: 0004-0007.
- [Yarchi, “Graph Engineering needs both halves — seven repos”](https://x.com/undefinedKi/status/2081787771333546438)
  실행 그래프와 지식 그래프 도구 지도를 분리. Use for: 0001, 0008, 0010.
- [rody, “How to Do Graph Engineering with Opus 5”](https://x.com/0x_rody/article/2081664256571810178)
  temporal graph ingestion/traversal 분리, cache/batch/effort. Use for: 0008. 가격은 Anthropic 공식 문서로 검증.
- [Sprytix, “Graph Engineering replaced RAG…”](https://x.com/Sprytixl/article/2078778799064584535)
  GraphRAG pipeline과 local/global 질문 프레임. 18%/85% 일반화는 오해이므로 교정 사례로 사용. Use for: 0008-0009.
- [George, “McKinsey Issue Tree: Why / What / How”](https://x.com/nurijanian/article/2081707189853642988)
  문제 분해 트리의 교수용 3분류. McKinsey 공식 표준 3종은 아님. Use for: 0001, 0010.

## Primary Sources — Authority / Verification

- [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
  Workflow vs agent, 단순한 composable pattern 우선. Use for: 0001, 0010.
- [Anthropic: Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
  90.2% internal research eval와 4x/15x token 관측의 정확한 범위. Use for: 0007.
- [Claude Code: Dynamic workflows](https://code.claude.com/docs/en/workflows)
  `agent()`, `parallel()`, `pipeline()`, `/deep-research`, same-session resume, 16 concurrent agents. Use for: 0005-0007.
- [Bun in Rust](https://bun.com/blog/bun-in-rust) · [Anthropic AI Code Migration](https://claude.com/blog/ai-code-migration)
  Zig→Rust와 별도 Python→TypeScript 사례, judge/rulebook/reviewer 구조. Use for: 0006.
- [LangGraph Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api) · [Persistence](https://docs.langchain.com/oss/python/langgraph/persistence) · [Durable execution](https://docs.langchain.com/oss/python/langgraph/durable-execution)
  State/Nodes/Edges, checkpoint, node replay/idempotency. Use for: 0004-0005.
- [Microsoft Agent Framework overview](https://learn.microsoft.com/en-us/agent-framework/overview)
  AutoGen/Semantic Kernel 후계, graph workflow·typed routing·checkpoint·HITL. Use for: 0004, 0010.
- [Google ADK 2.0 graphs](https://adk.dev/graphs)
  Nodes/edges/routes/fan-out/fan-in/loops. Use for: 0004-0005.
- [Microsoft GraphRAG architecture](https://microsoft.github.io/graphrag/index/architecture/) · [Global search](https://microsoft.github.io/graphrag/query/global_search/) · [Paper](https://arxiv.org/abs/2404.16130)
  Entity/relation extraction, Leiden communities, community reports, local/global query. Use for: 0009.
- [Microsoft LazyGraphRAG](https://www.microsoft.com/en-us/research/blog/lazygraphrag-setting-a-new-standard-for-quality-and-cost/)
  Index/query cost trade-off의 공식 평가. Use for: 0009.
- [Graphiti official repo](https://github.com/getzep/graphiti) · [Graphiti MCP server](https://help.getzep.com/graphiti/getting-started/mcp-server)
  Temporal validity, provenance, experimental MCP server. Use for: 0008.
- [Anthropic prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) · [Pricing](https://platform.claude.com/docs/en/about-claude/pricing) · [Effort](https://platform.claude.com/docs/en/build-with-claude/effort)
  Opus 5 cache/batch/effort 검증. Use for: 0008.
- [McKinsey: Problem solving is for everyday life too](https://www.mckinsey.com/careers/life-at-mckinsey/our-culture-and-communities/mckinsey-women-blog/problem-solving-is-for-everyday-life-too)
  Issue tree/MECE의 공식적 범위. Use for: 0001, 0010.

## Evidence

- Full X evidence: `source/x-bookmarks/`
- Chapter syntheses: `source/synthesis/`
- Claim-by-claim verification ledger: `source/evidence-ledger.md` (verified 2026-07-29 KST)
- Full bookmarks snapshot: `source/all-bookmarks-2026-07-29.json`

## Gaps

- 실제 LangGraph/MAF/Graphiti 구현 실습은 별도 코딩 코스로 분리.
- X Articles의 스크린샷/원본 도식은 저작권·장기 접근성을 고려해 복제하지 않고, 핵심 구조를 새 인라인 SVG로 재작성.
