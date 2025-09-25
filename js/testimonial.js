
document.addEventListener("DOMContentLoaded", function () {
  const slider = document.querySelector(".testimonial-slider");
  const cards = document.querySelectorAll(".testimonial-card");
  let currentIndex = 0;
  const total = cards.length;

  // Make slider use smooth transition
  slider.style.display = "flex";
  slider.style.transition = "transform 0.6s ease-in-out";

  function showSlide(index) {
    const offset = -index * 100; // move by 100% width each time
    slider.style.transform = `translateX(${offset}%)`;
  }

  function nextSlide() {
    currentIndex = (currentIndex + 1) % total;
    showSlide(currentIndex);
  }

  // Auto-slide every 4s
  setInterval(nextSlide, 4000);

  // Initialize first slide
  showSlide(currentIndex);
});

