import { useState, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { Stepper, useAutoPlay } from "pasito";
import pasitoCss from "pasito/styles.css";

const ELASTIC = "cubic-bezier(0.34, 1.56, 0.64, 1)";

function injectPasitoStyles() {
  if (document.getElementById("pasito-styles")) return;
  const el = document.createElement("style");
  el.id = "pasito-styles";
  el.textContent = pasitoCss;
  document.head.appendChild(el);
}

function IconClose() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconChevron({ direction }) {
  const path = direction === "prev" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6";
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5v14l11-7z" fill="currentColor" />
    </svg>
  );
}

function IconPause() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 5h4v14H6zm8 0h4v14h-4z" fill="currentColor" />
    </svg>
  );
}

function GalleryOverlay({ images, startIndex, onClose }) {
  const [active, setActive] = useState(startIndex);

  const { playing, toggle, filling, fillDuration } = useAutoPlay({
    count: images.length,
    active,
    onStepChange: setActive,
    stepDuration: 5000,
    loop: true,
  });

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const goPrev = useCallback(
    () => setActive((i) => (i - 1 + images.length) % images.length),
    [images.length],
  );
  const goNext = useCallback(
    () => setActive((i) => (i + 1) % images.length),
    [images.length],
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, goPrev, goNext]);

  return (
    <div
      className="c-gallery-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Galéria"
    >
      <button
        type="button"
        className="c-gallery-overlay__backdrop"
        aria-label="Bezárás"
        onClick={onClose}
      />
      <button
        type="button"
        className="c-gallery-overlay__close"
        onClick={onClose}
        aria-label="Bezárás"
      >
        <IconClose />
      </button>

      <div className="c-gallery-overlay__stage">
        <button
          type="button"
          className="c-gallery-overlay__nav c-gallery-overlay__nav--prev"
          onClick={goPrev}
          aria-label="Előző kép"
        >
          <IconChevron direction="prev" />
        </button>

        <figure className="c-gallery-overlay__figure">
          <img
            key={images[active].src}
            src={images[active].src}
            alt={images[active].alt ?? ""}
            className="c-gallery-overlay__image"
            style={{ animationTimingFunction: ELASTIC }}
          />
        </figure>

        <button
          type="button"
          className="c-gallery-overlay__nav c-gallery-overlay__nav--next"
          onClick={goNext}
          aria-label="Következő kép"
        >
          <IconChevron direction="next" />
        </button>
      </div>

      <div className="c-gallery-overlay__footer">
        <button
          type="button"
          className="c-gallery-overlay__play"
          onClick={toggle}
          aria-label={playing ? "Diavetítés szüneteltetése" : "Diavetítés indítása"}
          aria-pressed={playing}
        >
          {playing ? <IconPause /> : <IconPlay />}
        </button>
        <Stepper
          count={images.length}
          active={active}
          onStepClick={setActive}
          filling={filling}
          fillDuration={fillDuration}
          className="c-gallery-overlay__stepper"
        />
      </div>
    </div>
  );
}

function openGallery(images, startIndex) {
  injectPasitoStyles();
  const mount = document.createElement("div");
  mount.className = "c-gallery-overlay-root";
  document.body.appendChild(mount);

  const root = createRoot(mount);
  const close = () => {
    root.unmount();
    mount.remove();
  };

  root.render(
    <GalleryOverlay images={images} startIndex={startIndex} onClose={close} />,
  );
}

function initGalleries() {
  document.querySelectorAll("[data-gallery]").forEach((el) => {
    if (el.dataset.galleryBound) return;
    el.dataset.galleryBound = "true";

    let images;
    try {
      images = JSON.parse(el.dataset.galleryImages);
    } catch {
      return;
    }

    el.querySelectorAll(".c-gallery__thumb").forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = Number(btn.dataset.index) || 0;
        openGallery(images, index);
      });
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGalleries);
} else {
  initGalleries();
}
