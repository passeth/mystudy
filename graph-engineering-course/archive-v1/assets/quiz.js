document.querySelectorAll("[data-quiz]").forEach((quiz) => {
  const feedback = quiz.querySelector("[data-feedback]");
  quiz.querySelectorAll("button[data-answer]").forEach((button) => {
    button.addEventListener("click", () => {
      const isCorrect = button.dataset.answer === "correct";
      quiz.querySelectorAll("button[data-answer]").forEach((b) => {
        b.classList.remove("correct", "incorrect");
        b.setAttribute("aria-pressed", "false");
      });
      button.classList.add(isCorrect ? "correct" : "incorrect");
      button.setAttribute("aria-pressed", "true");
      feedback.textContent = isCorrect ? quiz.dataset.correct : quiz.dataset.incorrect;
    });
  });
});
