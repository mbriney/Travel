// passport.js — page-flip navigation.
//
// State model: every page has data-state in {"flipped", "current", "stack"}.
//   flipped  — already turned, rotated -180deg around left edge, hidden by backface
//   current  — the active page, sitting on top with rotateY(0)
//   stack    — future pages, beneath the current one, hidden
//
// One source of truth for visual state lives in CSS rules below — JS only
// manages data-state and the active index. Inline styles are used only for
// stacking order (z-index) which we recompute every change.

export function initPassport(bookEl, pages) {
  let idx = 0;
  let busy = false;
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  const indicator = document.getElementById("indicator");
  const jumpButtons = [...document.querySelectorAll(".page-jump button[data-jump]")];

  function pageIndexForButton(b) {
    // Buttons with a name match (Stamps/Log) win over data-jump.
    const label = b.textContent.trim();
    if (label === "Stamps") {
      const i = pages.findIndex(p => p.dataset.name === "stamps");
      if (i >= 0) return i;
    }
    if (label === "Log") {
      const i = pages.findIndex(p => p.dataset.name === "log");
      if (i >= 0) return i;
    }
    const target = parseInt(b.dataset.jump, 10);
    if (target < 0) return pages.length - 1;
    return Math.max(0, Math.min(pages.length - 1, target));
  }

  function applyStates() {
    pages.forEach((p, i) => {
      // z-index: flipped pages stack with higher z on more recently flipped
      // (so they pile on top of each other rotated to the left). Current page
      // sits above the stack of future pages.
      if (i < idx) {
        p.dataset.state = "flipped";
        // Higher i means flipped later -> nearer to viewer in the pile on left
        p.style.zIndex = String(50 + i);
      } else if (i === idx) {
        p.dataset.state = "current";
        p.style.zIndex = "100";
      } else {
        p.dataset.state = "stack";
        // Future pages: nearer ones on top of farther ones
        p.style.zIndex = String(99 - (i - idx));
      }
    });

    prevBtn.disabled = idx === 0;
    nextBtn.disabled = idx === pages.length - 1;
    indicator.textContent = `Page ${idx + 1} / ${pages.length} · ${pages[idx].dataset.name}`;

    for (const b of jumpButtons) {
      b.classList.toggle("is-active", pageIndexForButton(b) === idx);
    }
  }

  // For adjacent-page transitions we want a smooth flip; for jumps of >1 we
  // disable the transition so intermediate pages snap into place without
  // racing each other.
  function go(newIdx, opts = {}) {
    newIdx = Math.max(0, Math.min(pages.length - 1, newIdx));
    if (newIdx === idx) return;
    if (busy && !opts.force) return;

    const delta = newIdx - idx;
    const isJump = Math.abs(delta) > 1;

    if (isJump) {
      // Snap intermediate pages without animating
      bookEl.classList.add("no-anim");
      idx = newIdx;
      applyStates();
      // Force reflow so the no-anim class takes effect before we remove it
      void bookEl.offsetWidth;
      requestAnimationFrame(() => {
        bookEl.classList.remove("no-anim");
      });
    } else {
      busy = true;
      idx = newIdx;
      applyStates();
      // Re-enable input after the CSS transition finishes
      setTimeout(() => { busy = false; }, 850);
    }
  }

  prevBtn.addEventListener("click", () => go(idx - 1));
  nextBtn.addEventListener("click", () => go(idx + 1));

  // Keyboard
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); go(idx + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(idx - 1); }
    else if (e.key === "Home") { e.preventDefault(); go(0); }
    else if (e.key === "End")  { e.preventDefault(); go(pages.length - 1); }
  });

  // Click on the right half of the visible book to flip forward, left half to flip back.
  // Skip when the click lands on interactive content inside a page (maps, scrollable lists).
  bookEl.addEventListener("click", (e) => {
    if (e.target.closest("a, button, input, select, textarea, .inner-scroll, .log, svg")) return;
    const r = bookEl.getBoundingClientRect();
    const x = e.clientX - r.left;
    if (x > r.width / 2) go(idx + 1);
    else go(idx - 1);
  });

  // Swipe
  let touchStartX = null;
  bookEl.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  bookEl.addEventListener("touchend", (e) => {
    if (touchStartX == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(dx) > 40) (dx < 0) ? go(idx + 1) : go(idx - 1);
  });

  // Top-nav jump buttons
  jumpButtons.forEach(b => b.addEventListener("click", (e) => {
    e.stopPropagation();
    go(pageIndexForButton(b), { force: true });
  }));

  applyStates();
}
