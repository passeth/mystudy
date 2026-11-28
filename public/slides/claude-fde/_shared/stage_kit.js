/* v3 Stage Kit — human-md.ai 커스텀 이징 사전 + 단일 스테이지 마스터 타임라인 엔진
   모든 애니메이션은 window.__seek(t)의 순수 함수로 평가되어 30fps 결정적 렌더를 보장한다. */

const C = window.CUES;
const EP = window.EPISODE || {};
const FPS = 30;
const DUR = C.dur;
const NS = 'http://www.w3.org/2000/svg';
const $ = s => document.querySelector(s);
const SC = Object.fromEntries(C.scenes.map(s => [s.id, s]));

// 어절 시각 조회
const wt = (id, pre, n = 0) => {
  const s = SC[id];
  if (!s) throw new Error(`no scene ${id}`);
  const w = s.words.filter(w => w.r.startsWith(pre) || w.r.includes(pre));
  if (!w[n]) throw new Error(`no word ${id} "${pre}" #${n} in: ${s.words.map(x => x.r).join(' ')}`);
  return w[n].t;
};
const st = id => SC[id].start;
const en = id => SC[id].start + SC[id].dur;
const vo = id => SC[id].vo;
const ae = id => SC[id].vo + SC[id].adur;
const clamp01 = x => (x <= 0 ? 0 : x >= 1 ? 1 : x);
const lerp = (a, b, u) => a + (b - a) * u;

/* ---------- human-md.ai 커스텀 이징 사전 (원문 그대로) ---------- */
function cubicBezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sampleX = t => ((ax * t + bx) * t + cx) * t;
  const sampleY = t => ((ay * t + by) * t + cy) * t;
  const sampleDX = t => (3 * ax * t + 2 * bx) * t + cx;
  return x => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i++) {
      const dx = sampleDX(t);
      if (Math.abs(dx) < 1e-6) break;
      t -= (sampleX(t) - x) / dx;
      t = Math.max(0, Math.min(1, t));
    }
    return sampleY(t);
  };
}

function makeSpring(zeta, omega) {
  // 감쇠 조화 진동자: f(0)=0, f(1)=1 정규화
  const wd = omega * Math.sqrt(Math.max(0.01, 1 - zeta * zeta));
  const raw = t => 1 - Math.exp(-zeta * omega * t) * (Math.cos(wd * t) + (zeta * omega / wd) * Math.sin(wd * t));
  const end = raw(1);
  return t => (t <= 0 ? 0 : t >= 1 ? 1 : raw(t) / end);
}

const EASE = {
  linear: t => clamp01(t),
  power2In: t => { t = clamp01(t); return t * t; },
  power2Out: t => { t = clamp01(t); return 1 - (1 - t) * (1 - t); },
  power2InOut: t => { t = clamp01(t); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },
  sineInOut: t => -(Math.cos(Math.PI * clamp01(t)) - 1) / 2,
  // 사이트 커스텀 곡선
  camera: cubicBezier(0.62, 0, 0.22, 1),
  dive: cubicBezier(0.7, 0, 0.84, 0.28),
  surface: cubicBezier(0.08, 0.7, 0.18, 1),
  reveal: cubicBezier(0.18, 0.82, 0.24, 1),
  exit: cubicBezier(0.3, -0.16, 0.62, 0),
  // dolly: 74%에서 1.03까지 갔다가 1.0으로 숨 쉬며 복귀
  dolly: t => {
    t = clamp01(t);
    if (t <= 0.74) return 1.03 * EASE.camera(t / 0.74);
    const u = (t - 0.74) / 0.26;
    return 1.03 - 0.03 * EASE.sineInOut(u);
  },
  // rise: 60%에서 1.04까지 솟아오른 뒤 감쇠
  rise: t => {
    t = clamp01(t);
    if (t <= 0.60) return 1.04 * EASE.surface(t / 0.60);
    const u = (t - 0.60) / 0.40;
    return 1.04 - 0.04 * EASE.sineInOut(u);
  },
  // 스프링 6종
  spring: makeSpring(0.62, 11),
  springOut: makeSpring(0.50, 12),
  bouncy: makeSpring(0.34, 14),
  snappy: makeSpring(0.78, 16),
  wobble: makeSpring(0.18, 20),
  settle: makeSpring(0.90, 9),
  steps6: t => Math.floor(clamp01(t) * 6) / 6,
};

const prog = (t, a, b, easeName = 'linear') => {
  if (b <= a) return t >= b ? 1 : 0;
  const u = clamp01((t - a) / (b - a));
  const fn = typeof easeName === 'function' ? easeName : (EASE[easeName] || EASE.linear);
  return fn(u);
};

/* ---------- 단일 결정적 렌더러 큐 + 오디오 이벤트 기록 ---------- */
const updaters = [];
const events = [];
const onFrame = fn => updaters.push(fn);
const mark = (t, type, label = '') => events.push({ t: Number(t.toFixed(3)), frame: Math.round(t * FPS), type, label });
const markTick = (t, label = 'tick') => mark(t, 'tick', label);
const markPop = (t, label = 'pop') => mark(t, 'pop', label);
const markCut = (t, label = 'cut') => mark(t, 'cut', label);

/* ---------- DOM 헬퍼 ---------- */
let uid = 0;
const mk = (parent, cls = '', html = '', style = '') => {
  const e = document.createElement('div');
  e.id = 'v' + (uid++);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  if (style) e.style.cssText = style;
  (typeof parent === 'string' ? $(parent) : parent).appendChild(e);
  return e;
};
const mkImg = (parent, src, cls = 'cutout', style = '') => {
  const img = document.createElement('img');
  img.id = 'v' + (uid++);
  img.className = cls;
  img.src = src;
  if (style) img.style.cssText = style;
  (typeof parent === 'string' ? $(parent) : parent).appendChild(img);
  return img;
};
const svgIn = (parent, w = 1920, h = 1080) => {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('width', w);
  s.setAttribute('height', h);
  s.style.cssText = 'position:absolute;left:0;top:0;overflow:visible;pointer-events:none;';
  (typeof parent === 'string' ? $(parent) : parent).appendChild(s);
  return s;
};
const svgPath = (svg, d, stroke = '#FC4109', width = 6) => {
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('d', d);
  p.setAttribute('fill', 'none');
  p.setAttribute('stroke', stroke);
  p.setAttribute('stroke-width', width);
  p.setAttribute('stroke-linecap', 'round');
  p.setAttribute('stroke-linejoin', 'round');
  p.setAttribute('pathLength', '1');
  p.setAttribute('stroke-dasharray', '1');
  p.setAttribute('stroke-dashoffset', '1');
  svg.appendChild(p);
  return p;
};

/* ---------- 무대 룸 빌더 (단색 벽 + 좌상단 빛 + 바닥 띠 70~80%) ---------- */
const makeRoom = (wallColor, floorColor, floorHeightPct = 24, z = 10) => {
  const r = mk('#stage', 'room', '', `background:${wallColor};z-index:${z};visibility:hidden;`);
  mk(r, 'wall-light');
  let fl = null;
  if (floorColor) {
    fl = mk(r, 'floor', '', `height:calc(${floorHeightPct}% + 40px);background:${floorColor};`);
  }
  r.floor = fl;
  return r;
};

// 접지 그림자 + 컷아웃 오브젝트 묶음 (window.ART_BASE / window.ART_EXT 지정 시 정적 슬라이드 경로로 해석)
const artUrl = artFile => {
  const f = window.ART_EXT ? artFile.replace(/\.png$/i, window.ART_EXT) : artFile;
  if (window.SHARED_ART_BASE && artFile === 'v3_host.png') return `${window.SHARED_ART_BASE}${f}`;
  return (window.ART_BASE !== undefined ? window.ART_BASE : '../art/') + f;
};
const makeProp = (parent, artFile, x, y, w, h, shadowW = null) => {
  const wrap = mk(parent, '', '', `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;transform-origin:50% 92%;`);
  const sw = shadowW || Math.round(w * 0.72);
  const sh = mk(wrap, 'gshadow', '', `left:${Math.round((w - sw) / 2)}px;bottom:-10px;width:${sw}px;height:28px;`);
  const img = mkImg(wrap, artUrl(artFile), 'cutout', `left:0;top:0;width:${w}px;height:${h}px;`);
  wrap.img = img;
  wrap.shadow = sh;
  return wrap;
};

/* ---------- 애니메이션 유틸 (순수 함수) ---------- */
// 스프링 팝업 (아래에서 튀어 올라 착지)
const animPop = (el, t0, dur = 0.65, dy = 80, easeName = 'bouncy', s0 = 0.72) => {
  onFrame(t => {
    if (t < t0) {
      el.style.opacity = '0';
      el.style.transform = `translate3d(0,${dy}px,0) scale(${s0})`;
      return;
    }
    const u = prog(t, t0, t0 + dur, easeName);
    const op = clamp01((t - t0) / 0.14);
    el.style.opacity = op.toFixed(3);
    el.style.transform = `translate3d(0,${lerp(dy, 0, u).toFixed(1)}px,0) scale(${lerp(s0, 1, u).toFixed(4)})`;
  });
};

// 중력 낙하 + 스쿼시 착지
const animDrop = (el, t0, dur = 0.7, dy = -220, easeName = 'bouncy') => {
  onFrame(t => {
    if (t < t0) {
      el.style.opacity = '0';
      el.style.transform = `translate3d(0,${dy}px,0)`;
      return;
    }
    const u = prog(t, t0, t0 + dur, easeName);
    el.style.opacity = clamp01((t - t0) / 0.12).toFixed(3);
    el.style.transform = `translate3d(0,${lerp(dy, 0, u).toFixed(1)}px,0)`;
  });
};

// 부드러운 등장 (reveal / surface)
const animReveal = (el, t0, dur = 0.5, dx = 0, dy = 26, easeName = 'reveal') => {
  onFrame(t => {
    if (t < t0) {
      el.style.opacity = '0';
      el.style.transform = `translate3d(${dx}px,${dy}px,0)`;
      return;
    }
    const u = prog(t, t0, t0 + dur, easeName);
    el.style.opacity = clamp01((t - t0) / Math.min(0.22, dur)).toFixed(3);
    el.style.transform = `translate3d(${lerp(dx, 0, u).toFixed(1)}px,${lerp(dy, 0, u).toFixed(1)}px,0)`;
  });
};

// SVG 선 그리기
const animDraw = (p, t0, dur = 0.55, easeName = 'camera') => {
  onFrame(t => {
    const u = prog(t, t0, t0 + dur, easeName);
    p.setAttribute('stroke-dashoffset', (1 - u).toFixed(4));
  });
};

// 타이핑 텍스트 (글자 단위)
const animType = (el, fullText, t0, dur = 1.2, prefixHtml = '', withCaret = false) => {
  const chars = Array.from(fullText);
  onFrame(t => {
    if (t < t0) { el.style.opacity = '0'; el.innerHTML = ''; return; }
    el.style.opacity = '1';
    const n = Math.round(clamp01((t - t0) / dur) * chars.length);
    const caret = withCaret && (Math.floor((t * 1000) / 525) % 2 === 0) ? '<span class="caret"></span>' : (withCaret ? '<span class="caret" style="opacity:0"></span>' : '');
    el.innerHTML = prefixHtml + chars.slice(0, n).join('') + caret;
  });
};

// 룸 가시성 + 아이리스 포털(clip-path circle) 제어
// open = {t0, dur, cx, cy} (선택), close = {t0, dur, cx, cy} (선택)
const controlRoom = (room, tStart, tEnd, opts = {}) => {
  onFrame(t => {
    if (t < tStart - 0.001 || t >= tEnd) {
      room.style.visibility = 'hidden';
      return;
    }
    room.style.visibility = 'visible';
    let clip = 'none';
    if (opts.irisIn && t < opts.irisIn.t0 + opts.irisIn.dur) {
      const u = prog(t, opts.irisIn.t0, opts.irisIn.t0 + opts.irisIn.dur, 'power2In');
      const r = lerp(0, 2350, u);
      clip = `circle(${r.toFixed(1)}px at ${opts.irisIn.cx}px ${opts.irisIn.cy}px)`;
    } else if (opts.irisOut && t >= opts.irisOut.t0) {
      const u = prog(t, opts.irisOut.t0, opts.irisOut.t0 + opts.irisOut.dur, 'power2Out');
      const r = lerp(2350, 0, u);
      clip = `circle(${r.toFixed(1)}px at ${opts.irisOut.cx}px ${opts.irisOut.cy}px)`;
    }
    room.style.clipPath = clip;
  });
};

/* ---------- 6단 계단 필름 그레인 (0.9초 / 6단계) ---------- */
{
  const grain = $('#grain');
  const G = [[0, 0], [-6, 4], [5, -7], [-8, -2], [6, 6], [2, -4]];
  onFrame(t => {
    const k = Math.floor(Math.round(t * FPS) / 4.5) % 6;
    grain.style.transform = `translate3d(${G[k][0] * 3}px, ${G[k][1] * 3}px, 0)`;
  });
}

/* ---------- 자막 렌더러 (어절별 부드러운 상승, cues.json 완전 동기화) ---------- */
{
  const capsWrap = $('#caps');
  const all = [];
  C.scenes.forEach(s => s.caps.forEach(c => all.push(c)));
  const els = all.map((c, i) => {
    const d = mk(capsWrap, 'cap', '', 'visibility:hidden;');
    const words = c.text.split(' ');
    d.innerHTML = words.map(w => `<span style="display:inline-block;margin:0 4px;">${w}</span>`).join('');
    const spans = [...d.querySelectorAll('span')];
    const startT = c.t0 - 0.08;
    const endT = i + 1 < all.length ? Math.min(all[i + 1].t0 - 0.08, c.t1 + 0.7) : c.t1 + 0.7;
    return { d, spans, wTimes: c.w, startT, endT };
  });
  onFrame(t => {
    for (const item of els) {
      if (t < item.startT || t >= item.endT) {
        item.d.style.visibility = 'hidden';
        continue;
      }
      item.d.style.visibility = 'visible';
      item.spans.forEach((sp, k) => {
        const wt0 = (item.wTimes && item.wTimes[k] !== undefined) ? item.wTimes[k] - 0.08 : item.startT + k * 0.1;
        const u = prog(t, wt0, wt0 + 0.22, 'reveal');
        sp.style.opacity = u.toFixed(3);
        sp.style.transform = `translate3d(0,${lerp(12, 0, u).toFixed(1)}px,0)`;
      });
    }
  });
}

/* ---------- 결정적 시크 계약 (render_sw.mjs 연동) ---------- */
window.__duration = DUR;
window.__seek = t => {
  const tt = Math.max(0, Math.min(DUR, Number(t) || 0));
  for (let i = 0; i < updaters.length; i++) updaters[i](tt);
};
window.__events = () => events;
