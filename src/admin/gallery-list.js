(function () {
  const IMAGE_PATH =
    /^\/images\/uploads\/[^\s"']+\.(?:jpe?g|png|webp|gif|avif)$/i;

  function enhanceSummary(el) {
    if (el.dataset.galleryThumb) return;

    const text = (el.textContent || "").trim();
    if (!IMAGE_PATH.test(text)) return;

    el.dataset.galleryThumb = "1";
    el.classList.add("gallery-list-item");

    let row = el.parentElement;
    for (let i = 0; i < 5 && row; i++) {
      row.classList.add("gallery-list-row");
      row = row.parentElement;
    }

    const img = document.createElement("img");
    img.src = text;
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    img.className = "gallery-list-thumb";

    const label = document.createElement("span");
    label.className = "gallery-list-label";
    label.textContent = text.split("/").pop();

    el.textContent = "";
    el.append(img, label);
  }

  function enhanceAll() {
    document.querySelectorAll("span, p, div, button").forEach((el) => {
      if (el.children.length !== 0) return;
      enhanceSummary(el);
    });
  }

  function start() {
    enhanceAll();
    new MutationObserver(enhanceAll).observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
