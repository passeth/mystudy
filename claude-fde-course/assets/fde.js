/* Claude FDE 스터디 — 강의실 동작: 진도(localStorage), 객관식 즉시 채점, 복습 카드 뒤집기, 뽑기 무대 */
(function () {
  // ---- 진도: 이 브라우저의 localStorage에만 저장
  var KEY = "mystudy.claude-fde.done";
  function load() {
    try {
      var v = JSON.parse(window.localStorage.getItem(KEY) || "[]");
      return Array.isArray(v) ? v : [];
    } catch (e) { return []; }
  }
  function save(list) {
    try { window.localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* 저장 불가 — 화면만 갱신 */ }
  }
  var done = load();

  function paint() {
    document.querySelectorAll("[data-done]").forEach(function (box) {
      box.checked = done.indexOf(box.getAttribute("data-done")) >= 0;
    });
    document.querySelectorAll("[data-done-mark]").forEach(function (el) {
      el.classList.toggle("is-done", done.indexOf(el.getAttribute("data-done-mark")) >= 0);
    });
    var sessions = window.FDE_SESSIONS || [];
    if (!sessions.length) return;
    var count = sessions.filter(function (s) { return done.indexOf(s.id) >= 0; }).length;
    var countEl = document.querySelector("[data-progress-count]");
    if (countEl) countEl.textContent = String(count);
    var bar = document.querySelector("[data-progress-bar]");
    if (bar) bar.style.width = Math.round((count / sessions.length) * 100) + "%";
    var nextEl = document.querySelector("[data-progress-next]");
    if (nextEl) {
      var next = sessions.filter(function (s) { return done.indexOf(s.id) < 0; })[0];
      nextEl.textContent = "";
      if (count > 0 && next) {
        var a = document.createElement("a");
        a.href = next.href;
        a.target = "_top";
        a.textContent = "이어서: " + next.id + " · " + next.title + " →";
        nextEl.appendChild(a);
      } else if (count > 0) {
        nextEl.textContent = "모든 세션을 마쳤어요.";
      }
    }
  }
  document.addEventListener("change", function (e) {
    var box = e.target;
    if (!box || !box.hasAttribute || !box.hasAttribute("data-done")) return;
    var id = box.getAttribute("data-done");
    done = done.filter(function (x) { return x !== id; });
    if (box.checked) done.push(id);
    save(done);
    paint();
  });
  paint();

  // ---- 객관식: 고르면 바로 채점
  document.querySelectorAll(".q[data-answer]").forEach(function (q) {
    var ans = +q.getAttribute("data-answer");
    var opts = q.querySelectorAll(".opt");
    opts.forEach(function (o, i) {
      o.addEventListener("click", function () {
        if (q.classList.contains("done")) return;
        if (opts[ans]) opts[ans].classList.add("right");
        if (i !== ans) o.classList.add("wrong");
        q.classList.add("done");
        opts.forEach(function (b) { b.setAttribute("aria-disabled", "true"); });
      });
    });
  });

  // ---- 복습 카드 뒤집기
  document.querySelectorAll(".card").forEach(function (c) {
    c.addEventListener("click", function () {
      var on = c.classList.toggle("on");
      c.setAttribute("aria-pressed", on ? "true" : "false");
    });
  });

  // ---- 뽑기 무대 (config의 lab이 있는 세션만)
  var dataEl = document.getElementById("fde-data");
  var lab = null;
  try { lab = dataEl ? JSON.parse(dataEl.textContent).lab : null; } catch (e) { lab = null; }
  var root = document.querySelector("[data-lab]");
  if (lab && root && Array.isArray(lab.dist)) {
    var barsEl = root.querySelector("[data-lab-bars]");
    var nextEl = root.querySelector("[data-lab-next]");
    var tallyEl = root.querySelector("[data-lab-tally]");
    var counts = lab.dist.map(function () { return 0; });
    var max = Math.max.apply(null, lab.dist.map(function (d) { return d[1]; }));
    lab.dist.forEach(function (d) {
      var row = document.createElement("div");
      row.className = "bar";
      var b = document.createElement("b"); b.textContent = d[0];
      var t = document.createElement("span"); t.className = "t";
      var f = document.createElement("span"); f.className = "f"; f.style.width = Math.round((d[1] / max) * 92) + "%";
      t.appendChild(f);
      var p = document.createElement("span"); p.className = "p"; p.textContent = d[1] + "%";
      row.append(b, t, p);
      barsEl.appendChild(row);
    });
    var n = 0;
    var total = lab.dist.reduce(function (a, d) { return a + d[1]; }, 0);
    root.querySelector("[data-lab-draw]").addEventListener("click", function () {
      var r = Math.random() * total, k = 0;
      for (; k < lab.dist.length - 1; k++) { if ((r -= lab.dist[k][1]) < 0) break; }
      counts[k]++; n++;
      barsEl.querySelectorAll(".bar").forEach(function (b, i) { b.classList.toggle("hit", i === k); });
      nextEl.textContent = k === lab.dist.length - 1 && /그 밖|기타/.test(lab.dist[k][0]) ? "……" : lab.dist[k][0];
      nextEl.classList.remove("pop"); void nextEl.offsetWidth; nextEl.classList.add("pop");
      tallyEl.textContent = n + "번 뽑음 · " + lab.dist.map(function (d, i) { return d[0] + " " + counts[i]; }).join(" · ");
    });
  }
})();
