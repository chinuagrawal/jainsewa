(function () {
  const carousel = document.getElementById('mainCarousel');
  const track = carousel.querySelector('.carousel-track');
  const slides = Array.from(track.children);
  const prevBtn = carousel.querySelector('.carousel-button.prev');
  const nextBtn = carousel.querySelector('.carousel-button.next');
  const indicatorsContainer = carousel.querySelector('.carousel-indicators');

  let index = 0;
  let autoplayInterval = 4000;
  let timer = null;
  let isPlaying = true;

  // build indicators
  slides.forEach((_, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', `Go to slide ${i+1}`);
    if (i === 0) btn.setAttribute('aria-current','true');
    indicatorsContainer.appendChild(btn);
    btn.addEventListener('click', () => goTo(i));
  });

  const indicators = Array.from(indicatorsContainer.children);

  function update() {
    track.style.transform = `translateX(-${index * 100}%)`;
    indicators.forEach((b, i) => b.toggleAttribute('aria-current', i === index));
  }

  function goTo(i) {
    index = (i + slides.length) % slides.length;
    update();
    resetTimer();
  }

  function next() { goTo(index + 1); }
  function prev() { goTo(index - 1); }

  // autoplay
  function startTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(next, autoplayInterval);
    isPlaying = true;
  }
  function stopTimer() {
    if (timer) clearInterval(timer);
    timer = null;
    isPlaying = false;
  }
  function resetTimer() {
    stopTimer();
    startTimer();
  }

  // controls
  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);

  // pause on hover and focus
  carousel.addEventListener('mouseenter', stopTimer);
  carousel.addEventListener('mouseleave', startTimer);
  carousel.addEventListener('focusin', stopTimer);
  carousel.addEventListener('focusout', startTimer);

  // keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!carousel.contains(document.activeElement) && !carousel.matches(':hover')) {
      /* still allow global left/right */
    }
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  });

  // touch / swipe support (simple)
  let startX = 0;
  carousel.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, {passive:true});
  carousel.addEventListener('touchend', (e) => {
    const dx = (e.changedTouches[0].clientX - startX);
    if (Math.abs(dx) > 40) dx > 0 ? prev() : next();
  });

  // init
  update();
  // Respect reduced motion preference
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) startTimer();
})();