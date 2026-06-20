# mystudy

개인이 공부하면서 만든 HTML/Markdown 학습 자료를 토픽별로 보관하고 다시 읽기 위한 정적 학습 아카이브입니다.

이 저장소는 데이터베이스, 계정, 권한 모델을 가진 SaaS가 아닙니다. 대신 GitHub와 Vercel만으로 운영되는 개인용 지식 서재에 가깝습니다. 포크한 뒤 자신의 주제, 레슨, 레퍼런스를 쌓아가면 “내가 배운 것”을 오래 보관하고 모바일에서도 다시 꺼내 볼 수 있습니다.

## 왜 쓰는가

- AI나 스킬로 만든 학습 HTML을 흩어지지 않게 한 곳에 저장합니다.
- 주제별 토픽, 레슨 목록, 레슨 상세 뷰를 정적 사이트로 제공합니다.
- 모든 자료가 Git 커밋으로 남아 학습 이력이 보존됩니다.
- Vercel에 배포하면 개인 기기 어디서든 읽을 수 있습니다.
- DB가 없으므로 유지비와 운영 복잡도가 낮습니다.

## 포크해서 개인 학습 공간으로 쓰기

1. 이 저장소를 자신의 GitHub 계정으로 fork합니다.
2. fork한 저장소를 로컬에 clone합니다.

```bash
git clone https://github.com/<your-id>/mystudy.git
cd mystudy
npm install
npm run dev
```

3. 필요하면 예시 자료를 정리합니다.
   - 토픽 메타데이터: `content/topics.json`
   - 레슨 HTML: `public/lessons/<topic>/*.html`
   - 빌드 산출 manifest: `public/manifest.json`은 직접 수정하지 않아도 됩니다.

4. Vercel에 fork한 저장소를 연결합니다.
5. Vercel 환경변수를 설정합니다.

| 변수 | 설명 |
| --- | --- |
| `GITHUB_TOKEN` | 업로드/삭제 API가 GitHub에 커밋하기 위한 토큰 |
| `GITHUB_REPO` | 선택값. 기본은 `passeth/mystudy`; fork에서는 `<your-id>/<repo>`로 설정 권장 |
| `GITHUB_BRANCH` | 선택값. 기본 `main` |

6. 배포된 사이트의 `/upload`에서 토픽과 레슨을 추가합니다.

업로드 후에는 서버리스 함수가 GitHub에 커밋하고, Vercel이 다시 빌드하면서 새 레슨이 사이트에 표시됩니다.

## 추천 학습 콘텐츠 생성 방식: teach skill

이 시스템에 올릴 HTML은 Matt Pocock의 [`teach` skill](https://github.com/mattpocock/skills/tree/main/skills/productivity/teach)을 활용해 만드는 것을 권장합니다.

`teach` skill은 현재 디렉터리를 장기 학습 워크스페이스로 보고, 학습 목적(`MISSION.md`), 자료 목록(`RESOURCES.md`), 학습 기록(`learning-records/`), 레슨 HTML(`lessons/*.html`), 레퍼런스 문서(`reference/*.html`), 재사용 자산(`assets/`)을 함께 관리하는 흐름을 전제로 합니다. 특히 레슨은 “하나의 좁은 주제를 가르치는 self-contained HTML”로 만들도록 설계되어 있어 mystudy에 업로드하기 좋습니다.

권장 흐름:

1. 배우고 싶은 주제별로 별도 폴더를 만들고 teach skill을 실행합니다.
2. `MISSION.md`에 왜 이 주제를 배우는지 정리합니다.
3. teach skill로 짧고 읽기 좋은 HTML 레슨을 생성합니다.
4. 생성된 HTML을 mystudy의 `/upload`에 올립니다.
5. 반복해서 토픽별 개인 학습 라이브러리를 쌓습니다.

예시:

```text
teach skill로 “EU PPWR 재활용성 등급을 실무에서 판정하는 법”을 학습하고 싶다고 요청
-> 짧은 HTML lesson 생성
-> mystudy /upload에서 “PPWR 패키징 규제” 토픽에 추가
-> 나중에 모바일에서 다시 읽고 관련 레슨으로 이동
```

## 사이트 구조

```text
content/topics.json              # 토픽 메타데이터: 제목, 부제, 컬러, 순서
public/lessons/<topic>/*.html    # 실제 레슨 HTML
public/manifest.json             # 빌드 시 자동 생성되는 목록 데이터
scripts/gen-manifest.mjs         # lessons + topics.json -> manifest 생성
api/upload.ts                    # 업로드 서버리스 함수
api/delete.ts                    # 삭제 서버리스 함수
src/                             # Vite + React 프론트엔드
```

## 데이터 흐름

```text
public/lessons/
content/topics.json
        |
        v
scripts/gen-manifest.mjs
        |
        v
public/manifest.json
        |
        v
React UI
```

`public/manifest.json`은 빌드 때 자동 생성됩니다. 레슨 파일이나 토픽 메타데이터를 수정한 뒤 `npm run build`를 실행하면 최신 목록으로 갱신됩니다.

## 레슨 업로드 방식

`/upload`에서 다음 방식으로 레슨을 추가할 수 있습니다.

- 기존 토픽에 추가
- 새 토픽 생성 후 추가
- HTML 붙여넣기
- Markdown 붙여넣기 또는 `.md` 파일 업로드

Markdown은 클라이언트에서 HTML로 변환된 뒤 저장됩니다. 변환기는 `src/lib/markdown.ts`에 있으며, 기본적인 제목, 목록, 표, 코드블록, 링크, 이미지 문법을 지원합니다.

## 삭제 방식

토픽 페이지에서 각 레슨의 삭제 버튼을 누르면 `api/delete.ts`가 해당 HTML 파일을 GitHub에서 제거합니다. 토픽의 마지막 레슨을 삭제하면 `content/topics.json`에서도 해당 토픽이 제거됩니다.

## 로컬 개발

```bash
npm install
npm run dev
npm run build
```

`npm run dev`와 `npm run build`는 먼저 manifest를 생성한 뒤 Vite를 실행합니다.

## 배포

Vercel에 GitHub 저장소를 연결하면 `main` 브랜치 push마다 자동 배포됩니다.

업로드 기능까지 쓰려면 `GITHUB_TOKEN`이 필요합니다. 읽기 전용 정적 아카이브로만 쓸 경우에는 레슨 HTML을 직접 커밋하고 push하는 방식으로도 운영할 수 있습니다.

## UI 없이 직접 레슨 추가하기

1. `public/lessons/<topic>/0001-my-lesson.html` 형태로 HTML 파일을 추가합니다.
2. 새 토픽이면 `content/topics.json`에 토픽 메타데이터를 추가합니다.
3. `npm run build`로 manifest 생성을 확인합니다.
4. commit 후 push합니다.

HTML의 `<title>`은 레슨 제목으로, `<meta name="description">` 또는 `.subtitle` 요소는 부제로 추출됩니다.

## 한계

이 프로젝트는 개인용 정적 아카이브입니다. 다음 기능이 필요한 경우에는 별도 DB와 인증 구조를 붙이는 것이 맞습니다.

- 사용자 계정
- 비공개/공개 권한
- 태그 검색과 전문 검색
- 다중 사용자 협업
- 업로드 승인 플로우
- 대량 콘텐츠 관리

개인 학습 저장소로는 단순함이 장점입니다. 상품화하려면 이 단순함 위에 DB, 인증, 검색, 백업, 운영 도구를 새로 설계해야 합니다.
