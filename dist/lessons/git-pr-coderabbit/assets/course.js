(function () {
  function markAnswer(button) {
    var card = button.closest(".quiz-card");
    if (!card) return;
    var buttons = Array.prototype.slice.call(card.querySelectorAll("button[data-answer]"));
    var feedback = card.querySelector(".quiz-feedback");
    buttons.forEach(function (item) {
      item.classList.remove("correct", "incorrect");
    });

    var isCorrect = button.getAttribute("data-answer") === "true";
    button.classList.add(isCorrect ? "correct" : "incorrect");
    if (feedback) {
      feedback.textContent = isCorrect
        ? "맞습니다. 이 판단을 실제 PR 화면에서 다시 확인해 보세요."
        : "아직 아닙니다. 위의 흐름표를 보고 어떤 단계인지 다시 고르세요.";
    }
  }

  document.addEventListener("click", function (event) {
    var target = event.target;
    if (target && target.matches("button[data-answer]")) {
      markAnswer(target);
    }
  });
})();
