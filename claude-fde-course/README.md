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
public/lessons/claude-fde/   # 생성 결과 (커밋함. 직접 고치지 않기)
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

## 노트 형식에서 기대하는 것

- frontmatter: `session`, `course`, `title`, `minutes`, `status`, `official_sections`
- `## 확인 문제`와 `## 정답과 해설`이 같은 번호의 목록이면 문항마다 "정답과 해설 보기"로 접혀요. 형식이 다르면(S42처럼) 해설 전체를 하나로 접어요.
- `## 복습 카드`의 `- Q: … / A: …` 줄은 카드로 바뀌고 답이 접혀요.
- `## 영상 대본`은 항상 접혀 있고, 영상이 있는 세션은 영상 바로 아래에 놓여요.
- `확인 필요`라는 글자는 지우지 않고 빨간 배지로 보여 줘요.

## 영상

영상 파일은 **저장소에 넣지 않아요.** 외부에 올린 뒤 URL만 `fde.config.json`에 적어요.

```json
"sessions": {
  "S01": { "video": "https://…/s01.mp4", "poster": "img/hero.jpg" },
  "S02": { "video": "https://youtu.be/XXXXXXXXXXX" }
}
```

- `.mp4` 같은 직접 링크면 `<video>`로, YouTube 링크면 youtube-nocookie 임베드로 붙어요.
- URL이 비어 있으면 "영상 준비 중" 자리(포스터 이미지)가 보여요. 봇 폴더 `video/sNN.mp4`가 있는데 URL이 없으면 `fde:sync`가 알려 주고 자리를 만들어요.

넣지 않는 이유: 세션 1 시범 영상만 7MB이고, 곧 새 디자인으로 바뀌며, 42개 세션으로 늘면 수백 MB가 돼요.
git은 바꾼 영상도 이력에 영원히 남겨서 저장소가 계속 커지고(GitHub 권장 1GB, 파일당 100MB 제한),
Vercel 정적 배포는 영상 스트리밍용 CDN이 아니라 대역폭이 그대로 사용량에 잡혀요.
추천 호스팅: YouTube(일부 공개) 또는 Cloudflare R2·Vercel Blob 같은 객체 저장소의 mp4 직접 링크.
