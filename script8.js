document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // --- Scroll-Triggered Fade-In Animations ---
  const fadeElements = document.querySelectorAll('.fade-in');
  
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };
  
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // Stop observing once visible
      }
    });
  }, observerOptions);
  
  fadeElements.forEach(element => {
    observer.observe(element);
  });

  // --- Sticky Header Styling on Scroll ---
  const header = document.querySelector('header');
  function updateHeaderStyle() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (window.scrollY > 50) {
      header.style.boxShadow = isLight ? '0 10px 30px rgba(0,0,0,0.06)' : '0 10px 30px rgba(0,0,0,0.4)';
      header.style.backgroundColor = isLight ? 'rgba(255,255,255,0.95)' : '#0c0c10';
    } else {
      header.style.boxShadow = 'none';
      header.style.backgroundColor = isLight ? 'rgba(255,255,255,0.85)' : '#0c0c10';
    }
  }
  window.addEventListener('scroll', updateHeaderStyle);
  updateHeaderStyle();

  // --- Navigation Offset Handler for Sticky Navbar ---
  const navLinks = document.querySelectorAll('.nav-link, .btn-resume');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId.startsWith('#')) {
        e.preventDefault();
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          const headerHeight = header.offsetHeight;
          const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      }
    });
  });
});
