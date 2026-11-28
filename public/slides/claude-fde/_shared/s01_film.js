/* v3 S01 Film — human-md.ai 영감 시네마틱 무대 · Claude FDE 스터디 S01 (326.54s)
   - 기존 seulki 나레이션(cues.js) 타임스탬프에 100% 동기화
   - 시그니처 전환 5종:
     1) 공부 책상 허브 L->R 트럭 + dolly 1.6x 푸시인 + clip-path: circle() 아이리스 포털
     2) 로그 스케일 글자 관통 줌 (왜? -> L01 핑크 방, 토큰 -> L04 라일락 방)
     3) 화면을 떠다니는 #FC4109 단일 점 + 전체 화면 도트 와이프 (L01->L02, L04->L05)
     4) 고정 세트 스프링 팝업 / 좌->우 물결 / 중력 낙하 / 바닥 단면 상승(rise)
     5) 단 한 번의 R->L 역방향 휩팬(L10) -> 줄 공책 형광펜 -> 밤하늘 크레인 업 -> 북엔드 풀백 */

(() => {
  // ---------- 헬퍼 ----------
  const lerpPt = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];

  // ---------- 0. 상단 미니멀 HUD (배경 밝기에 따라 ink <-> paper 0.6초 전환) ----------
  const hudEl = $('#hud');
  const hudLeft = $('#hud-left');
  const hudPill = $('#hud-pill');
  const hudProg = $('#hud-prog-fill');

  // [tStart, darkBg(bool), pillLabel]
  const HUD_SEG = [
    [0.00, true, 'S01 · OPENING'],
    [5.85, false, '01 · 오늘의 질문'],
    [35.80, false, '02 · 네 가지 성질'],
    [71.10, false, '03 · 한 조각씩 쓴다'],
    [99.45, false, '04 · 확률에서 뽑는다'],
    [150.65, false, '05 · 몰린 분포 vs 퍼진 분포'],
    [179.55, false, '06 · 능력 쪽'],
    [211.77, true, '07 · 한계 쪽'],
    [240.55, false, '08 · 일에 맞게 받쳐 주기'],
    [268.20, false, '09 · 고객 앞에서'],
    [302.32, false, '10 · 한 줄 정리'],
    [317.00, true, 'NEXT · S02 지식'],
    [321.74, true, 'S01 · Claude FDE'],
  ];

  onFrame(t => {
    hudProg.style.transform = `scaleX(${clamp01(t / DUR).toFixed(5)})`;
    let cur = HUD_SEG[0], prev = HUD_SEG[0];
    for (let i = 0; i < HUD_SEG.length; i++) {
      if (t >= HUD_SEG[i][0]) {
        prev = i > 0 ? HUD_SEG[i - 1] : HUD_SEG[0];
        cur = HUD_SEG[i];
      }
    }
    const u = prog(t, cur[0], cur[0] + 0.55, 'sineInOut');
    const darkMix = lerp(prev[1] ? 1 : 0, cur[1] ? 1 : 0, u);
    const r = Math.round(lerp(32, 244, darkMix));
    const g = Math.round(lerp(30, 239, darkMix));
    const b = Math.round(lerp(31, 232, darkMix));
    const fg = `rgb(${r},${g},${b})`;
    const bgA = darkMix > 0.5 ? 'rgba(244,239,232,0.14)' : 'rgba(32,30,31,0.09)';
    const bdA = darkMix > 0.5 ? 'rgba(244,239,232,0.34)' : 'rgba(32,30,31,0.28)';
    hudLeft.style.color = fg;
    hudPill.style.color = fg;
    hudPill.style.background = bgA;
    hudPill.style.border = `1.5px solid ${bdA}`;
    hudPill.textContent = cur[2];
    hudEl.style.opacity = t < 0.45 ? prog(t, 0.15, 0.45, 'reveal').toFixed(3) : '1';
  });

  // =========================================================================
  // 1. 오프닝 히어로 (0.00 .. 4.90) — Cobalt #0B41C2 + Sand #D1C2AF
  // =========================================================================
  const rOpen = makeRoom('#0B41C2', '#D1C2AF', 25, 10);
  const openInner = mk(rOpen, '', '', 'position:absolute;inset:0;transform-origin:50% 50%;');
  // 좌상단 타이틀 + .S01 (사이에 #FC4109 점이 안착)
  const opTitle = mk(openInner, 'h-hero',
    '<span style="color:#F4EFE8;">Claude FDE</span><span style="display:inline-block;width:54px;"></span><span style="color:#FFABC8;">S01</span>',
    'position:absolute;left:96px;top:170px;font-size:138px;'
  );
  const opSub = mk(openInner, 'body-l', '생성형 AI의 네 가지 성질과 다음 토큰 예측',
    'position:absolute;left:102px;top:350px;color:#F4EFE8;font-weight:600;font-size:44px;');
  const opGt1 = mk(openInner, 'gt-line', '', 'position:absolute;left:104px;top:450px;color:rgba(244,239,232,0.88);');
  const opGt2 = mk(openInner, 'gt-line', '', 'position:absolute;left:104px;top:492px;color:rgba(244,239,232,0.88);');
  const opHost = makeProp(openInner, 'v3_host.png', 1390, 178, 300, 740, 195);
  const opTiles = makeProp(openInner, 'v3_tokens_3d.png', 1120, 610, 270, 220, 195);
  const opNote = mk(openInner, 'footnote',
    '비공식 학습 자료 · 공식 강의: Anthropic Claude FDE 학습 경로',
    'left:96px;top:886px;color:#201E1F;background:rgba(244,239,232,0.75);');

  animReveal(opTitle, 0.35, 0.70, 0, 42, 'surface');
  animReveal(opSub, 0.72, 0.58, 0, 28, 'reveal');
  animType(opGt1, 'C1 · AI Capabilities & Limitations', 1.10, 0.95, '<span class="gt">&gt;</span>', false);
  animType(opGt2, '첫 번째 성질 · 다음 토큰 예측', 1.85, 0.85, '<span class="gt">&gt;</span>', true);
  animPop(opHost, 0.55, 0.80, 90, 'bouncy', 0.84);
  animPop(opTiles, 0.95, 0.75, 70, 'bouncy', 0.74);
  animReveal(opNote, 1.35, 0.50, 0, 14, 'reveal');
  markPop(0.55, 'open_host');
  markTick(1.10, 'open_type');

  onFrame(t => {
    if (t >= 6.45) { rOpen.style.visibility = 'hidden'; return; }
    rOpen.style.visibility = 'visible';
    // 0.0~0.55 중앙에서 수직 펼침
    const unfurl = prog(t, 0.0, 0.55, 'camera');
    rOpen.style.clipPath = unfurl < 1
      ? `inset(${((1 - unfurl) * 50).toFixed(2)}% 0 ${((1 - unfurl) * 50).toFixed(2)}% 0)`
      : 'none';
    // 4.15~5.10 오프닝 콘텐츠 시차 퇴장 (exit)
    if (t > 4.15) {
      const ex = prog(t, 4.15, 5.05, 'exit');
      openInner.style.transform = `translate3d(0,${lerp(0, -140, ex).toFixed(1)}px,0)`;
      openInner.style.opacity = (1 - clamp01((t - 4.20) / 0.65)).toFixed(3);
    } else {
      openInner.style.transform = 'none';
      openInner.style.opacity = '1';
    }
  });

  // =========================================================================
  // 1B. 로그 스케일 글자 관통 줌 #1: "왜?" (4.55 .. 6.45) -> L01 핑크 방으로 관통!
  // =========================================================================
  const rWhyZoom = mk('#stage', 'room', '', 'background:transparent;z-index:16;visibility:hidden;pointer-events:none;');
  const whyWrap = mk(rWhyZoom, '', '', 'position:absolute;inset:0;transform-origin:848px 510px;');
  // 거대한 #FFABC8 "왜?" (글자 획이 L01 벽 색 #FFABC8과 완벽히 일치!)
  const whyWord = mk(whyWrap, 'h-giant', '왜?',
    'position:absolute;left:670px;top:310px;color:#FFABC8;font-size:380px;text-shadow:0 22px 44px rgba(11,65,194,0.28);');
  const whySub = mk(rWhyZoom, 'body-m', '똑같은 질문, 다른 답',
    'position:absolute;left:0;right:0;top:730px;text-align:center;color:#F4EFE8;font-weight:600;');
  markCut(4.80, 'why_zoom');

  onFrame(t => {
    if (t < 4.45 || t >= 6.45) { rWhyZoom.style.visibility = 'hidden'; return; }
    rWhyZoom.style.visibility = 'visible';
    if (t < 5.15) {
      const u = prog(t, 4.45, 5.10, 'rise');
      whyWrap.style.transform = `translate3d(0,${lerp(90, 0, u).toFixed(1)}px,0) scale(${lerp(0.65, 1, u).toFixed(4)})`;
      whyWord.style.opacity = clamp01((t - 4.45) / 0.22).toFixed(3);
      whySub.style.opacity = prog(t, 4.70, 5.05, 'reveal').toFixed(3);
    } else {
      // 로그 스케일 줌: Z^(power2InOut(u)), 초점을 화면 중앙(960,540)으로 수렴
      const u = prog(t, 5.15, 6.28, 'power2InOut');
      const s = Math.pow(30, u);
      const fu = prog(t, 5.15, 6.15, 'sineInOut');
      const tx = lerp(0, 112, fu);
      const ty = lerp(0, 30, fu);
      whyWrap.style.transform = `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0) scale(${s.toFixed(4)})`;
      whyWord.style.opacity = '1';
      whySub.style.opacity = (1 - clamp01((t - 5.15) / 0.25)).toFixed(3);
    }
  });

  // =========================================================================
  // 2. L01 (6.05 .. 35.95) — Pink #FFABC8 + Warm Tabletop #EFEDE8
  // =========================================================================
  const rL01 = makeRoom('#FFABC8', '#EFEDE8', 26, 18);
  const l01Title = mk(rL01, 'h-ch', '<span class="hash">##</span>같은 질문, 다른 답',
    'position:absolute;left:96px;top:128px;color:#201E1F;');
  const l01Prompt = mk(rL01, 'gt-line', '',
    'position:absolute;left:100px;top:240px;color:#201E1F;font-size:27px;');
  const l01Host = makeProp(rL01, 'v3_host.png', 1380, 168, 300, 740, 195);
  const l01Bub1 = mk(rL01, 'hm-bub tail-r',
    '<span style="font-family:var(--f-mono);font-size:20px;color:#FC4109;display:block;margin-bottom:4px;">1ST TRY</span>월요 엔진 점검',
    'left:160px;top:345px;min-width:440px;');
  const l01Bub2 = mk(rL01, 'hm-bub tail-r',
    '<span style="font-family:var(--f-mono);font-size:20px;color:#0B41C2;display:block;margin-bottom:4px;">2ND TRY</span>한 주 예열 타임',
    'left:430px;top:510px;min-width:460px;');

  // "고장 난 걸까요?" -> 취소선 + "고장이 아니에요"
  const l01Q = mk(rL01, 'body-l', '고장 난 걸까요?',
    'position:absolute;left:166px;top:716px;color:#201E1F;font-weight:700;font-size:44px;');
  const l01Svg = svgIn(rL01);
  const l01Strike = svgPath(l01Svg, 'M 156 746 L 452 738', '#FC4109', 8);
  const l01Ans = mk(rL01, 'h-ch',
    '<span style="color:#FC4109;">고장이 아니에요</span> <span class="ser-it" style="font-size:52px;color:#201E1F;margin-left:14px;">by design</span>',
    'position:absolute;left:530px;top:702px;font-size:64px;');
  const l01Next = mk(rL01, 'gt-line', '',
    'position:absolute;left:166px;top:834px;color:#201E1F;font-size:26px;');

  const tL01_prompt = wt('L01', '우리');
  const tL01_b1 = wt('L01', '월요');
  const tL01_b2 = wt('L01', '예열');
  const tL01_q = wt('L01', '고장');
  const tL01_no = wt('L01', '아니에요');
  const tL01_next = wt('L01', '다음');

  animReveal(l01Title, 6.25, 0.55, 0, 26, 'reveal');
  animPop(l01Host, 6.35, 0.78, 95, 'bouncy', 0.82);
  animType(l01Prompt, '"우리 팀 주간 회의 이름을 재치 있게 하나만 지어 줘"', tL01_prompt, 2.2, '<span class="gt">&gt;</span>', false);
  animPop(l01Bub1, tL01_b1 - 0.05, 0.65, 56, 'bouncy', 0.75);
  animPop(l01Bub2, tL01_b2 - 0.05, 0.65, 56, 'bouncy', 0.75);
  animReveal(l01Q, tL01_q - 0.1, 0.42, 0, 20, 'reveal');
  animDraw(l01Strike, tL01_no, 0.36, 'camera');
  animPop(l01Ans, tL01_no + 0.12, 0.62, 42, 'snappy', 0.82);
  animType(l01Next, '오늘의 주제 · 다음 토큰 예측', tL01_next, 1.3, '<span class="gt">&gt;</span>', true);

  markPop(tL01_b1, 'l01_bub1');
  markPop(tL01_b2, 'l01_bub2');
  markPop(tL01_no + 0.12, 'l01_not_broken');

  onFrame(t => {
    if (t < 6.08 || t >= 35.90) { rL01.style.visibility = 'hidden'; return; }
    rL01.style.visibility = 'visible';
    rL01.style.opacity = prog(t, 6.08, 6.32, 'linear').toFixed(3);
    // 바닥 테이블(#EFEDE8)이 아래에서 스프링으로 올라옴
    const fu = prog(t, 6.22, 6.95, 'bouncy');
    rL01.floor.style.transform = `translate3d(0,${lerp(280, 0, fu).toFixed(1)}px,0)`;
  });

  // =========================================================================
  // 3. 공부 책상 허브 ("Study Desk Hub") — Mustard #C0902F + Panning Tabletop #EFEDE8
  //    재사용 구간:
  //    A) L02 전체 (35.75 .. 71.65): 4가지 성질 L->R 트럭 + 능력<->한계 눈금 + Station 1 dolly
  //    B) L05->L06 브릿지 (178.00 .. 180.25): Station 1 -> Station 3(만년필) 짧은 트럭 + dolly
  //    C) L08->L09 브릿지 (267.00 .. 268.80): Station 3 -> Station 4(고객 테이블) 짧은 트럭 + dolly
  //    D) L10 역방향 휩팬 (301.95 .. 304.95): 단 한 번의 R->L 휩팬으로 Station 4 -> Station 1 복귀!
  // =========================================================================
  const rHub = makeRoom('#C0902F', null, 0, 20);
  const hubCam = mk(rHub, '', '', 'position:absolute;inset:0;transform-origin:960px 560px;');
  const hubWorld = mk(hubCam, '', '', 'position:absolute;left:0;top:0;width:4800px;height:1080px;');

  // 책상 바닥 띠 (4800px 와이드, 0.72 축소 시에도 하단 여백 노출 없도록 780px 높이)
  mk(hubWorld, '', '', 'position:absolute;left:-400px;width:5600px;top:730px;height:780px;background:#EFEDE8;border-top:2px solid rgba(32,30,31,0.12);');

  // 4개 성질 오브젝트 스테이션 (x = 960, 1920, 2880, 3840)
  const hubStations = [
    { x: 960, art: 'v3_tokens_3d.png', w: 360, h: 290, y: 470, num: '01', name: '다음 토큰 예측', tag: 'NEXT TOKEN' },
    { x: 1920, art: 'v3_hollow_book_3d.png', w: 310, h: 340, y: 424, num: '02', name: '지식', tag: 'KNOWLEDGE' },
    { x: 2880, art: 'v3_nib_3d.png', w: 230, h: 400, y: 366, num: '03', name: '작업 기억', tag: 'WORKING MEMORY' },
    { x: 3840, art: 'v3_desk_duo.png', w: 460, h: 290, y: 472, num: '04', name: '조종 가능성', tag: 'STEERABILITY' },
  ].map(stObj => {
    const p = makeProp(hubWorld, stObj.art, stObj.x - stObj.w / 2, stObj.y, stObj.w, stObj.h);
    const lbl = mk(hubWorld, '',
      `<div class="mono" style="font-size:21px;color:#FC4109;letter-spacing:0.08em;">${stObj.num} · ${stObj.tag}</div>` +
      `<div style="font-size:42px;font-weight:800;color:#201E1F;margin-top:4px;">${stObj.name}</div>`,
      `position:absolute;left:${stObj.x - 210}px;top:792px;width:420px;text-align:center;`
    );
    return { ...stObj, prop: p, lbl };
  });

  // 허브 고정 좌상단 타이틀 (L02에서만 표시)
  const hubTitle = mk(rHub, 'h-ch', '<span class="hash">##</span>네 가지 성질',
    'position:absolute;left:96px;top:116px;color:#201E1F;');
  const hubSub = mk(rHub, 'gt-line', '', 'position:absolute;left:102px;top:212px;color:#201E1F;font-size:25px;');

  // 능력 <-> 한계 단일 눈금자 (L02 후반 50.6..66.0)
  const scaleWrap = mk(rHub, '', '',
    'position:absolute;left:220px;top:290px;width:1480px;height:150px;pointer-events:none;');
  mk(scaleWrap, 'hm-pill', '능력  Capability', 'left:0;top:18px;font-size:30px;padding:10px 26px;background:#69B488;color:#201E1F;');
  mk(scaleWrap, 'hm-pill', '한계  Limitation', 'right:0;top:18px;font-size:30px;padding:10px 26px;background:#FFABC8;color:#201E1F;');
  mk(scaleWrap, '', '', 'position:absolute;left:280px;right:280px;top:52px;height:5px;background:#201E1F;border-radius:3px;');
  const scaleKnob = mk(scaleWrap, '', '',
    'position:absolute;left:740px;top:35px;width:38px;height:38px;margin-left:-19px;border-radius:50%;background:#FC4109;border:3px solid #201E1F;');
  const scaleCap = mk(scaleWrap, 'body-m', '한 성질의 양쪽 끝',
    'position:absolute;left:0;right:0;top:98px;text-align:center;color:#201E1F;font-weight:700;font-size:30px;');

  const tL02_s1 = wt('L02', '다음');
  const tL02_s2 = wt('L02', '지식');
  const tL02_s3 = wt('L02', '작업');
  const tL02_s4 = wt('L02', '조종');
  const tL02_sc = wt('L02', '성질마다');
  const tL02_both = wt('L02', '양쪽');
  const tL02_lim = wt('L02', '한계');
  const tL02_open = wt('L02', '오늘은');

  animType(hubSub, '공부 책상 위의 네 가지 렌즈', 36.6, 1.4, '<span class="gt">&gt;</span>', false);
  markTick(tL02_s1, 'hub_s1');
  markTick(tL02_s2, 'hub_s2');
  markTick(tL02_s3, 'hub_s3');
  markTick(tL02_s4, 'hub_s4');
  markPop(tL02_sc, 'hub_scale');
  markCut(70.55, 'iris_to_l03');
  markCut(179.20, 'iris_to_l06');
  markCut(267.85, 'iris_to_l09');
  markCut(302.32, 'reverse_whip_pan');

  onFrame(t => {
    const inA = (t >= 35.75 && t < 71.75);
    const inB = (t >= 178.10 && t < 180.30);
    const inC = (t >= 267.00 && t < 268.85);
    const inD = (t >= 301.95 && t < 305.05);
    if (!inA && !inB && !inC && !inD) { rHub.style.visibility = 'hidden'; return; }
    rHub.style.visibility = 'visible';

    // z-index: 브릿지 구간에서는 이전 룸 위로 올라와야 함
    rHub.style.zIndex = inA ? '20' : (inB ? '32' : (inC ? '42' : '48'));

    let camX = 960; // viewport center가 바라보는 world X
    let dollyS = 1.0;

    if (inA) {
      hubTitle.style.opacity = prog(t, 36.1, 36.6, 'reveal').toFixed(3);
      hubSub.style.opacity = prog(t, 36.5, 36.9, 'reveal').toFixed(3);
      // L->R 순방향 트럭 (Station 1 -> 2 -> 3 -> 4)
      if (t < tL02_s2 - 0.1) {
        camX = 960;
      } else if (t < tL02_s3 - 0.05) {
        camX = lerp(960, 1920, prog(t, tL02_s2 - 0.1, tL02_s2 + 0.65, 'camera'));
      } else if (t < tL02_s4 - 0.1) {
        camX = lerp(1920, 2880, prog(t, tL02_s3 - 0.05, tL02_s3 + 0.65, 'camera'));
      } else if (t < tL02_sc) {
        camX = lerp(2880, 3840, prog(t, tL02_s4 - 0.1, tL02_s4 + 0.75, 'camera'));
      } else if (t < tL02_open) {
        // 4개 전체가 느긋하게 보이도록 중앙(2400)에 넓은 샷으로 정렬
        camX = lerp(3840, 2400, prog(t, tL02_sc, tL02_sc + 1.1, 'camera'));
        dollyS = lerp(1.0, 0.72, prog(t, tL02_sc, tL02_sc + 1.1, 'camera'));
      } else {
        // 첫 번째 오브젝트(Station 1, x=960)로 포커스 복귀 후 1.6x dolly 푸시인!
        const backU = prog(t, tL02_open, tL02_open + 1.4, 'camera');
        camX = lerp(2400, 960, backU);
        const baseS = lerp(0.72, 1.0, backU);
        const pushU = prog(t, 68.40, 70.75, 'dolly');
        dollyS = baseS * lerp(1.0, 1.68, pushU);
      }
      // 능력<->한계 눈금자 제어
      const scIn = prog(t, tL02_sc, tL02_sc + 0.55, 'reveal');
      const scOut = 1 - prog(t, tL02_open - 0.2, tL02_open + 0.35, 'linear');
      const scOp = scIn * scOut;
      scaleWrap.style.opacity = scOp.toFixed(3);
      scaleWrap.style.transform = `translate3d(0,${lerp(24, 0, scIn).toFixed(1)}px,0)`;
      // 슬라이더 노브가 능력 <-> 한계 사이를 오감
      let knobX = 740;
      if (t >= tL02_both && t < tL02_lim) {
        knobX = 740 + Math.sin((t - tL02_both) * 1.6) * 320;
      } else if (t >= tL02_lim) {
        knobX = lerp(740, 1110, prog(t, tL02_lim, tL02_lim + 0.7, 'bouncy'));
      }
      scaleKnob.style.left = `${knobX.toFixed(1)}px`;
    } else {
      hubTitle.style.opacity = '0';
      hubSub.style.opacity = '0';
      scaleWrap.style.opacity = '0';
      if (inB) {
        // L05 -> L06 브릿지: Station 2 -> Station 3(만년필) L->R 트럭 + dolly 1.6x
        camX = lerp(1920, 2880, prog(t, 178.15, 178.95, 'camera'));
        dollyS = lerp(1.0, 1.65, prog(t, 178.85, 179.45, 'dolly'));
      } else if (inC) {
        // L08 -> L09 브릿지: Station 3 -> Station 4(고객 테이블) L->R 트럭 + dolly 1.6x
        camX = lerp(2880, 3840, prog(t, 267.05, 267.75, 'camera'));
        dollyS = lerp(1.0, 1.65, prog(t, 267.65, 268.25, 'dolly'));
      } else if (inD) {
        // L10 단 한 번의 R->L 역방향 휩팬 (Station 4 -> Station 1 귀환!)
        camX = lerp(3840, 960, prog(t, 302.15, 304.05, 'camera'));
        dollyS = lerp(0.86, 1.0, prog(t, 302.15, 304.05, 'sineInOut'));
      }
    }

    hubWorld.style.transform = `translate3d(${(960 - camX).toFixed(1)}px,0,0)`;
    hubCam.style.transform = `scale(${dollyS.toFixed(4)})`;

    // 각 스테이션 활성 강조 (가까운 스테이션 살짝 확대)
    hubStations.forEach((s, i) => {
      const dist = Math.abs(camX - s.x);
      const focus = clamp01(1 - dist / 850);
      const bob = Math.sin(t * 2.1 + i * 1.2) * 4 * focus;
      s.prop.style.transform = `translate3d(0,${bob.toFixed(1)}px,0) scale(${lerp(0.92, 1.05, focus).toFixed(4)})`;
      s.lbl.style.opacity = lerp(0.45, 1, focus).toFixed(3);
    });
  });

  // =========================================================================
  // 4. L03 (70.55 .. 100.20) — Sky Blue #5D9DC5 + Pink Floor #FFABC8
  //    아이리스 포털 열림 -> 기계 + 토큰 알약 물결 -> 거대 "토큰" 로그 줌 관통!
  // =========================================================================
  const rL03 = makeRoom('#5D9DC5', '#FFABC8', 25, 24);
  const l03Title = mk(rL03, 'h-ch', '<span class="hash">##</span>한 조각씩 쓴다',
    'position:absolute;left:96px;top:124px;color:#201E1F;');
  const l03Sub = mk(rL03, 'gt-line', '',
    'position:absolute;left:102px;top:222px;color:#201E1F;font-size:25px;');
  const l03Mach = makeProp(rL03, 'v3_machine_3d.png', 1290, 328, 490, 502, 340);

  // 토큰 알약 좌->우 물결
  const tokSpecs = [
    { txt: '오늘', x: 100, t0: wt('L03', '지금까지'), cls: 'hm-pill' },
    { txt: '날씨가', x: 266, t0: wt('L03', '지금까지') + 0.35, cls: 'hm-pill' },
    { txt: '맑', x: 472, t0: wt('L03', '작은'), cls: 'hm-pill acc' },
    { txt: '아', x: 604, t0: wt('L03', '붙이고'), cls: 'hm-pill yellow' },
    { txt: '요', x: 736, t0: wt('L03', '고르죠'), cls: 'hm-pill pink' },
  ];
  const tokWrap = mk(rL03, '', '', 'position:absolute;inset:0;');
  const tokEls = tokSpecs.map((tk, i) => {
    const el = mk(tokWrap, tk.cls, tk.txt, `left:${tk.x}px;top:490px;font-size:46px;padding:16px 36px;`);
    animPop(el, tk.t0, 0.55, 65, 'bouncy', 0.65);
    markPop(tk.t0, `tok_${i}`);
    return el;
  });

  // 반복 루프 화살표 ("다시 전체를 보고 -> 다음 조각")
  const l03Svg = svgIn(tokWrap);
  const l03Arc = svgPath(l03Svg, 'M 790 470 C 760 350, 210 350, 180 468', '#201E1F', 4);
  const l03ArcHead = svgPath(l03Svg, 'M 164 452 L 180 470 L 198 454', '#201E1F', 4);
  const l03LoopTxt = mk(tokWrap, 'mono', '전체 다시 읽기 → 다음 1조각',
    'position:absolute;left:320px;top:338px;font-size:23px;color:#201E1F;background:#F4EFE8;padding:4px 14px;border-radius:999px;border:1.5px solid #201E1F;');
  const tL03_loop = wt('L03', '다시');
  animDraw(l03Arc, tL03_loop, 0.75, 'camera');
  animDraw(l03ArcHead, tL03_loop + 0.65, 0.2, 'linear');
  animReveal(l03LoopTxt, tL03_loop + 0.2, 0.45, 0, 14, 'reveal');

  // 거대 라일락 "토큰" -> L04 벽 색(#CB9CF8)으로 로그 스케일 관통 줌!
  const tL03_tok = wt('L03', '토큰이라고');
  const tL03_piece = wt('L03', '단어');
  const l03GiantWrap = mk(rL03, '', '', 'position:absolute;inset:0;transform-origin:700px 510px;');
  const l03Giant = mk(l03GiantWrap, 'h-giant', '토큰',
    'position:absolute;left:560px;top:310px;color:#CB9CF8;font-size:390px;text-shadow:0 24px 50px rgba(32,30,31,0.22);');
  const l03PieceSub = mk(rL03, 'hm-pill', '단어 하나 · 단어의 일부 · 글자 하나',
    'left:575px;top:742px;font-size:32px;padding:12px 32px;');

  animReveal(l03Title, 71.75, 0.55, 0, 26, 'reveal');
  animType(l03Sub, '한 번에 완성하지 않고, 앞 글을 보고 다음 1조각만 고른다', 72.4, 2.0, '<span class="gt">&gt;</span>', false);
  animPop(l03Mach, 72.10, 0.75, 90, 'bouncy', 0.78);
  animReveal(l03PieceSub, tL03_piece, 0.50, 0, 20, 'reveal');
  markPop(tL03_tok, 'giant_token');
  markCut(98.40, 'token_zoom_l04');

  controlRoom(rL03, 70.55, 100.10, {
    irisIn: { t0: 70.55, dur: 1.05, cx: 960, cy: 560 },
  });

  onFrame(t => {
    if (t < 70.55 || t >= 100.10) return;
    // 토큰 나올 때마다 기계 살짝 바운스
    let machPulse = 0;
    tokSpecs.forEach(tk => {
      if (t >= tk.t0 && t < tk.t0 + 0.35) {
        machPulse = Math.max(machPulse, Math.sin(((t - tk.t0) / 0.35) * Math.PI));
      }
    });
    if (t > 72.9) {
      l03Mach.style.transform = `translate3d(0,${(-machPulse * 14).toFixed(1)}px,0) scale(${(1 + machPulse * 0.04).toFixed(4)})`;
    }
    // 거대 "토큰" 등장 및 로그 스케일 관통 줌 (98.35 .. 99.65)
    if (t < tL03_tok) {
      l03GiantWrap.style.opacity = '0';
      tokWrap.style.opacity = '1';
      tokWrap.style.transform = 'none';
    } else if (t < 98.35) {
      const u = prog(t, tL03_tok, tL03_tok + 0.75, 'rise');
      l03GiantWrap.style.opacity = clamp01((t - tL03_tok) / 0.20).toFixed(3);
      l03GiantWrap.style.transform = `translate3d(0,${lerp(100, 0, u).toFixed(1)}px,0) scale(${lerp(0.68, 1, u).toFixed(4)})`;
      // 기존 알약과 기계는 은은히 물러남
      const fadeU = prog(t, tL03_tok, tL03_tok + 0.55, 'linear');
      tokWrap.style.opacity = lerp(1, 0.16, fadeU).toFixed(3);
      tokWrap.style.transform = `translate3d(0,${lerp(0, 70, fadeU).toFixed(1)}px,0)`;
      l03Mach.style.opacity = lerp(1, 0.25, fadeU).toFixed(3);
    } else {
      // 로그 스케일 관통 줌: Z^(power2InOut(u)), 초점을 화면 중앙(960,540)으로 수렴
      const u = prog(t, 98.35, 99.60, 'power2InOut');
      const s = Math.pow(32, u);
      const fu = prog(t, 98.35, 99.45, 'sineInOut');
      const tx = lerp(0, 260, fu);
      const ty = lerp(0, 30, fu);
      l03GiantWrap.style.opacity = '1';
      l03GiantWrap.style.transform = `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0) scale(${s.toFixed(4)})`;
      tokWrap.style.opacity = '0';
      l03PieceSub.style.opacity = (1 - clamp01((t - 98.35) / 0.22)).toFixed(3);
      l03Title.style.opacity = (1 - clamp01((t - 98.35) / 0.25)).toFixed(3);
      l03Sub.style.opacity = (1 - clamp01((t - 98.35) / 0.25)).toFixed(3);
      l03Mach.style.opacity = '0';
    }
  });

  // =========================================================================
  // 5. L04 (99.45 .. 150.75) — Lilac #CB9CF8 + Terracotta Floor #C85A2C
  //    유리 구슬 항아리 + 최소 확률 막대 + 바닥 단면 상승(rise) -> API temperature 제거!
  // =========================================================================
  const rL04 = makeRoom('#CB9CF8', '#C85A2C', 25, 26);
  const l04Upper = mk(rL04, '', '', 'position:absolute;inset:0;');
  const l04Title = mk(l04Upper, 'h-ch', '<span class="hash">##</span>확률에서 뽑는다',
    'position:absolute;left:96px;top:114px;color:#201E1F;');
  const l04Prompt = mk(l04Upper, 'gt-line', '',
    'position:absolute;left:102px;top:210px;color:#201E1F;font-size:28px;');
  const l04Jar = makeProp(l04Upper, 'v3_marbles_3d.png', 1320, 250, 440, 560, 300);

  // 최소 확률 막대 (카드 박스 없이 깔끔한 선·색면만!)
  const tL04_ex = wt('L04', '오늘');
  const tL04_b1 = wt('L04', '맑아요가', 0);
  const tL04_b2 = wt('L04', '좋네요가', 0);
  const tL04_pick1 = wt('L04', '맑아요가', 1);
  const tL04_pick2 = wt('L04', '좋네요가', 1);
  const tL04_ref = wt('L04', '참고로');
  const tL04_temp = wt('L04', '템퍼러처');
  const tL04_date = wt('L04', '이천이십육');
  const tL04_err = wt('L04', '오류가');
  const tL04_sol = wt('L04', '출력');

  const bars = [
    { label: '맑아요', pct: 46, color: '#0B41C2', t0: tL04_b1 },
    { label: '좋네요', pct: 31, color: '#26512F', t0: tL04_b2 },
    { label: '흐려요', pct: 18, color: '#C85A2C', t0: tL04_b2 + 0.9 },
    { label: '그 밖', pct: 5, color: '#201E1F', t0: tL04_b2 + 1.4 },
  ].map((b, i) => {
    const y = 290 + i * 96;
    const row = mk(l04Upper, '', '', `position:absolute;left:102px;top:${y}px;width:1060px;height:74px;`);
    const lbl = mk(row, '', b.label, 'position:absolute;left:0;top:10px;width:170px;font-size:40px;font-weight:800;color:#201E1F;');
    const track = mk(row, '', '', 'position:absolute;left:186px;top:14px;width:720px;height:46px;background:rgba(244,239,232,0.58);border:1.5px solid #201E1F;border-radius:999px;overflow:hidden;');
    const fill = mk(track, '', '', `position:absolute;left:0;top:0;bottom:0;width:${b.pct * 1.92}%;background:${b.color};transform-origin:0 50%;border-radius:999px;`);
    const num = mk(row, 'mono', `${b.pct}%`, 'position:absolute;left:926px;top:14px;font-size:34px;font-weight:700;color:#201E1F;');
    const hi = mk(row, '', '', 'position:absolute;left:-14px;top:2px;right:8px;bottom:2px;border:3.5px solid #FC4109;border-radius:16px;opacity:0;pointer-events:none;');
    markTick(b.t0, `l04_bar_${i}`);
    return { ...b, row, fill, hi };
  });

  const l04ExNote = mk(l04Upper, 'footnote',
    '※ 설명용 예시 확률 (실제 모델 확률 값 아님)',
    'left:102px;top:680px;color:#201E1F;background:rgba(244,239,232,0.72);');

  // 바닥 단면 상승 챔버 (#CF4A1A) — API temperature 제거 & 진짜 해법
  const l04Chamber = mk(rL04, '', '',
    'position:absolute;left:0;right:0;bottom:0;height:520px;background:#CF4A1A;border-top:3px solid #201E1F;transform:translate3d(0,540px,0);');
  const l04ChTag = mk(l04Chamber, 'gt-line', '',
    'position:absolute;left:102px;top:44px;color:#F8D867;font-size:25px;');
  const l04ChMain = mk(l04Chamber, 'h-ch',
    '<span style="color:#F4EFE8;font-family:var(--f-mono);font-size:58px;">temperature</span> <span style="color:#FFABC8;font-size:60px;">파라미터 제거</span>',
    'position:absolute;left:102px;top:102px;');
  const l04ErrPill = mk(l04Chamber, 'hm-pill ink', '보내면 오류 반환',
    'left:980px;top:106px;font-size:32px;padding:10px 28px;border-color:#F4EFE8;');
  const l04SolRow = mk(l04Chamber, '',
    '<span class="gt-line" style="color:#F4EFE8;font-size:28px;margin-right:20px;"><span class="gt" style="color:#F8D867;">&gt;</span>일정한 답이 필요할 때:</span>',
    'position:absolute;left:102px;top:240px;');
  const l04Sol1 = mk(l04Chamber, 'hm-pill', '출력 형식 지정', 'left:480px;top:222px;font-size:34px;');
  const l04Sol2 = mk(l04Chamber, 'hm-pill yellow', '판단 기준 명시', 'left:790px;top:222px;font-size:34px;');

  animReveal(l04Title, 99.75, 0.55, 0, 26, 'reveal');
  animType(l04Prompt, '"오늘 날씨가 ____"  후보별 확률 분포', tL04_ex - 0.3, 1.5, '<span class="gt">&gt;</span>', false);
  animPop(l04Jar, 100.1, 0.78, 85, 'bouncy', 0.80);
  animReveal(l04ExNote, tL04_b1 + 0.3, 0.45, 0, 14, 'reveal');
  animType(l04ChTag, 'API 2026-10-21 변경 사항 (바닥 단면 확인)', tL04_date - 0.4, 1.3, '<span class="gt" style="color:#F8D867;">&gt;</span>', true);
  animReveal(l04ChMain, tL04_temp, 0.55, 0, 24, 'reveal');
  animPop(l04ErrPill, tL04_err - 0.1, 0.50, 30, 'snappy', 0.78);
  animReveal(l04SolRow, tL04_sol - 0.4, 0.45, 0, 16, 'reveal');
  animPop(l04Sol1, tL04_sol, 0.55, 40, 'bouncy', 0.76);
  animPop(l04Sol2, tL04_sol + 0.7, 0.55, 40, 'bouncy', 0.76);
  markPop(tL04_pick1, 'l04_pick1');
  markPop(tL04_pick2, 'l04_pick2');
  markCut(tL04_ref, 'l04_chamber_rise');
  markPop(tL04_err, 'l04_err_badge');

  onFrame(t => {
    if (t < 99.45 || t >= 150.75) { rL04.style.visibility = 'hidden'; return; }
    rL04.style.visibility = 'visible';
    rL04.style.opacity = prog(t, 99.45, 99.65, 'linear').toFixed(3);
    // 유리 구슬 항아리 은은한 숨결 부유
    if (t > 101.0) {
      l04Jar.style.transform = `translate3d(0,${(Math.sin(t * 1.9) * 6).toFixed(1)}px,0)`;
    }
    // 확률 막대 채우기 + 선택 강조
    bars.forEach((b, i) => {
      const u = prog(t, b.t0, b.t0 + 0.70, 'camera');
      b.row.style.opacity = clamp01((t - b.t0 + 0.15) / 0.25).toFixed(3);
      b.fill.style.transform = `scaleX(${u.toFixed(4)})`;
      if (i === 0) {
        const on = (t >= tL04_pick1 - 0.1 && t < tL04_pick2 - 0.1);
        b.hi.style.opacity = on ? '1' : '0';
      } else if (i === 1) {
        const on = (t >= tL04_pick2 - 0.1 && t < tL04_ref);
        b.hi.style.opacity = on ? '1' : '0';
      }
    });
    // 바닥 단면 상승 (rise, 128.3..129.6)
    const chU = prog(t, tL04_ref, tL04_ref + 1.15, 'rise');
    l04Chamber.style.transform = `translate3d(0,${lerp(540, 0, chU).toFixed(1)}px,0)`;
    // 위쪽 막대는 살짝 축소 정리하고, 상단 타이틀/프롬프트는 HUD와 겹치지 않도록 깔끔히 페이드
    l04Upper.style.transform = `translate3d(0,${lerp(0, -135, chU).toFixed(1)}px,0) scale(${lerp(1, 0.86, chU).toFixed(4)})`;
    l04Upper.style.transformOrigin = '50% 0%';
    if (t >= tL04_ref) {
      const topFade = (1 - prog(t, tL04_ref, tL04_ref + 0.45, 'linear')).toFixed(3);
      l04Title.style.opacity = topFade;
      l04Prompt.style.opacity = topFade;
    }
  });

  // =========================================================================
  // 6. L05 (150.65 .. 178.30) — 분할 벽 무대 (Sky #5D9DC5 | Yellow #F8D867 + Sand #D1C2AF)
  // =========================================================================
  const rL05 = makeRoom('#5D9DC5', '#D1C2AF', 24, 28);
  mk(rL05, '', '', 'position:absolute;left:960px;top:0;right:0;bottom:259px;background:#F8D867;border-left:2px solid #201E1F;');
  mk(rL05, 'wall-light');

  const tL05_q = wt('L05', '대한민국의');
  const tL05_seoul = wt('L05', '서울이라는');
  const tL05_meet = wt('L05', '회의');
  const tL05_spread = wt('L05', '후보');

  // 1단계: 중앙 질문 ("대한민국의 수도는?")
  const l05QWrap = mk(rL05, '', '', 'position:absolute;left:0;right:0;top:220px;text-align:center;');
  mk(l05QWrap, 'gt-line', '<span class="gt">&gt;</span>잠깐 생각해 볼까요?', 'color:#201E1F;font-size:26px;margin-bottom:16px;');
  mk(l05QWrap, 'h-ch', '“대한민국의 수도는?”', 'color:#201E1F;font-size:84px;');
  const l05QSub = mk(l05QWrap, 'body-l', '왜 매번 똑같이 답할까요?', 'color:#201E1F;margin-top:16px;font-weight:600;');

  // 좌측 몰린 분포 (서울 기둥 1개 압도적 상승)
  const l05LeftHdr = mk(rL05, 'h-ch', '<span class="hash">##</span>몰린 분포',
    'position:absolute;left:96px;top:120px;font-size:62px;color:#201E1F;');
  const l05LeftSub = mk(rL05, 'gt-line', '<span class="gt">&gt;</span>한 후보에 확률 집중 → 거의 일정',
    'position:absolute;left:102px;top:206px;color:#201E1F;font-size:24px;');
  const seoulPillar = mk(rL05, '',
    '<div style="color:#F4EFE8;font-size:66px;font-weight:900;padding-top:34px;text-align:center;">서울</div>' +
    '<div class="mono" style="color:#FFABC8;font-size:24px;text-align:center;margin-top:8px;">DOMINANT</div>',
    'position:absolute;left:350px;bottom:259px;width:260px;height:460px;background:#0B41C2;border:2px solid #201E1F;border-bottom:none;border-radius:20px 20px 0 0;transform-origin:50% 100%;');

  // 우측 퍼진 분포 (회의 이름 5개 기둥 좌->우 물결)
  const l05RightHdr = mk(rL05, 'h-ch', '<span class="hash">##</span>퍼진 분포',
    'position:absolute;left:1048px;top:120px;font-size:62px;color:#201E1F;');
  const l05RightSub = mk(rL05, 'gt-line', '<span class="gt">&gt;</span>여러 후보가 고르게 → 매번 달라짐',
    'position:absolute;left:1054px;top:206px;color:#201E1F;font-size:24px;');

  const meetNames = [
    { txt: '엔진\n점검', h: 195, col: '#FC4109', fg: '#F4EFE8' },
    { txt: '예열\n타임', h: 185, col: '#26512F', fg: '#F4EFE8' },
    { txt: '주간\n싱크', h: 175, col: '#0B41C2', fg: '#F4EFE8' },
    { txt: '모닝\n체크', h: 168, col: '#CB9CF8', fg: '#201E1F' },
    { txt: '월요\n브리핑', h: 158, col: '#FFABC8', fg: '#201E1F' },
  ];
  const meetPillars = meetNames.map((m, i) => {
    const x = 1030 + i * 164;
    const el = mk(rL05, '',
      `<div style="color:${m.fg};font-size:27px;font-weight:800;line-height:1.25;text-align:center;padding-top:24px;white-space:pre;">${m.txt}</div>`,
      `position:absolute;left:${x}px;bottom:259px;width:144px;height:${m.h}px;background:${m.col};border:2px solid #201E1F;border-bottom:none;border-radius:16px 16px 0 0;transform-origin:50% 100%;`
    );
    markTick(tL05_spread + i * 0.14, `l05_p_${i}`);
    return el;
  });

  animReveal(l05LeftHdr, tL05_seoul - 0.3, 0.50, 0, 22, 'reveal');
  animReveal(l05LeftSub, tL05_seoul, 0.45, 0, 16, 'reveal');
  animReveal(l05RightHdr, tL05_meet - 0.3, 0.50, 0, 22, 'reveal');
  animReveal(l05RightSub, tL05_meet, 0.45, 0, 16, 'reveal');
  markPop(tL05_seoul, 'l05_seoul');

  onFrame(t => {
    if (t < 150.65 || t >= 178.30) { rL05.style.visibility = 'hidden'; return; }
    rL05.style.visibility = 'visible';
    // 중앙 질문은 151.3~161.8에 떠 있다가 서울 기둥 등장 시 깔끔히 페이드아웃
    const qIn = prog(t, 151.2, 151.85, 'reveal');
    const qOut = 1 - prog(t, tL05_seoul - 0.65, tL05_seoul - 0.1, 'linear');
    l05QWrap.style.opacity = (qIn * qOut).toFixed(3);
    l05QWrap.style.transform = `translate3d(0,${lerp(30, 0, qIn).toFixed(1)}px,0)`;
    l05QSub.style.opacity = prog(t, tL05_q + 2.0, tL05_q + 2.45, 'reveal').toFixed(3);

    // 서울 기둥 rise
    const sU = prog(t, tL05_seoul, tL05_seoul + 0.85, 'rise');
    seoulPillar.style.opacity = clamp01((t - tL05_seoul) / 0.12).toFixed(3);
    seoulPillar.style.transform = `scaleY(${sU.toFixed(4)})`;

    // 5개 회의 이름 기둥 bouncy 좌->우 물결
    meetPillars.forEach((p, i) => {
      const t0 = tL05_spread + i * 0.14;
      const u = prog(t, t0, t0 + 0.65, 'bouncy');
      p.style.opacity = clamp01((t - t0) / 0.10).toFixed(3);
      p.style.transform = `scaleY(${u.toFixed(4)})`;
    });
  });

  // =========================================================================
  // 7. L06 (179.20 .. 211.77) — Mint #69B488 + Bottle Green #26512F
  //    아이리스 포털 -> 우측 정렬 레이아웃 + 황금 만년필 3D + 5개 능력 알약 아크 + "하나"
  // =========================================================================
  const rL06 = makeRoom('#69B488', '#26512F', 24, 34);
  const l06Title = mk(rL06, 'h-ch', '<span class="hash">###</span>능력 쪽 · 다재다능',
    'position:absolute;right:96px;top:120px;color:#201E1F;text-align:right;');
  const l06Sub = mk(rL06, 'gt-line', '',
    'position:absolute;right:100px;top:216px;color:#201E1F;font-size:25px;text-align:right;');
  const l06Nib = makeProp(rL06, 'v3_nib_3d.png', 210, 240, 320, 610, 210);

  const tL06_pre = wt('L06', '사전');
  const tL06_tr = wt('L06', '번역');
  const tL06_dr = wt('L06', '초안');
  const tL06_cl = wt('L06', '분류');
  const tL06_cd = wt('L06', '코드');
  const tL06_one = wt('L06', '뿌리는');

  // 수렴 루트 선 (알약 뒤에 깔리도록 먼저 배치) + 5개 능력 알약
  const l06Svg = svgIn(rL06);
  const rootPaths = [
    'M 820 390 C 820 510, 1130 515, 1130 578',
    'M 1065 390 C 1065 500, 1130 515, 1130 578',
    'M 1340 390 C 1340 510, 1130 515, 1130 578',
    'M 930 500 C 930 548, 1130 548, 1130 578',
    'M 1210 500 C 1210 548, 1130 548, 1130 578',
  ].map(d => svgPath(l06Svg, d, '#26512F', 4));

  const capPills = [
    { txt: '번역', x: 740, y: 315, t0: tL06_tr, cls: 'hm-pill' },
    { txt: '요약', x: 985, y: 315, t0: tL06_tr + 0.30, cls: 'hm-pill yellow' },
    { txt: '초안 쓰기', x: 1230, y: 315, t0: tL06_dr, cls: 'hm-pill' },
    { txt: '분류', x: 850, y: 425, t0: tL06_cl, cls: 'hm-pill pink' },
    { txt: '코드 작성', x: 1090, y: 425, t0: tL06_cd, cls: 'hm-pill' },
  ];
  capPills.forEach((cp, i) => {
    const el = mk(rL06, cp.cls, cp.txt, `left:${cp.x}px;top:${cp.y}px;font-size:38px;padding:14px 36px;`);
    animPop(el, cp.t0, 0.58, 56, 'bouncy', 0.72);
    markTick(cp.t0, `l06_cap_${i}`);
  });

  const l06One = mk(rL06, '',
    '<span style="font-size:94px;font-weight:900;color:#FC4109;letter-spacing:-0.04em;">뿌리는 하나</span>' +
    '<div class="mono" style="font-size:24px;color:#201E1F;margin-top:4px;">NEXT TOKEN PREDICTION</div>',
    'position:absolute;left:760px;top:592px;width:740px;text-align:center;');

  animReveal(l06Title, 180.1, 0.55, 0, 24, 'reveal');
  animType(l06Sub, '문법 · 설명 · 요약 · 코드 패턴을 한꺼번에 익혔다', tL06_pre, 1.8, '<span class="gt">&gt;</span>', false);
  animPop(l06Nib, 180.35, 0.78, 90, 'bouncy', 0.80);
  rootPaths.forEach((p, i) => animDraw(p, tL06_one - 0.4 + i * 0.06, 0.55, 'camera'));
  animPop(l06One, tL06_one, 0.65, 50, 'bouncy', 0.78);
  markPop(tL06_one, 'l06_one_root');

  controlRoom(rL06, 179.20, 211.77, {
    irisIn: { t0: 179.20, dur: 0.90, cx: 960, cy: 540 },
  });

  // =========================================================================
  // 8. L07 (211.77 .. 241.15) — 암전 스포트라이트 컷! Ink #201E1F + Pink Floor #F0A8C0
  // =========================================================================
  const rL07 = makeRoom('#201E1F', '#F0A8C0', 24, 36);
  // 무대 스포트라이트 빛 원
  mk(rL07, '', '',
    'position:absolute;left:1100px;top:110px;width:720px;height:720px;border-radius:50%;' +
    'background:radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 48%, transparent 72%);pointer-events:none;');

  const l07Title = mk(rL07, 'h-ch', '<span class="hash">###</span>한계 쪽 · 그럴듯함 ≠ 사실',
    'position:absolute;left:96px;top:120px;color:#F4EFE8;');
  const l07Sub = mk(rL07, 'gt-line', '',
    'position:absolute;left:102px;top:218px;color:#FFABC8;font-size:25px;');
  const l07Book = makeProp(rL07, 'v3_hollow_book_3d.png', 1270, 276, 460, 520, 320);

  const tL07_plaus = wt('L07', '그럴듯한');
  const tL07_paper = wt('L07', '세상에');
  const tL07_fake = wt('L07', '지어낼');
  const tL07_calc = wt('L07', '긴');
  const tL07_root = wt('L07', '유창함과');

  const l07FakePaper = mk(rL07, 'gt-line', '',
    'position:absolute;left:102px;top:350px;color:#F4EFE8;font-size:32px;background:rgba(255,255,255,0.06);padding:20px 28px;border:1.5px solid rgba(244,239,232,0.28);border-radius:16px;min-width:960px;');
  const l07Badge = mk(rL07, 'hm-pill acc', '존재하지 않음',
    'left:102px;top:468px;font-size:38px;padding:12px 34px;');
  const l07Calc = mk(rL07, 'gt-line', '',
    'position:absolute;left:102px;top:586px;color:rgba(244,239,232,0.84);font-size:26px;');
  const l07Bottom = mk(rL07, 'h-ch',
    '<span style="color:#F4EFE8;">유창함과 오류는</span> <span style="color:#FFABC8;">한 뿌리</span>',
    'position:absolute;left:102px;top:680px;font-size:66px;');

  animReveal(l07Title, 212.0, 0.50, 0, 24, 'reveal');
  animType(l07Sub, '고르는 것은 “그럴듯한 다음 조각”이지, 확인된 사실이 아니다', tL07_plaus - 0.5, 2.0, '<span class="gt">&gt;</span>', false);
  animDrop(l07Book, 212.6, 0.72, -160, 'bouncy');
  animType(l07FakePaper, '"2024 Neural Scaling & Enterprise FDE Review"', tL07_paper, 2.0, '<span class="gt">&gt;</span>', true);
  animPop(l07Badge, tL07_fake - 0.15, 0.52, 36, 'snappy', 0.74);
  animType(l07Calc, '긴 계산 · 글자 수 세기 → 도구 없으면 틀릴 수 있음', tL07_calc, 1.8, '<span class="gt">&gt;</span>', false);
  animPop(l07Bottom, tL07_root, 0.62, 40, 'reveal', 0.90);

  markCut(211.77, 'l07_light_off');
  markPop(tL07_fake - 0.15, 'l07_fake_stamp');

  onFrame(t => {
    if (t < 211.77 || t >= 241.15) { rL07.style.visibility = 'hidden'; return; }
    rL07.style.visibility = 'visible';
    // 240.18..241.05 크레인 다운으로 L07이 위로 슬라이드 아웃
    if (t >= 240.18) {
      const u = prog(t, 240.18, 241.05, 'camera');
      rL07.style.transform = `translate3d(0,${lerp(0, -1080, u).toFixed(1)}px,0)`;
    } else {
      rL07.style.transform = 'none';
    }
  });

  // =========================================================================
  // 9. L08 (240.18 .. 267.15) — 크레인 다운! Olive #B0BE77 + Terracotta #C0623E
  //    "모델을 믿지 말자" 취소선 -> "받쳐 주기" + 3개 기둥 중력 낙하 + 위험 미터 하강
  // =========================================================================
  const rL08 = makeRoom('#B0BE77', '#C0623E', 24, 38);
  const l08Title = mk(rL08, 'h-ch', '<span class="hash">##</span>일에 맞게 받쳐 주기',
    'position:absolute;left:96px;top:116px;color:#201E1F;');

  const tL08_no = wt('L08', '모델을');
  const tL08_nope = wt('L08', '아니에요');
  const tL08_ans = wt('L08', '받쳐');
  const tL08_p1 = wt('L08', '계산이나');
  const tL08_p2 = wt('L08', '출력');
  const tL08_p3 = wt('L08', '사람이');
  const tL08_risk = wt('L08', '위험은');

  const l08Wrong = mk(rL08, 'body-l', '“모델을 믿지 말자”',
    'position:absolute;left:104px;top:224px;color:#201E1F;font-weight:700;font-size:40px;');
  const l08Svg = svgIn(rL08);
  const l08Strike = svgPath(l08Svg, 'M 98 250 L 424 244', '#FC4109', 7);
  const l08Ans = mk(rL08, 'hm-pill acc', '받쳐 주기',
    'left:490px;top:214px;font-size:36px;padding:10px 30px;');

  const l08Prop = makeProp(rL08, 'v3_supports_3d.png', 1320, 326, 460, 440, 320);

  // 언어 모델 들보 + 아래에 끼워지는 받침대 기둥 3개
  const l08Beam = mk(rL08, '',
    '<span style="color:#F4EFE8;font-size:34px;font-weight:800;">언어 모델</span><span class="mono" style="color:#FFABC8;font-size:20px;margin-left:18px;">LLM CORE</span>',
    'position:absolute;left:104px;top:370px;width:960px;height:76px;line-height:74px;padding:0 34px;background:#201E1F;border-radius:16px;border:2px solid #201E1F;');

  const pillars = [
    { num: '01', txt: '계산 · 검색 도구', col: '#0B41C2', fg: '#F4EFE8', x: 104, t0: tL08_p1 },
    { num: '02', txt: '출력 형식 · 기준', col: '#26512F', fg: '#F4EFE8', x: 434, t0: tL08_p2 },
    { num: '03', txt: '사람 확인', col: '#FC4109', fg: '#F4EFE8', x: 764, t0: tL08_p3 },
  ].map((p, i) => {
    const el = mk(rL08, '',
      `<div class="mono" style="font-size:20px;opacity:0.82;margin-bottom:8px;">SUPPORT ${p.num}</div>` +
      `<div style="font-size:32px;font-weight:800;line-height:1.25;">${p.txt}</div>`,
      `position:absolute;left:${p.x}px;top:460px;width:300px;height:210px;padding:28px 24px;background:${p.col};color:${p.fg};border:2px solid #201E1F;border-radius:16px;`
    );
    animDrop(el, p.t0 - 0.1, 0.65, -180, 'bouncy');
    markPop(p.t0, `l08_pillar_${i}`);
    return el;
  });

  // 한계 위험 하강 미터 (바닥 띠 바로 위)
  const riskWrap = mk(rL08, '', '',
    'position:absolute;left:104px;top:730px;width:960px;height:66px;');
  mk(riskWrap, 'mono', '한계 위험도', 'position:absolute;left:0;top:16px;font-size:25px;color:#201E1F;font-weight:700;');
  const riskTrack = mk(riskWrap, '', '', 'position:absolute;left:168px;top:16px;width:660px;height:34px;background:rgba(244,239,232,0.55);border:2px solid #201E1F;border-radius:999px;overflow:hidden;');
  const riskFill = mk(riskTrack, '', '', 'position:absolute;left:0;top:0;bottom:0;width:100%;background:#FC4109;transform-origin:0 50%;');
  const riskLbl = mk(riskWrap, 'mono', 'HIGH', 'position:absolute;left:850px;top:16px;font-size:24px;color:#201E1F;font-weight:700;');

  animReveal(l08Title, 240.8, 0.50, 0, 22, 'reveal');
  animReveal(l08Wrong, tL08_no - 0.1, 0.45, 0, 18, 'reveal');
  animDraw(l08Strike, tL08_nope, 0.35, 'camera');
  animPop(l08Ans, tL08_ans - 0.1, 0.55, 36, 'bouncy', 0.78);
  animPop(l08Prop, 246.8, 0.78, 80, 'bouncy', 0.80);
  animReveal(l08Beam, 248.2, 0.55, 0, 22, 'reveal');
  markCut(240.18, 'l08_crane_down');
  markPop(tL08_ans, 'l08_support_ans');

  onFrame(t => {
    if (t < 240.18 || t >= 267.15) { rL08.style.visibility = 'hidden'; return; }
    rL08.style.visibility = 'visible';
    if (t < 241.05) {
      const u = prog(t, 240.18, 241.05, 'camera');
      rL08.style.transform = `translate3d(0,${lerp(1080, 0, u).toFixed(1)}px,0)`;
    } else {
      rL08.style.transform = 'none';
    }
    // 위험도 단계별 감소: 0.90 -> 0.58 -> 0.32 -> 0.14
    riskWrap.style.opacity = prog(t, 249.2, 249.7, 'reveal').toFixed(3);
    const v1 = lerp(0.90, 0.58, prog(t, tL08_p1, tL08_p1 + 0.6, 'camera'));
    const v2 = lerp(v1, 0.32, prog(t, tL08_p2, tL08_p2 + 0.6, 'camera'));
    const v3 = lerp(v2, 0.14, prog(t, tL08_p3, tL08_p3 + 0.7, 'camera'));
    riskFill.style.transform = `scaleX(${v3.toFixed(4)})`;
    riskFill.style.background = v3 < 0.25 ? '#26512F' : (v3 < 0.45 ? '#C0902F' : '#FC4109');
    riskLbl.textContent = v3 < 0.25 ? 'LOW' : (v3 < 0.45 ? 'MID' : 'HIGH');
  });

  // =========================================================================
  // 10. L09 (267.85 .. 302.10) — 아이리스 포털 -> Yellow #F8D867 + Wood #D7B583
  //     현장 미팅 테이블(v3_desk_duo) + human-md 말풍선 + KPI 전환
  // =========================================================================
  const rL09 = makeRoom('#F8D867', '#D7B583', 24, 44);
  const l09Title = mk(rL09, 'h-ch', '<span class="hash">##</span>고객 앞에서',
    'position:absolute;left:96px;top:114px;color:#201E1F;');
  const l09Duo = makeProp(rL09, 'v3_desk_duo.png', 540, 390, 840, 524, 660);

  const tL09_cli = wt('L09', '어제랑');
  const tL09_you = wt('L09', '여러분이라면');
  const tL09_fde = wt('L09', '이걸');
  const tL09_kpi = wt('L09', '성공');
  const tL09_pass = wt('L09', '업무', 1);

  const l09BubCli = mk(rL09, 'hm-bub tail-l',
    '<span style="font-family:var(--f-mono);font-size:19px;color:#FC4109;display:block;margin-bottom:4px;">CLIENT</span>어제랑 똑같이 물었는데 답이 달라요.\n믿어도 되는 건가요?',
    'left:96px;top:248px;max-width:610px;font-size:31px;');
  const l09You = mk(rL09, 'gt-line', '',
    'position:absolute;right:96px;top:138px;color:#201E1F;font-size:26px;text-align:right;');
  const l09BubFde = mk(rL09, 'hm-bub tail-r',
    '<span style="font-family:var(--f-mono);font-size:19px;color:#26512F;display:block;margin-bottom:4px;">FDE · 설계 근거</span>확률 구조라 표현은 달라질 수 있고,\n업무 기준 통과율로 검증합니다.',
    'right:96px;top:248px;max-width:620px;font-size:31px;');

  // KPI 합의 전환 (우측 상단 깔끔한 한 줄)
  const l09KpiOld = mk(rL09, 'body-m', '100% 같은 답',
    'position:absolute;left:1080px;top:128px;color:#201E1F;font-weight:700;font-size:34px;');
  const l09Svg = svgIn(rL09);
  const l09KpiStrike = svgPath(l09Svg, 'M 1072 152 L 1300 146', '#FC4109', 6);
  const l09KpiNew = mk(rL09, 'hm-pill acc', '업무 기준 통과율',
    'left:1354px;top:116px;font-size:34px;padding:10px 30px;');

  animReveal(l09Title, 268.6, 0.50, 0, 22, 'reveal');
  animPop(l09Duo, 268.8, 0.78, 85, 'bouncy', 0.84);
  animPop(l09BubCli, tL09_cli - 0.05, 0.62, 48, 'bouncy', 0.78);
  animType(l09You, '여러분이라면 어떻게 답하실까요?', tL09_you, 1.5, '<span class="gt">&gt;</span>', true);
  animPop(l09BubFde, tL09_fde + 0.1, 0.62, 48, 'bouncy', 0.78);
  animReveal(l09KpiOld, tL09_kpi, 0.45, 0, 16, 'reveal');
  animDraw(l09KpiStrike, tL09_pass - 0.6, 0.36, 'camera');
  animPop(l09KpiNew, tL09_pass - 0.1, 0.55, 36, 'snappy', 0.78);

  markPop(tL09_cli, 'l09_cli');
  markPop(tL09_fde + 0.1, 'l09_fde');
  markPop(tL09_pass, 'l09_kpi');

  controlRoom(rL09, 267.85, 302.10, {
    irisIn: { t0: 267.85, dur: 0.85, cx: 960, cy: 540 },
  });

  onFrame(t => {
    if (t < 267.85 || t >= 302.10) return;
    // KPI가 올라올 때 "여러분이라면..." 프롬프트는 깔끔히 퇴장
    if (t >= tL09_kpi - 0.35) {
      l09You.style.opacity = (1 - prog(t, tL09_kpi - 0.35, tL09_kpi, 'linear')).toFixed(3);
    }
  });

  // =========================================================================
  // 11. L10 줄 공책 요약 (304.05 .. 317.40) — Paper #F4EFE8 + Blue 42% Lines + Pink 66% HL
  // =========================================================================
  const rNote = mk('#stage', 'room', '', 'background:#F4EFE8;z-index:50;visibility:hidden;');
  mk(rNote, 'notebook-page');
  mk(rNote, 'notebook-margin');

  const nHdr = mk(rNote, 'h-ch', '<span class="hash">##</span>딱 한 줄 정리',
    'position:absolute;left:244px;top:116px;color:#201E1F;font-size:66px;');

  const tL10_1 = wt('L10', '언어');
  const tL10_2 = wt('L10', '유창하지만');
  const tL10_3 = wt('L10', '도구와');

  const nL1 = mk(rNote, '',
    '언어 모델은 <span class="pink-hl-wrap">다음 토큰을 확률로 하나씩 뽑기<span class="pink-hl-bar" id="hl1"></span></span> 때문에',
    'position:absolute;left:244px;top:290px;font-size:50px;font-weight:800;line-height:1.5;color:#201E1F;');
  const nL2 = mk(rNote, '',
    '<span class="pink-hl-wrap">유창하지만 틀릴 수도 있고,<span class="pink-hl-bar" id="hl2"></span></span>',
    'position:absolute;left:244px;top:442px;font-size:50px;font-weight:800;line-height:1.5;color:#201E1F;');
  const nL3 = mk(rNote, '',
    '그래서 <span class="pink-hl-wrap">도구 · 형식 · 사람 확인<span class="pink-hl-bar" id="hl3"></span></span>으로 받쳐 줘야 해요.',
    'position:absolute;left:244px;top:594px;font-size:50px;font-weight:800;line-height:1.5;color:#201E1F;');
  const nSrc = mk(rNote, 'footnote',
    '출처: Anthropic Claude FDE 학습 경로 · C1 AI Capabilities & Limitations',
    'left:244px;top:792px;color:#5d625f;background:transparent;padding-left:0;');

  animReveal(nHdr, 304.4, 0.45, 0, 20, 'reveal');
  animReveal(nL1, tL10_1 - 0.1, 0.50, 0, 22, 'reveal');
  animReveal(nL2, tL10_2 - 0.15, 0.50, 0, 22, 'reveal');
  animReveal(nL3, tL10_3 - 0.3, 0.50, 0, 22, 'reveal');
  animReveal(nSrc, tL10_3 + 1.2, 0.50, 0, 14, 'reveal');
  markTick(tL10_1 + 0.8, 'hl1');
  markTick(tL10_2, 'hl2');
  markTick(tL10_3, 'hl3');

  const hl1 = $('#hl1'), hl2 = $('#hl2'), hl3 = $('#hl3');
  onFrame(t => {
    if (t < 304.05 || t >= 317.45) { rNote.style.visibility = 'hidden'; return; }
    rNote.style.visibility = 'visible';
    let y = 0;
    if (t < 304.85) {
      y = lerp(1080, 0, prog(t, 304.05, 304.85, 'surface'));
    } else if (t >= 316.50) {
      // 크레인 업: 노트가 아래로 내려가고 밤하늘이 위에서 내려옴!
      y = lerp(0, 1080, prog(t, 316.50, 317.40, 'camera'));
    }
    rNote.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
    hl1.style.transform = `scaleX(${prog(t, tL10_1 + 0.7, tL10_1 + 2.3, 'camera').toFixed(4)})`;
    hl2.style.transform = `scaleX(${prog(t, tL10_2, tL10_2 + 1.4, 'camera').toFixed(4)})`;
    hl3.style.transform = `scaleX(${prog(t, tL10_3, tL10_3 + 1.8, 'camera').toFixed(4)})`;
  });

  // =========================================================================
  // 12. 크레인 업 밤하늘 예고 (316.50 .. 322.10) — Night #171B33 + Pink Clouds #FFABC8
  // =========================================================================
  const rNight = mk('#stage', 'room', '', 'background:#171B33;z-index:51;visibility:hidden;');
  // 핑크 뭉게구름 3개 (에디토리얼 플랫 2단 실루엣, 유유히 떠다님)
  const clouds = [
    { x: 130, y: 185, w: 320, h: 86, sp: 18 },
    { x: 1370, y: 245, w: 370, h: 96, sp: -14 },
    { x: 280, y: 710, w: 280, h: 78, sp: 12 },
  ].map(c => {
    const wrap = mk(rNight, '', '', `position:absolute;left:${c.x}px;top:${c.y}px;width:${c.w}px;height:${c.h + 56}px;opacity:0.92;`);
    mk(wrap, '', '', `position:absolute;left:0;bottom:0;width:${c.w}px;height:${c.h}px;background:#FFABC8;border-radius:999px;`);
    mk(wrap, '', '', `position:absolute;left:${Math.round(c.w * 0.18)}px;bottom:${Math.round(c.h * 0.45)}px;width:${Math.round(c.w * 0.42)}px;height:${Math.round(c.h * 0.92)}px;background:#FFABC8;border-radius:50%;`);
    mk(wrap, '', '', `position:absolute;left:${Math.round(c.w * 0.48)}px;bottom:${Math.round(c.h * 0.35)}px;width:${Math.round(c.w * 0.34)}px;height:${Math.round(c.h * 0.78)}px;background:#FFABC8;border-radius:50%;`);
    return { ...c, el: wrap };
  });

  const tL10_know = wt('L10', '지식을');
  const nightTag = mk(rNight, 'gt-line', '<span class="gt">&gt;</span>NEXT SESSION · S02',
    'position:absolute;left:0;right:0;top:330px;text-align:center;color:#FFABC8;font-size:28px;');
  const nightTitle = mk(rNight, 'h-kw', '두 번째 성질, <span style="color:#FFABC8;">지식</span>',
    'position:absolute;left:0;right:0;top:395px;text-align:center;color:#F4EFE8;font-size:112px;');
  const nightSub = mk(rNight, 'body-l', '학습 데이터 · 지식 컷오프 · 환각',
    'position:absolute;left:0;right:0;top:560px;text-align:center;color:rgba(244,239,232,0.85);font-size:38px;');

  animReveal(nightTag, 317.1, 0.45, 0, 20, 'reveal');
  animPop(nightTitle, tL10_know - 0.25, 0.65, 50, 'bouncy', 0.80);
  animReveal(nightSub, tL10_know + 0.35, 0.45, 0, 18, 'reveal');
  markCut(316.50, 'crane_up_night');
  markPop(tL10_know, 's02_preview');

  onFrame(t => {
    if (t < 316.50 || t >= 322.60) { rNight.style.visibility = 'hidden'; return; }
    rNight.style.visibility = 'visible';
    let y = 0;
    if (t < 317.40) {
      y = lerp(-1080, 0, prog(t, 316.50, 317.40, 'camera'));
    }
    rNight.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
    if (t >= 321.74) {
      rNight.style.opacity = (1 - prog(t, 321.74, 322.45, 'camera')).toFixed(3);
    } else {
      rNight.style.opacity = '1';
    }
    clouds.forEach(c => {
      c.el.style.transform = `translate3d(${((t - 316.5) * c.sp).toFixed(1)}px,0,0)`;
    });
  });

  // =========================================================================
  // 13. 북엔드 와이드 풀백 (321.74 .. 326.54) — Cobalt #0B41C2 + 미니어처 공부 책상
  // =========================================================================
  const rEnd = makeRoom('#0B41C2', '#EFEDE8', 25, 52);
  const endWrap = mk(rEnd, '', '', 'position:absolute;inset:0;transform-origin:50% 60%;');
  const endTitle = mk(endWrap, 'h-hero',
    '<span style="color:#F4EFE8;">Claude FDE</span><span style="display:inline-block;width:54px;"></span><span style="color:#FFABC8;">S01</span><span class="caret" id="end-caret" style="height:0.78em;width:16px;margin-left:14px;"></span>',
    'position:absolute;left:0;right:0;top:175px;text-align:center;font-size:132px;');
  const endSub = mk(endWrap, 'body-l', '다음 강의 · S02 지식 (학습 데이터 · 지식 컷오프 · 환각)',
    'position:absolute;left:0;right:0;top:358px;text-align:center;color:#F4EFE8;font-size:36px;font-weight:500;');

  // 하단 바닥 띠 위의 미니어처 공부 책상 소품 4종 + 호스트
  makeProp(endWrap, 'v3_tokens_3d.png', 210, 675, 220, 178, 160);
  makeProp(endWrap, 'v3_hollow_book_3d.png', 520, 646, 185, 206, 130);
  makeProp(endWrap, 'v3_nib_3d.png', 820, 608, 140, 246, 100);
  makeProp(endWrap, 'v3_desk_duo.png', 1050, 678, 285, 178, 220);
  makeProp(endWrap, 'v3_host.png', 1480, 442, 180, 435, 120);

  const endFoot = mk(endWrap, 'footnote',
    '비공식 학습 자료 · 공식 강의: Anthropic Claude FDE 학습 경로 · AI 생성 일러스트·음성',
    'left:0;right:0;top:946px;text-align:center;color:#201E1F;background:transparent;');
  const endCaret = $('#end-caret');

  onFrame(t => {
    if (t < 321.74) { rEnd.style.visibility = 'hidden'; return; }
    rEnd.style.visibility = 'visible';
    const u = prog(t, 321.74, 322.75, 'camera');
    rEnd.style.opacity = clamp01((t - 321.74) / 0.55).toFixed(3);
    // 와이드 풀백 (scale 1.24 -> 1.0)
    endWrap.style.transform = `scale(${lerp(1.24, 1.0, u).toFixed(4)})`;
    endCaret.style.opacity = (Math.floor((t * 1000) / 525) % 2 === 0) ? '1' : '0';
  });

  // =========================================================================
  // 14. 전 구간 단일 떠다니는 Accent 점 (#FC4109, z-index 55) + 도트 와이프 2회
  //     키프레임: [t, x, y, scale, ease]
  // =========================================================================
  const dot = $('#accent-dot');
  const DOT_KF = [
    [0.00, 960, 500, 0.00, 'linear'],
    [0.55, 960, 500, 1.45, 'bouncy'],
    [1.35, 748, 286, 1.05, 'camera'],   // 오프닝 "Claude FDE . S01" 마침표 안착
    [4.15, 748, 286, 1.05, 'linear'],
    [4.85, 1185, 622, 1.25, 'camera'],  // "왜?" 옆
    [6.35, 72, 166, 0.90, 'camera'],    // L01 좌상단 앵커
    [24.40, 72, 166, 0.90, 'linear'],
    [25.25, 492, 740, 1.15, 'bouncy'],  // "고장이 아니에요" 앞
    [34.60, 492, 740, 1.15, 'linear'],
    [35.15, 960, 540, 1.15, 'camera'],
    // --- 전체 화면 도트 와이프 #1 (L01 -> L02 공부 책상) ---
    [35.80, 960, 540, 82.0, 'dive'],
    [36.45, 960, 442, 1.00, 'surface'], // Station 1 위 착지
    [41.67, 960, 442, 1.00, 'linear'],
    [44.50, 960, 396, 1.00, 'camera'],  // Station 2 트럭 동행
    [46.80, 960, 442, 1.00, 'camera'],  // Station 4
    [50.60, 960, 260, 0.00, 'linear'],  // 눈금자 노브에 역할 이양
    [66.40, 960, 440, 0.00, 'linear'],
    [67.20, 960, 440, 1.10, 'bouncy'],  // Station 1 복귀
    [70.55, 960, 540, 0.00, 'dive'],    // 아이리스 속으로 다이브
    // --- L03 토큰 알약 위 호핑 ---
    [72.00, 180, 452, 0.00, 'linear'],
    [78.80, 180, 452, 0.95, 'bouncy'],
    [81.80, 520, 452, 1.05, 'bouncy'],
    [85.40, 650, 452, 1.05, 'bouncy'],
    [89.40, 780, 452, 1.05, 'bouncy'],
    [92.50, 1290, 370, 1.15, 'camera'], // 거대 "토큰" 옆
    [98.35, 1290, 370, 0.00, 'linear'],
    // --- L04 확률 막대 호핑 ---
    [100.20, 1540, 226, 0.95, 'bouncy'],
    [122.60, 1540, 226, 0.95, 'linear'],
    [123.35, 1152, 326, 1.20, 'bouncy'], // 맑아요 46%
    [125.00, 1152, 326, 1.20, 'linear'],
    [125.75, 1152, 422, 1.20, 'bouncy'], // 좋네요 31%
    [128.10, 1152, 422, 1.20, 'linear'],
    [129.20, 68, 616, 0.95, 'camera'],   // 바닥 단면 강조
    [149.40, 68, 616, 0.95, 'linear'],
    [150.00, 960, 540, 1.10, 'camera'],
    // --- 전체 화면 도트 와이프 #2 (L04 -> L05 분할 벽) ---
    [150.65, 960, 540, 82.0, 'dive'],
    [151.30, 960, 180, 0.95, 'surface'],
    [162.10, 960, 180, 0.95, 'linear'],
    [162.95, 480, 330, 1.20, 'bouncy'],  // 서울 기둥 정상
    [171.60, 480, 330, 1.20, 'linear'],
    [172.35, 1102, 588, 1.05, 'bouncy'], // 회의 기둥 물결
    [176.80, 1756, 620, 1.05, 'camera'],
    [178.10, 960, 540, 0.00, 'linear'],
    // --- L06 민트 방 ---
    [180.50, 1835, 156, 0.95, 'bouncy'],
    [208.30, 1835, 156, 0.95, 'linear'],
    [209.25, 1412, 650, 1.25, 'bouncy'], // "뿌리는 하나" 옆
    [211.75, 1412, 650, 1.25, 'linear'],
    // --- L07 암전 스포트라이트 ---
    [211.80, 72, 156, 0.95, 'linear'],
    [225.70, 72, 156, 0.95, 'linear'],
    [226.45, 412, 502, 1.25, 'snappy'],  // "존재하지 않음" 옆
    [240.15, 412, 502, 1.25, 'linear'],
    // --- L08 올리브 받침대 ---
    [241.00, 72, 152, 0.95, 'camera'],
    [251.20, 72, 152, 0.95, 'linear'],
    [252.00, 254, 434, 1.10, 'bouncy'],  // 기둥 1
    [255.80, 254, 434, 1.10, 'linear'],
    [256.50, 584, 434, 1.10, 'bouncy'],  // 기둥 2
    [259.80, 584, 434, 1.10, 'linear'],
    [260.50, 914, 434, 1.10, 'bouncy'],  // 기둥 3
    [266.60, 914, 434, 1.10, 'linear'],
    [267.00, 960, 540, 0.00, 'linear'],
    // --- L09 고객 앞 ---
    [269.00, 72, 150, 0.95, 'bouncy'],
    [296.60, 72, 150, 0.95, 'linear'],
    [297.45, 1690, 150, 1.20, 'snappy'], // "업무 기준 통과율" 옆
    [301.90, 1690, 150, 1.20, 'linear'],
    // --- L10 역방향 휩팬 -> 노트 형광펜 -> 밤하늘 -> 북엔드 마침표 ---
    [302.15, 1620, 520, 1.05, 'camera'],
    [304.05, 300, 520, 1.05, 'camera'],
    [305.20, 192, 326, 0.85, 'camera'],  // 여백선 따라 내려옴
    [313.50, 192, 630, 0.85, 'camera'],
    [316.45, 192, 630, 0.85, 'linear'],
    [317.40, 960, 290, 1.00, 'camera'],  // 밤하늘 S02 위
    [321.70, 960, 290, 1.00, 'linear'],
    [322.65, 1152, 284, 1.05, 'bouncy'], // 북엔드 "Claude FDE . S01" 마침표 귀환!
    [326.54, 1152, 284, 1.05, 'linear'],
  ];

  markCut(35.80, 'dot_wipe_1');
  markCut(150.65, 'dot_wipe_2');

  onFrame(t => {
    let i = 0;
    while (i + 1 < DOT_KF.length && t >= DOT_KF[i + 1][0]) i++;
    const a = DOT_KF[i];
    const b = DOT_KF[Math.min(i + 1, DOT_KF.length - 1)];
    const u = prog(t, a[0], b[0], b[4] || 'linear');
    const [x, y, s] = lerpPt([a[1], a[2], a[3]], [b[1], b[2], b[3]], u);
    if (s <= 0.01) {
      dot.style.opacity = '0';
    } else {
      dot.style.opacity = '1';
      dot.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${s.toFixed(3)})`;
    }
  });

  // 모든 폰트 + 이미지 로드 후 렌더 준비 신호
  window.__ready = Promise.all([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    ...Array.from(document.querySelectorAll('img')).map(im =>
      im.complete ? Promise.resolve() : new Promise(res => { im.onload = res; im.onerror = res; })
    ),
  ]);
})();
