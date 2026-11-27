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
