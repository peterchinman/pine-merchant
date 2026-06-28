function matchLetters(source, target) {
   const srcGroups = {};
   const tgtGroups = {};

   for (let i = 0; i < source.length; i++) {
      const ch = source[i].toUpperCase();
      if (ch === " ") continue;
      srcGroups[ch] ??= [];
      srcGroups[ch].push(i);
   }

   for (let i = 0; i < target.length; i++) {
      const ch = target[i].toUpperCase();
      if (ch === " ") continue;
      tgtGroups[ch] ??= [];
      tgtGroups[ch].push(i);
   }

   const pairs = [];

   for (const ch in srcGroups) {
      const srcs = srcGroups[ch].slice().sort((a, b) => a - b);
      const tgts = (tgtGroups[ch] || []).slice().sort((a, b) => a - b);

      for (let k = 0; k < srcs.length; k++) {
         pairs.push({ fromIndex: srcs[k], toIndex: tgts[k] });
      }
   }

   return pairs;
}

function renderRow(rowEl, str, dataAttr) {
   rowEl.innerHTML = "";

   for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      const span = document.createElement("span");

      if (ch === " ") {
         span.className = "aa-space";
         span.textContent = " ";
      } else {
         span.className = "aa-letter";
         span.dataset[dataAttr] = i;
         span.textContent = ch;
      }

      rowEl.appendChild(span);
   }
}

const OBSERVED_ATTRS = [
   "anagrams",
   "duration",
   "stagger",
   "easing",
   "arc-factor",
   "arc-max",
   "arc-peak",
   "scale-peak",
   "duration-jitter",
   "hold",
   "enter-delay",
   "trigger",
];

class AnagramAnimator extends HTMLElement {
   static get observedAttributes() {
      return OBSERVED_ATTRS;
   }

   connectedCallback() {
      this._connected = true;
      this._ensureScaffold();
      this._init();
   }

   _ensureScaffold() {
      if (this.querySelector('[data-role="start"]')) return;

      const start = (this.textContent || "").trim();
      const into = this.getAttribute("into");
      this._authored = into ? `${start}|${into}` : start;

      this.replaceChildren();
      for (const role of ["start", "end"]) {
         const span = document.createElement("span");
         span.dataset.role = role;
         this.append(span);
      }
   }

   disconnectedCallback() {
      this._connected = false;
      this.stop();
      this._removeHoverListeners?.();
   }

   attributeChangedCallback() {
      if (this._connected) this._init();
   }

   _init() {
      this.stop();
      this._removeHoverListeners?.();
      this._removeHoverListeners = null;
      this._initError = null;

      const raw = this.getAttribute("anagrams") ?? this._authored ?? "";
      const anagrams = raw
         .split("|")
         .map((s) => s.trim())
         .filter((s) => s.length > 0);

      if (anagrams.length < 2) return;

      const rowTop = this.querySelector('[data-role="start"]');
      const rowBottom = this.querySelector('[data-role="end"]');

      if (!rowTop || !rowBottom) return;

      const num = (attr) => {
         const v = this.getAttribute(attr);
         return v !== null ? Number(v) : undefined;
      };

      const str = (attr) => {
         const v = this.getAttribute(attr);
         return v !== null ? v : undefined;
      };

      this.duration = num("duration") ?? 700;
      this.stagger = num("stagger") ?? 18;
      this.easing = str("easing") ?? "cubic-bezier(0.34, 1.4, 0.64, 1)";
      this.arcFactor = num("arc-factor") ?? 0.3;
      this.arcMax = num("arc-max") ?? 28;
      this.arcPeak = num("arc-peak") ?? 0.4;
      this.scalePeak = num("scale-peak") ?? 1.15;
      this.durationJitter = num("duration-jitter") ?? 0;
      this.hold = num("hold") ?? 2000;
      this.enterDelay = num("enter-delay") ?? 100;
      this.trigger = str("trigger") ?? "hover";

      this._rowTop = rowTop;
      this._rowBottom = rowBottom;

      try {
         this.setup(anagrams);

         if (this.trigger === "hover") {
            this._setupHoverTrigger();
         } else {
            this.start();
         }
      } catch (e) {
         this._initError = e.message.replace("AnagramAnimator: ", "");
      }
   }

   _setupHoverTrigger() {
      if (!this.hasAttribute("tabindex")) this.tabIndex = 0;

      // Wait out a short delay before morphing, so a quick pass over the name
      // doesn't fire the animation. Leaving before the delay cancels it.
      const pointerEnter = () => {
         clearTimeout(this._enterTimer);
         this._enterTimer = setTimeout(
            () => this.animateTo(1),
            this.enterDelay,
         );
      };
      const showEnd = () => this.animateTo(1);
      const showStart = () => {
         clearTimeout(this._enterTimer);
         this._enterTimer = null;
         this.animateTo(0);
      };

      this.addEventListener("pointerenter", pointerEnter);
      this.addEventListener("focusin", showEnd);
      this.addEventListener("pointerleave", showStart);
      this.addEventListener("focusout", showStart);

      this._removeHoverListeners = () => {
         clearTimeout(this._enterTimer);
         this._enterTimer = null;
         this.removeEventListener("pointerenter", pointerEnter);
         this.removeEventListener("focusin", showEnd);
         this.removeEventListener("pointerleave", showStart);
         this.removeEventListener("focusout", showStart);
      };
   }

   start() {
      this.stop();

      const cycle = () => {
         this._autoTimer = setTimeout(() => {
            this.animate().then(cycle);
         }, this.hold);
      };

      cycle();
   }

   stop() {
      clearTimeout(this._autoTimer);
      this._autoTimer = null;
   }

   setup(anagrams) {
      this.stop();

      const normalize = (s) =>
         s.replace(/ /g, "").toUpperCase().split("").sort().join("");
      const ref = normalize(anagrams[0]);

      for (const a of anagrams) {
         if (normalize(a) !== ref) {
            throw new Error(
               `AnagramAnimator: "${a}" is not an anagram of "${anagrams[0]}"`,
            );
         }
      }

      this.anagrams = anagrams;
      this.currentIndex = 0;
      this._desiredIndex = 0;
      this._currentRow = "top";
      this.animating = false;

      renderRow(this._rowTop, anagrams[0], "srcIdx");
      renderRow(this._rowBottom, anagrams[1], "tgtIdx");

      this._rowTop.style.visibility = "";
      this._rowBottom.style.visibility = "hidden";
   }

   animateTo(targetIndex) {
      if (!this.anagrams?.length) return Promise.resolve();

      this._desiredIndex = targetIndex;

      if (this.animating) {
         return this._pendingAnimation ?? Promise.resolve();
      }

      if (this.currentIndex === this._desiredIndex) {
         return Promise.resolve();
      }

      this._pendingAnimation = this.animate().then(() => {
         this._pendingAnimation = null;

         if (this.currentIndex !== this._desiredIndex) {
            return this.animateTo(this._desiredIndex);
         }
      });

      return this._pendingAnimation;
   }

   animate() {
      if (this.animating) return Promise.resolve();

      this.animating = true;

      const goingDown = this._currentRow === "top";
      const fromRow = goingDown ? this._rowTop : this._rowBottom;
      const toRow = goingDown ? this._rowBottom : this._rowTop;
      const fromAttr = goingDown ? "srcIdx" : "tgtIdx";
      const toAttr = goingDown ? "tgtIdx" : "srcIdx";

      const nextIndex = (this.currentIndex + 1) % this.anagrams.length;
      const pairs = matchLetters(
         this.anagrams[this.currentIndex],
         this.anagrams[nextIndex],
      );

      toRow.style.visibility = "hidden";

      const firstRects = {};
      fromRow.querySelectorAll(".aa-letter").forEach((span) => {
         firstRects[span.dataset[fromAttr]] = span.getBoundingClientRect();
      });

      const lastRects = {};
      const toSpans = {};
      toRow.querySelectorAll(".aa-letter").forEach((span) => {
         const idx = span.dataset[toAttr];
         lastRects[idx] = span.getBoundingClientRect();
         toSpans[idx] = span;
      });

      fromRow.querySelectorAll(".aa-letter, .aa-space").forEach((span) => {
         span.style.opacity = "0";
      });

      pairs.forEach((pair) => {
         const span = toSpans[pair.toIndex];
         const from = firstRects[pair.fromIndex];
         const to = lastRects[pair.toIndex];

         if (!span || !from || !to) return;

         span.style.transition = "none";
         span.style.transform = `translate(${from.left - to.left}px, ${from.top - to.top}px)`;
      });

      toRow.style.visibility = "";
      toRow.offsetHeight;

      const {
         duration,
         stagger,
         easing,
         arcFactor,
         arcMax,
         arcPeak,
         scalePeak,
         durationJitter,
      } = this;

      const pairsByDest = pairs.slice().sort((a, b) => a.toIndex - b.toIndex);
      const totalMs = duration * (1 + durationJitter) + stagger * (pairs.length - 1);

      pairsByDest.forEach((pair, i) => {
         const span = toSpans[pair.toIndex];
         const from = firstRects[pair.fromIndex];
         const to = lastRects[pair.toIndex];

         if (!span || !from || !to) return;

         const dx = from.left - to.left;
         const dy = from.top - to.top;
         const absDx = Math.abs(dx);
         const absDy = Math.abs(dy);
         const arcAmount = Math.min(Math.max(absDx, absDy) * arcFactor, arcMax);
         const arcX = absDy > absDx ? (dy > 0 ? -arcAmount : arcAmount) : 0;
         const arcY = absDx >= absDy ? (dx > 0 ? -arcAmount : arcAmount) : 0;
         const letterDuration = duration * (1 + (Math.random() * 2 - 1) * durationJitter);

         span.style.transform = "";
         span.animate(
            [
               {
                  transform: `translate(${dx}px, ${dy}px) scale(1)`,
                  offset: 0,
               },
               {
                  transform: `translate(${dx * 0.5 + arcX}px, ${dy * 0.5 + arcY}px) scale(${scalePeak})`,
                  offset: arcPeak,
               },
               { transform: "translate(0, 0) scale(1)", offset: 1 },
            ],
            {
               duration: letterDuration,
               delay: stagger * i,
               easing,
               fill: "both",
            },
         );
      });

      return new Promise((resolve) => {
         setTimeout(() => {
            fromRow.style.visibility = "hidden";
            fromRow.querySelectorAll(".aa-letter, .aa-space").forEach((span) => {
               span.style.opacity = "";
            });

            toRow.querySelectorAll(".aa-letter").forEach((span) => {
               for (const animation of span.getAnimations()) animation.cancel();
               span.style.transform = "";
            });

            this.currentIndex = nextIndex;
            this._currentRow = goingDown ? "bottom" : "top";

            const afterNextIndex = (this.currentIndex + 1) % this.anagrams.length;
            renderRow(fromRow, this.anagrams[afterNextIndex], goingDown ? "srcIdx" : "tgtIdx");

            this.animating = false;
            resolve();
         }, totalMs);
      });
   }
}

customElements.define("anagram-animator", AnagramAnimator);
