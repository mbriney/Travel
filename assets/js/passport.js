// passport.js — flip-book inside the Passport view.
//
// pages are passed in flat order. We pair them 2-per-sheet:
//   sheet[i].front = pages[2i]
//   sheet[i].back  = pages[2i+1]
//
// State: `flipped` = number of sheets currently flipped to the left.
// At any time:
//   - sheets [0..flipped-1] are on the left pile (rotated -180deg)
//   - sheet [flipped]  is the active right page (rotateY 0)
//   - sheets [flipped+1..] are stacked underneath

const FLIP_MS = 850;

export function initPassport(bookEl, pages) {
  bookEl.innerHTML = "";  // wipe in case of re-init

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
      backFace.innerHTML = `<div class="end-paper"><div>End of passport</div></div>`;
    }

    sheet.appendChild(frontFace);
    sheet.appendChild(backFace);
    bookEl.appendChild(sheet);
    sheets.push(sheet);
  }

  let flipped = 0;
  let busy = false;
  const maxFlipped = sheets.length;

  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  const indicator = document.getElementById("indicator");

  function pageNameAt(flipState) {
    const sheetIdx = Math.min(flipState, sheets.length - 1);
    const isBack = flipState >= sheets.length;
    const pageIdx = sheetIdx * 2 + (isBack ? 1 : 0);
    return pages[pageIdx]?.dataset.name || "—";
  }

  function applyStates() {
    sheets.forEach((s, i) => {
      if (i < flipped) {
        s.dataset.state = "flipped";
        s.style.zIndex = String(100 + i);   // last-flipped on top of pile
      } else {
        s.dataset.state = i === flipped ? "current" : "future";
        s.style.zIndex = String(500 - i);   // current sheet on top
      }
    });
    prevBtn.disabled = flipped === 0;
    nextBtn.disabled = flipped >= maxFlipped;
    indicator.textContent = `${flipped} / ${maxFlipped} · ${pageNameAt(flipped)}`;
  }

  function go(newFlipped) {
    newFlipped = Math.max(0, Math.min(maxFlipped, newFlipped));
    if (newFlipped === flipped || busy) return;
    const delta = Math.abs(newFlipped - flipped);
    if (delta > 1) {
      bookEl.classList.add("no-anim");
      flipped = newFlipped;
      applyStates();
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
    // Only handle keys while the passport view is active
    const passportActive = document.getElementById("view-passport").classList.contains("is-active");
    if (!passportActive) return;
    if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); go(flipped + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(flipped - 1); }
    else if (e.key === "Home") { e.preventDefault(); go(0); }
    else if (e.key === "End")  { e.preventDefault(); go(maxFlipped); }
  });

  bookEl.addEventListener("click", (e) => {
    if (e.target.closest("a, button, input, select, textarea, .inner-scroll, .log, svg")) return;
    const r = bookEl.getBoundingClientRect();
    const x = e.clientX - r.left;
    if (x > r.width / 2) go(flipped + 1);
    else go(flipped - 1);
  });

  let touchStartX = null;
  bookEl.addEventListener("touchstart", (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  bookEl.addEventListener("touchend", (e) => {
    if (touchStartX == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(dx) > 40) (dx < 0) ? go(flipped + 1) : go(flipped - 1);
  });

  applyStates();
}
