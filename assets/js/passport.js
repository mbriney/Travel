// passport.js — page-flip navigation.
// We stack the pages in z-order. The "current" page is on top; the page underneath
// is the "next" we'll reveal. Flipping forward rotates the current page -180deg
// around its left edge. Going back rotates the previously flipped page back.

export function initPassport(bookEl, pages) {
  let idx = 0;
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  const indicator = document.getElementById("indicator");
  const jumpButtons = document.querySelectorAll(".page-jump button[data-jump]");

  function setStates() {
    pages.forEach((p, i) => {
      if (i < idx) {
        // Already flipped — keep rotated so the cover stays "open"
        p.dataset.state = "flipping-forward";
      } else if (i === idx) {
        p.dataset.state = "current";
        p.style.visibility = "visible";
      } else if (i === idx + 1) {
        // Next page is behind the current — visible but underneath
        p.dataset.state = "current";
        p.style.visibility = "visible";
        p.style.zIndex = 5;
        p.style.transform = "rotateY(0deg)";
      } else {
        p.dataset.state = "next";
      }
    });
    // The actual current page sits on top.
    pages[idx].style.zIndex = 10;
    pages[idx].style.transform = "rotateY(0deg)";
    pages[idx].style.visibility = "visible";

    prevBtn.disabled = idx === 0;
    nextBtn.disabled = idx === pages.length - 1;

    indicator.textContent = `Page ${idx + 1} / ${pages.length} · ${pages[idx].dataset.name}`;

    jumpButtons.forEach(b => {
      const target = parseInt(b.dataset.jump, 10);
      const resolved = target < 0 ? pages.length - 1 : target;
      // For the "Stamps" button, find the first stamps page dynamically
      let resolvedFinal = resolved;
      if (b.textContent === "Stamps") {
        const i = pages.findIndex(p => p.dataset.name === "stamps");
        resolvedFinal = i >= 0 ? i : resolved;
      } else if (b.textContent === "Log") {
        const i = pages.findIndex(p => p.dataset.name === "log");
        resolvedFinal = i >= 0 ? i : resolved;
      }
      b.classList.toggle("is-active", resolvedFinal === idx);
    });
  }

  function go(newIdx) {
    newIdx = Math.max(0, Math.min(pages.length - 1, newIdx));
    if (newIdx === idx) return;
    if (newIdx > idx) {
      // Flip pages forward one at a time? Just snap z-order; CSS transition handles look.
      // Animate the leaving page rotating away.
      for (let i = idx; i < newIdx; i++) {
        pages[i].dataset.state = "flipping-forward";
        pages[i].style.transform = "rotateY(-180deg)";
        pages[i].style.zIndex = 30 - i;
      }
    } else {
      // Flip back
      for (let i = idx - 1; i >= newIdx; i--) {
        pages[i].dataset.state = "current";
        pages[i].style.transform = "rotateY(0deg)";
        pages[i].style.zIndex = 30 - i;
      }
    }
    idx = newIdx;
    setStates();
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

  // Click on the right half of the current page goes forward, left half goes back
  bookEl.addEventListener("click", (e) => {
    // Ignore clicks on interactive elements (links, buttons inside)
    if (e.target.closest("a,button,svg path,svg circle,svg rect")) return;
    const r = bookEl.getBoundingClientRect();
    const x = e.clientX - r.left;
    if (x > r.width / 2) go(idx + 1);
    else go(idx - 1);
  });

  // Swipe support
  let touchStartX = null;
  bookEl.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  bookEl.addEventListener("touchend", (e) => {
    if (touchStartX == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(dx) > 40) {
      if (dx < 0) go(idx + 1); else go(idx - 1);
    }
  });

  // Page-jump nav buttons
  jumpButtons.forEach(b => b.addEventListener("click", () => {
    const target = parseInt(b.dataset.jump, 10);
    if (b.textContent === "Stamps") {
      const i = pages.findIndex(p => p.dataset.name === "stamps");
      if (i >= 0) return go(i);
    }
    if (b.textContent === "Log") {
      const i = pages.findIndex(p => p.dataset.name === "log");
      if (i >= 0) return go(i);
    }
    if (target < 0) return go(pages.length - 1);
    go(target);
  }));

  setStates();
}
