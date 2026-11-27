# Claude FDE 학습 코스 (슬기 · Study_FDE)

공식 학습 경로 **Claude Forward Deployed Engineer**(Anthropic 파트너 학습 사이트, 11개 항목, 약 9.5시간)의
개요에 맞춰 만든 한국어 학습 코스입니다. 하루 1세션, 15~25분.

- 공식 경로: https://anthropic-partners.skilljar.com/path/claude-fde
- 공식 개요 원문(2026-11-27에 읽은 것): `_official-outline-2026-11-27.txt`
- 경로의 최종 목표: **고객 유스케이스의 파일럿 계획서 쓰기** — 측정 기준선(baseline), 만들기 전에 합의하는 성공 지표,
  먼저 출시할 부분, 첫 사용자 그룹을 들이는 방법.

> 주의: 이 노트는 공식 강의의 필기가 아닙니다. 공식 사이트에서 로그인 없이 보이는 개요(코스 설명·목차)와
> 공개 문서를 바탕으로 Study_FDE가 직접 쓴 학습 자료예요. 실제 강의·퀴즈·수료증은 공식 사이트에서 진행합니다.

## 세션 한 번의 흐름 (15~25분)

1. 복습 카드 (지난 세션, 3분)
2. 영상 보기 (`study/video/sNN.mp4`, 4~6분)
3. 노트 읽기: 핵심 정리 + 직접 해 보기 (5~8분)
4. 확인 문제 5개 (이 채팅에서 풀고 채점, 5분)
5. FDE 관점 한 가지 (2분)

## 커리큘럼: 11개 코스 → 42개 세션

| 세션 | 코스 | 주제 | 파일 |
|---|---|---|---|
| **1. AI Capabilities and Limitations** (핵심, 약 60분) | | | |
| S01 | C1 | 생성형 AI의 네 가지 성질과 다음 토큰 예측 | `s01-next-token-prediction.md` |
| S02 | C1 | 지식: 학습 데이터, 지식 컷오프, 환각 | `s02-knowledge.md` |
| S03 | C1 | 작업 기억: 컨텍스트 윈도우 | `s03-working-memory.md` |
| S04 | C1 | 조종 가능성과 예상 밖 출력 진단하기 | `s04-steerability-diagnosis.md` |
| **2. AI Fluency for Builders** (핵심, 약 45분) | | | |
| S05 | C2 | AI Fluency와 4D 프레임워크: 위임과 설명 | `s05-4d-delegation-description.md` |
| S06 | C2 | 분별과 책임: 빌더의 검증 | `s06-4d-discernment-diligence.md` |
| **3. Claude Platform and Model Foundations** (핵심, 약 60분) | | | |
| S07 | C3 | 결정 1·2: 진입점과 기능 고르기 | `s07-entry-points-features.md` |
| S08 | C3 | 결정 3·4: 모델 선택과 컨텍스트·메모리 관리 | `s08-model-context-decisions.md` |
| **4. Choosing the right Claude model** (핵심, 약 10분) | | | |
| S09 | C4 | 네 가지 모델과 effort 조절 | `s09-choosing-model.md` |
| **5. Claude Platform 101** (빌드, 약 90분) | | | |
| S10 | C5 | Claude Platform이란, 첫 API 호출, 모델 고르기 | `s10-platform-first-api-call.md` |
| S11 | C5 | 에이전트 루프 | `s11-agent-loop.md` |
| S12 | C5 | 도구 사용 (tool use) | `s12-tool-use.md` |
| S13 | C5 | 확장 사고 (thinking) | `s13-thinking.md` |
| S14 | C5 | 내장 도구와 Skills | `s14-built-in-tools-skills.md` |
| S15 | C5 | MCP와 컨텍스트 관리 | `s15-mcp-context-management.md` |
| S16 | C5 | Managed Agents | `s16-managed-agents.md` |
| S17 | C5 | Claude Code로 만들기 + 코스 5 총정리 | `s17-building-with-claude-code.md` |
| **6. Claude Code 101** (빌드, 약 60분) | | | |
| S18 | C6 | Claude Code란: 에이전트 루프, 컨텍스트, 도구와 권한, 설치 | `s18-what-is-claude-code.md` |
| S19 | C6 | 첫 프롬프트: 승인 모드, 자동 수락, Plan Mode | `s19-first-prompt-modes.md` |
| S20 | C6 | 일상 워크플로: Explore → Plan → Code → Commit, 리뷰, 컨텍스트 명령 | `s20-daily-workflows.md` |
| S21 | C6 | 커스터마이즈 1: CLAUDE.md와 서브에이전트 | `s21-claude-md-subagents.md` |
| S22 | C6 | 커스터마이즈 2: skills, MCP, hooks | `s22-skills-mcp-hooks.md` |
| **7. Claude Code in Action** (빌드, 약 60분) | | | |
| S23 | C7 | 작업 조종: plan mode, 압축(compaction), 되감기(rewind) | `s23-steer-the-work.md` |
| S24 | C7 | 설정: 간결한 CLAUDE.md, 지시를 둘 자리, 검증 skill | `s24-configure-claude.md` |
| S25 | C7 | 권한 모드와 hooks로 규칙 강제하기 | `s25-permissions-hooks.md` |
| S26 | C7 | 반복 작업 자동화: 자율 세션, worktree, routines, headless, PR 리뷰 | `s26-automate-repeat-work.md` |
| S27 | C7 | 검증과 공유: 무감독 실행 검증, plugin | `s27-verify-share.md` |
| **8. Introduction to Model Context Protocol** (빌드, 약 60분) | | | |
| S28 | C8 | MCP 구조: 클라이언트와 서버 | `s28-mcp-architecture.md` |
| S29 | C8 | 서버 만들기: tools와 MCP Inspector | `s29-mcp-server-tools.md` |
| S30 | C8 | Resources와 Prompts, 셋 중 무엇을 쓸까 | `s30-mcp-resources-prompts.md` |
| S31 | C8 | 클라이언트 구현: 연결, 비동기, 정리 | `s31-mcp-client.md` |
| **9. Introduction to agent skills** (빌드, 약 30분) | | | |
| S32 | C9 | Skill이란, 첫 skill 만들기 | `s32-what-are-skills.md` |
| S33 | C9 | 설정과 여러 파일 skill, 다른 기능과 비교 | `s33-skill-config-comparison.md` |
| S34 | C9 | skill 공유와 문제 해결 | `s34-sharing-troubleshooting-skills.md` |
| **10. Delivery Methodology** (파일럿, 약 40분) | | | |
| S35 | C10 | 유스케이스 발굴과 자격 판정 | `s35-use-case-qualification.md` |
| S36 | C10 | 파일럿 설계와 ROI 측정 | `s36-pilot-design-roi.md` |
| S37 | C10 | 단계적 롤아웃, 변화 관리, 챔피언 | `s37-rollout-champions.md` |
| S38 | C10 | 흔한 실패 모드 예방과 30일 활성화 | `s38-failure-modes-30-day.md` |
| **11. Driving enterprise adoption of Claude** (파일럿, 약 60분) | | | |
| S39 | C11 | 1단계 Activation: 성공 팀, 프로비저닝, 문화, 교육, 런치 | `s39-activation.md` |
| S40 | C11 | 2단계 Acceleration: CoE와 Train the Trainer | `s40-acceleration.md` |
| S41 | C11 | 3단계 Expansion: 측정, 축하, 반복, 새 유스케이스 | `s41-expansion.md` |
| **캡스톤** | | | |
| S42 | 전체 | 파일럿 계획서 쓰기 | `s42-capstone-pilot-plan.md` |

주 5회면 약 8.5주, 매일이면 6주입니다.

## 폴더

- `study/course/` — 세션 노트 (이 폴더). `_template.md`가 노트 형식.
- `study/video/` — 세션 영상 (`sNN.mp4`)과 제작 파일.
- `study/notes/` — 슬기님이 직접 넣는 자료(공식 강의에서 받은 PDF, 메모 등).
- `study/progress.md` — 학습 기록과 복습 일정.
