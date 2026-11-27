/* Claude FDE 스터디 — 진행 상태(완료 체크). 이 브라우저의 localStorage에만 저장돼요. */
(function () {
  var KEY = "mystudy.claude-fde.done";

  function load() {
    try {
      var v = JSON.parse(window.localStorage.getItem(KEY) || "[]");
      return Array.isArray(v) ? v : [];
    } catch (e) {
      return [];
    }
  }
  function save(list) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(list));
    } catch (e) {
      /* 저장 불가(사생활 보호 모드 등) — 화면만 갱신 */
    }
  }

  var done = load();

  function paint() {
    document.querySelectorAll("[data-done]").forEach(function (box) {
      box.checked = done.indexOf(box.getAttribute("data-done")) >= 0;
    });
    document.querySelectorAll("[data-done-mark]").forEach(function (el) {
      var on = done.indexOf(el.getAttribute("data-done-mark")) >= 0;
      el.classList.toggle("is-done", on);
      el.setAttribute("aria-label", on ? "완료" : "아직");
    });
    var sessions = window.FDE_SESSIONS || [];
    var count = sessions.filter(function (s) { return done.indexOf(s.id) >= 0; }).length;
    var countEl = document.querySelector("[data-progress-count]");
    if (countEl) countEl.textContent = String(count);
    var bar = document.querySelector("[data-progress-bar]");
    if (bar && sessions.length) bar.style.width = Math.round((count / sessions.length) * 100) + "%";
    var nextEl = document.querySelector("[data-progress-next]");
    if (nextEl) {
      var next = sessions.filter(function (s) { return done.indexOf(s.id) < 0; })[0];
      nextEl.innerHTML = "";
      if (count > 0 && next) {
        var a = document.createElement("a");
        a.href = next.href;
        a.target = "_top";
        a.textContent = "이어서: " + next.id + " · " + next.title + " →";
        nextEl.appendChild(a);
      } else if (count > 0 && !next) {
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
})();
