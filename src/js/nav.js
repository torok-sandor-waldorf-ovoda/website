/**
 * Scroll-spy for the sticky section nav: marks the link for the section
 * in view and scrolls the nav bar so that link stays visible.
 */
function initNavScrollSpy() {
  const nav = document.querySelector(".c-nav");
  if (!nav) return;

  const links = [...nav.querySelectorAll('.c-nav__link[href^="#"]')];
  if (!links.length) return;

  const entries = [];
  for (const link of links) {
    const id = link.getAttribute("href").slice(1);
    const section = document.getElementById(id);
    if (!section) continue;
    entries.push({ id, link, section });
  }
  if (!entries.length) return;

  const offset =
    parseFloat(getComputedStyle(entries[0].section).scrollMarginTop) || 112;

  const indicator = nav.querySelector(".c-nav__indicator");
  if (!indicator) return;

  let activeId = null;
  let activeLink = null;
  let ticking = false;
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  function moveIndicator(link) {
    const navRect = nav.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    indicator.style.width = `${linkRect.width}px`;
    indicator.style.transform = `translateX(${linkRect.left - navRect.left}px)`;
  }

  function setActive(id) {
    const changed = id !== activeId;
    activeId = id;

    for (const { id: sectionId, link } of entries) {
      const isActive = sectionId === id;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        activeLink = link;
        link.setAttribute("aria-current", "location");
        if (changed) {
          link.scrollIntoView({
            inline: "center",
            block: "nearest",
            behavior: reduceMotion ? "auto" : "smooth",
          });
        }
      } else {
        link.removeAttribute("aria-current");
      }
    }

    if (activeLink) moveIndicator(activeLink);
  }

  function update() {
    ticking = false;
    const atBottom =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 1;

    let id = entries[0].id;

    if (atBottom) {
      id = entries[entries.length - 1].id;
    } else {
      for (const entry of entries) {
        if (entry.section.getBoundingClientRect().top <= offset) {
          id = entry.id;
        } else {
          break;
        }
      }
    }

    setActive(id);
  }

  function scheduleUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  function syncIndicator() {
    if (activeLink) moveIndicator(activeLink);
  }

  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", () => {
    scheduleUpdate();
    syncIndicator();
  });
  nav.addEventListener("scroll", syncIndicator, { passive: true });

  const resizeObserver = new ResizeObserver(syncIndicator);
  resizeObserver.observe(nav);
  for (const { link } of entries) {
    resizeObserver.observe(link);
  }

  update();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initNavScrollSpy);
} else {
  initNavScrollSpy();
}
