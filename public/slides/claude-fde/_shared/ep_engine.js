/* v3 Universal Episode Engine — S01 v3 (human-md.ai) 디자인 문법의 41편 공통 스테이지 엔진
   - window.SPEC + window.CUES + window.EPISODE 기반으로 단일 스테이지 결정적 렌더
   - 100% S01 v3 시그니처 문법:
     1) 코발트/병녹색/잉크/머스터드 등 편별 고유 무대 벽·바닥 + 55~70% 여백
     2) 공부 책상 허브 L->R 트럭 + dolly 1.65x 푸시인 + clip-path: circle() 아이리스 포털
     3) 로그 스케일 글자 관통 줌 (scale = 32^(power2InOut))
     4) 단일 떠다니는 #FC4109 점 + 전체 화면 도트 와이프
     5) 스프링 팝업 / 물결 / 중력 낙하 / 바닥 단면 상승 / 분할 벽 / 암전 스포트라이트 / 모노 코드 카드 / 플로우 / 진단표
     6) 단 한 번의 R->L 역방향 휩팬 -> 줄 공책 분홍 형광펜 -> 밤하늘 크레인 업 -> 와이드 풀백 북엔드 */

(() => {
  const SPEC = window.SPEC;
  if (!SPEC) throw new Error('window.SPEC missing');
  const DARK_BG = new Set(['#0B41C2', '#0F50BA', '#201E1F', '#171B33', '#26512F', '#1C1A1B', '#1E3A5F', '#2B1F3A', '#1B4332', '#2D232E']);
  const isDark = hex => DARK_BG.has(String(hex || '').toUpperCase());
  const lerpPt = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];

  window.__warnings = [];

  // 안전한 큐 시각 계산: 숫자(0..1 비율) 또는 ["단어", n, offsetSec]
  const cueAt = (sid, spec, fallbackFrac = 0.25) => {
    const s = SC[sid];
    if (!s) return 0;
    const t0 = s.vo, dur = Math.max(0.5, s.adur);
    if (spec === undefined || spec === null) return t0 + dur * fallbackFrac;
    if (typeof spec === 'number') return t0 + dur * clamp01(spec);
    if (Array.isArray(spec)) {
      const [word, n = 0, off = 0] = spec;
      const matches = s.words.filter(w => w.r.startsWith(word) || w.r.includes(word));
      if (matches[n]) return matches[n].t + off;
      if (matches[0]) return matches[0].t + off;
      window.__warnings.push(`cue fallback ${sid}:${word}`);
      return t0 + dur * fallbackFrac + off;
    }
    return t0 + dur * fallbackFrac;
  };

  // 아트워크 경로 해석: window.ART_BASE 지정 시 정적 슬라이드 경로, 기본은 MP4 렌더 경로 유지
  const artSrc = file => {
    const f = window.ART_EXT ? file.replace(/\.png$/i, window.ART_EXT) : file;
    if (window.SHARED_ART_BASE && file === 'v3_host.png') return `${window.SHARED_ART_BASE}${f}`;
    if (window.ART_BASE !== undefined) return `${window.ART_BASE}${f}`;
    return file === 'v3_host.png' ? '../../../art/v3_host.png' : `../art/${f}`;
  };
  const mkStageProp = (parent, artFile, x, y, w, h, shadowW = null) => {
    const wrap = mk(parent, '', '', `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;transform-origin:50% 92%;`);
    const sw = shadowW || Math.round(w * 0.72);
    const sh = mk(wrap, 'gshadow', '', `left:${Math.round((w - sw) / 2)}px;bottom:-10px;width:${sw}px;height:28px;`);
    const img = mkImg(wrap, artSrc(artFile), 'cutout', `left:0;top:0;width:${w}px;height:${h}px;`);
    wrap.img = img;
    wrap.shadow = sh;
    return wrap;
  };

  // ---------- 0. 상단 미니멀 HUD (배경 밝기 자동 전환) ----------
  const hudEl = $('#hud');
  const hudLeft = $('#hud-left');
  const hudPill = $('#hud-pill');
  const hudProg = $('#hud-prog-fill');
  const sessionTag = EP.session || SPEC.session || 'S00';

  const scenes = SPEC.scenes || [];
  const hudSegs = [[0.0, isDark(SPEC.opening.wall), `${sessionTag} · OPENING`]];
  scenes.forEach((sc, idx) => {
    const s = SC[sc.id];
    if (!s) return;
    const tStart = idx === 0 && SPEC.openZoom ? s.start + 1.55 : s.start;
    const dark = sc.type === 'spotlight' ? true : (sc.type === 'notebook' ? false : isDark(sc.wall));
    const label = sc.hud || `${String(idx + 1).padStart(2, '0')} · ${s.title}`;
    hudSegs.push([tStart, dark, label]);
  });
  const lastSc = SC[scenes[scenes.length - 1]?.id];
  if (lastSc) {
    const nightT = Math.max(lastSc.start + lastSc.dur - 5.2, lastSc.vo + lastSc.adur * 0.72);
    hudSegs.push([nightT, true, EP.next_session ? `NEXT · ${EP.next_session}` : 'CAPSTONE COMPLETE']);
  }
  hudSegs.push([C.end_start, isDark(SPEC.opening.wall), `${sessionTag} · Claude FDE`]);

  onFrame(t => {
    hudProg.style.transform = `scaleX(${clamp01(t / DUR).toFixed(5)})`;
    let cur = hudSegs[0], prev = hudSegs[0];
    for (let i = 0; i < hudSegs.length; i++) {
      if (t >= hudSegs[i][0]) {
        prev = i > 0 ? hudSegs[i - 1] : hudSegs[0];
        cur = hudSegs[i];
      }
    }
    const u = prog(t, cur[0], cur[0] + 0.55, 'sineInOut');
    const darkMix = lerp(prev[1] ? 1 : 0, cur[1] ? 1 : 0, u);
    const r = Math.round(lerp(32, 244, darkMix));
    const g = Math.round(lerp(30, 239, darkMix));
    const b = Math.round(lerp(31, 232, darkMix));
    const fg = `rgb(${r},${g},${b})`;
    hudLeft.style.color = fg;
    hudPill.style.color = fg;
    hudPill.style.background = darkMix > 0.5 ? 'rgba(244,239,232,0.14)' : 'rgba(32,30,31,0.09)';
    hudPill.style.border = `1.5px solid ${darkMix > 0.5 ? 'rgba(244,239,232,0.34)' : 'rgba(32,30,31,0.28)'}`;
    hudPill.textContent = cur[2];
    hudEl.style.opacity = t < 0.45 ? prog(t, 0.15, 0.45, 'reveal').toFixed(3) : '1';
  });

  // 떠다니는 #FC4109 점 키프레임 수집기
  const DOT_KF = [];
  const addDot = (t, x, y, s = 1.0, ease = 'camera') => DOT_KF.push([t, x, y, s, ease]);
  addDot(0.00, 960, 500, 0.00, 'linear');
  addDot(0.55, 960, 500, 1.45, 'bouncy');

  // =========================================================================
  // 1. 오프닝 히어로 (0.00 .. opening_dur + zoom)
  // =========================================================================
  const op = SPEC.opening;
  const openDark = isDark(op.wall);
  const opTextCol = openDark ? '#F4EFE8' : '#201E1F';
  const opAccCol = openDark ? '#FFABC8' : '#0B41C2';
  const rOpen = makeRoom(op.wall, op.floor, 25, 10);
  const openInner = mk(rOpen, '', '', 'position:absolute;inset:0;transform-origin:50% 50%;');

  const opTitle = mk(openInner, 'h-hero',
    `<span style="color:${opTextCol};">Claude FDE</span><span id="open-dot-slot" style="display:inline-block;width:54px;"></span><span style="color:${opAccCol};">${sessionTag}</span>`,
    'position:absolute;left:96px;top:170px;font-size:138px;'
  );
  const opSub = mk(openInner, 'body-l', EP.title || op.subtitle || '',
    `position:absolute;left:102px;top:350px;color:${opTextCol};font-weight:700;font-size:44px;max-width:1050px;white-space:normal;line-height:1.28;`);
  const opGt1 = mk(openInner, 'gt-line', '',
    `position:absolute;left:104px;top:486px;color:${openDark ? 'rgba(244,239,232,0.88)' : 'rgba(32,30,31,0.85)'};`);
  const opGt2 = mk(openInner, 'gt-line', '',
    `position:absolute;left:104px;top:528px;color:${openDark ? 'rgba(244,239,232,0.88)' : 'rgba(32,30,31,0.85)'};`);

  const opHost = mkStageProp(openInner, 'v3_host.png', 1390, 178, 300, 740, 195);
  const opProp = mkStageProp(openInner, op.prop || SPEC.hub.stations[0].art, 1110, 560, 270, 270, 195);
  const opNote = mk(openInner, 'footnote',
    '비공식 학습 자료 · 공식 강의: Anthropic Claude FDE 학습 경로',
    'left:96px;top:886px;color:#201E1F;background:rgba(244,239,232,0.80);');

  animReveal(opTitle, 0.35, 0.70, 0, 42, 'surface');
  animReveal(opSub, 0.72, 0.58, 0, 28, 'reveal');
  animType(opGt1, op.gt1 || EP.course || '', 1.10, 0.95, '<span class="gt">&gt;</span>', false);
  animType(opGt2, op.gt2 || EP.accent_concept || '', 1.85, 0.85, '<span class="gt">&gt;</span>', true);
  animPop(opHost, 0.55, 0.80, 90, 'bouncy', 0.84);
  animPop(opProp, 0.95, 0.75, 70, 'bouncy', 0.74);
  animReveal(opNote, 1.35, 0.50, 0, 14, 'reveal');
  markPop(0.55, 'open_host');
  markTick(1.10, 'open_type');

  const openEndT = SPEC.openZoom ? C.opening_dur + 2.20 : C.opening_dur + 0.20;
  onFrame(t => {
    if (t >= openEndT) { rOpen.style.visibility = 'hidden'; return; }
    rOpen.style.visibility = 'visible';
    const unfurl = prog(t, 0.0, 0.55, 'camera');
    rOpen.style.clipPath = unfurl < 1
      ? `inset(${((1 - unfurl) * 50).toFixed(2)}% 0 ${((1 - unfurl) * 50).toFixed(2)}% 0)`
      : 'none';
    if (t > C.opening_dur - 0.05) {
      const ex = prog(t, C.opening_dur - 0.05, C.opening_dur + 0.85, 'exit');
      openInner.style.transform = `translate3d(0,${lerp(0, -140, ex).toFixed(1)}px,0)`;
      openInner.style.opacity = (1 - clamp01((t - C.opening_dur) / 0.65)).toFixed(3);
    } else {
      openInner.style.transform = 'none';
      openInner.style.opacity = '1';
    }
  });

  // =========================================================================
  // 1B. 오프닝 -> L01 로그 스케일 글자 관통 줌 (선택)
  // =========================================================================
  if (SPEC.openZoom && scenes[0]) {
    const zWord = SPEC.openZoom.word || '왜?';
    const zCol = scenes[0].wall || '#FFABC8';
    const rZoom = mk('#stage', 'room', '', 'background:transparent;z-index:16;visibility:hidden;pointer-events:none;');
    const zWrap = mk(rZoom, '', '', 'position:absolute;inset:0;transform-origin:848px 510px;');
    const zEl = mk(zWrap, 'h-giant', zWord,
      `position:absolute;left:0;right:0;top:310px;text-align:center;color:${zCol};font-size:${zWord.length <= 2 ? 380 : 310}px;text-shadow:0 22px 44px rgba(20,20,40,0.28);`);
    const zSub = mk(rZoom, 'body-m', SPEC.openZoom.sub || scenes[0].title || '',
      `position:absolute;left:0;right:0;top:730px;text-align:center;color:${opTextCol};font-weight:700;`);
    const t0 = C.opening_dur + 0.25;
    const tZoom = C.opening_dur + 0.95;
    const tEnd = C.opening_dur + 2.20;
    markCut(t0 + 0.35, 'open_word_zoom');
    onFrame(t => {
      if (t < t0 || t >= tEnd) { rZoom.style.visibility = 'hidden'; return; }
      rZoom.style.visibility = 'visible';
      if (t < tZoom) {
        const u = prog(t, t0, tZoom - 0.05, 'rise');
        zWrap.style.transform = `translate3d(0,${lerp(90, 0, u).toFixed(1)}px,0) scale(${lerp(0.65, 1, u).toFixed(4)})`;
        zEl.style.opacity = clamp01((t - t0) / 0.22).toFixed(3);
        zSub.style.opacity = prog(t, t0 + 0.25, tZoom - 0.1, 'reveal').toFixed(3);
      } else {
        const u = prog(t, tZoom, tEnd - 0.12, 'power2InOut');
        const s = Math.pow(32, u);
        const fu = prog(t, tZoom, tEnd - 0.25, 'sineInOut');
        zWrap.style.transform = `translate3d(${lerp(0, 112, fu).toFixed(1)}px,${lerp(0, 30, fu).toFixed(1)}px,0) scale(${s.toFixed(4)})`;
        zEl.style.opacity = '1';
        zSub.style.opacity = (1 - clamp01((t - tZoom) / 0.25)).toFixed(3);
      }
    });
  }

  // =========================================================================
  // 2. 공유 공부 책상 허브 ("Study Desk Hub") — 4개 스테이션 (L->R 트럭, 브릿지, R->L 휩팬)
  // =========================================================================
  const hubSpec = SPEC.hub;
  const rHub = makeRoom(hubSpec.wall || '#C0902F', null, 0, 20);
  const hubCam = mk(rHub, '', '', 'position:absolute;inset:0;transform-origin:960px 560px;');
  const hubWorld = mk(hubCam, '', '', 'position:absolute;left:0;top:0;width:4800px;height:1080px;');
  mk(hubWorld, '', '', `position:absolute;left:-400px;width:5600px;top:730px;height:780px;background:${hubSpec.table || '#EFEDE8'};border-top:2px solid rgba(32,30,31,0.12);`);

  const hubStations = (hubSpec.stations || []).slice(0, 4).map((stObj, idx) => {
    const x = 960 + idx * 960;
    const w = stObj.w || 340, h = stObj.h || 320;
    const y = 762 - h;
    const p = mkStageProp(hubWorld, stObj.art, x - w / 2, y, w, h);
    const lbl = mk(hubWorld, '',
      `<div class="mono" style="font-size:21px;color:#FC4109;letter-spacing:0.08em;">0${idx + 1} · ${stObj.tag || ''}</div>` +
      `<div style="font-size:40px;font-weight:800;color:#201E1F;margin-top:4px;">${stObj.name}</div>`,
      `position:absolute;left:${x - 230}px;top:792px;width:460px;text-align:center;`
    );
    return { ...stObj, x, prop: p, lbl };
  });

  const hubTitle = mk(rHub, 'h-ch', `<span class="hash">##</span>${hubSpec.title || '핵심 구조'}`,
    'position:absolute;left:96px;top:116px;color:#201E1F;');
  const hubSub = mk(rHub, 'gt-line', '', 'position:absolute;left:102px;top:212px;color:#201E1F;font-size:25px;');

  const scaleWrap = mk(rHub, '', '',
    'position:absolute;left:220px;top:290px;width:1480px;height:150px;pointer-events:none;opacity:0;');
  mk(scaleWrap, 'hm-pill', hubSpec.scaleLeft || '능력  Capability', 'left:0;top:18px;font-size:30px;padding:10px 26px;background:#69B488;color:#201E1F;');
  mk(scaleWrap, 'hm-pill', hubSpec.scaleRight || '한계  Limitation', 'right:0;top:18px;font-size:30px;padding:10px 26px;background:#FFABC8;color:#201E1F;');
  mk(scaleWrap, '', '', 'position:absolute;left:280px;right:280px;top:52px;height:5px;background:#201E1F;border-radius:3px;');
  const scaleKnob = mk(scaleWrap, '', '',
    'position:absolute;left:740px;top:35px;width:38px;height:38px;margin-left:-19px;border-radius:50%;background:#FC4109;border:3px solid #201E1F;');
  mk(scaleWrap, 'body-m', hubSpec.scaleCaption || '한 성질의 양쪽 끝',
    'position:absolute;left:0;right:0;top:98px;text-align:center;color:#201E1F;font-weight:700;font-size:30px;');

  // 허브 활성 창 목록: {t0, t1, z, mode, fromX, toX, showTitle, showScale, focusIdx}
  const hubWindows = [];

  // =========================================================================
  // 3. 장면별 룸 빌더 (scenes 배열 순회)
  // =========================================================================
  const sceneRooms = {};
  scenes.forEach((sc, idx) => {
    const s = SC[sc.id];
    if (!s) throw new Error(`missing cue scene ${sc.id}`);
    const nextS = scenes[idx + 1] ? SC[scenes[idx + 1].id] : null;
    const tStart = s.start;
    const tEnd = nextS ? nextS.start : C.end_start;
    const z = 22 + idx * 2;
    const dark = sc.type === 'spotlight' ? true : isDark(sc.wall);
    const inkCol = dark ? '#F4EFE8' : '#201E1F';
    const subCol = dark ? (sc.subColor || '#FFABC8') : '#201E1F';
    const tr = sc.transition || 'cut'; // cut | dot_wipe | iris | word_zoom | crane_down | light_off | whip_pan

    // 전환 처리 (이전 장면과의 경계)
    let irisIn = null;
    if (tr === 'dot_wipe' && idx > 0) {
      addDot(tStart - 0.60, 960, 540, 1.10, 'camera');
      addDot(tStart, 960, 540, 82.0, 'dive');
      addDot(tStart + 0.62, 960, 210, 0.95, 'surface');
      markCut(tStart, `dot_wipe_${sc.id}`);
    } else if (tr === 'iris' && idx > 0) {
      // 이전 장면 끝에서 0.9초 공부 책상 허브 브릿지 -> dolly -> 아이리스 열림!
      const prevSc = scenes[idx - 1];
      if (prevSc.type !== 'hub') {
        const stIdx = sc.hubStation !== undefined ? sc.hubStation : Math.min(3, Math.floor(idx / 2));
        const fromIdx = Math.max(0, stIdx - 1);
        hubWindows.push({
          t0: tStart - 1.05, t1: tStart + 0.95, z: z - 1, mode: 'bridge',
          fromX: 960 + fromIdx * 960, toX: 960 + stIdx * 960,
        });
      }
      irisIn = { t0: tStart - 0.15, dur: 0.90, cx: 960, cy: 540 };
      markCut(tStart - 0.15, `iris_${sc.id}`);
    } else if (tr === 'light_off') {
      markCut(tStart, `light_off_${sc.id}`);
    } else if (tr === 'crane_down') {
      markCut(tStart, `crane_down_${sc.id}`);
    } else if (tr === 'whip_pan') {
      hubWindows.push({
        t0: tStart - 0.35, t1: tStart + 2.10, z: z - 1, mode: 'whip_pan',
        fromX: 3840, toX: 960,
      });
      markCut(tStart, `whip_pan_${sc.id}`);
    }

    // ---------- ARCHETYPE: hub (L02 등 풀 허브 씬) ----------
    if (sc.type === 'hub') {
      const focusIdx = sc.focusStation || 0;
      const showScale = sc.showScale !== false;
      hubWindows.push({
        t0: tStart, t1: tEnd + 0.85, z, mode: 'full',
        focusIdx, showScale, tStart, tEnd, sid: sc.id,
      });
      animType(hubSub, sc.sub || hubSpec.sub || '공부 책상 위의 네 가지 렌즈', tStart + 0.5, 1.4, '<span class="gt">&gt;</span>', false);
      addDot(tStart + 0.65, 960, 430, 1.00, 'surface');
      addDot(tStart + (tEnd - tStart) * 0.45, 960, 260, 0.00, 'linear');
      addDot(tEnd - 0.30, 960, 540, 0.00, 'dive');
      markTick(cueAt(sc.id, 0.16), 'hub_s1');
      markTick(cueAt(sc.id, 0.32), 'hub_s2');
      markTick(cueAt(sc.id, 0.48), 'hub_s3');
      markPop(cueAt(sc.id, 0.62), 'hub_scale');
      return;
    }

    // ---------- ARCHETYPE: notebook (L10 줄 공책 + 밤하늘 + 북엔드) ----------
    if (sc.type === 'notebook') {
      const rNote = mk('#stage', 'room', '', `background:#F4EFE8;z-index:${z};visibility:hidden;`);
      mk(rNote, 'notebook-page');
      mk(rNote, 'notebook-margin');
      const noteInT = tr === 'whip_pan' ? tStart + 1.45 : tStart;
      const nightT = Math.max(noteInT + 5.5, cueAt(sc.id, sc.nextCue || 0.72));

      const nHdr = mk(rNote, 'h-ch', `<span class="hash">##</span>${sc.title || '딱 한 줄 정리'}`,
        'position:absolute;left:244px;top:116px;color:#201E1F;font-size:66px;');
      const lines = (sc.lines || []).slice(0, 3);
      const hlEls = [];
      lines.forEach((ln, li) => {
        const top = 286 + li * 152;
        const tLine = cueAt(sc.id, ln.cue, 0.14 + li * 0.20);
        const el = mk(rNote, '',
          `${ln.pre || ''}<span class="pink-hl-wrap">${ln.hl || ln.text || ''}<span class="pink-hl-bar" id="hl_${sc.id}_${li}"></span></span>${ln.post || ''}`,
          `position:absolute;left:244px;top:${top}px;max-width:1540px;font-size:48px;font-weight:800;line-height:1.48;color:#201E1F;`
        );
        animReveal(el, Math.max(noteInT + 0.15, tLine - 0.15), 0.50, 0, 22, 'reveal');
        markTick(Math.max(noteInT + 0.3, tLine + 0.2), `hl_${li}`);
        hlEls.push({ el: $(`#hl_${sc.id}_${li}`), t0: Math.max(noteInT + 0.35, tLine + 0.15) });
      });
      const nSrc = mk(rNote, 'footnote',
        sc.source || `출처: Anthropic Claude FDE 학습 경로 · ${EP.course || ''}`,
        'left:244px;top:792px;color:#5d625f;background:transparent;padding-left:0;');
      animReveal(nHdr, noteInT + 0.20, 0.45, 0, 20, 'reveal');
      animReveal(nSrc, noteInT + 2.8, 0.50, 0, 14, 'reveal');

      addDot(noteInT + 0.4, 192, 326, 0.85, 'camera');
      addDot(nightT - 0.2, 192, 630, 0.85, 'camera');

      onFrame(t => {
        if (t < noteInT || t >= nightT + 0.95) { rNote.style.visibility = 'hidden'; return; }
        rNote.style.visibility = 'visible';
        let y = 0;
        if (t < noteInT + 0.75) {
          y = lerp(1080, 0, prog(t, noteInT, noteInT + 0.75, 'surface'));
        } else if (t >= nightT) {
          y = lerp(0, 1080, prog(t, nightT, nightT + 0.90, 'camera'));
        }
        rNote.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
        hlEls.forEach(h => {
          h.el.style.transform = `scaleX(${prog(t, h.t0, h.t0 + 1.5, 'camera').toFixed(4)})`;
        });
      });

      // 밤하늘 크레인 업 (nightT .. C.end_start + 0.7)
      const rNight = mk('#stage', 'room', '', `background:#171B33;z-index:${z + 1};visibility:hidden;`);
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
      const nTag = mk(rNight, 'gt-line',
        `<span class="gt">&gt;</span>${EP.next_session ? `NEXT SESSION · ${EP.next_session}` : 'CLAUDE FDE STUDY · COMPLETE'}`,
        'position:absolute;left:0;right:0;top:325px;text-align:center;color:#FFABC8;font-size:28px;');
      const nTitle = mk(rNight, 'h-kw',
        sc.nextTitleHtml || EP.next_title_accent || EP.next_title || '파일럿 계획서 완성',
        'position:absolute;left:80px;right:80px;top:395px;text-align:center;color:#F4EFE8;font-size:100px;white-space:normal;line-height:1.12;');
      const nSub = mk(rNight, 'body-l', EP.next_desc || sc.nextDesc || '',
        'position:absolute;left:120px;right:120px;top:565px;text-align:center;color:rgba(244,239,232,0.85);font-size:36px;white-space:normal;');
      animReveal(nTag, nightT + 0.45, 0.45, 0, 20, 'reveal');
      animPop(nTitle, nightT + 0.70, 0.65, 50, 'bouncy', 0.80);
      animReveal(nSub, nightT + 1.15, 0.45, 0, 18, 'reveal');
      markCut(nightT, 'crane_up_night');
      markPop(nightT + 0.70, 'next_preview');
      addDot(nightT + 0.85, 960, 285, 1.00, 'camera');
      addDot(C.end_start - 0.05, 960, 285, 1.00, 'linear');

      onFrame(t => {
        if (t < nightT || t >= C.end_start + 0.85) { rNight.style.visibility = 'hidden'; return; }
        rNight.style.visibility = 'visible';
        const y = t < nightT + 0.90 ? lerp(-1080, 0, prog(t, nightT, nightT + 0.90, 'camera')) : 0;
        rNight.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
        rNight.style.opacity = t >= C.end_start ? (1 - prog(t, C.end_start, C.end_start + 0.70, 'camera')).toFixed(3) : '1';
        clouds.forEach(c => { c.el.style.transform = `translate3d(${((t - nightT) * c.sp).toFixed(1)}px,0,0)`; });
      });
      return;
    }

    // ---------- 일반 무대 룸 생성 ----------
    const wallCol = sc.type === 'spotlight' ? '#201E1F' : (sc.wall || '#FFABC8');
    const floorCol = sc.floor || (sc.type === 'spotlight' ? '#F0A8C0' : '#EFEDE8');
    const r = makeRoom(wallCol, floorCol, sc.floorPct || 25, z);
    sceneRooms[sc.id] = r;

    const roomShowStart = (idx === 0 && SPEC.openZoom) ? C.opening_dur + 1.88 : (irisIn ? irisIn.t0 : tStart);
    const nextIsCrane = scenes[idx + 1] && scenes[idx + 1].transition === 'crane_down';
    const roomShowEnd = nextIsCrane ? tEnd + 0.95 : (scenes[idx + 1] && scenes[idx + 1].transition === 'iris' ? tEnd + 0.10 : tEnd + 0.15);

    const alignRight = !!sc.alignRight;
    const hashStr = sc.hash || (sc.type === 'spotlight' || alignRight ? '###' : '##');

    // 기본 가시성 + 아이리스 / 크레인 다운 / 오프닝 줌 페이드인
    onFrame(t => {
      if (t < roomShowStart - 0.01 || t >= roomShowEnd) {
        r.style.visibility = 'hidden';
        return;
      }
      r.style.visibility = 'visible';
      if (idx === 0 && SPEC.openZoom) {
        r.style.opacity = prog(t, roomShowStart, roomShowStart + 0.25, 'linear').toFixed(3);
      } else {
        r.style.opacity = '1';
      }
      if (irisIn && t < irisIn.t0 + irisIn.dur) {
        const u = prog(t, irisIn.t0, irisIn.t0 + irisIn.dur, 'power2In');
        r.style.clipPath = `circle(${lerp(0, 2350, u).toFixed(1)}px at ${irisIn.cx}px ${irisIn.cy}px)`;
      } else {
        r.style.clipPath = 'none';
      }
      if (tr === 'crane_down' && t < tStart + 0.88) {
        const u = prog(t, tStart, tStart + 0.88, 'camera');
        r.style.transform = `translate3d(0,${lerp(1080, 0, u).toFixed(1)}px,0)`;
      } else if (nextIsCrane && t >= tEnd) {
        const u = prog(t, tEnd, tEnd + 0.88, 'camera');
        r.style.transform = `translate3d(0,${lerp(0, -1080, u).toFixed(1)}px,0)`;
      } else {
        r.style.transform = 'none';
      }
    });

    // 헤더 공통 헬퍼
    const makeHeader = (parent = r, customTitle = null) => {
      const tEl = mk(parent, 'h-ch',
        `<span class="hash">${hashStr}</span>${customTitle || sc.title || s.title}`,
        alignRight
          ? `position:absolute;right:96px;top:116px;color:${inkCol};text-align:right;font-size:68px;`
          : `position:absolute;left:96px;top:116px;color:${inkCol};font-size:68px;`
      );
      animReveal(tEl, roomShowStart + 0.20, 0.52, 0, 24, 'reveal');
      let sEl = null;
      if (sc.sub) {
        sEl = mk(parent, 'gt-line', '',
          alignRight
            ? `position:absolute;right:100px;top:210px;color:${subCol};font-size:25px;text-align:right;`
            : `position:absolute;left:102px;top:210px;color:${subCol};font-size:25px;`
        );
        animType(sEl, sc.sub, roomShowStart + 0.55, 1.5, '<span class="gt">&gt;</span>', false);
      }
      return { tEl, sEl };
    };

    // 떠다니는 점 기본 장면 진입 앵커
    const anchorX = alignRight ? 1835 : 72;
    if (tr !== 'dot_wipe') addDot(roomShowStart + 0.55, anchorX, 154, 0.92, 'camera');

    // ---------- 1) ARCHETYPE: dialogue (말풍선 + 강사/대화 컷아웃 + 취소선/핵심 결론) ----------
    if (sc.type === 'dialogue') {
      makeHeader();
      const isDuo = sc.layout === 'duo';
      if (isDuo) {
        const duo = mkStageProp(r, sc.prop || 'v3_desk_duo.png', 540, 390, 840, 524, 660);
        animPop(duo, roomShowStart + 0.35, 0.78, 85, 'bouncy', 0.84);
      } else {
        const propFile = sc.prop || 'v3_host.png';
        const isHost = propFile === 'v3_host.png';
        const p = isHost
          ? mkStageProp(r, propFile, 1385, 168, 300, 740, 195)
          : mkStageProp(r, propFile, 1290, 285, 470, 500, 320);
        animPop(p, roomShowStart + 0.35, 0.78, 90, 'bouncy', 0.82);
      }

      const bubs = sc.bubbles || [];
      bubs.forEach((b, bi) => {
        const tb = cueAt(sc.id, b.cue, 0.15 + bi * 0.26);
        let posStyle;
        if (isDuo) {
          posStyle = bi === 0
            ? 'left:96px;top:248px;max-width:610px;font-size:30px;'
            : 'right:96px;top:248px;max-width:620px;font-size:30px;';
        } else {
          posStyle = `left:${140 + bi * 180}px;top:${310 + bi * 168}px;min-width:440px;max-width:760px;font-size:32px;`;
        }
        const tailCls = isDuo ? (bi === 0 ? 'tail-l' : 'tail-r') : 'tail-r';
        const tagCol = b.tagColor || (bi === 0 ? '#FC4109' : '#0B41C2');
        const el = mk(r, `hm-bub ${tailCls}`,
          `<span style="font-family:var(--f-mono);font-size:19px;color:${tagCol};display:block;margin-bottom:4px;">${b.tag || ''}</span>${b.text}`,
          posStyle
        );
        animPop(el, tb, 0.62, 48, 'bouncy', 0.76);
        markPop(tb, `${sc.id}_bub_${bi}`);
      });

      if (sc.strike && sc.punch) {
        const tWrong = cueAt(sc.id, sc.strikeCue, 0.56);
        const tPunch = cueAt(sc.id, sc.punchCue, 0.68);
        if (isDuo) {
          const oldEl = mk(r, 'body-m', sc.strike,
            'position:absolute;left:1020px;top:128px;color:#201E1F;font-weight:700;font-size:32px;');
          const sv = svgIn(r);
          const ln = svgPath(sv, `M 1012 150 L ${1020 + Math.min(340, sc.strike.length * 25)} 144`, '#FC4109', 6);
          const nw = mk(r, 'hm-pill acc', sc.punch, 'right:96px;top:116px;font-size:32px;padding:10px 28px;');
          animReveal(oldEl, tWrong, 0.45, 0, 16, 'reveal');
          animDraw(ln, tPunch - 0.35, 0.36, 'camera');
          animPop(nw, tPunch, 0.55, 36, 'snappy', 0.78);
          addDot(tPunch + 0.1, 1842, 150, 1.15, 'snappy');
        } else {
          const qEl = mk(r, 'body-l', sc.strike,
            `position:absolute;left:140px;top:694px;color:${inkCol};font-weight:700;font-size:40px;`);
          const sv = svgIn(r);
          const strikeW = Math.min(420, Math.max(200, sc.strike.length * 32));
          const ln = svgPath(sv, `M 132 722 L ${132 + strikeW} 714`, '#FC4109', 7);
          const ansEl = mk(r, 'h-ch',
            `<span style="color:#FC4109;">${sc.punch}</span>${sc.punchItalic ? ` <span class="ser-it" style="font-size:46px;color:${inkCol};margin-left:10px;">${sc.punchItalic}</span>` : ''}`,
            `position:absolute;left:${180 + strikeW}px;top:682px;font-size:56px;`
          );
          animReveal(qEl, tWrong, 0.45, 0, 18, 'reveal');
          animDraw(ln, tPunch, 0.36, 'camera');
          animPop(ansEl, tPunch + 0.12, 0.60, 40, 'snappy', 0.80);
          addDot(tPunch + 0.2, 152 + strikeW, 718, 1.15, 'bouncy');
        }
        markPop(tPunch, `${sc.id}_punch`);
      }

      if (sc.bottomNote) {
        const bn = mk(r, 'gt-line', '', `position:absolute;left:140px;top:834px;color:${inkCol};font-size:25px;`);
        animType(bn, sc.bottomNote, cueAt(sc.id, sc.bottomCue, 0.82), 1.3, '<span class="gt">&gt;</span>', true);
      }
      return;
    }

    // ---------- 2) ARCHETYPE: pills (3D 소품 + 알약 물결 + 루프/수렴 + 선택적 글자 관통 줌) ----------
    if (sc.type === 'pills') {
      const { tEl, sEl } = makeHeader();
      const propLeft = alignRight;
      const prop = mkStageProp(r, sc.prop || hubSpec.stations[0].art,
        propLeft ? 180 : 1270, 270, 440, 500, 300);
      animPop(prop, roomShowStart + 0.35, 0.78, 90, 'bouncy', 0.80);

      const pillWrap = mk(r, '', '', 'position:absolute;inset:0;');
      const pills = sc.pills || [];
      const baseX = propLeft ? 740 : 100;
      const isTaggedList = pills.some(p => p.tag || (p.text && p.text.length > 11));
      const maxCols = isTaggedList ? 1 : (pills.length <= 4 ? pills.length : 3);
      const colW = pills.length <= 4 ? 260 : 320;
      const sv = svgIn(pillWrap);
      const pillCenters = [];

      pills.forEach((p, pi) => {
        const row = Math.floor(pi / maxCols);
        const col = pi % maxCols;
        const x = isTaggedList ? (propLeft ? 740 : 96) : (baseX + col * colW + (row % 2 ? 70 : 0));
        const y = isTaggedList ? (298 + pi * 124) : ((pills.length <= 4 ? 440 : 325) + row * 116);
        const t0 = cueAt(sc.id, p.cue, 0.16 + pi * 0.13);
        const cls = p.style ? `hm-pill ${p.style}` : 'hm-pill';
        const badgeCols = ['#0B41C2', '#26512F', '#C85A2C', '#FC4109'];
        const html = p.tag
          ? `<span class="mono" style="background:${badgeCols[pi % 4]};color:#F4EFE8;font-size:19px;font-weight:700;padding:5px 14px;border-radius:999px;margin-right:16px;vertical-align:middle;">${p.tag}</span><span style="vertical-align:middle;">${p.text}</span>`
          : p.text;
        const styleExtra = isTaggedList
          ? `left:${x}px;top:${y}px;font-size:30px;padding:16px 28px;max-width:1120px;border-radius:20px;`
          : `left:${x}px;top:${y}px;font-size:${p.text.length > 7 ? 32 : 38}px;padding:14px 32px;`;
        const el = mk(pillWrap, cls, html, styleExtra);
        animPop(el, t0, 0.58, 56, 'bouncy', 0.70);
        markTick(t0, `${sc.id}_pill_${pi}`);
        pillCenters.push({ x: x + 90, y: y + 36, t0 });
      });

      if (sc.rootKeyword) {
        const tRoot = cueAt(sc.id, sc.rootCue, 0.76);
        const targetX = propLeft ? 1130 : 540;
        const targetY = isTaggedList ? 648 : 588;
        pillCenters.forEach((c, ci) => {
          const p = svgPath(sv, `M ${c.x} ${c.y + 28} C ${c.x} ${targetY - 50}, ${targetX} ${targetY - 50}, ${targetX} ${targetY}`, '#26512F', 4);
          animDraw(p, tRoot - 0.35 + ci * 0.05, 0.55, 'camera');
        });
        const rk = mk(pillWrap, '',
          `<span style="font-size:86px;font-weight:900;color:#FC4109;letter-spacing:-0.04em;">${sc.rootKeyword}</span>` +
          (sc.rootSub ? `<div class="mono" style="font-size:23px;color:${inkCol};margin-top:4px;">${sc.rootSub}</div>` : ''),
          `position:absolute;left:${targetX - 380}px;top:${targetY + 12}px;width:760px;text-align:center;`
        );
        animPop(rk, tRoot, 0.65, 48, 'bouncy', 0.78);
        markPop(tRoot, `${sc.id}_root`);
        addDot(tRoot + 0.15, targetX + 280, targetY + 62, 1.20, 'bouncy');
      }

      // 선택적 로그 스케일 글자 관통 줌 (다음 방 벽 색으로 직결!)
      if (sc.exitWordZoom && scenes[idx + 1]) {
        const zWord = sc.exitWordZoom.word;
        const nextWall = scenes[idx + 1].wall || '#CB9CF8';
        const tWord = cueAt(sc.id, sc.exitWordZoom.cue, 0.72);
        const tZoom = tEnd - 1.25;
        const gWrap = mk(r, '', '', 'position:absolute;inset:0;transform-origin:760px 510px;');
        mk(gWrap, 'h-giant', zWord,
          `position:absolute;left:0;right:0;top:310px;text-align:center;color:${nextWall};font-size:${zWord.length <= 2 ? 380 : 300}px;text-shadow:0 24px 50px rgba(32,30,31,0.22);`);
        const gSub = sc.exitWordZoom.sub
          ? mk(r, 'hm-pill', sc.exitWordZoom.sub, 'left:540px;top:742px;font-size:32px;padding:12px 32px;')
          : null;
        if (gSub) animReveal(gSub, tWord + 0.4, 0.45, 0, 20, 'reveal');
        markPop(tWord, `${sc.id}_giant`);
        markCut(tZoom, `${sc.id}_word_zoom`);
        onFrame(t => {
          if (t < roomShowStart || t >= roomShowEnd) return;
          if (t < tWord) {
            gWrap.style.opacity = '0';
            pillWrap.style.opacity = '1';
          } else if (t < tZoom) {
            const u = prog(t, tWord, tWord + 0.72, 'rise');
            gWrap.style.opacity = clamp01((t - tWord) / 0.20).toFixed(3);
            gWrap.style.transform = `translate3d(0,${lerp(95, 0, u).toFixed(1)}px,0) scale(${lerp(0.68, 1, u).toFixed(4)})`;
            const fu = prog(t, tWord, tWord + 0.5, 'linear');
            pillWrap.style.opacity = lerp(1, 0.14, fu).toFixed(3);
            prop.style.opacity = lerp(1, 0.22, fu).toFixed(3);
          } else {
            const u = prog(t, tZoom, tEnd + 0.05, 'power2InOut');
            const s = Math.pow(32, u);
            const fu = prog(t, tZoom, tEnd - 0.1, 'sineInOut');
            gWrap.style.opacity = '1';
            gWrap.style.transform = `translate3d(${lerp(0, 200, fu).toFixed(1)}px,${lerp(0, 30, fu).toFixed(1)}px,0) scale(${s.toFixed(4)})`;
            pillWrap.style.opacity = '0';
            prop.style.opacity = '0';
            tEl.style.opacity = (1 - clamp01((t - tZoom) / 0.22)).toFixed(3);
            if (sEl) sEl.style.opacity = (1 - clamp01((t - tZoom) / 0.22)).toFixed(3);
            if (gSub) gSub.style.opacity = (1 - clamp01((t - tZoom) / 0.20)).toFixed(3);
          }
        });
      }
      return;
    }

    // ---------- 3) ARCHETYPE: bars_chamber (최소 막대 + 3D 소품 + 바닥 단면 상승 챔버) ----------
    if (sc.type === 'bars_chamber') {
      const upper = mk(r, '', '', 'position:absolute;inset:0;transform-origin:50% 0%;');
      const { tEl, sEl } = makeHeader(upper);
      const prop = mkStageProp(upper, sc.prop || hubSpec.stations[1].art, 1320, 250, 440, 540, 300);
      animPop(prop, roomShowStart + 0.35, 0.78, 85, 'bouncy', 0.80);

      const barColors = ['#0B41C2', '#26512F', '#C85A2C', '#201E1F', '#FC4109'];
      const barObjs = (sc.bars || []).slice(0, 4).map((b, bi) => {
        const y = 290 + bi * 96;
        const t0 = cueAt(sc.id, b.cue, 0.14 + bi * 0.11);
        const row = mk(upper, '', '', `position:absolute;left:102px;top:${y}px;width:1080px;height:74px;`);
        mk(row, '', b.label, `position:absolute;left:0;top:12px;width:230px;font-size:34px;font-weight:800;color:${inkCol};`);
        const track = mk(row, '', '', 'position:absolute;left:244px;top:14px;width:660px;height:46px;background:rgba(244,239,232,0.62);border:1.5px solid #201E1F;border-radius:999px;overflow:hidden;');
        const fill = mk(track, '', '', `position:absolute;left:0;top:0;bottom:0;width:${clamp01((b.pct || 50) / 100) * 100}%;background:${b.color || barColors[bi % barColors.length]};transform-origin:0 50%;border-radius:999px;`);
        mk(row, 'mono', b.val || `${b.pct}%`, `position:absolute;left:924px;top:16px;font-size:28px;font-weight:700;color:${inkCol};`);
        markTick(t0, `${sc.id}_bar_${bi}`);
        return { row, fill, t0 };
      });
      if (sc.note) {
        const nt = mk(upper, 'footnote', sc.note,
          'left:102px;top:680px;color:#201E1F;background:rgba(244,239,232,0.78);');
        animReveal(nt, roomShowStart + 1.5, 0.45, 0, 14, 'reveal');
      }

      // 바닥 단면 상승 챔버
      let chEl = null, tCh = 1e9;
      if (sc.chamber) {
        const ch = sc.chamber;
        tCh = cueAt(sc.id, ch.cue, 0.56);
        chEl = mk(r, '', '',
          `position:absolute;left:0;right:0;bottom:0;height:520px;background:${ch.bg || '#CF4A1A'};border-top:3px solid #201E1F;transform:translate3d(0,540px,0);`);
        const chTag = mk(chEl, 'gt-line', '', 'position:absolute;left:102px;top:42px;color:#F8D867;font-size:25px;');
        const chMain = mk(chEl, 'h-ch',
          `<span style="color:#F4EFE8;font-size:56px;">${ch.title}</span>`,
          'position:absolute;left:102px;top:102px;max-width:1100px;white-space:normal;line-height:1.15;');
        animType(chTag, ch.tag || '핵심 확인', tCh + 0.1, 1.1, '<span class="gt" style="color:#F8D867;">&gt;</span>', true);
        animReveal(chMain, tCh + 0.35, 0.55, 0, 22, 'reveal');
        if (ch.badge) {
          const bp = mk(chEl, 'hm-pill ink', ch.badge, 'right:102px;top:108px;font-size:30px;padding:10px 26px;border-color:#F4EFE8;');
          animPop(bp, tCh + 0.75, 0.50, 30, 'snappy', 0.78);
        }
        (ch.pills || []).slice(0, 3).forEach((cp, ci) => {
          const pe = mk(chEl, ci === 1 ? 'hm-pill yellow' : 'hm-pill', cp,
            `left:${102 + ci * 360}px;top:248px;font-size:32px;padding:12px 28px;`);
          animPop(pe, tCh + 1.1 + ci * 0.45, 0.55, 36, 'bouncy', 0.76);
        });
        markCut(tCh, `${sc.id}_chamber_rise`);
        addDot(tCh + 0.5, 68, 616, 0.95, 'camera');
      }

      onFrame(t => {
        if (t < roomShowStart || t >= roomShowEnd) return;
        barObjs.forEach(b => {
          b.row.style.opacity = clamp01((t - b.t0 + 0.15) / 0.25).toFixed(3);
          b.fill.style.transform = `scaleX(${prog(t, b.t0, b.t0 + 0.68, 'camera').toFixed(4)})`;
        });
        if (chEl) {
          const chU = prog(t, tCh, tCh + 1.10, 'rise');
          chEl.style.transform = `translate3d(0,${lerp(540, 0, chU).toFixed(1)}px,0)`;
          upper.style.transform = `translate3d(0,${lerp(0, -135, chU).toFixed(1)}px,0) scale(${lerp(1, 0.86, chU).toFixed(4)})`;
          if (t >= tCh) {
            const tf = (1 - prog(t, tCh, tCh + 0.42, 'linear')).toFixed(3);
            tEl.style.opacity = tf;
            if (sEl) sEl.style.opacity = tf;
          }
        }
      });
      return;
    }

    // ---------- 4) ARCHETYPE: split (분할 벽 무대: 좌 vs 우 대비 — 막대형 & 카드형 모두 지원) ----------
    if (sc.type === 'split') {
      if (sc.left && sc.right && typeof sc.left === 'object' && typeof sc.right === 'object') {
        makeHeader();
        if (sc.prop) {
          const prop = mkStageProp(r, sc.prop, 1440, 290, 360, 420, 250);
          animPop(prop, roomShowStart + 0.35, 0.78, 80, 'bouncy', 0.80);
        }
        const cardW = sc.prop ? 610 : 810;
        const gap = 36;
        [sc.left, sc.right].forEach((side, si) => {
          const x = 96 + si * (cardW + gap);
          const acc = side.accent || (si === 0 ? '#D65A31' : '#26512F');
          const box = mk(r, '', '',
            `position:absolute;left:${x}px;top:292px;width:${cardW}px;min-height:460px;background:#F4EFE8;border:2.5px solid #201E1F;border-radius:24px;padding:28px 30px;box-shadow:0 16px 36px rgba(32,30,31,0.16);`
          );
          mk(box, 'mono', side.tag || (si === 0 ? 'BEFORE' : 'AFTER'),
            `display:inline-block;background:${acc};color:#F4EFE8;font-size:21px;font-weight:700;padding:7px 20px;border-radius:999px;margin-bottom:22px;`);
          const tBox = roomShowStart + 0.35 + si * 0.35;
          animPop(box, tBox, 0.62, 48, 'bouncy', 0.86);
          (side.items || []).slice(0, 4).forEach((it, ii) => {
            const tIt = cueAt(sc.id, it.cue, 0.16 + si * 0.32 + ii * 0.11);
            const rowEl = mk(box, '',
              `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${acc};margin-right:14px;flex:0 0 auto;margin-top:13px;"></span>` +
              `<span style="font-size:26px;font-weight:700;line-height:1.38;color:#201E1F;">${it.text}</span>`,
              'display:flex;align-items:flex-start;padding:14px 16px;margin-bottom:14px;background:rgba(32,30,31,0.045);border-radius:14px;border-left:4px solid ' + acc + ';'
            );
            animReveal(rowEl, Math.max(tBox + 0.12, tIt), 0.45, -24, 0, 'reveal');
            markTick(tIt, `${sc.id}_sp_${si}_${ii}`);
          });
          addDot(tBox + 0.2, x + cardW - 30, 320, 1.02, 'camera');
        });
        return;
      }

      const rightWall = sc.rightWall || '#F8D867';
      const floorH = Math.round(1080 * (sc.floorPct || 24) / 100);
      mk(r, '', '', `position:absolute;left:960px;top:0;right:0;bottom:${floorH}px;background:${rightWall};border-left:2px solid #201E1F;`);
      mk(r, 'wall-light');

      const leftInk = isDark(wallCol) ? '#F4EFE8' : '#201E1F';
      const rightInk = isDark(rightWall) ? '#F4EFE8' : '#201E1F';
      const hasQ = !!sc.question;
      const tReveal = hasQ ? cueAt(sc.id, sc.revealCue, 0.36) : roomShowStart + 0.3;

      let qWrap = null;
      if (hasQ) {
        qWrap = mk(r, '', '', 'position:absolute;left:120px;right:120px;top:210px;text-align:center;');
        mk(qWrap, 'gt-line', `<span class="gt">&gt;</span>${sc.questionTag || '잠깐 생각해 볼까요?'}`,
          'color:#201E1F;font-size:26px;margin-bottom:16px;background:rgba(244,239,232,0.82);display:inline-block;padding:4px 18px;border-radius:999px;');
        mk(qWrap, 'h-ch', sc.question,
          'color:#201E1F;font-size:74px;white-space:normal;line-height:1.18;margin-top:10px;background:rgba(244,239,232,0.88);padding:20px 36px;border-radius:24px;border:2px solid #201E1F;');
      }

      const lHdr = mk(r, 'h-ch', `<span class="hash">##</span>${sc.leftTitle || '왼쪽'}`,
        `position:absolute;left:86px;top:118px;font-size:58px;color:${leftInk};`);
      const lSub = mk(r, 'gt-line', `<span class="gt">&gt;</span>${sc.leftSub || ''}`,
        `position:absolute;left:92px;top:198px;font-size:23px;color:${leftInk};`);
      const rHdr = mk(r, 'h-ch', `<span class="hash">##</span>${sc.rightTitle || '오른쪽'}`,
        `position:absolute;left:1036px;top:118px;font-size:58px;color:${rightInk};`);
      const rSub = mk(r, 'gt-line', `<span class="gt">&gt;</span>${sc.rightSub || ''}`,
        `position:absolute;left:1042px;top:198px;font-size:23px;color:${rightInk};`);

      const tLeft = cueAt(sc.id, sc.leftCue, hasQ ? 0.40 : 0.16);
      const tRight = cueAt(sc.id, sc.rightCue, hasQ ? 0.64 : 0.48);
      animReveal(lHdr, tLeft - 0.25, 0.50, 0, 20, 'reveal');
      animReveal(lSub, tLeft, 0.45, 0, 14, 'reveal');
      animReveal(rHdr, tRight - 0.25, 0.50, 0, 20, 'reveal');
      animReveal(rSub, tRight, 0.45, 0, 14, 'reveal');

      const lItems = sc.leftItems || [{ text: sc.leftTitle, h: 420, color: '#0B41C2', fg: '#F4EFE8' }];
      const lEls = lItems.map((it, i) => {
        const w = Math.floor(720 / lItems.length) - 20;
        const x = 110 + i * (w + 22);
        const el = mk(r, '',
          `<div style="color:${it.fg || '#F4EFE8'};font-size:${lItems.length === 1 ? 52 : 28}px;font-weight:900;text-align:center;padding:28px 14px;line-height:1.22;white-space:pre-wrap;">${it.text}</div>`,
          `position:absolute;left:${x}px;bottom:${floorH}px;width:${w}px;height:${it.h || 380}px;background:${it.color || '#0B41C2'};border:2px solid #201E1F;border-bottom:none;border-radius:18px 18px 0 0;transform-origin:50% 100%;`
        );
        return { el, t0: tLeft + i * 0.16 };
      });
      const rItems = sc.rightItems || [{ text: sc.rightTitle, h: 200, color: '#FC4109', fg: '#F4EFE8' }];
      const rEls = rItems.map((it, i) => {
        const w = Math.floor(780 / rItems.length) - 18;
        const x = 1020 + i * (w + 18);
        const el = mk(r, '',
          `<div style="color:${it.fg || '#F4EFE8'};font-size:${rItems.length <= 2 ? 38 : 25}px;font-weight:800;text-align:center;padding:24px 10px;line-height:1.25;white-space:pre-wrap;">${it.text}</div>`,
          `position:absolute;left:${x}px;bottom:${floorH}px;width:${w}px;height:${it.h || (230 - i * 12)}px;background:${it.color || ['#FC4109', '#26512F', '#0B41C2', '#CB9CF8', '#FFABC8'][i % 5]};border:2px solid #201E1F;border-bottom:none;border-radius:16px 16px 0 0;transform-origin:50% 100%;`
        );
        markTick(tRight + i * 0.14, `${sc.id}_rp_${i}`);
        return { el, t0: tRight + i * 0.14 };
      });
      markPop(tLeft, `${sc.id}_left_pop`);
      addDot(tLeft + 0.2, 480, 320, 1.15, 'bouncy');
      addDot(tRight + 0.3, 1440, 520, 1.05, 'camera');

      onFrame(t => {
        if (t < roomShowStart || t >= roomShowEnd) return;
        if (qWrap) {
          const qi = prog(t, roomShowStart + 0.2, roomShowStart + 0.75, 'reveal');
          const qo = 1 - prog(t, tReveal - 0.55, tReveal, 'linear');
          qWrap.style.opacity = (qi * qo).toFixed(3);
          qWrap.style.transform = `translate3d(0,${lerp(28, 0, qi).toFixed(1)}px,0)`;
        }
        lEls.forEach(o => {
          const u = prog(t, o.t0, o.t0 + 0.80, 'rise');
          o.el.style.opacity = clamp01((t - o.t0) / 0.12).toFixed(3);
          o.el.style.transform = `scaleY(${u.toFixed(4)})`;
        });
        rEls.forEach(o => {
          const u = prog(t, o.t0, o.t0 + 0.65, 'bouncy');
          o.el.style.opacity = clamp01((t - o.t0) / 0.10).toFixed(3);
          o.el.style.transform = `scaleY(${u.toFixed(4)})`;
        });
      });
      return;
    }

    // ---------- 5) ARCHETYPE: spotlight (암전 스포트라이트 + 3D 낙하 + 타이핑 + 도장) ----------
    if (sc.type === 'spotlight') {
      mk(r, '', '',
        'position:absolute;left:1100px;top:110px;width:720px;height:720px;border-radius:50%;' +
        'background:radial-gradient(circle, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.03) 48%, transparent 72%);pointer-events:none;');
      makeHeader();
      const prop = mkStageProp(r, sc.prop || hubSpec.stations[1].art, 1270, 276, 460, 500, 320);
      animDrop(prop, roomShowStart + 0.35, 0.72, -160, 'bouncy');

      const tBox = cueAt(sc.id, sc.boxCue, 0.28);
      const tStamp = cueAt(sc.id, sc.stampCue, 0.50);
      const tNote = cueAt(sc.id, sc.noteCue, 0.64);
      const tPunch = cueAt(sc.id, sc.punchCue, 0.80);

      if (sc.boxText) {
        const bx = mk(r, 'gt-line', '',
          'position:absolute;left:102px;top:338px;color:#F4EFE8;font-size:30px;background:rgba(255,255,255,0.06);padding:20px 28px;border:1.5px solid rgba(244,239,232,0.28);border-radius:16px;max-width:1020px;white-space:pre-wrap;line-height:1.45;');
        animType(bx, sc.boxText, tBox, 1.8, '<span class="gt">&gt;</span>', true);
      }
      if (sc.stamp) {
        const stEl = mk(r, 'hm-pill acc', sc.stamp, 'left:102px;top:476px;font-size:36px;padding:12px 34px;');
        animPop(stEl, tStamp, 0.52, 36, 'snappy', 0.74);
        markPop(tStamp, `${sc.id}_stamp`);
        addDot(tStamp + 0.1, 102 + Math.min(480, sc.stamp.length * 36 + 100), 510, 1.22, 'snappy');
      }
      if (sc.noteLine) {
        const nt = mk(r, 'gt-line', '', 'position:absolute;left:102px;top:592px;color:rgba(244,239,232,0.86);font-size:25px;');
        animType(nt, sc.noteLine, tNote, 1.5, '<span class="gt">&gt;</span>', false);
      }
      if (sc.punch) {
        const pn = mk(r, 'h-ch',
          `<span style="color:#F4EFE8;">${sc.punch}</span>${sc.punchAcc ? ` <span style="color:#FFABC8;">${sc.punchAcc}</span>` : ''}`,
          'position:absolute;left:102px;top:678px;font-size:60px;');
        animPop(pn, tPunch, 0.60, 38, 'reveal', 0.90);
      }
      return;
    }

    // ---------- 6) ARCHETYPE: pillars (크레인 다운 + 취소선 + 들보 + 중력 낙하 기둥 3~4개 + 미터) ----------
    if (sc.type === 'pillars') {
      makeHeader();
      const prop = mkStageProp(r, sc.prop || hubSpec.stations[2].art, 1320, 316, 460, 450, 320);
      animPop(prop, roomShowStart + 0.5, 0.78, 80, 'bouncy', 0.80);

      if (sc.wrong && sc.right) {
        const tW = cueAt(sc.id, sc.wrongCue, 0.12);
        const tR = cueAt(sc.id, sc.rightCue, 0.24);
        const wEl = mk(r, 'body-l', sc.wrong, `position:absolute;left:104px;top:222px;color:${inkCol};font-weight:700;font-size:38px;`);
        const sv = svgIn(r);
        const wLen = Math.min(440, Math.max(200, sc.wrong.length * 30));
        const ln = svgPath(sv, `M 98 248 L ${98 + wLen} 242`, '#FC4109', 7);
        const rEl = mk(r, 'hm-pill acc', sc.right, `left:${130 + wLen}px;top:212px;font-size:34px;padding:10px 28px;`);
        animReveal(wEl, tW, 0.42, 0, 16, 'reveal');
        animDraw(ln, tR - 0.2, 0.35, 'camera');
        animPop(rEl, tR, 0.55, 34, 'bouncy', 0.78);
        markPop(tR, `${sc.id}_right`);
      }

      if (sc.beam) {
        const bm = mk(r, '',
          `<span style="color:#F4EFE8;font-size:32px;font-weight:800;">${sc.beam}</span>` +
          (sc.beamTag ? `<span class="mono" style="color:#FFABC8;font-size:19px;margin-left:18px;">${sc.beamTag}</span>` : ''),
          'position:absolute;left:104px;top:358px;width:1020px;height:72px;line-height:70px;padding:0 32px;background:#201E1F;border-radius:16px;border:2px solid #201E1F;'
        );
        animReveal(bm, roomShowStart + 0.9, 0.52, 0, 20, 'reveal');
      }

      const items = (sc.pillars || []).slice(0, 4);
      const pCols = ['#0B41C2', '#26512F', '#FC4109', '#6B3FA0'];
      const gap = 22;
      const pW = Math.floor((1020 - gap * (items.length - 1)) / items.length);
      const pTimes = [];
      items.forEach((p, pi) => {
        const x = 104 + pi * (pW + gap);
        const t0 = cueAt(sc.id, p.cue, 0.30 + pi * 0.16);
        pTimes.push(t0);
        const el = mk(r, '',
          `<div class="mono" style="font-size:19px;opacity:0.84;margin-bottom:8px;">${p.tag || `STEP 0${pi + 1}`}</div>` +
          `<div style="font-size:${items.length >= 4 ? 26 : 31}px;font-weight:800;line-height:1.28;white-space:pre-wrap;">${p.text}</div>`,
          `position:absolute;left:${x}px;top:448px;width:${pW}px;height:216px;padding:26px 22px;background:${p.color || pCols[pi % pCols.length]};color:#F4EFE8;border:2px solid #201E1F;border-radius:16px;`
        );
        animDrop(el, t0, 0.65, -180, 'bouncy');
        markPop(t0, `${sc.id}_pil_${pi}`);
        addDot(t0 + 0.1, x + pW / 2, 426, 1.05, 'bouncy');
      });

      if (sc.meterLabel) {
        const mw = mk(r, '', '', 'position:absolute;left:104px;top:724px;width:1020px;height:66px;');
        mk(mw, 'mono', sc.meterLabel, `position:absolute;left:0;top:18px;width:255px;font-size:21px;color:${inkCol};font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`);
        const trk = mk(mw, '', '', 'position:absolute;left:265px;top:16px;width:605px;height:34px;background:rgba(244,239,232,0.58);border:2px solid #201E1F;border-radius:999px;overflow:hidden;');
        const fl = mk(trk, '', '', 'position:absolute;left:0;top:0;bottom:0;width:100%;background:#FC4109;transform-origin:0 50%;');
        const lb = mk(mw, 'mono', 'HIGH', `position:absolute;left:892px;top:16px;font-size:23px;color:${inkCol};font-weight:700;`);
        const up = sc.meterDir === 'up';
        onFrame(t => {
          if (t < roomShowStart || t >= roomShowEnd) return;
          mw.style.opacity = prog(t, roomShowStart + 1.2, roomShowStart + 1.7, 'reveal').toFixed(3);
          let v = up ? 0.15 : 0.90;
          const step = 0.75 / Math.max(1, pTimes.length);
          pTimes.forEach(pt => {
            const u = prog(t, pt, pt + 0.6, 'camera');
            v = up ? v + step * u : v - step * u;
          });
          fl.style.transform = `scaleX(${clamp01(v).toFixed(4)})`;
          fl.style.background = (up ? v > 0.7 : v < 0.3) ? '#26512F' : '#FC4109';
          lb.textContent = up ? `${Math.round(v * 100)}%` : (v < 0.3 ? 'LOW' : (v < 0.6 ? 'MID' : 'HIGH'));
        });
      }
      return;
    }

    // ---------- 7) ARCHETYPE: code (기술 세션 모노 코드·명령·설정 카드 + 3D 소품 + 한글 요점 알약) ----------
    if (sc.type === 'code') {
      makeHeader();
      const prop = mkStageProp(r, sc.prop || hubSpec.stations[0].art, 1340, 290, 420, 460, 280);
      animPop(prop, roomShowStart + 0.35, 0.78, 80, 'bouncy', 0.80);

      const codeBox = mk(r, 'hm-code', '', 'left:96px;top:256px;width:1160px;min-height:340px;');
      mk(codeBox, 'hm-code-hdr', sc.codeHeader || 'COMMAND / CONFIG', '');
      const cLines = (sc.codeLines || []).map((ln, li) => {
        const text = typeof ln === 'string' ? ln : ln.text;
        const tHi = typeof ln === 'object' && ln.cue !== undefined ? cueAt(sc.id, ln.cue, 0.22 + li * 0.12) : null;
        const el = mk(codeBox, 'hm-code-line', text.replace(/</g, '&lt;').replace(/>/g, '&gt;'), '');
        return { el, tHi };
      });
      animPop(codeBox, roomShowStart + 0.45, 0.65, 42, 'reveal', 0.94);

      // 하단 한글 요점 칩 2~3개 (flexbox 자동 간격 -> 긴 문구도 절대 겹침 없음!)
      const coRow = mk(r, '', '', 'position:absolute;left:96px;top:734px;display:flex;gap:18px;align-items:center;max-width:1180px;');
      (sc.callouts || []).slice(0, 3).forEach((co, ci) => {
        const t0 = cueAt(sc.id, co.cue, 0.30 + ci * 0.22);
        const el = mk(coRow, ci === 0 ? 'hm-pill acc' : (ci === 1 ? 'hm-pill yellow' : 'hm-pill'), co.text,
          'position:relative;font-size:26px;padding:10px 24px;white-space:nowrap;');
        animPop(el, t0, 0.56, 40, 'bouncy', 0.78);
        markTick(t0, `${sc.id}_co_${ci}`);
      });

      onFrame(t => {
        if (t < roomShowStart || t >= roomShowEnd) return;
        let activeIdx = -1;
        cLines.forEach((ln, i) => { if (ln.tHi !== null && t >= ln.tHi) activeIdx = i; });
        cLines.forEach((ln, i) => {
          ln.el.classList.toggle('hi', i === activeIdx);
        });
      });
      return;
    }

    // ---------- 8) ARCHETYPE: flow (단계 흐름·루프·아키텍처 + 화살표) ----------
    if (sc.type === 'flow') {
      makeHeader();
      const prop = mkStageProp(r, sc.prop || hubSpec.stations[2].art, 1410, 290, 380, 440, 260);
      animPop(prop, roomShowStart + 0.35, 0.78, 80, 'bouncy', 0.80);

      const steps = (sc.steps || []).slice(0, 4);
      const sv = svgIn(r);
      const boxW = steps.length <= 3 ? 350 : 285;
      const gap = steps.length <= 3 ? 68 : 44;
      const startX = 96;
      const topY = 350;
      const accCols = ['#0B41C2', '#FC4109', '#26512F', '#C85A2C'];

      steps.forEach((stItem, si) => {
        const x = startX + si * (boxW + gap);
        const t0 = cueAt(sc.id, stItem.cue, 0.16 + si * 0.19);
        const el = mk(r, 'hm-flow-box',
          `<div class="mono" style="font-size:20px;color:${accCols[si % 4]};margin-bottom:8px;">0${si + 1} · ${stItem.tag || ''}</div>` +
          `<div style="font-size:${steps.length >= 4 ? 28 : 34}px;font-weight:800;line-height:1.25;margin-bottom:10px;">${stItem.title}</div>` +
          (stItem.desc ? `<div style="font-size:22px;line-height:1.4;color:#444;">${stItem.desc}</div>` : ''),
          `left:${x}px;top:${topY}px;width:${boxW}px;min-height:240px;`
        );
        animPop(el, t0, 0.60, 52, 'bouncy', 0.76);
        markTick(t0, `${sc.id}_flow_${si}`);
        addDot(t0 + 0.15, x + boxW / 2, topY - 26, 1.02, 'camera');
        if (si > 0) {
          const ax1 = x - gap + 8, ax2 = x - 8, ay = topY + 115;
          const p = svgPath(sv, `M ${ax1} ${ay} L ${ax2} ${ay} M ${ax2 - 14} ${ay - 10} L ${ax2} ${ay} L ${ax2 - 14} ${ay + 10}`, '#201E1F', 4);
          animDraw(p, t0 - 0.15, 0.35, 'camera');
        }
      });

      if (sc.loopBack && steps.length >= 2) {
        const lastX = startX + (steps.length - 1) * (boxW + gap) + boxW / 2;
        const firstX = startX + boxW / 2;
        const tLoop = cueAt(sc.id, sc.loopCue, 0.76);
        const lp = svgPath(sv, `M ${lastX} ${topY + 255} C ${lastX} ${topY + 345}, ${firstX} ${topY + 345}, ${firstX} ${topY + 255}`, '#FC4109', 5);
        animDraw(lp, tLoop, 0.75, 'camera');
        const lt = mk(r, 'hm-pill acc', sc.loopBack, `left:${Math.round((firstX + lastX) / 2 - 170)}px;top:${topY + 298}px;font-size:26px;padding:8px 26px;`);
        animPop(lt, tLoop + 0.35, 0.50, 24, 'bouncy', 0.80);
      }
      return;
    }

    // ---------- 9) ARCHETYPE: table (진단표 / 비교표) ----------
    if (sc.type === 'table') {
      makeHeader();
      const prop = mkStageProp(r, sc.prop || hubSpec.stations[3].art, 1410, 290, 390, 440, 270);
      animPop(prop, roomShowStart + 0.35, 0.78, 80, 'bouncy', 0.80);

      const rows = (sc.rows || []).slice(0, 4);
      const badgeCols = ['#0B41C2', '#26512F', '#C85A2C', '#FC4109'];
      rows.forEach((rw, ri) => {
        const y = 290 + ri * 124;
        const isArr = Array.isArray(rw);
        const t0 = cueAt(sc.id, isArr ? rw[2] : rw.cue, 0.15 + ri * 0.19);
        const html = isArr
          ? `<div style="flex:0 0 380px;background:${badgeCols[ri % 4]};color:#F4EFE8;font-size:25px;font-weight:800;padding:11px 22px;border-radius:14px;text-align:center;line-height:1.25;">${rw[0]}</div>` +
            `<div style="flex:1;font-size:27px;font-weight:700;line-height:1.35;color:#201E1F;padding-left:10px;">${rw[1]}</div>`
          : `<div style="flex:1.25;font-size:28px;font-weight:700;line-height:1.3;">${rw.left}</div>` +
            `<div style="flex:0 0 auto;background:${rw.color || badgeCols[ri % 4]};color:#F4EFE8;font-size:24px;font-weight:800;padding:8px 20px;border-radius:999px;">${rw.mid}</div>` +
            `<div style="flex:1.15;font-size:25px;font-weight:600;line-height:1.32;color:#2c2a2b;">${rw.right}</div>`;
        const el = mk(r, 'hm-diag-row', html, `left:96px;top:${y}px;width:1260px;min-height:98px;`);
        animReveal(el, t0, 0.52, -32, 0, 'reveal');
        markTick(t0, `${sc.id}_row_${ri}`);
        addDot(t0 + 0.1, 72, y + 48, 0.96, 'camera');
      });
      return;
    }
  });

  // 공부 책상 허브 통합 렌더 루프
  onFrame(t => {
    let active = null;
    for (const w of hubWindows) {
      if (t >= w.t0 && t < w.t1) active = w;
    }
    if (!active) { rHub.style.visibility = 'hidden'; return; }
    rHub.style.visibility = 'visible';
    rHub.style.zIndex = String(active.z);

    let camX = 960, dollyS = 1.0;
    if (active.mode === 'full') {
      const dur = active.tEnd - active.tStart;
      const f = clamp01((t - active.tStart) / Math.max(1, dur));
      hubTitle.style.opacity = prog(t, active.tStart + 0.2, active.tStart + 0.7, 'reveal').toFixed(3);
      hubSub.style.opacity = prog(t, active.tStart + 0.5, active.tStart + 1.0, 'reveal').toFixed(3);
      const targetX = 960 + (active.focusIdx || 0) * 960;
      if (f < 0.16) camX = 960;
      else if (f < 0.30) camX = lerp(960, 1920, prog(f, 0.16, 0.28, 'camera'));
      else if (f < 0.44) camX = lerp(1920, 2880, prog(f, 0.30, 0.42, 'camera'));
      else if (f < 0.56) camX = lerp(2880, 3840, prog(f, 0.44, 0.54, 'camera'));
      else if (f < 0.80) {
        const u = prog(f, 0.56, 0.64, 'camera');
        camX = lerp(3840, 2400, u);
        dollyS = lerp(1.0, 0.72, u);
      } else {
        const backU = prog(f, 0.80, 0.89, 'camera');
        camX = lerp(2400, targetX, backU);
        const baseS = lerp(0.72, 1.0, backU);
        const pushU = prog(t, active.tEnd - 1.9, active.tEnd, 'dolly');
        dollyS = baseS * lerp(1.0, 1.66, pushU);
      }
      if (active.showScale) {
        const scIn = prog(f, 0.56, 0.62, 'reveal');
        const scOut = 1 - prog(f, 0.78, 0.83, 'linear');
        scaleWrap.style.opacity = (scIn * scOut).toFixed(3);
        scaleKnob.style.left = `${(740 + Math.sin(t * 1.5) * 320).toFixed(1)}px`;
      } else {
        scaleWrap.style.opacity = '0';
      }
    } else if (active.mode === 'bridge') {
      hubTitle.style.opacity = '0';
      hubSub.style.opacity = '0';
      scaleWrap.style.opacity = '0';
      camX = lerp(active.fromX, active.toX, prog(t, active.t0, active.t0 + 0.75, 'camera'));
      dollyS = lerp(1.0, 1.65, prog(t, active.t0 + 0.55, active.t0 + 1.25, 'dolly'));
    } else if (active.mode === 'whip_pan') {
      hubTitle.style.opacity = '0';
      hubSub.style.opacity = '0';
      scaleWrap.style.opacity = '0';
      camX = lerp(active.fromX, active.toX, prog(t, active.t0 + 0.15, active.t0 + 1.85, 'camera'));
      dollyS = lerp(0.86, 1.0, prog(t, active.t0 + 0.15, active.t0 + 1.85, 'sineInOut'));
    }
    hubWorld.style.transform = `translate3d(${(960 - camX).toFixed(1)}px,0,0)`;
    hubCam.style.transform = `scale(${dollyS.toFixed(4)})`;
    hubStations.forEach((s, i) => {
      const focus = clamp01(1 - Math.abs(camX - s.x) / 850);
      const bob = Math.sin(t * 2.1 + i * 1.2) * 4 * focus;
      s.prop.style.transform = `translate3d(0,${bob.toFixed(1)}px,0) scale(${lerp(0.92, 1.05, focus).toFixed(4)})`;
      s.lbl.style.opacity = lerp(0.45, 1, focus).toFixed(3);
    });
  });

  // =========================================================================
  // 4. 와이드 풀백 북엔드 (C.end_start .. DUR) — 미니어처 공부 책상 + 강사 + 마침표 귀환
  // =========================================================================
  const rEnd = makeRoom(op.wall, '#EFEDE8', 25, 52);
  const endWrap = mk(rEnd, '', '', 'position:absolute;inset:0;transform-origin:50% 60%;');
  mk(endWrap, 'h-hero',
    `<span style="color:${opTextCol};">Claude FDE</span><span id="end-dot-slot" style="display:inline-block;width:54px;"></span><span style="color:${opAccCol};">${sessionTag}</span><span class="caret" id="end-caret" style="height:0.78em;width:16px;margin-left:14px;"></span>`,
    'position:absolute;left:0;right:0;top:175px;text-align:center;font-size:132px;');
  mk(endWrap, 'body-l',
    EP.next_session ? `다음 강의 · ${EP.next_session} ${EP.next_title || ''}` : 'Claude FDE 전체 42세션 완주',
    `position:absolute;left:120px;right:120px;top:358px;text-align:center;color:${opTextCol};font-size:34px;font-weight:500;white-space:normal;`);

  hubStations.forEach((stObj, si) => {
    const mx = 190 + si * 290;
    mkStageProp(endWrap, stObj.art, mx, 636, 210, 216, 150);
  });
  mkStageProp(endWrap, 'v3_host.png', 1480, 442, 180, 435, 120);
  mk(endWrap, 'footnote',
    '비공식 학습 자료 · 공식 강의: Anthropic Claude FDE 학습 경로 · AI 생성 일러스트·음성',
    'left:0;right:0;top:946px;text-align:center;color:#201E1F;background:transparent;');
  const endCaret = $('#end-caret');

  onFrame(t => {
    if (t < C.end_start) { rEnd.style.visibility = 'hidden'; return; }
    rEnd.style.visibility = 'visible';
    const u = prog(t, C.end_start, C.end_start + 1.0, 'camera');
    rEnd.style.opacity = clamp01((t - C.end_start) / 0.55).toFixed(3);
    endWrap.style.transform = `scale(${lerp(1.24, 1.0, u).toFixed(4)})`;
    endCaret.style.opacity = (Math.floor((t * 1000) / 525) % 2 === 0) ? '1' : '0';
  });

  // =========================================================================
  // 5. 떠다니는 #FC4109 점 마스터 트랙 (오프닝/북엔드 슬롯 좌표 자동 측정!)
  // =========================================================================
  const dot = $('#accent-dot');
  let openDotPos = [748, 286];
  let endDotPos = [1152, 284];
  let sortedDotKf = [];

  const buildDotTrack = () => {
    const stageEl = $('#stage');
    const sr = stageEl ? stageEl.getBoundingClientRect() : { left: 0, top: 0, width: 1920, height: 1080 };
    const sx = sr.width > 0 ? sr.width / 1920 : 1;
    const sy = sr.height > 0 ? sr.height / 1080 : 1;
    const oSlot = $('#open-dot-slot');
    if (oSlot) {
      const rc = oSlot.getBoundingClientRect();
      if (rc.width > 1) openDotPos = [(rc.left - sr.left + rc.width / 2) / sx, (rc.bottom - sr.top) / sy - 22];
    }
    const eSlot = $('#end-dot-slot');
    if (eSlot) {
      // endWrap scale 1.0 기준 측정을 위해 임시 표시
      const prevVis = rEnd.style.visibility, prevTr = endWrap.style.transform;
      rEnd.style.visibility = 'visible';
      endWrap.style.transform = 'none';
      const rc = eSlot.getBoundingClientRect();
      if (rc.width > 1) endDotPos = [(rc.left - sr.left + rc.width / 2) / sx, (rc.bottom - sr.top) / sy - 20];
      rEnd.style.visibility = prevVis;
      endWrap.style.transform = prevTr;
    }
    const full = [
      [0.00, 960, 500, 0.00, 'linear'],
      [0.55, 960, 500, 1.45, 'bouncy'],
      [1.35, openDotPos[0], openDotPos[1], 1.05, 'camera'],
      [C.opening_dur - 0.05, openDotPos[0], openDotPos[1], 1.05, 'linear'],
      ...DOT_KF.slice(2),
      [C.end_start + 0.92, endDotPos[0], endDotPos[1], 1.05, 'bouncy'],
      [DUR, endDotPos[0], endDotPos[1], 1.05, 'linear'],
    ];
    full.sort((a, b) => a[0] - b[0]);
    sortedDotKf = full;
  };

  onFrame(t => {
    if (!sortedDotKf.length) return;
    let i = 0;
    while (i + 1 < sortedDotKf.length && t >= sortedDotKf[i + 1][0]) i++;
    const a = sortedDotKf[i];
    const b = sortedDotKf[Math.min(i + 1, sortedDotKf.length - 1)];
    const u = prog(t, a[0], b[0], b[4] || 'linear');
    const [x, y, s] = lerpPt([a[1], a[2], a[3]], [b[1], b[2], b[3]], u);
    if (s <= 0.01) {
      dot.style.opacity = '0';
    } else {
      dot.style.opacity = '1';
      dot.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${s.toFixed(3)})`;
    }
  });

  window.__ready = Promise.all([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    ...Array.from(document.querySelectorAll('img')).map(im =>
      im.complete ? Promise.resolve() : new Promise(res => { im.onload = res; im.onerror = res; })
    ),
  ]).then(() => { buildDotTrack(); });
})();
