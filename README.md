# mystudy — 학습 기록 아카이브

스킬로 만든 학습 HTML을 **토픽별로 보관**하고, 모바일에서 언제든 다시 읽는 개인 아카이브.
새 주제가 생기면 UI에서 토픽을 만들고 HTML을 업로드하면 됩니다. (현재 PIF·CPSR, PPWR, 레퍼런스 수록)

## 구조

```
content/topics.json        # 큐레이션된 토픽 메타 (제목·부제·컬러·순서)
public/lessons/<topic>/*.html   # 레슨 HTML (제목·부제는 HTML에서 자동 추출)
public/manifest.json       # 빌드 시 자동 생성 (gen-manifest.mjs)
scripts/gen-manifest.mjs   # 폴더 스캔 → manifest 생성
api/upload.ts              # 업로드 서버리스 함수 (GitHub Contents API 커밋)
src/                       # Vite + React 프론트엔드
```

- **디자인**: `DESIGN.md`(Figma 에디토리얼 — 흑백 프레임 + 파스텔 컬러블록) 기반. 폰트는 Inter / JetBrains Mono.
- **데이터 흐름**: manifest는 빌드 타임에 `public/lessons/`와 `topics.json`에서 파생됩니다. 손으로 manifest를 고칠 필요 없음.

## 업로드 동작 방식

1. `/upload`에서 토픽 선택(또는 새로 생성) + 레슨 제목 + HTML 입력
2. `POST /api/upload` → 서버리스 함수가 GitHub repo에 커밋
   - `public/lessons/<topic>/NNNN-slug.html`
   - 새 토픽이면 `content/topics.json`에 항목 추가
3. GitHub push → Vercel 자동 재배포 → `prebuild`가 manifest 재생성 → 새 글 노출 (약 30~60초)

## 로컬 개발

```bash
npm install
npm run dev        # gen-manifest 후 vite dev
npm run build      # prebuild(gen-manifest) 후 vite build
```

## 배포 (Vercel)

- GitHub repo(`passeth/mystudy`)를 Vercel에 연결하면 push마다 자동 재배포.
- **필수 환경변수**: `GITHUB_TOKEN` (repo 스코프) — 업로드 함수가 커밋할 때 사용.
- 선택: `GITHUB_REPO`(기본 `passeth/mystudy`), `GITHUB_BRANCH`(기본 `main`).

## 새 토픽/레슨 추가 (UI 없이)

`public/lessons/<새토픽>/0001-foo.html`를 두고 `content/topics.json`에 토픽 메타를 추가한 뒤 push 하면 됩니다.
HTML의 `<title>`이 레슨 제목, `<meta name="description">` 또는 `.subtitle` 요소가 부제로 추출됩니다.
