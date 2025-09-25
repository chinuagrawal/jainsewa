// testimonial.js — robust version (ignores keyboard height changes, safe resize handling)
(function () {
  const slider = document.querySelector(".testimonial-slider");
  if (!slider) return;

  // Capture the original cards (clone them once so we have stable templates)
  const ORIGINAL_CARDS = Array.from(document.querySelectorAll(".testimonial-card")).map(c => c.cloneNode(true));
  const BREAKPOINT = 768; // px
  const WIDTH_CHANGE_THRESHOLD = 50; // px — ignore smaller width changes
  const HEIGHT_CHANGE_THRESHOLD = 100; // px — a large height change likely keyboard; ignore if width didn't change
  const RESIZE_DEBOUNCE = 150; // ms

  let mode = window.innerWidth >= BREAKPOINT ? "desktop" : "mobile";
  let intervalId = null;
  let currentIndex = 0;
  let resizeTimer = null;
  let lastWidth = window.innerWidth;
  let lastHeight = (window.visualViewport && window.visualViewport.height) || window.innerHeight;

  // utility: clear auto-swap interval
  function clearIntervalIfAny() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  // Render originals into slider (start fresh)
  function renderOriginals() {
    slider.innerHTML = "";
    ORIGINAL_CARDS.forEach(card => slider.appendChild(card.cloneNode(true)));
  }

  // DESKTOP: clones + CSS-driven infinite appearance
  function setupDesktop() {
    clearIntervalIfAny();
    renderOriginals();

    // duplicate the set so CSS animations (if any) can loop seamlessly
    const currentChildren = Array.from(slider.children);
    currentChildren.forEach(c => slider.appendChild(c.cloneNode(true)));

    // reset transforms/transitions
    slider.style.transition = "";
    slider.style.transform = "";
    // ensure slider width/position are reset
    slider.style.willChange = "auto";
  }

  // MOBILE: simple auto-swap (translateX by 100% per card)
  function setupMobile() {
    clearIntervalIfAny();
    renderOriginals();

    slider.style.transition = "transform 0.5s ease-in-out";
    currentIndex = 0;
    slider.style.transform = "translateX(0%)";
    slider.style.willChange = "transform";

    // start interval
    intervalId = setInterval(() => {
      const total = ORIGINAL_CARDS.length || 1;
      currentIndex = (currentIndex + 1) % total;
      const offset = -currentIndex * 100; // -0%, -100%, -200% ...
      slider.style.transform = `translateX(${offset}%)`;
    }, 3000);
  }

  // Initialize correct mode
  try {
    if (mode === "desktop") setupDesktop();
    else setupMobile();
  } catch (err) {
    console.error("testimonial.js init error:", err);
  }

  // Helper: decide whether resize should trigger mode check
  function shouldProcessResize(newW, newH) {
    const dW = Math.abs(newW - lastWidth);
    const dH = Math.abs(newH - lastHeight);

    // If width changed significantly -> process
    if (dW >= WIDTH_CHANGE_THRESHOLD) return true;

    // If width change is tiny but height changed a lot -> likely keyboard open/close -> ignore
    if (dW < WIDTH_CHANGE_THRESHOLD && dH >= HEIGHT_CHANGE_THRESHOLD) return false;

    // tiny changes only -> ignore
    return false;
  }

  // Debounced resize handler
  function onResize() {
    const newWidth = window.innerWidth;
    const newHeight = (window.visualViewport && window.visualViewport.height) || window.innerHeight;

    if (!shouldProcessResize(newWidth, newHeight)) {
      // update lastHeight/lastWidth so future checks are correct, but don't re-render modes
      lastWidth = newWidth;
      lastHeight = newHeight;
      return;
    }

    // debounce to avoid thrash
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const newMode = window.innerWidth >= BREAKPOINT ? "desktop" : "mobile";
      if (newMode !== mode) {
        mode = newMode;
        // teardown + setup
        clearIntervalIfAny();
        // small safety: remove extra children if any
        try {
          if (mode === "desktop") setupDesktop();
          else setupMobile();
        } catch (err) {
          console.error("testimonial.js setup error after resize:", err);
        }
      }
      // update last sizes used for future heuristics
      lastWidth = window.innerWidth;
      lastHeight = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
    }, RESIZE_DEBOUNCE);
  }

  // Use visualViewport if available for more accurate keyboard detection
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', onResize, { passive: true });
  } else {
    window.addEventListener('resize', onResize, { passive: true });
  }

  // Clean up when the page unloads (avoid interval leak in SPA-like contexts)
  window.addEventListener('pagehide', function () {
    clearIntervalIfAny();
  }, { passive: true });
})();
