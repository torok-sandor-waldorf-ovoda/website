import { useState, useEffect, useCallback, useRef } from "react";
import { createRoot } from "react-dom/client";
import { Stepper, useAutoPlay } from "pasito";
import pasitoCss from "pasito/styles.css";

function readActiveIndex(viewport, count) {
  const slides = viewport.querySelectorAll(".c-gallery-overlay__slide");
  if (!slides.length) return 0;

  const center = viewport.scrollLeft + viewport.clientWidth / 2;
  let best = 0;
  let bestDist = Infinity;

  slides.forEach((slide, i) => {
    const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
    const dist = Math.abs(slideCenter - center);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  });

  return Math.min(count - 1, best);
}

function scrollLeftForSlide(viewport, slide) {
  const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
  return slideCenter - viewport.clientWidth / 2;
}

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
  const path = direction === "prev" ? "M14.5 18L8.5 12L14.5 6" : "M9.5 18L15.5 12L9.5 6";
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d={path} stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path></svg>
  );
}

function IconPlay() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M11.1967 2.71828C8.53683 0.970354 5 2.8783 5 6.0611V17.9387C5 21.1215 8.53684 23.0294 11.1967 21.2815L20.234 15.3427C22.6384 13.7627 22.6384 10.2371 20.234 8.65706L11.1967 2.71828Z" fill="white"></path></svg>
  );
}

function IconPause() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 6C4 4.34315 5.34315 3 7 3C8.65685 3 10 4.34315 10 6V18C10 19.6569 8.65685 21 7 21C5.34315 21 4 19.6569 4 18V6Z" fill="white"></path><path d="M14 6C14 4.34315 15.3431 3 17 3C18.6569 3 20 4.34315 20 6V18C20 19.6569 18.6569 21 17 21C15.3431 21 14 19.6569 14 18V6Z" fill="white"></path></svg>
  );
}

function GalleryOverlay({ images, startIndex, onClose }) {
  const viewportRef = useRef(null);
  const activeChangeSource = useRef("init");
  const isFirstScroll = useRef(true);
  const pendingControlScroll = useRef(false);
  const reduceMotion = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [active, setActive] = useState(startIndex);

  const setActiveFromControl = useCallback((next) => {
    activeChangeSource.current = "control";
    setActive(next);
  }, []);

  const { playing, toggle, filling, fillDuration } = useAutoPlay({
    count: images.length,
    active,
    onStepChange: setActiveFromControl,
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

  const goPrev = useCallback(() => {
    setActiveFromControl(
      (i) => (i - 1 + images.length) % images.length,
    );
  }, [images.length, setActiveFromControl]);
  const goNext = useCallback(() => {
    setActiveFromControl((i) => (i + 1) % images.length);
  }, [images.length, setActiveFromControl]);

  const scrollToIndex = useCallback((index, smooth) => {
    const viewport = viewportRef.current;
    const slide = viewport?.querySelector(`[data-index="${index}"]`);
    if (!viewport || !slide) return;

    pendingControlScroll.current = true;
    viewport.scrollTo({
      left: scrollLeftForSlide(viewport, slide),
      behavior:
        smooth && !reduceMotion.current ? "smooth" : "instant",
    });
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const syncActiveFromScroll = () => {
      if (pendingControlScroll.current) {
        pendingControlScroll.current = false;
        return;
      }

      const index = readActiveIndex(viewport, images.length);
      setActive((current) => {
        if (current === index) return current;
        activeChangeSource.current = "user";
        return index;
      });
    };

    let scrollEndTimer;
    const onScroll = () => {
      window.clearTimeout(scrollEndTimer);
      scrollEndTimer = window.setTimeout(syncActiveFromScroll, 100);
    };

    viewport.addEventListener("scrollend", syncActiveFromScroll);
    viewport.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      viewport.removeEventListener("scrollend", syncActiveFromScroll);
      viewport.removeEventListener("scroll", onScroll);
      window.clearTimeout(scrollEndTimer);
    };
  }, [images.length]);

  useEffect(() => {
    const source = activeChangeSource.current;
    activeChangeSource.current = null;

    if (source === "user") return;

    const smooth = source === "control" && !isFirstScroll.current;
    if (isFirstScroll.current) isFirstScroll.current = false;
    scrollToIndex(active, smooth);
  }, [active, scrollToIndex]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, goPrev, goNext]);

  const caption = images[active]?.alt ?? "";

  return (
    <div
      className="c-gallery-overlay"
      role="dialog"
      data-playing={playing}
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

      <div className="c-gallery-overlay__main">
        <div
          ref={viewportRef}
          className="c-gallery-overlay__viewport"
          aria-label="Képek"
        >
          
          {images.map((img, i) => (
            <figure
              key={img.src}
              className={`c-gallery-overlay__slide${i === active ? " is-active" : ""}`}
              data-index={i}
              aria-hidden={i !== active}
            >
              
                <img
                  src={img.src}
                  alt={img.alt ?? ""}
                  loading={i === active ? "eager" : "lazy"}
                  decoding="async"
                  draggable={false}
                />
            </figure>
          ))}
        </div>
      

        {caption ? (
          <p key={active} className="c-gallery-overlay__caption" aria-live="polite">
            {caption}
          </p>
        ) : null}
      </div>

      <div className="c-gallery-overlay__footer">
        <div className="c-gallery-overlay__controls">
          <button
            type="button"
            className="c-gallery-overlay__btn c-gallery-overlay__btn--play"
            onClick={toggle}
            aria-label={
              playing ? "Diavetítés szüneteltetése" : "Diavetítés indítása"
            }
            aria-pressed={playing}
          >
            {playing ? <IconPause /> : <IconPlay />}
          </button>
          <button
            type="button"
            className="c-gallery-overlay__btn"
            onClick={goPrev}
            aria-label="Előző kép"
          >
            <IconChevron direction="prev" />
          </button>
          <Stepper
            count={images.length}
            active={active}
            onStepClick={setActiveFromControl}
            filling={filling}
            fillDuration={fillDuration}
            className="c-gallery-overlay__stepper"
          />
          <button
            type="button"
            className="c-gallery-overlay__btn"
            onClick={goNext}
            aria-label="Következő kép"
          >
            <IconChevron direction="next" />
          </button>
        </div>
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

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const hoverRotateRange = 14;

    el.querySelectorAll(".c-gallery__thumb").forEach((btn) => {
      const pickHoverRotate = () => {
        if (reduceMotion) {
          btn.style.removeProperty("--hover-rotate");
          return;
        }
        const deg = (Math.random() * 2 - 1) * hoverRotateRange;
        btn.style.setProperty("--hover-rotate", `${deg.toFixed(1)}deg`);
      };

      const clearHoverRotate = () => btn.style.removeProperty("--hover-rotate");

      btn.addEventListener("mouseenter", pickHoverRotate);
      btn.addEventListener("mouseleave", clearHoverRotate);
      btn.addEventListener("focus", pickHoverRotate);
      btn.addEventListener("blur", clearHoverRotate);

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
