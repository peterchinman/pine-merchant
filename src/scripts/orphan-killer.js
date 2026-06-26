// ORPHAN KILLER
// Glue the last two words of each paragraph / list item together with a
// non-breaking space, so a lone short word never wraps onto a line by itself.

const NBSP = String.fromCharCode(0xa0);

export function killOrphans(root) {
   // Default to the article body; bail on pages without one.
   const scope = root ?? document.querySelector("article");
   if (!scope) return;

   deOrphanLines(scope);
   glueFootnoteMarkers(scope);
}

function deOrphanLines(scope) {
   const elements = scope.querySelectorAll("p, li");

   // What a hideous Regex!! But it seems to work well.
   // (?<!<[^>]*)  negative lookbehind so we don't match inside an html tag
   // \s           a leading space, positioning us at the start of a word
   // then two capture groups separated by space(s): each is a run of 1–9
   // non-space, non-tag chars, optionally wrapped in any number of tags
   // (the 2nd allows a trailing "." to capture cases like "<a>link</a>.").
   // 1–9 keeps us from yanking a long word down and leaving a ragged line.
   const regex =
      /(?<!<[^>]*)\s((?:<[^>]*>)*[^<\s]{1,9}(?:<[^>]*>)*)\s+((?:<[^>]*>)*[^<\s]{1,9}(?:<[^>]*>)*\.?)$/;

   elements.forEach((el) => {
      const html = el.innerHTML.trim();
      // length guard stops it from de-orphaning already-short lines
      if (html.length <= 30) return;

      const match = html.match(regex);
      if (!match) return;

      // Footnote markers are handled by glueFootnoteMarkers; never rewrite
      // their <sup><a …> markup here.
      if (match[0].includes("data-footnote-")) return;

      el.innerHTML = html.replace(
         regex,
         (_m, word1, word2) => ` ${word1}${NBSP}${word2}`,
      );
   });
}

// Keep footnote markers from wrapping onto a line by themselves: replace the
// space before each one with a non-breaking space so it stays glued to the
// preceding word. (Markers written tight against a word, "word[^1]", already
// have no break opportunity before them, so there's nothing to do there.)
function glueFootnoteMarkers(scope) {
   scope.querySelectorAll("[data-footnote-ref]").forEach((ref) => {
      const marker = ref.closest("sup") ?? ref;
      const prev = marker.previousSibling;
      if (prev && prev.nodeType === Node.TEXT_NODE && /\s$/.test(prev.nodeValue)) {
         prev.nodeValue = prev.nodeValue.replace(/\s+$/, NBSP);
      }
   });
}
