# Claude FDE 스터디 (사이트 섹션 원본)

사이트 경로: `/t/claude-fde` (코스 홈: `/t/claude-fde/0000-course-home`, 세션: `/t/claude-fde/s01-next-token-prediction` …)

이 폴더는 Study_FDE 봇이 쓴 세션 노트를 사이트로 옮길 때 쓰는 **스냅샷과 설정**이에요.
노트의 원본은 봇 폴더(`/Users/passeth/.orca/bots/study-fde/study/`)에 있고, 이 저장소에서는 고치지 않아요.

```text
claude-fde-course/
  source/            # 봇 원본에서 복사한 README.md + s01~s42 노트 (자동, 직접 고치지 않기)
  overview.md        # 코스 홈 위쪽 소개 글 (사이트용으로 직접 쓰는 글)
  fde.config.json    # 원본 경로, 공식 경로 링크, 세션별 영상 URL·포스터
  assets/fde.css     # 세션·코스 홈 공통 스타일
  assets/fde.js      # 진행 상태(완료 체크, localStorage)
scripts/sync-fde.mjs # 원본 → 스냅샷 → public/lessons/claude-fde/*.html
scripts/sync-fde-slides.mjs  # 슬라이드 묶음 → public/slides/claude-fde/ (+ 링크 후처리)
public/lessons/claude-fde/   # 생성 결과 (커밋함. 직접 고치지 않기)
public/slides/claude-fde/    # 슬라이드 강의 사본 (커밋함. 직접 고치지 않기)
```

## 노트가 고쳐졌을 때 다시 가져오기

```bash
npm run fde:sync          # 봇 폴더 → source/ 복사 → HTML 다시 생성
npm run build             # manifest 갱신 + 빌드 확인
git add claude-fde-course public/lessons/claude-fde && git commit
```

- 다른 위치에서 가져오려면 `npm run fde:sync -- --src <study 폴더 또는 study/course 폴더>` 또는 `FDE_SRC=<경로> npm run fde:sync`.
- 원본 없이 화면만 다시 만들 때(스타일·변환기 수정 뒤): `npm run fde:render`.
- 가져오는 것: `README.md`(커리큘럼 표), `sNN-*.md` 노트, 설정에 적힌 이미지(1MB 이하).
- 가져오지 않는 것: `_official-outline-*.txt`(공식 개요 원문 메모), `_template.md`, `classroom.html`, `_needs-check.md`, 영상 파일.
  "확인이 필요한 곳" 목록은 노트 본문의 `(확인 필요)` 표시에서 직접 모아서 코스 홈에 보여 줘요.
- 원본에서 지워진 노트는 스냅샷과 사이트에서도 지워져요.

## 페이지 디자인: 강의실(무대 세트)

봇 폴더의 `classroom.html`(S01 강의실 시안)을 틀로 써요. 세션 페이지는 위에서부터 이런 방으로 이어져요.

| 방 | 노트에서 가져오는 것 |
|---|---|
| 히어로 | 제목, 코스 이름, 오늘의 목표 첫 줄. 그림이 없으면 코발트 벽 + 베이지 바닥 위의 큰 세션 번호 |
| 오늘의 강의 | `fde.config.json`의 영상 주소(유튜브면 nocookie 임베드), 없으면 "영상 준비 중" 자리. `## 영상 대본`은 아래에 접힘 |
| 핵심 단어 줌 | 제목·핵심 정리에서 고른 한 단어(또는 config의 `zoom`) |
| 핵심 정리 | `###` 소제목마다 말풍선 카드 한 장 |
| 줄 공책 | 오늘의 목표, 직접 해 보기, 확인 문제 |
| FDE 관점 | 첫 문장은 큰 문장, 나머지는 본문 |
| 복습 카드 | `- Q: … / A: …` 한 줄마다 눌러서 뒤집는 카드 |
| 시간표 | 완료 체크, 이전·다음, 11개 코스 → 42세션 |
| 밤 | 비공식 학습 자료 안내, 출처 |

- 벽·바닥 색은 코스마다 한 벌씩 돌려 써요(`scripts/sync-fde.mjs`의 `THEMES`).
- 줄 공책의 객관식은 `## 정답과 해설`의 `N. (b). 해설` 형식에서 정답을 읽어 버튼으로 바로 채점해요.
  읽지 못한 문항은 "정답과 해설 보기"로 접고, `npm run fde:render`가 목록을 출력해요.
  서술형·상황형은 "예시 답 보기"로 접혀요.
- 스크롤 연출(아이리스, 줌)은 CSS scroll-driven animation을 지원하는 브라우저에서만 움직이고, 그 밖에서는 완성된 모습으로 보여요.
- 이 섹션은 사이트의 다크 모드와 상관없이 밝은 무대 한 가지로 고정돼요(레슨 iframe 안에서만 적용).
- 노트의 `확인 필요`라는 글자는 지우지 않고 빨간 배지로 보여 줘요.

### `fde.config.json`

```json
{
  "home": { "hero": "img/stage.jpg", "heroAlt": "…", "headline": "Claude FDE *스터디*", "lines": ["…"] },
  "sessions": {
    "S01": {
      "video": "https://youtu.be/…",        // 유튜브(일부 공개) 또는 mp4 직접 링크
      "poster": "img/s01-poster.jpg",       // 영상 자리 포스터(선택)
      "hero": "img/stage.jpg",              // 히어로 그림(선택). 없으면 타이포 히어로
      "heroAlt": "…",
      "headline": "다음 *토큰*을 …",          // 히어로 큰 제목. *단어* 는 분홍 세리프 강조
      "lines": ["…"],                       // 히어로의 `>` 세 줄
      "zoom": "토큰",                        // 핵심 단어 줌
      "lab": { "title": "…", "prefix": ["오늘", "날씨가"], "dist": [["맑아요", 46]], "note": "…" }
    }
  }
}
```

이미지 경로는 봇 폴더 `course/` 기준이고, `fde:sync`가 1MB 이하 파일만 `public/lessons/claude-fde/img/`로 복사해요.
그림만 바꿨다면 `fde:sync`, 설정만 바꿨다면 `fde:render`면 돼요.

## 영상

영상 파일은 **저장소에 넣지 않아요.** 유튜브(일부 공개)에 올린 뒤 주소만 `sessions.SNN.video`에 적고 `npm run fde:render` 해요.

- YouTube 링크(`youtu.be/…`, `watch?v=…`)는 youtube-nocookie 16:9 임베드로, `.mp4` 같은 직접 링크는 `<video>`로 붙어요.
- 주소가 없으면 "영상 준비 중" 자리가 보여요. 봇 폴더 `video/sNN.mp4`가 있는데 주소가 없으면 `fde:sync`가 알려 줘요.

넣지 않는 이유: 세션 1 시범 영상만 7MB이고, 곧 새 디자인으로 바뀌며, 42개 세션으로 늘면 수백 MB가 돼요.
git은 바꾼 영상도 이력에 영원히 남겨서 저장소가 계속 커지고(GitHub 권장 1GB, 파일당 100MB 제한),
Vercel 정적 배포는 영상 스트리밍용 CDN이 아니라 대역폭이 그대로 사용량에 잡혀요.
추천 호스팅: YouTube(일부 공개) 또는 Cloudflare R2·Vercel Blob 같은 객체 저장소의 mp4 직접 링크.

## 슬라이드 강의 (`/slides/claude-fde/`)

같은 강의를 장면 단위로 넘기며 보는 별도 페이지예요. 장면마다 영상과 같은 모션 + 그 장면의 음성·자막이 나오고,
오른쪽 패널은 강의 목록, 아래 패널은 학습 자료(영상·노트·문제·복습 카드·출처)예요.
묶음은 Study_FDE 쪽에서 만들고(`<study>/slides/site/`: `_shared/`, `s01/`~`s42/`, `index.html`), 이 저장소는 사본만 둬요.

- 진입: `/slides/claude-fde/` (S01로 이동), 세션별 `/slides/claude-fde/s07/` — **끝 슬래시 필수**(상대 경로 `./assets`, `../_shared`).
- 사이트 쪽 진입점은 `fde:render`가 붙여요: 코스 홈 히어로 "슬라이드로 처음부터", 시간표 각 줄의 "슬라이드",
  세션 페이지 영상 아래 "슬라이드로 보기". `public/slides/claude-fde/sNN/index.html`이 있는 세션에만 붙어요.
- `vercel.json`의 SPA 리라이트는 `slides/`를 제외해요. 없는 슬라이드 파일은 앱 화면이 아니라 404가 돼요.

### 슬라이드를 다시 받을 때

```bash
npm run fde:slides        # <study>/slides/site → public/slides/claude-fde/ 복사 + 링크 후처리
npm run fde:render        # 세션 페이지·코스 홈의 슬라이드 버튼 갱신
npm run build
git add public/slides/claude-fde public/lessons/claude-fde && git commit
```

- 다른 위치: `npm run fde:slides -- --src <묶음 폴더>` 또는 `FDE_SLIDES_SRC=<경로>`. 기본값은 `fde.config.json`의 `source` + `/slides/site`.
- 묶음이 아직 만들어지는 중이면(세션 폴더·`_shared`·`assets` 누락) 복사하지 않고 멈춰요. 생성이 끝난 뒤 다시 실행하세요.
- 후처리(원본 폴더는 건드리지 않고 사본에만):
  1. 묶음 안의 `/t/claude-fde/<id>` 링크를 `public/lessons/claude-fde/`의 실제 노트 파일과 맞춰요.
     세션 번호(`sNN-`)가 같은 노트로 바꾸고, 코스 홈은 `0000-course-home`으로. 맞출 수 없는 링크가 있으면 실패해요.
  2. `index.html`마다 `<!-- mystudy:trailing-slash -->` 한 줄을 넣어, 끝 슬래시 없이 열렸을 때 슬래시를 붙여 다시 열어요.
- 사본만 다시 검사: `npm run fde:slides -- --check`.

### 용량

묶음은 약 63MB, 파일 758개(mp3 280 · webp 254 · js 173, 가장 큰 파일 약 0.4MB)예요.
GitHub(파일당 100MB, 저장소 1GB 권장)와 Vercel(Git 배포, 출력 파일 수 제한 없음) 한도 안이에요.
다만 git은 바뀐 mp3·webp를 이력에 계속 쌓으므로, 묶음을 통째로 다시 만들 때마다 저장소가 최대 수십 MB씩 커질 수 있어요.
자주 다시 만들게 되면 음성·그림을 객체 저장소(Cloudflare R2, Vercel Blob)로 옮기는 걸 검토하세요.
