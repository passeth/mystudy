/* Claude FDE Study — Right Curriculum Drawer & Bottom Study Materials Sheet
   Decoupled panel controller layered cleanly atop window.__slidePlayer. */

(() => {
  'use strict';

  const CURR = window.CURRICULUM || { courses: [] };
  const STUDY = window.STUDY_DATA || null;
  const EP = window.EPISODE || {};
  const C = window.CUES || { scenes: [] };
  const CUR_SESSION = (EP.session || C.session || (STUDY && STUDY.session) || 'S01').toUpperCase();

  const btnToc = document.getElementById('btn-toc');
  const btnStudy = document.getElementById('btn-study');
  const backdrop = document.getElementById('panel-backdrop');

  const tocDrawer = document.getElementById('toc-drawer');
  const btnTocClose = document.getElementById('btn-toc-close');
  const tocProgPill = document.getElementById('toc-prog-pill');
  const tocScenesEl = document.getElementById('toc-scenes-list');
  const tocCoursesEl = document.getElementById('toc-courses-list');

  const studySheet = document.getElementById('study-sheet');
  const btnSheetSize = document.getElementById('btn-sheet-size');
  const btnSheetClose = document.getElementById('btn-sheet-close');
  const studyTabs = [...document.querySelectorAll('#study-sheet .study-tab')];
  const studyBody = document.getElementById('study-body');

  if (!tocDrawer || !studySheet) return;

  /* ---------- Safe localStorage progress tracking ---------- */
  const STORAGE_KEY = 'claude_fde_completed_v1';
  function readCompleted() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? arr : []);
    } catch (_) {
      return new Set();
    }
  }
  function saveCompleted(set) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
    } catch (_) {}
  }

  const completedSessions = readCompleted();

  /* ---------- Panel State ---------- */
  const panelState = {
    tocOpen: false,
    studyOpen: false,
    studyFull: false,
    activeTab: 'video', // 'video' | 'notes' | 'quiz' | 'cards' | 'sources'
    quizAnswers: {},    // { qIdx: chosenKey }
    quizOpenShown: {},  // { qIdx: bool }
    cardsFlipped: {},   // { cIdx: bool }
  };

  /* ---------- HTML Escaping & Inline Markdown Renderer ---------- */
  const esc = s => String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  function renderInline(raw) {
    // 1. Escape HTML first
    let s = esc(raw);
    // 2. Preserve inline code spans temporarily so bold/links don't touch them
    const codes = [];
    s = s.replace(/`([^`]+)`/g, (_, c) => {
      const idx = codes.push(`<code>${c}</code>`) - 1;
      return `\u0000CODE${idx}\u0000`;
    });
    // 3. Preserve (확인 필요) as a styled badge (never remove!)
    s = s.replace(/\(확인\s*필요\)/g, '<span class="sp-badge-check">확인 필요</span>');
    // 4. Bold **text**
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // 5. Markdown links [text](url)
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    // 6. Bare URLs
    s = s.replace(/(^|[\s(:])(https?:\/\/[^\s)<]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>');
    // 7. Restore code spans
    s = s.replace(/\u0000CODE(\d+)\u0000/g, (_, i) => codes[Number(i)]);
    return s;
  }

  function renderBlocks(blocks) {
    if (!Array.isArray(blocks) || !blocks.length) return '';
    return blocks.map(b => {
      if (b.type === 'p') return `<p>${renderInline(b.text)}</p>`;
      if (b.type === 'ul') {
        return `<ul>${b.items.map(it => `<li>${renderInline(it)}</li>`).join('')}</ul>`;
      }
      if (b.type === 'ol') {
        return `<ol>${b.items.map(it => `<li>${renderInline(it)}</li>`).join('')}</ol>`;
      }
      if (b.type === 'code') {
        const lang = b.lang ? `<div class="sp-code-lang">${esc(b.lang)}</div>` : '';
        return `<div class="sp-code-wrap">${lang}<pre>${esc(b.text)}</pre></div>`;
      }
      if (b.type === 'table') {
        const head = `<thead><tr>${b.headers.map(h => `<th>${renderInline(h)}</th>`).join('')}</tr></thead>`;
        const rows = `<tbody>${b.rows.map(r => `<tr>${r.map(c => `<td>${renderInline(c)}</td>`).join('')}</tr>`).join('')}</tbody>`;
        return `<div class="sp-table-wrap"><table class="sp-table">${head}${rows}</table></div>`;
      }
      return '';
    }).join('');
  }

  /* ---------- Build Right Drawer Content ---------- */
  let sceneButtons = [];
  function renderTocScenes() {
    const player = window.__slidePlayer;
    const slides = (player && player.slides) || C.scenes || [];
    tocScenesEl.innerHTML = '';
    sceneButtons = slides.map((sl, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'toc-scene-btn';
      const cleanTitle = String(sl.title || `장면 ${i + 1}`).replace(/^\d{2}\s*[·.\-]\s*/, '');
      btn.innerHTML = `<span class="toc-scene-num">${String(i + 1).padStart(2, '0')}</span><span>${esc(cleanTitle)}</span>`;
      btn.addEventListener('click', () => {
        if (window.__slidePlayer) window.__slidePlayer.goTo(i, 'jump');
        if (window.innerWidth <= 900) closeToc({ restoreFocus: false });
      });
      tocScenesEl.appendChild(btn);
      return btn;
    });
    syncActiveSceneInToc();
  }

  function syncActiveSceneInToc() {
    const idx = window.__slidePlayer ? window.__slidePlayer.getState().slideIdx : -1;
    sceneButtons.forEach((b, i) => {
      b.classList.toggle('is-active', i === idx);
      if (i === idx) b.setAttribute('aria-current', 'step');
      else b.removeAttribute('aria-current');
    });
  }

  function renderTocCourses() {
    const courses = CURR.courses || [];
    let totalSessions = 0;
    courses.forEach(c => { totalSessions += (c.sessions || []).length; });
    if (tocProgPill) {
      tocProgPill.textContent = `완료 ${completedSessions.size} / ${totalSessions || 42}`;
    }

    tocCoursesEl.innerHTML = '';
    courses.forEach(course => {
      const det = document.createElement('details');
      det.className = 'toc-course';
      const hasCurrent = (course.sessions || []).some(s => s.id === CUR_SESSION);
      if (hasCurrent) det.open = true;

      const sum = document.createElement('summary');
      sum.className = 'toc-course-sum';
      sum.innerHTML = `
        <span class="toc-course-sum-l">
          <span class="toc-course-tag">${esc(course.id)}</span>
          <span class="toc-course-name" title="${esc(course.title)}">${esc(course.title)}</span>
        </span>
        <span class="toc-course-chev" aria-hidden="true">▸</span>
      `;
      det.appendChild(sum);

      const list = document.createElement('div');
      list.className = 'toc-course-list';

      (course.sessions || []).forEach(sess => {
        const isCurrent = sess.id === CUR_SESSION;
        const isDone = completedSessions.has(sess.id);
        const el = document.createElement(sess.available ? 'a' : 'div');
        el.className = 'toc-session'
          + (isCurrent ? ' is-current' : '')
          + (!sess.available ? ' is-pending' : '');
        if (sess.available) {
          el.href = `../${sess.slug}/`;
          if (isCurrent) el.setAttribute('aria-current', 'page');
        } else {
          el.setAttribute('aria-disabled', 'true');
        }

        const checkHtml = isDone ? '<span class="toc-check" title="완료">✓</span>' : '';
        const badgeHtml = isCurrent
          ? '<span class="toc-sess-badge is-now">현재</span>'
          : (!sess.available ? '<span class="toc-sess-badge">준비 중</span>' : '');
        const durHtml = sess.durText ? `<span class="toc-sess-dur">${esc(sess.durText)}</span>` : '';

        el.innerHTML = `
          ${checkHtml}
          <span class="toc-sess-code">${esc(sess.id)}</span>
          <span class="toc-sess-title">${esc(sess.title)}</span>
          <span class="toc-sess-meta">${durHtml}${badgeHtml}</span>
        `;
        list.appendChild(el);
      });

      det.appendChild(list);
      tocCoursesEl.appendChild(det);
    });
  }

  /* ---------- Video Embed Detection (youtube-nocookie default; fallback card only on failure or local file) ---------- */
  function shouldUseVideoFallbackCard() {
    if (window.FORCE_VIDEO_CARD) return true;
    try {
      const proto = window.location.protocol;
      if (proto === 'file:' || proto === 'about:' || proto === 'blob:' || proto === 'data:') return true;
    } catch (_) {
      return true;
    }
    return false;
  }

  function renderVideoFallbackHtml(ytId, ytUrl) {
    return `
      <div class="study-container">
        <div class="yt-fallback-card">
          <a class="yt-thumb-box" href="${esc(ytUrl)}" target="_blank" rel="noopener noreferrer" aria-label="유튜브에서 영상 보기">
            <img src="https://i.ytimg.com/vi/${esc(ytId)}/hqdefault.jpg" alt="${esc(STUDY.title)} 유튜브 썸네일" loading="lazy" onerror="this.style.display='none'">
            <span class="yt-play-badge" aria-hidden="true">▶</span>
          </a>
          <div class="yt-card-foot">
            <div>
              <div class="st-card-tag">${esc(CUR_SESSION)} · FULL VIDEO</div>
              <div style="font-size:14.5px;font-weight:800;">${esc(STUDY.title)}</div>
            </div>
            <a class="yt-open-btn" href="${esc(ytUrl)}" target="_blank" rel="noopener noreferrer">유튜브에서 보기 ↗</a>
          </div>
        </div>
        <div class="src-notice">임베드 영상을 불러올 수 없는 환경에서는 링크 카드로 표시됩니다. 위 버튼을 누르면 유튜브에서 전체 영상을 볼 수 있어요.</div>
      </div>`;
  }

  /* ---------- Render Active Study Sheet Tab ---------- */
  function renderStudyTab() {
    if (!STUDY) {
      studyBody.innerHTML = '<div class="study-container"><div class="st-card"><p>학습 자료가 준비되지 않았습니다.</p></div></div>';
      return;
    }

    const tab = panelState.activeTab;
    studyTabs.forEach(t => {
      const sel = t.dataset.tab === tab;
      t.setAttribute('aria-selected', String(sel));
    });

    if (tab === 'video') {
      const ytId = STUDY.youtubeId;
      const ytUrl = STUDY.youtubeUrl || (ytId ? `https://youtu.be/${ytId}` : '');
      if (!ytId) {
        studyBody.innerHTML = '<div class="study-container"><div class="st-card"><p>이 세션의 영상 링크가 아직 등록되지 않았습니다.</p></div></div>';
        return;
      }
      const useCard = shouldUseVideoFallbackCard();
      if (useCard) {
        studyBody.innerHTML = renderVideoFallbackHtml(ytId, ytUrl);
      } else {
        studyBody.innerHTML = `
          <div class="study-container">
            <div class="yt-embed-wrap" id="yt-embed-wrap">
              <iframe
                id="yt-embed-iframe"
                src="https://www.youtube-nocookie.com/embed/${esc(ytId)}?rel=0"
                title="${esc(CUR_SESSION)} · ${esc(STUDY.title)}"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
                loading="lazy"
                referrerpolicy="strict-origin-when-cross-origin"></iframe>
            </div>
            <div class="st-card" style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:12px 16px;">
              <div>
                <div class="st-card-tag">${esc(CUR_SESSION)} · YOUTUBE (UNLISTED)</div>
                <div style="font-size:14px;font-weight:700;">${esc(STUDY.title)}</div>
              </div>
              <a class="yt-open-btn" href="${esc(ytUrl)}" target="_blank" rel="noopener noreferrer">유튜브에서 보기 ↗</a>
            </div>
          </div>`;
        const ifr = document.getElementById('yt-embed-iframe');
        if (ifr) {
          ifr.addEventListener('error', () => {
            studyBody.innerHTML = renderVideoFallbackHtml(ytId, ytUrl);
          });
        }
      }
      return;
    }

    if (tab === 'notes') {
      const parts = [];
      if (STUDY.goals && STUDY.goals.length) {
        parts.push(`
          <section class="st-card">
            <div class="st-card-tag">GOALS</div>
            <h3 class="st-card-h">오늘의 목표</h3>
            <div class="st-prose"><ul>${STUDY.goals.map(g => `<li>${renderInline(g)}</li>`).join('')}</ul></div>
          </section>`);
      }
      (STUDY.summaryCards || []).forEach((card, ci) => {
        parts.push(`
          <section class="st-card">
            <div class="st-card-tag">KEY NOTE · ${String(ci + 1).padStart(2, '0')}</div>
            <h3 class="st-card-h">${renderInline(card.heading)}</h3>
            <div class="st-prose">${renderBlocks(card.blocks)}</div>
          </section>`);
      });
      if (STUDY.tryIt && STUDY.tryIt.blocks && STUDY.tryIt.blocks.length) {
        parts.push(`
          <section class="st-card is-lab">
            <div class="st-card-tag">HANDS-ON</div>
            <h3 class="st-card-h">${esc(STUDY.tryIt.title || '직접 해 보기')}</h3>
            <div class="st-prose">${renderBlocks(STUDY.tryIt.blocks)}</div>
          </section>`);
      }
      if (STUDY.fdePerspective && STUDY.fdePerspective.length) {
        parts.push(`
          <section class="st-card is-fde">
            <div class="st-card-tag">FDE PERSPECTIVE</div>
            <h3 class="st-card-h">FDE 관점</h3>
            <div class="st-prose">${renderBlocks(STUDY.fdePerspective)}</div>
          </section>`);
      }
      if (STUDY.notePath) {
        parts.push(`
          <div style="display:flex;justify-content:flex-end;">
            <a class="toc-site-link" href="${esc(STUDY.notePath)}">웹 노트 페이지에서 보기 ↗</a>
          </div>`);
      }
      studyBody.innerHTML = `<div class="study-container">${parts.join('')}</div>`;
      return;
    }

    if (tab === 'quiz') {
      const qs = STUDY.quiz || [];
      if (!qs.length && STUDY.capstoneAnswer && STUDY.capstoneAnswer.length) {
        const shown = !!panelState.quizOpenShown.capstone;
        studyBody.innerHTML = `
          <div class="study-container">
            <section class="st-card">
              <div class="st-card-tag">CAPSTONE TASK</div>
              <h3 class="st-card-h">캡스톤 과제 · 파일럿 계획서 작성 예시</h3>
              <p style="font-size:14px;line-height:1.6;margin:0 0 12px;">노트 탭의 가상 고객 브리프와 템플릿으로 직접 계획서를 작성한 뒤, 아래 예시 답안과 항목별로 비교해 보세요.</p>
              <button type="button" class="quiz-toggle-btn" id="btn-cap-ans" aria-expanded="${shown}">
                ${shown ? '작성 예시 숨기기' : '작성 예시 보기'}
              </button>
              ${shown ? `<div class="st-prose" style="margin-top:14px;">${renderBlocks(STUDY.capstoneAnswer)}</div>` : ''}
            </section>
          </div>`;
        const b = document.getElementById('btn-cap-ans');
        if (b) {
          b.addEventListener('click', () => {
            panelState.quizOpenShown.capstone = !panelState.quizOpenShown.capstone;
            renderStudyTab();
          });
        }
        return;
      }
      const mcQs = qs.filter(q => q.type === 'mc');
      let correctCnt = 0;
      let answeredCnt = 0;
      mcQs.forEach(q => {
        const chosen = panelState.quizAnswers[q.num];
        if (chosen) {
          answeredCnt++;
          if (chosen === q.answerKey) correctCnt++;
        }
      });

      const scoreHtml = mcQs.length ? `
        <div class="quiz-score-bar">
          <span>객관식 채점: ${correctCnt} / ${mcQs.length} 정답${answeredCnt ? ` (${answeredCnt}문제 풀이)` : ''}</span>
          <button type="button" class="panel-icon-btn" id="btn-quiz-reset">다시 풀기</button>
        </div>` : '';

      const cardsHtml = qs.map(q => {
        if (q.type === 'mc') {
          const chosen = panelState.quizAnswers[q.num];
          const optsHtml = q.options.map(opt => {
            let cls = 'quiz-opt';
            if (chosen) {
              if (opt.key === q.answerKey) cls += ' is-correct';
              else if (opt.key === chosen) cls += ' is-wrong';
            }
            return `
              <button type="button" class="${cls}" data-q="${q.num}" data-opt="${opt.key}" aria-pressed="${chosen === opt.key}">
                <span class="quiz-opt-key">(${esc(opt.key)})</span>
                <span>${renderInline(opt.text)}</span>
              </button>`;
          }).join('');
          let fbHtml = '';
          if (chosen) {
            const ok = chosen === q.answerKey;
            fbHtml = `<div class="quiz-fb ${ok ? 'is-correct' : 'is-wrong'}">
              <strong>${ok ? '정답이에요!' : `아쉬워요. 정답은 (${esc(q.answerKey)})예요.`}</strong>
              ${q.explanation ? ` ${renderInline(q.explanation)}` : ''}
            </div>`;
          }
          return `
            <section class="st-card">
              <div class="quiz-q-hdr">
                <span class="quiz-q-num">Q${q.num}</span>
                <div class="quiz-q-text">${renderInline(q.prompt)}</div>
              </div>
              <div class="quiz-opts">${optsHtml}</div>
              ${fbHtml}
            </section>`;
        } else {
          const shown = !!panelState.quizOpenShown[q.num];
          return `
            <section class="st-card">
              <div class="quiz-q-hdr">
                <span class="quiz-q-num">Q${q.num}</span>
                <div class="quiz-q-text">${renderInline(q.prompt)}</div>
              </div>
              <button type="button" class="quiz-toggle-btn" data-open-q="${q.num}" aria-expanded="${shown}">
                ${shown ? '예시 답 숨기기' : '예시 답 보기'}
              </button>
              ${shown ? `<div class="quiz-fb">${renderInline(q.sampleAnswer || '해설이 준비되지 않았습니다.')}</div>` : ''}
            </section>`;
        }
      }).join('');

      studyBody.innerHTML = `<div class="study-container">${scoreHtml}${cardsHtml}</div>`;

      const resetBtn = document.getElementById('btn-quiz-reset');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          panelState.quizAnswers = {};
          panelState.quizOpenShown = {};
          renderStudyTab();
        });
      }
      studyBody.querySelectorAll('.quiz-opt').forEach(btn => {
        btn.addEventListener('click', () => {
          panelState.quizAnswers[btn.dataset.q] = btn.dataset.opt;
          renderStudyTab();
        });
      });
      studyBody.querySelectorAll('.quiz-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const k = btn.dataset.openQ;
          panelState.quizOpenShown[k] = !panelState.quizOpenShown[k];
          renderStudyTab();
        });
      });
      return;
    }

    if (tab === 'cards') {
      const cards = STUDY.flashcards || [];
      const allFlipped = cards.length > 0 && cards.every((_, i) => panelState.cardsFlipped[i]);
      const cardsHtml = cards.map((c, i) => {
        const flipped = !!panelState.cardsFlipped[i];
        return `
          <button type="button" class="fc-card${flipped ? ' is-flipped' : ''}" data-card="${i}" aria-pressed="${flipped}">
            <span class="fc-side-tag">${flipped ? `ANSWER · ${String(i + 1).padStart(2, '0')}` : `QUESTION · ${String(i + 1).padStart(2, '0')}`}</span>
            <span class="fc-text">${renderInline(flipped ? c.a : c.q)}</span>
            <span class="fc-hint">${flipped ? '눌러서 질문 보기' : '눌러서 답 확인하기'}</span>
          </button>`;
      }).join('');
      studyBody.innerHTML = `
        <div class="study-container">
          <div class="fc-toolbar">
            <span style="font-size:13px;font-weight:700;color:#4D4844;">복습 카드 ${cards.length}장 (카드를 눌러 뒤집으세요)</span>
            <button type="button" class="panel-icon-btn" id="btn-fc-flipall">${allFlipped ? '모두 앞면으로' : '모두 뒤집기'}</button>
          </div>
          <div class="fc-grid">${cardsHtml}</div>
        </div>`;
      const flipAll = document.getElementById('btn-fc-flipall');
      if (flipAll) {
        flipAll.addEventListener('click', () => {
          cards.forEach((_, i) => { panelState.cardsFlipped[i] = !allFlipped; });
          renderStudyTab();
        });
      }
      studyBody.querySelectorAll('.fc-card').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = Number(btn.dataset.card);
          panelState.cardsFlipped[i] = !panelState.cardsFlipped[i];
          renderStudyTab();
        });
      });
      return;
    }

    if (tab === 'sources') {
      const srcs = STUDY.sources || [];
      studyBody.innerHTML = `
        <div class="study-container">
          <section class="st-card">
            <div class="st-card-tag">REFERENCES</div>
            <h3 class="st-card-h">출처 및 참고 문서</h3>
            <ul class="src-list">${srcs.map(s => `<li>${renderInline(s)}</li>`).join('')}</ul>
          </section>
          <div class="src-notice">
            <strong>비공식 학습 자료 안내</strong><br>
            이 자료는 공식 강의의 필기가 아닙니다. 공식 파트너 학습 사이트(<a href="https://anthropic-partners.skilljar.com/path/claude-fde" target="_blank" rel="noopener noreferrer">Anthropic Claude FDE 학습 경로</a>)의 공개 개요와 공식 문서를 바탕으로 Study_FDE가 직접 구성한 학습 자료입니다. 공식 강의·퀴즈·수료증은 공식 사이트에서 진행합니다.
          </div>
        </div>`;
    }
  }

  /* ---------- Open / Close Controllers ---------- */
  function syncPanelClasses() {
    tocDrawer.classList.toggle('is-open', panelState.tocOpen);
    tocDrawer.setAttribute('aria-hidden', String(!panelState.tocOpen));
    backdrop.classList.toggle('is-open', panelState.tocOpen);

    studySheet.classList.toggle('is-open', panelState.studyOpen);
    studySheet.classList.toggle('is-full', panelState.studyOpen && panelState.studyFull);
    studySheet.setAttribute('aria-hidden', String(!panelState.studyOpen));

    if (btnToc) btnToc.setAttribute('aria-pressed', String(panelState.tocOpen));
    if (btnStudy) btnStudy.setAttribute('aria-pressed', String(panelState.studyOpen));
    if (btnSheetSize) {
      btnSheetSize.textContent = panelState.studyFull ? '반만 보기' : '전체 보기';
      btnSheetSize.setAttribute('aria-pressed', String(panelState.studyFull));
    }

    const anyOpen = panelState.tocOpen || panelState.studyOpen;
    document.body.classList.toggle('panel-open', anyOpen);
    if (window.__slidePlayer && typeof window.__slidePlayer.setPanelOpen === 'function') {
      window.__slidePlayer.setPanelOpen(anyOpen);
    }
  }

  function openToc() {
    panelState.tocOpen = true;
    renderTocScenes();
    renderTocCourses();
    syncPanelClasses();
    setTimeout(() => { try { btnTocClose.focus({ preventScroll: true }); } catch (_) {} }, 60);
  }

  function closeToc({ restoreFocus = true } = {}) {
    if (!panelState.tocOpen) return;
    panelState.tocOpen = false;
    syncPanelClasses();
    if (restoreFocus && btnToc) {
      try { btnToc.focus({ preventScroll: true }); } catch (_) {}
    }
  }

  function openStudy(tab = null) {
    if (tab) panelState.activeTab = tab;
    panelState.studyOpen = true;
    renderStudyTab();
    syncPanelClasses();
    setTimeout(() => { try { btnSheetClose.focus({ preventScroll: true }); } catch (_) {} }, 60);
  }

  function closeStudy({ restoreFocus = true } = {}) {
    if (!panelState.studyOpen) return;
    panelState.studyOpen = false;
    syncPanelClasses();
    if (restoreFocus && btnStudy) {
      try { btnStudy.focus({ preventScroll: true }); } catch (_) {}
    }
  }

  /* ---------- Event Bindings ---------- */
  if (btnToc) {
    btnToc.addEventListener('click', () => {
      if (panelState.tocOpen) closeToc();
      else openToc();
    });
  }
  if (btnTocClose) btnTocClose.addEventListener('click', () => closeToc());
  if (backdrop) backdrop.addEventListener('click', () => closeToc());

  if (btnStudy) {
    btnStudy.addEventListener('click', () => {
      if (panelState.studyOpen) closeStudy();
      else openStudy();
    });
  }
  if (btnSheetClose) btnSheetClose.addEventListener('click', () => closeStudy());
  if (btnSheetSize) {
    btnSheetSize.addEventListener('click', () => {
      panelState.studyFull = !panelState.studyFull;
      syncPanelClasses();
    });
  }

  studyTabs.forEach(t => {
    t.addEventListener('click', () => {
      panelState.activeTab = t.dataset.tab;
      renderStudyTab();
      studyBody.scrollTop = 0;
    });
  });

  window.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.code === 'Escape') {
      if (panelState.tocOpen) {
        e.preventDefault();
        closeToc();
      } else if (panelState.studyOpen) {
        e.preventDefault();
        closeStudy();
      }
    }
  });

  // Listen to slide player events to keep active scene & completion progress synced
  window.addEventListener('slideplayer:change', () => {
    if (panelState.tocOpen) syncActiveSceneInToc();
  });

  window.addEventListener('slideplayer:session-complete', () => {
    if (!completedSessions.has(CUR_SESSION)) {
      completedSessions.add(CUR_SESSION);
      saveCompleted(completedSessions);
      if (panelState.tocOpen) renderTocCourses();
    }
  });

  /* ---------- Initial Setup ---------- */
  renderTocScenes();
  renderTocCourses();
  syncPanelClasses();

  /* ---------- Introspection & Automated Test API ---------- */
  window.__studyPanels = {
    getState: () => ({
      tocOpen: panelState.tocOpen,
      studyOpen: panelState.studyOpen,
      studyFull: panelState.studyFull,
      activeTab: panelState.activeTab,
      completed: [...completedSessions],
    }),
    openToc,
    closeToc,
    openStudy,
    closeStudy,
    setTab: tab => {
      panelState.activeTab = tab;
      if (!panelState.studyOpen) panelState.studyOpen = true;
      renderStudyTab();
      syncPanelClasses();
    },
    toggleSize: () => {
      panelState.studyFull = !panelState.studyFull;
      syncPanelClasses();
    },
  };
})();
