// testimonial.js — Safe version (no reload on keyboard open)
(function () {
  const slider = document.querySelector(".testimonial-slider");
  if (!slider) return;

  const ORIGINAL_CARDS = Array.from(document.querySelectorAll(".testimonial-card"));
  const BREAKPOINT = 768; // same breakpoint you used
  let mode = window.innerWidth >= BREAKPOINT ? "desktop" : "mobile";
  let intervalId = null;
  let currentIndex = 0;

  // Helpers
  function clearIntervalIfAny() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function removeExtraChildren() {
    // Keep only as many children as ORIGINAL_CARDS.length (remove clones)
    while (slider.children.length > ORIGINAL_CARDS.length) {
      slider.removeChild(slider.lastElementChild);
    }
  }

  function renderOriginals() {
    slider.innerHTML = "";
    ORIGINAL_CARDS.forEach(card => slider.appendChild(card.cloneNode(true)));
  }

  // DESKTOP: clone all cards to allow seamless CSS-driven infinite scrolling
  function setupDesktop() {
    clearIntervalIfAny();
    renderOriginals();
    // append clones
    const currentChildren = Array.from(slider.children);
    currentChildren.forEach(c => slider.appendChild(c.cloneNode(true)));
    // reset transforms/transitions
    slider.style.transition = "";
    slider.style.transform = "";
  }

  // MOBILE: simple auto-swap (one card width each time)
  function setupMobile() {
    clearIntervalIfAny();
    renderOriginals();
    slider.style.transition = "transform 0.5s ease-in-out";
    currentIndex = 0;
    slider.style.transform = "translateX(0%)";

    intervalId = setInterval(() => {
      const total = ORIGINAL_CARDS.length;
      currentIndex = (currentIndex + 1) % total;
      const offset = -currentIndex * 100; // each card is 100% width
      slider.style.transform = `translateX(${offset}%)`;
    }, 3000); // every 3s (your code used 3000)
  }

  // Initial setup
  if (mode === "desktop") setupDesktop();
  else setupMobile();

  // Resize handling: only react if the *width* crosses the breakpoint.
  // This avoids reacting to height-only changes (keyboard open/close).
  let lastWidth = window.innerWidth;
  window.addEventListener("resize", () => {
    const newWidth = window.innerWidth;
    // ignore small width changes (debounce-ish)
    if (Math.abs(newWidth - lastWidth) < 50) {
      // update lastWidth and return — this prevents tiny resizes from toggling
      lastWidth = newWidth;
      return;
    }

    const newMode = newWidth >= BREAKPOINT ? "desktop" : "mobile";
    if (newMode !== mode) {
      mode = newMode;
      if (mode === "desktop") setupDesktop();
      else setupMobile();
    }
    lastWidth = newWidth;
  });
})();
