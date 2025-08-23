document.addEventListener('DOMContentLoaded', () => {
  // Smooth scroll for scroll-down link
  const scrollLink = document.querySelector('.scroll-down');
  if (scrollLink) {
    scrollLink.addEventListener('click', (e) => {
      e.preventDefault();
      const gamesSection = document.querySelector('#games');
      gamesSection?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Navigate to game when play button clicked
  document.querySelectorAll('.play-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const link = btn.getAttribute('data-link');
      if (link) {
        // Navigate relative to current directory
        window.location.href = link;
      }
    });
  });

  // Hover effect: clicking anywhere on the card triggers the play button
  document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
      const btn = card.querySelector('.play-btn');
      btn?.click();
    });
  });

  // Intersection observer to animate cards when in view
  const cards = document.querySelectorAll('.game-card');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.2
  });
  cards.forEach(card => observer.observe(card));
});