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
    // buildPages() now always pads so every sheet has a back, so this `else`
    // is purely defensive — there should never be a missing back face.
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
    // Only two sheets are actually visible at any time:
    //   - sheet[flipped - 1]: its .sheet-back is showing on the LEFT page
    //   - sheet[flipped]:     its .sheet-front is showing on the RIGHT page
    // Every other sheet is buried in one of the two piles. We make those
    // buried sheets pointer-events:none so they can never intercept a click
    // that should reach a stamp on the visible top sheet — especially the
    // left page, where multiple flipped sheets are stacked at the same
    // visual position and the browser's 3D hit-test can otherwise route the
    // click into the wrong sheet.
    const topFlipped = flipped - 1;       // index of the topmost flipped sheet (or -1)
    sheets.forEach((s, i) => {
      if (i < flipped) {
        s.dataset.state = "flipped";
        s.style.zIndex = String(100 + i);   // last-flipped on top of pile
      } else {
        s.dataset.state = i === flipped ? "current" : "future";
        s.style.zIndex = String(500 - i);   // current sheet on top
      }
      s.style.pointerEvents = (i === topFlipped || i === flipped) ? "" : "none";
    });
    // Book-level state controls the horizontal slide:
    //   - closed-front: cover-only, shifted so the cover sits at viewport center
    //   - closed-back:  back-cover-only, shifted the other way for symmetry
    //   - open:         two-page spread, centered
    let bookState = "open";
    if (flipped === 0)             bookState = "closed-front";
    else if (flipped === maxFlipped) bookState = "closed-back";
    bookEl.dataset.state = bookState;

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
      // Which sheet is actually flipping?
      //   - Forward (newFlipped > flipped): the OLD current sheet[flipped]
      //     rotates from 0 → -180.
      //   - Backward (newFlipped < flipped): the topmost-flipped sheet
      //     [newFlipped] rotates from -180 → 0.
      // Either way, that sheet needs to be ON TOP of every other sheet during
      // the transition. applyStates() will assign it a low z-index (because
      // its end state is either "flipped" or "current" with a normal-tier
      // z-index that's lower than the new current/future sheet stack on the
      // other side). Without overriding, the flipping page sinks BEHIND the
      // newly-visible page mid-flip — that's the "flipping behind" bug.
      const flippingIdx = newFlipped > flipped ? flipped : newFlipped;
      const flippingSheet = sheets[flippingIdx];
      flipped = newFlipped;
      applyStates();
      if (flippingSheet) {
        flippingSheet.classList.add("is-flipping");
        flippingSheet.style.zIndex = "1000";
      }
      setTimeout(() => {
        busy = false;
        if (flippingSheet) flippingSheet.classList.remove("is-flipping");
        // Re-apply: this restores the sheet's correct resting z-index for
        // the pile it now belongs to.
        applyStates();
      }, FLIP_MS + 50);
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
    // Ignore clicks on interactive content INSIDE the page — those have
    // their own handlers (stamp detail, links, scrollables, etc.)
    if (e.target.closest("a, button, input, select, textarea, .inner-scroll, .log, svg, .stamp")) return;
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
