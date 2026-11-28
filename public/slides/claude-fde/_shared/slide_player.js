/* Claude FDE Study — Universal Interactive Slide Player Engine
   Works seamlessly with both S01 (s01_film.js) and S02..S42 (ep_engine.js)
   on top of stage_kit.js's deterministic window.__seek(t). */

(() => {
  'use strict';

  const C = window.CUES;
  const EP = window.EPISODE || {};
  const CFG = window.SLIDE_CONFIG || {};
  if (!C || !Array.isArray(C.scenes) || typeof window.__seek !== 'function') {
    console.error('[slide_player] Missing CUES or window.__seek');
    return;
  }

  const stageEl = document.getElementById('stage');
  const viewportEl = document.getElementById('slide-viewport');
  const frameEl = document.getElementById('stage-frame');
  const coverEl = document.getElementById('cover-overlay');
  const dockEl = document.getElementById('slide-dock');
  const btnStart = document.getElementById('btn-start');
  const toastEl = document.getElementById('stage-toast');

  const btnPrev = document.getElementById('btn-prev');
  const btnPlay = document.getElementById('btn-play');
  const btnReplay = document.getElementById('btn-replay');
  const btnNext = document.getElementById('btn-next');
  const btnAuto = document.getElementById('btn-auto');
  const btnMute = document.getElementById('btn-mute');
  const btnCaps = document.getElementById('btn-caps');
  const btnFs = document.getElementById('btn-fs');

  const dotsWrap = document.getElementById('dock-dots');
  const countEl = document.getElementById('dock-count');
  const titleEl = document.getElementById('dock-title');
  const statusEl = document.getElementById('dock-status');
  const progFill = document.getElementById('dock-prog-fill');
  const srLive = document.getElementById('sr-live');

  /* ---------- Build Slide Definitions ---------- */
  const scenes = C.scenes;
  const slides = scenes.map((s, i) => {
    const custom = (CFG.slides && CFG.slides[i]) || {};
    const nextS = scenes[i + 1];
    const voEnd = s.vo + s.adur;
    const isLast = i === scenes.length - 1;
    const holdT = custom.holdT !== undefined
      ? custom.holdT
      : (isLast ? C.dur : Math.min(voEnd, nextS.start - 0.06));
    const entryT = custom.entryT !== undefined ? custom.entryT : s.start;
    const transFromT = custom.transFromT !== undefined
      ? custom.transFromT
      : (i === 0 ? Math.max(0, C.opening_dur - 0.05) : null);
    return {
      idx: i,
      id: s.id,
      title: custom.title || s.title || `장면 ${i + 1}`,
      start: s.start,
      vo: s.vo,
      adur: s.adur,
      voEnd,
      holdT: Math.min(C.dur, Math.max(s.vo + 0.1, holdT)),
      entryT: Math.max(0, Math.min(s.vo, entryT)),
      transFromT,
      audio: custom.audio || `./audio/${s.id}.mp3`,
    };
  });
  for (let i = 1; i < slides.length; i++) {
    if (slides[i].transFromT === null || slides[i].transFromT === undefined) {
      slides[i].transFromT = slides[i - 1].holdT;
    }
  }

  const coverT = CFG.coverT !== undefined ? CFG.coverT : Math.min(3.2, Math.max(1.5, (C.opening_dur || 4.2) - 0.4));

  /* ---------- Overlay Mode (short viewport <= 500px OR coarse landscape) ---------- */
  const mqOverlay = window.matchMedia
    ? window.matchMedia('(max-height: 500px), (orientation: landscape) and (pointer: coarse)')
    : null;

  let overlayMode = false;
  let dockVisible = true;
  let dockHideTimer = null;
  let panelOpen = false;
  const DOCK_AUTO_HIDE_MS = 2500;

  function computeOverlayMode() {
    if (window.innerHeight <= 500) return true;
    return !!(mqOverlay && mqOverlay.matches);
  }

  function clearDockHideTimer() {
    if (dockHideTimer !== null) {
      clearTimeout(dockHideTimer);
      dockHideTimer = null;
    }
  }

  function applyDockVisibility(visible) {
    dockVisible = visible;
    document.body.classList.toggle('dock-hidden', overlayMode && !dockVisible);
  }

  function scheduleDockHide() {
    clearDockHideTimer();
    if (!overlayMode) {
      applyDockVisibility(true);
      return;
    }
    if (state.mode !== 'playing' || panelOpen) {
      applyDockVisibility(true);
      return;
    }
    dockHideTimer = setTimeout(() => {
      dockHideTimer = null;
      if (overlayMode && state.mode === 'playing' && !panelOpen) {
        applyDockVisibility(false);
      }
    }, DOCK_AUTO_HIDE_MS);
  }

  function showDock({ autoHide = true } = {}) {
    applyDockVisibility(true);
    if (autoHide) scheduleDockHide();
    else clearDockHideTimer();
  }

  function hideDock() {
    if (!overlayMode || state.mode !== 'playing') return;
    clearDockHideTimer();
    applyDockVisibility(false);
  }

  function syncOverlayMode() {
    const next = computeOverlayMode();
    if (next !== overlayMode) {
      overlayMode = next;
      document.body.classList.toggle('is-overlay', overlayMode);
      if (!overlayMode) {
        clearDockHideTimer();
        applyDockVisibility(true);
      } else if (state.mode === 'playing') {
        showDock({ autoHide: true });
      } else {
        showDock({ autoHide: false });
      }
    }
  }

  /* ---------- Fullscreen API (progressive enhancement; hidden when unsupported) ---------- */
  const fsRoot = document.documentElement;
  const canFullscreen = Boolean(
    (document.fullscreenEnabled || document.webkitFullscreenEnabled) &&
    (fsRoot.requestFullscreen || fsRoot.webkitRequestFullscreen)
  );

  function isFullscreen() {
    return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function toggleFullscreen() {
    if (!canFullscreen) return;
    try {
      if (isFullscreen()) {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) {
          const p = exit.call(document);
          if (p && typeof p.catch === 'function') p.catch(() => {});
        }
      } else {
        const req = fsRoot.requestFullscreen || fsRoot.webkitRequestFullscreen;
        if (req) {
          const p = req.call(fsRoot);
          if (p && typeof p.catch === 'function') p.catch(() => {});
        }
      }
    } catch (_) {
      // Blocked by iframe sandbox / permissions policy — fail silently without console errors
    }
  }

  /* ---------- Responsive 16:9 Letterbox Scaling ---------- */
  let currentScale = 1;
  function layoutStage() {
    syncOverlayMode();
    const style = getComputedStyle(viewportEl);
    const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const availW = Math.max(120, viewportEl.clientWidth - padX);
    const availH = Math.max(80, viewportEl.clientHeight - padY);
    const scale = Math.min(availW / 1920, availH / 1080);
    currentScale = scale;
    const w = Math.max(1, Math.round(1920 * scale));
    const h = Math.max(1, Math.round(1080 * scale));
    frameEl.style.width = `${w}px`;
    frameEl.style.height = `${h}px`;
    stageEl.style.transform = `scale(${scale.toFixed(6)})`;
  }

  /* ---------- Persistent Single Audio Element (iOS Safari friendly) ---------- */
  const audio = new Audio();
  audio.preload = 'auto';
  audio.playsInline = true;

  const prefetched = new Set();
  function prefetchSlideAudio(idx) {
    if (idx < 0 || idx >= slides.length) return;
    const url = slides[idx].audio;
    if (prefetched.has(url)) return;
    prefetched.add(url);
    try {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'audio';
      link.href = url;
      document.head.appendChild(link);
    } catch (_) {}
  }

  /* ---------- Player State ---------- */
  const state = {
    started: false,       // true after cover Start clicked
    slideIdx: -1,         // -1 = cover, 0..N-1 = active slide
    mode: 'cover',        // 'cover' | 'playing' | 'paused' | 'ended'
    t: coverT,            // current visual timeline timestamp
    slideStartT: coverT,  // visual start timestamp of this playback run
    audioStarted: false,  // whether audio.play() was triggered for current slide
    audioEnded: false,    // whether current slide's audio finished naturally
    audioFailed: false,   // fallback to pure wall-clock if audio playback fails
    autoAdvance: false,
    muted: false,
    captionsOn: true,
    visited: new Set(),
    lastRafTs: null,
    autoTimer: null,
    runId: 0,
  };

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(layoutStage).observe(viewportEl);
  }
  window.addEventListener('resize', layoutStage);
  window.addEventListener('orientationchange', () => setTimeout(layoutStage, 120));
  if (mqOverlay && mqOverlay.addEventListener) {
    mqOverlay.addEventListener('change', () => setTimeout(layoutStage, 40));
  }
  document.addEventListener('fullscreenchange', () => { updateUI(); setTimeout(layoutStage, 60); });
  document.addEventListener('webkitfullscreenchange', () => { updateUI(); setTimeout(layoutStage, 60); });
  layoutStage();

  /* ---------- Build Progress Dots ---------- */
  const dotButtons = slides.map((sl, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sp-dot';
    b.title = `${String(i + 1).padStart(2, '0')} · ${sl.title}`;
    b.setAttribute('aria-label', `장면 ${i + 1}: ${sl.title}`);
    b.addEventListener('click', () => {
      unlockAndRun(() => goToSlide(i, { via: 'jump' }));
    });
    dotsWrap.appendChild(b);
    return b;
  });

  /* ---------- Toast Feedback ---------- */
  let toastTimer = null;
  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 900);
  }

  function clearAutoTimer() {
    if (state.autoTimer !== null) {
      clearTimeout(state.autoTimer);
      state.autoTimer = null;
    }
  }

  /* ---------- Crisp Monochrome SVG Icons ---------- */
  const ICO = {
    play: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 2.8v10.4L13 8 4 2.8z"/></svg>',
    pause: '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="3.5" y="2.8" width="3.2" height="10.4" rx="0.8"/><rect x="9.3" y="2.8" width="3.2" height="10.4" rx="0.8"/></svg>',
    auto: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 4.2L7.5 8l-5 3.8V4.2z" fill="currentColor" stroke="none"/><path d="M8.5 4.2L13.5 8l-5 3.8V4.2z" fill="currentColor" stroke="none"/></svg>',
    vol: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6h2.8l3.4-2.8v9.6L5.3 10H2.5z" fill="currentColor" stroke="none"/><path d="M11 5.6a3.5 3.5 0 0 1 0 4.8"/><path d="M13 3.8a6 6 0 0 1 0 8.4"/></svg>',
    mute: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6h2.8l3.4-2.8v9.6L5.3 10H2.5z" fill="currentColor" stroke="none"/><path d="M11 6l3.5 4M14.5 6L11 10"/></svg>',
    fsEnter: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10"/></svg>',
    fsExit: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2.5V6H2.5M13.5 6H10V2.5M10 13.5V10h3.5M2.5 10H6v3.5"/></svg>',
  };

  /* ---------- UI Sync ---------- */
  function updateUI() {
    const total = slides.length;
    const isCover = state.slideIdx < 0;
    const sl = isCover ? null : slides[state.slideIdx];
    const isLast = !isCover && state.slideIdx === total - 1;

    coverEl.classList.toggle('is-hidden', !isCover);

    if (isCover) {
      countEl.textContent = `표지 · ${total}장면`;
      titleEl.textContent = EP.title || document.title;
      statusEl.textContent = '시작을 눌러 재생하세요';
      statusEl.classList.remove('is-ended');
      progFill.style.transform = 'scaleX(0)';
    } else {
      countEl.textContent = `${String(state.slideIdx + 1).padStart(2, '0')} / ${total}`;
      titleEl.textContent = sl.title.replace(/^\d{2}\s*[·.\-]\s*/, '');
      if (state.mode === 'ended') {
        statusEl.textContent = isLast
          ? '강의 완료 · 처음부터 다시 볼 수 있어요'
          : (state.autoAdvance ? '자동으로 다음 장면으로 넘어갑니다…' : '장면 끝 · 다음으로 넘기세요 →');
        statusEl.classList.add('is-ended');
      } else if (state.mode === 'paused') {
        statusEl.textContent = '일시정지';
        statusEl.classList.remove('is-ended');
      } else {
        statusEl.textContent = state.muted ? '재생 중 (음소거)' : '재생 중';
        statusEl.classList.remove('is-ended');
      }
      const span = Math.max(0.01, sl.holdT - state.slideStartT);
      const frac = Math.max(0, Math.min(1, (state.t - state.slideStartT) / span));
      progFill.style.transform = `scaleX(${frac.toFixed(4)})`;
    }

    dotButtons.forEach((b, i) => {
      const active = i === state.slideIdx;
      b.classList.toggle('is-active', active);
      b.classList.toggle('is-visited', state.visited.has(i));
      if (active) b.setAttribute('aria-current', 'step');
      else b.removeAttribute('aria-current');
    });

    btnPrev.disabled = isCover || state.slideIdx <= 0;
    btnReplay.disabled = isCover;
    btnPlay.disabled = isCover;

    if (state.mode === 'playing') {
      btnPlay.innerHTML = `<span class="btn-ico" aria-hidden="true">${ICO.pause}</span><span class="btn-lbl-sm-hide btn-lbl-ov-hide">일시정지</span>`;
      btnPlay.setAttribute('aria-label', '일시정지');
    } else {
      btnPlay.innerHTML = `<span class="btn-ico" aria-hidden="true">${ICO.play}</span><span class="btn-lbl-sm-hide btn-lbl-ov-hide">재생</span>`;
      btnPlay.setAttribute('aria-label', '재생');
    }

    if (isLast && state.mode === 'ended') {
      btnNext.disabled = false;
      btnNext.innerHTML = '<span class="btn-lbl-ov-hide">처음부터</span><span class="btn-ico" aria-hidden="true">↺</span>';
      btnNext.setAttribute('aria-label', '첫 장면부터 다시 보기');
      btnNext.classList.remove('is-pulse');
      btnNext.classList.add('is-primary');
    } else {
      btnNext.disabled = !isCover && isLast;
      btnNext.innerHTML = '<span class="btn-lbl-ov-hide">다음</span><span class="btn-ico" aria-hidden="true">→</span>';
      btnNext.setAttribute('aria-label', '다음 장면');
      btnNext.classList.toggle('is-pulse', state.mode === 'ended' && !isLast && !state.autoAdvance);
      btnNext.classList.toggle('is-primary', isCover);
    }

    btnAuto.setAttribute('aria-pressed', String(state.autoAdvance));
    btnAuto.innerHTML = `<span class="btn-ico" aria-hidden="true">${ICO.auto}</span><span class="btn-lbl-ov-hide">자동 넘김${state.autoAdvance ? ' 켜짐' : ''}</span>`;

    btnMute.setAttribute('aria-pressed', String(state.muted));
    btnMute.innerHTML = `<span class="btn-ico" aria-hidden="true">${state.muted ? ICO.mute : ICO.vol}</span><span class="btn-lbl-sm-hide btn-lbl-ov-hide">${state.muted ? '음소거됨' : '소리'}</span>`;
    btnMute.setAttribute('aria-label', state.muted ? '음소거 해제' : '음소거');

    btnCaps.setAttribute('aria-pressed', String(state.captionsOn));
    stageEl.classList.toggle('caps-hidden', !state.captionsOn);

    if (btnFs) {
      btnFs.hidden = !canFullscreen;
      if (canFullscreen) {
        const fs = isFullscreen();
        btnFs.setAttribute('aria-pressed', String(fs));
        btnFs.setAttribute('aria-label', fs ? '전체 화면 종료' : '전체 화면');
        btnFs.title = fs ? '전체 화면 종료 (F)' : '전체 화면 (F)';
        btnFs.innerHTML = `<span class="btn-ico" aria-hidden="true">${fs ? ICO.fsExit : ICO.fsEnter}</span>`;
      }
    }
  }

  /* ---------- Audio Events ---------- */
  audio.addEventListener('ended', () => {
    if (state.mode !== 'playing' || state.slideIdx < 0) return;
    state.audioEnded = true;
    const sl = slides[state.slideIdx];
    if (state.t >= sl.holdT - 0.02) {
      finishCurrentSlide();
    }
  });

  audio.addEventListener('error', () => {
    if (state.mode !== 'playing') return;
    state.audioFailed = true;
    state.audioEnded = true;
  });

  /* ---------- Core Navigation & Playback ---------- */
  function startAudioForSlide(sl, runId) {
    if (state.audioStarted) return;
    state.audioStarted = true;
    state.audioEnded = false;
    state.audioFailed = false;
    audio.muted = state.muted;
    const p = audio.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        if (state.runId !== runId) return;
        state.audioFailed = true;
        state.audioEnded = true;
      });
    }
  }

  function finishCurrentSlide() {
    if (state.mode === 'ended') return;
    const sl = slides[state.slideIdx];
    state.t = sl.holdT;
    window.__seek(state.t);
    state.mode = 'ended';
    state.lastRafTs = null;
    // Always reveal dock when waiting at slide end!
    showDock({ autoHide: false });
    updateUI();
    if (state.slideIdx === slides.length - 1) {
      window.dispatchEvent(new CustomEvent('slideplayer:session-complete'));
    }

    if (state.autoAdvance && state.slideIdx < slides.length - 1) {
      clearAutoTimer();
      const target = state.slideIdx + 1;
      const runId = state.runId;
      state.autoTimer = setTimeout(() => {
        if (state.runId !== runId || !state.autoAdvance || state.mode !== 'ended') return;
        goToSlide(target, { via: 'auto' });
      }, 650);
    }
  }

  function goToSlide(idx, { via = 'jump' } = {}) {
    if (idx < 0 || idx >= slides.length) return;
    clearAutoTimer();
    const prevIdx = state.slideIdx;
    const sl = slides[idx];

    state.runId += 1;
    const runId = state.runId;

    const isSequentialForward = (via === 'next' || via === 'auto' || via === 'start') && (
      (prevIdx === -1 && idx === 0) || (idx === prevIdx + 1)
    );
    const startT = isSequentialForward ? sl.transFromT : sl.entryT;

    state.started = true;
    state.slideIdx = idx;
    state.visited.add(idx);
    state.mode = 'playing';
    state.slideStartT = startT;
    state.t = startT;
    state.audioStarted = false;
    state.audioEnded = false;
    state.audioFailed = false;
    state.lastRafTs = null;

    try { audio.pause(); } catch (_) {}
    const resolvedSrc = new URL(sl.audio, window.location.href).href;
    if (audio.src !== resolvedSrc) {
      audio.src = sl.audio;
    }
    try { audio.currentTime = 0; } catch (_) {}
    audio.muted = state.muted;
    audio.load();

    window.__seek(state.t);

    if (state.t >= sl.vo - 0.01) {
      startAudioForSlide(sl, runId);
    }

    prefetchSlideAudio(idx + 1);

    // In overlay mode, show dock briefly on slide change then auto-hide after 2.5s
    if (overlayMode) {
      if (via === 'auto' && !dockVisible) {
        // Keep unobstructed full-bleed view during auto-advance if dock was already hidden
        applyDockVisibility(false);
      } else {
        showDock({ autoHide: true });
      }
    }

    updateUI();
    window.dispatchEvent(new CustomEvent('slideplayer:change', { detail: { idx, id: sl.id } }));
    if (srLive) {
      srLive.textContent = `장면 ${idx + 1} / ${slides.length}: ${sl.title}`;
    }
    ensureLoop();
  }

  function unlockAndRun(fn) {
    if (!state.started) {
      state.started = true;
    }
    fn();
  }

  function startFromCover() {
    goToSlide(0, { via: 'start' });
  }

  function nextSlide() {
    if (state.slideIdx < 0) {
      startFromCover();
      return;
    }
    if (state.slideIdx === slides.length - 1) {
      if (state.mode === 'ended') {
        goToSlide(0, { via: 'jump' });
      }
      return;
    }
    goToSlide(state.slideIdx + 1, { via: 'next' });
  }

  function prevSlide() {
    if (state.slideIdx <= 0) return;
    goToSlide(state.slideIdx - 1, { via: 'prev' });
  }

  function replaySlide() {
    if (state.slideIdx < 0) {
      startFromCover();
      return;
    }
    goToSlide(state.slideIdx, { via: 'replay' });
    showToast('다시 듣기');
  }

  function togglePlay() {
    if (state.slideIdx < 0) {
      startFromCover();
      return;
    }
    if (state.mode === 'ended') {
      replaySlide();
      return;
    }
    if (state.mode === 'playing') {
      clearAutoTimer();
      state.mode = 'paused';
      state.lastRafTs = null;
      if (state.audioStarted && !audio.paused) {
        try { audio.pause(); } catch (_) {}
      }
      showDock({ autoHide: false });
      updateUI();
      showToast('일시정지');
    } else if (state.mode === 'paused') {
      state.mode = 'playing';
      state.lastRafTs = null;
      const sl = slides[state.slideIdx];
      if (state.audioStarted && !state.audioEnded && !state.audioFailed) {
        const p = audio.play();
        if (p && typeof p.catch === 'function') p.catch(() => { state.audioFailed = true; });
      } else if (state.t >= sl.vo - 0.01 && !state.audioStarted) {
        startAudioForSlide(sl, state.runId);
      }
      showDock({ autoHide: true });
      updateUI();
      ensureLoop();
    }
  }

  function toggleAuto() {
    state.autoAdvance = !state.autoAdvance;
    clearAutoTimer();
    updateUI();
    showToast(state.autoAdvance ? '자동 넘김 켜짐' : '자동 넘김 꺼짐');
    if (overlayMode && state.mode === 'playing') scheduleDockHide();
    if (state.autoAdvance && state.mode === 'ended' && state.slideIdx < slides.length - 1) {
      const target = state.slideIdx + 1;
      const runId = state.runId;
      state.autoTimer = setTimeout(() => {
        if (state.runId !== runId || !state.autoAdvance || state.mode !== 'ended') return;
        goToSlide(target, { via: 'auto' });
      }, 450);
    }
  }

  function toggleMute() {
    state.muted = !state.muted;
    audio.muted = state.muted;
    updateUI();
    showToast(state.muted ? '음소거' : '소리 켜짐');
    if (overlayMode && state.mode === 'playing') scheduleDockHide();
  }

  function toggleCaps() {
    state.captionsOn = !state.captionsOn;
    updateUI();
    showToast(state.captionsOn ? '자막 켜짐' : '자막 꺼짐');
    if (overlayMode && state.mode === 'playing') scheduleDockHide();
  }

  /* ---------- Main rAF Animation Loop ---------- */
  let rafId = null;
  function ensureLoop() {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(tick);
  }

  function tick(now) {
    rafId = null;
    if (state.mode !== 'playing' || state.slideIdx < 0) return;

    const sl = slides[state.slideIdx];
    const dt = state.lastRafTs === null ? 0 : Math.min(0.1, (now - state.lastRafTs) / 1000);
    state.lastRafTs = now;

    if (!state.audioStarted) {
      state.t += dt;
      if (state.t >= sl.vo) {
        state.t = sl.vo;
        startAudioForSlide(sl, state.runId);
      }
    } else if (!state.audioEnded && !state.audioFailed && !audio.paused && audio.readyState >= 2) {
      const audioT = sl.vo + audio.currentTime;
      state.t = Math.min(sl.holdT, Math.max(sl.vo, audioT));
    } else if (state.audioEnded || state.audioFailed) {
      state.t = Math.min(sl.holdT, state.t + dt);
    } else {
      state.t = Math.min(sl.vo + 0.05, state.t + dt * 0.25);
    }

    window.__seek(state.t);

    const span = Math.max(0.01, sl.holdT - state.slideStartT);
    const frac = Math.max(0, Math.min(1, (state.t - state.slideStartT) / span));
    progFill.style.transform = `scaleX(${frac.toFixed(4)})`;

    const visualDone = state.t >= sl.holdT - 0.015;
    const audioDone = state.audioEnded || state.audioFailed || (state.audioStarted && audio.ended);
    if (visualDone && audioDone) {
      finishCurrentSlide();
      return;
    }

    rafId = requestAnimationFrame(tick);
  }

  /* ---------- Event Bindings ---------- */
  btnStart.addEventListener('click', startFromCover);
  btnPrev.addEventListener('click', prevSlide);
  btnPlay.addEventListener('click', togglePlay);
  btnReplay.addEventListener('click', replaySlide);
  btnNext.addEventListener('click', nextSlide);
  btnAuto.addEventListener('click', toggleAuto);
  btnMute.addEventListener('click', toggleMute);
  btnCaps.addEventListener('click', toggleCaps);
  if (btnFs) btnFs.addEventListener('click', toggleFullscreen);

  // Keep overlay dock alive while user interacts with it
  if (dockEl) {
    dockEl.addEventListener('pointerdown', () => {
      if (overlayMode && state.mode === 'playing') scheduleDockHide();
    });
    dockEl.addEventListener('focusin', () => {
      if (overlayMode) showDock({ autoHide: true });
    });
  }

  // Keyboard navigation
  window.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target && e.target.tagName) || '';
    const isBtn = tag === 'BUTTON' || tag === 'A';

    switch (e.code) {
      case 'ArrowRight':
      case 'PageDown':
        e.preventDefault();
        nextSlide();
        break;
      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault();
        prevSlide();
        break;
      case 'Space':
        if (isBtn && e.target !== btnStart) return;
        e.preventDefault();
        togglePlay();
        break;
      case 'KeyK':
        e.preventDefault();
        togglePlay();
        break;
      case 'KeyR':
        e.preventDefault();
        replaySlide();
        break;
      case 'KeyA':
        e.preventDefault();
        toggleAuto();
        break;
      case 'KeyM':
        e.preventDefault();
        toggleMute();
        break;
      case 'KeyC':
        e.preventDefault();
        toggleCaps();
        break;
      case 'KeyF':
        if (canFullscreen) {
          e.preventDefault();
          toggleFullscreen();
        }
        break;
      case 'Home':
        e.preventDefault();
        goToSlide(0, { via: 'jump' });
        break;
      case 'End':
        e.preventDefault();
        goToSlide(slides.length - 1, { via: 'jump' });
        break;
      default:
        break;
    }
  });

  // Touch swipe & overlay edge/center tap handling
  let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
  let lastSwipeAt = 0;

  viewportEl.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
  }, { passive: true });

  viewportEl.addEventListener('touchend', e => {
    if (!e.changedTouches.length) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    const dt = Date.now() - touchStartTime;
    if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.3 && dt < 700) {
      lastSwipeAt = Date.now();
      if (dx < 0) nextSlide();
      else prevSlide();
    }
  }, { passive: true });

  // Tap/click on viewport (in overlay mode: left/right 18% = prev/next, center = show/hide dock;
  // in desktop/portrait: click on stage toggles play/pause)
  viewportEl.addEventListener('click', e => {
    if (Date.now() - lastSwipeAt < 350) return;
    if (!state.started) return;
    if (e.target.closest('#cover-overlay') || e.target.closest('#slide-dock')) return;

    if (overlayMode) {
      const vw = viewportEl.clientWidth || window.innerWidth;
      const x = e.clientX;
      if (x <= vw * 0.18) {
        if (state.slideIdx > 0) prevSlide();
        else showDock({ autoHide: true });
      } else if (x >= vw * 0.82) {
        if (state.slideIdx < slides.length - 1 || state.mode === 'ended') nextSlide();
        else showDock({ autoHide: true });
      } else {
        // Center tap toggles dock visibility cleanly (never hides while paused/ended)
        if (!dockVisible) {
          showDock({ autoHide: true });
        } else if (state.mode === 'playing') {
          hideDock();
        }
      }
      return;
    }

    if (e.target.closest('#stage-frame')) {
      togglePlay();
    }
  });

  /* ---------- Initial Ready Render ---------- */
  const readyPromise = window.__ready || Promise.resolve();
  readyPromise.then(() => {
    layoutStage();
    window.__seek(coverT);
    updateUI();
    prefetchSlideAudio(0);
    try { btnStart.focus({ preventScroll: true }); } catch (_) {}
  });

  /* ---------- Introspection & Automated Test API ---------- */
  window.__slidePlayer = {
    get slides() { return slides; },
    getState: () => ({
      started: state.started,
      slideIdx: state.slideIdx,
      slideId: state.slideIdx >= 0 ? slides[state.slideIdx].id : null,
      totalSlides: slides.length,
      mode: state.mode,
      t: Number(state.t.toFixed(3)),
      holdT: state.slideIdx >= 0 ? slides[state.slideIdx].holdT : coverT,
      autoAdvance: state.autoAdvance,
      muted: state.muted,
      captionsOn: state.captionsOn,
      overlayMode,
      dockVisible,
      canFullscreen,
      isFullscreen: isFullscreen(),
      audioPaused: audio.paused,
      audioCurrentTime: Number((audio.currentTime || 0).toFixed(3)),
      audioDuration: Number((audio.duration || 0).toFixed(3)),
      audioReadyState: audio.readyState,
      scale: Number(currentScale.toFixed(4)),
    }),
    start: startFromCover,
    goTo: (i, via = 'jump') => goToSlide(i, { via }),
    next: nextSlide,
    prev: prevSlide,
    replay: replaySlide,
    togglePlay,
    toggleAuto,
    toggleMute,
    toggleCaps,
    toggleFullscreen,
    showDock: (autoHide = true) => showDock({ autoHide }),
    hideDock,
    setPanelOpen: isOpen => {
      panelOpen = !!isOpen;
      if (panelOpen) showDock({ autoHide: false });
      else if (overlayMode && state.mode === 'playing') scheduleDockHide();
      setTimeout(layoutStage, 260);
    },
    fastForwardToEnd: () => {
      if (state.slideIdx < 0) return;
      const sl = slides[state.slideIdx];
      state.t = sl.holdT;
      state.audioStarted = true;
      state.audioEnded = true;
      try { audio.pause(); } catch (_) {}
      finishCurrentSlide();
    },
  };
})();
