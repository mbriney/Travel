// passport.js — physical-book navigation.
//
// We render the pages array as a stack of "sheets". Each sheet has a front
// face (front-page content) and a back face (next-page content). Sheets are
// pinned to the spine of the book and rotate -180° around their left edge
// to flip from right to left. Two pages are visible at any time:
//   left  = back of the most-recently-flipped sheet
//   right = front of the next unflipped sheet
//
// State: `flipped` = number of sheets currently flipped to the left.
//   flipped = 0     → only the front cover is visible (right side)
//   flipped = N     → sheets 0..N-1 are on the left pile; sheet N (if any) is on the right
//
// Pages come in as a flat array. We pair them 2-by-2 into sheets:
//   sheet[0] = (pages[0], pages[1])  - cover front, cover back / bearer
//   sheet[1] = (pages[2], pages[3])
//   ...

const FLIP_MS = 850;

export function initPassport(bookEl, pages) {
  // Build sheets in the DOM
  const sheets = [];
  for (let i = 0; i < pages.length; i += 2) {
    const front = pages[i];
    const back  = pages[i + 1] || null;
    const sheet = document.createElement("div");
    sheet.className = "sheet";
    sheet.dataset.index = sheets.length;

    const frontFace = document.createElement("div");
    frontFace.className = "sheet-face sheet-front";
    frontFace.appendChild(front);

    const backFace = document.createElement("div");
    backFace.className = "sheet-face sheet-back";
    if (back) {
      backFace.appendChild(back);
    } else {
      backFace.innerHTML = `<div class="paper end-paper"><div class="end-paper-inner">
        <div class="end-paper-eagle" aria-hidden="true">★</div>
        <div class="end-paper-text">End of passport</div>
      </div></div>`;
    }

    sheet.appendChild(frontFace);
    sheet.appendChild(backFace);
    bookEl.appendChild(sheet);
    sheets.push(sheet);
  }

  let flipped = 0;
  let busy = false;
  const maxFlipped = sheets.length;  // 0..N inclusive

  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  const indicator = document.getElementById("indicator");
  const jumpButtons = [...document.querySelectorAll(".page-jump button[data-jump]")];

  function pageNameAt(flipState) {
    // Currently visible "primary" page is the front of sheet[flipState] (right side),
    // or the back of sheet[flipState-1] if no further sheets.
    const sheetIdx = flipState < sheets.length ? flipState : flipState - 1;
    const isBack = flipState >= sheets.length;
    const pageIdx = sheetIdx * 2 + (isBack ? 1 : 0);
    return pages[pageIdx]?.dataset.name || "—";
  }

  function targetForButton(b) {
    const label = b.textContent.trim();
    const findFlipForPageName = (name) => {
      const pIdx = pages.findIndex(p => p.dataset.name === name);
      if (pIdx < 0) return null;
      // Page pIdx lives in sheet floor(pIdx/2) on its (pIdx%2 === 0 ? front : back).
      // To make that page visible, we need flipped state where that sheet's
      // front is on the right (flipped = sheet idx) for fronts, or
      // sheet's back is on the left (flipped = sheet idx + 1) for backs.
      const sheetIdx = Math.floor(pIdx / 2);
      return pIdx % 2 === 0 ? sheetIdx : sheetIdx + 1;
    };
    if (label === "Stamps") return findFlipForPageName("stamps");
    if (label === "Log")    return findFlipForPageName("log");
    const t = parseInt(b.dataset.jump, 10);
    if (t < 0) return maxFlipped;
    return findFlipForPageName(["cover", "bearer", "stats", "world", "usa"][t]) ?? Math.min(t, maxFlipped);
  }

  function applyStates() {
    sheets.forEach((s, i) => {
      if (i < flipped) {
        s.dataset.state = "flipped";
        // Flipped sheets pile on the left. Later-flipped sit on top.
        s.style.zIndex = String(100 + i);
      } else {
        s.dataset.state = i === flipped ? "current" : "future";
        // Unflipped sheets: earlier ones on top so the current sheet shows.
        s.style.zIndex = String(500 - i);
      }
    });
    prevBtn.disabled = flipped === 0;
    nextBtn.disabled = flipped >= maxFlipped;
    indicator.textContent = `${flipped}/${maxFlipped} · ${pageNameAt(flipped)}`;
    for (const b of jumpButtons) {
      const target = targetForButton(b);
      b.classList.toggle("is-active", target === flipped);
    }
  }

  function go(newFlipped, opts = {}) {
    newFlipped = Math.max(0, Math.min(maxFlipped, newFlipped));
    if (newFlipped === flipped) return;
    if (busy && !opts.force) return;

    const delta = Math.abs(newFlipped - flipped);
    if (delta > 1) {
      // Snap jump — no animation
      bookEl.classList.add("no-anim");
      flipped = newFlipped;
      applyStates();
      // Force a layout flush, then re-enable transitions
      void bookEl.offsetWidth;
      requestAnimationFrame(() => bookEl.classList.remove("no-anim"));
    } else {
      busy = true;
      flipped = newFlipped;
      applyStates();
      setTimeout(() => { busy = false; }, FLIP_MS + 50);
    }
  }

  prevBtn.addEventListener("click", () => go(flipped - 1));
  nextBtn.addEventListener("click", () => go(flipped + 1));

  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); go(flipped + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(flipped - 1); }
    else if (e.key === "Home") { e.preventDefault(); go(0); }
    else if (e.key === "End")  { e.preventDefault(); go(maxFlipped); }
  });

  // Click anywhere on the right half flips forward; left half flips back.
  // Skip clicks on interactive content (scrolls, maps, log table).
  bookEl.addEventListener("click", (e) => {
    if (e.target.closest("a, button, input, select, textarea, .inner-scroll, .log, svg")) return;
    const r = bookEl.getBoundingClientRect();
    const x = e.clientX - r.left;
    if (x > r.width / 2) go(flipped + 1);
    else go(flipped - 1);
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
    if (Math.abs(dx) > 40) (dx < 0) ? go(flipped + 1) : go(flipped - 1);
  });

  jumpButtons.forEach(b => b.addEventListener("click", (e) => {
    e.stopPropagation();
    const target = targetForButton(b);
    if (target != null) go(target, { force: true });
  }));

  applyStates();
}
