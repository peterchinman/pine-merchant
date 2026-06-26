// Turns remark-gfm footnotes into sidenotes:
//   - wide screens: positioned in the right margin, aligned to their reference
//   - narrow screens: in flow, just beneath the referencing paragraph
//
// remark-gfm markup this expects:
//   ref:   <sup><a id="user-content-fnref-1" data-footnote-ref href="#user-content-fn-1">1</a></sup>
//   notes: <section class="footnotes"><ol><li id="user-content-fn-1"><p>… <a data-footnote-backref>↩</a></p></li></ol></section>

// Keep this in sync with the @media breakpoint in the blog post styles.
const WIDE = "(min-width: 1300px)";
const GAP = 24; // px of vertical breathing room between stacked sidenotes

function footnoteNumber(id) {
   const match = id.match(/(\d+)$/);
   return match ? match[1] : null;
}

// Move each footnote out of the bottom list into a .footnote-container by its ref.
function build() {
   const section = document.querySelector(".footnotes");
   if (!section) return null;

   const content = section.closest(".prose") ?? section.parentElement;
   const items = Array.from(section.querySelectorAll("ol > li"));
   const sidenotes = [];

   for (const li of items) {
      const num = footnoteNumber(li.id);
      const ref = document.getElementById(`user-content-fnref-${num}`);
      if (!ref) continue;

      const note = document.createElement("aside");
      note.className = "footnote-container";
      note.dataset.index = num;
      note.innerHTML = li.innerHTML;
      // drop remark-gfm's "↩" back-reference link
      note.querySelector("[data-footnote-backref]")?.remove();

      // Anchor it after the ref's block-level ancestor (its in-flow home on
      // narrow screens, and the relative offset parent for wide positioning).
      const block =
         ref.closest("p, ul, ol, pre, blockquote, figure") ?? content;

      // Stack multiple notes from the same block in order.
      let after = block;
      while (
         after.nextElementSibling?.classList.contains("footnote-container")
      ) {
         after = after.nextElementSibling;
      }
      after.insertAdjacentElement("afterend", note);

      sidenotes.push({ note, ref });
   }

   section.remove();
   return { content, sidenotes };
}

// Wide screens only: place each note at its ref's height, nudging down to
// avoid overlap with the note above it.
function position(state) {
   const { content, sidenotes } = state;

   if (!window.matchMedia(WIDE).matches) {
      for (const { note } of sidenotes) note.style.top = "";
      return;
   }

   const contentTop = content.getBoundingClientRect().top;
   let prevBottom = -Infinity;

   for (const { note, ref } of sidenotes) {
      let top = ref.getBoundingClientRect().top - contentTop;
      if (top < prevBottom + GAP) top = prevBottom + GAP;
      note.style.top = `${top}px`;
      prevBottom = top + note.offsetHeight;
   }
}

function debounce(fn, wait) {
   let timer;
   return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
   };
}

// Narrow screens: footnotes are hidden; tapping a ref pill toggles its note.
function setupToggle(state) {
   document.addEventListener("click", (event) => {
      const ref = event.target.closest("[data-footnote-ref]");
      if (!ref) return;

      // The original footnote anchor is gone (we moved it), so never jump.
      event.preventDefault();

      // Wide screens already show every note in the margin — nothing to toggle.
      if (window.matchMedia(WIDE).matches) return;

      const num = footnoteNumber(ref.id);
      const entry = state.sidenotes.find((s) => s.note.dataset.index === num);
      if (!entry) return;

      ref.classList.toggle("selected");
      entry.note.classList.toggle("is-open");
   });
}

export function initSidenotes() {
   const state = build();
   if (!state) return;

   setupToggle(state);

   const reposition = () => position(state);
   reposition();

   // Recompute once fonts/images settle (they shift ref positions).
   window.addEventListener("load", reposition);
   document.fonts?.ready.then(reposition);
   window.addEventListener("resize", debounce(reposition, 150));
}
