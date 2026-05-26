/**
 * Expands Intro.More panels when the built-in toggle is clicked.
 */
function initIntroExpand() {
  document.querySelectorAll("[data-intro]").forEach((root) => {
    const toggle = root.querySelector("[data-intro-toggle]");
    const panel = root.querySelector("[data-intro-more]");
    if (!toggle || !panel) return;

    toggle.addEventListener("click", () => {
      const expanded = root.classList.toggle("is-expanded");
      toggle.setAttribute("aria-expanded", String(expanded));
      panel.setAttribute("aria-hidden", String(!expanded));
      toggle.hidden = expanded;
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initIntroExpand);
} else {
  initIntroExpand();
}
