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

  // --- Mobile Menu Toggle ---
  const header = document.querySelector('header');
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  menuBtn.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(isOpen));
  });

  // --- Navigation Offset Handler for Sticky Navbar ---
  const navLinks = document.querySelectorAll('.nav-link, #mobileMenu a, .btn-resume');
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
        mobileMenu.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // --- Hero Background: Cursor-Reactive Particle Pattern ---
  initHeroParticles();
});

function initHeroParticles() {
  const heroSection = document.querySelector('.hero-section');
  const staticPattern = document.querySelector('.hero-pattern');
  if (!heroSection || !staticPattern) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduceMotion || !canHover) return; // keep the static pattern as-is

  const glyphs = ['a', 'b', 'c', 'd', 'e', 'g', 'z', 'f', 'h', 'i', 'j', 'k', 'l', 'm', 't', 'Y', 'n', 'o', 'p', 'q', 'X', 'r', '5', '3', '0'];

  const config = {
    cellW: 46,
    cellH: 52,
    fontSize: 50,
    baseAlpha: 0.05,
    peakAlpha: 0.4,
    repelRadius: 90,
    repelStrength: 26,
    spring: 0.18,
    damping: 0.72,
  };

  const canvas = document.createElement('canvas');
  canvas.className = 'hero-particles-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  heroSection.insertBefore(canvas, staticPattern);

  const ctx = canvas.getContext('2d');
  let particles = [];
  let w = 0, h = 0, dpr = 1;
  let mouseX = -9999, mouseY = -9999;
  let rafId = null;
  let isVisible = true;

  function build() {
    const rect = heroSection.getBoundingClientRect();
    w = Math.ceil(rect.width);
    h = Math.ceil(rect.height);
    if (w === 0 || h === 0) return;
    dpr = window.devicePixelRatio || 1;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = `${config.fontSize}px 'Yarndings 12'`;
    ctx.textBaseline = 'top';

    const cols = Math.ceil(w / config.cellW) + 1;
    const rows = Math.ceil(h / config.cellH) + 1;
    const next = [];
    let gi = 0;
    for (let ry = 0; ry < rows; ry++) {
      for (let cx = 0; cx < cols; cx++) {
        const homeX = cx * config.cellW;
        const homeY = ry * config.cellH;
        next.push({ x: homeX, y: homeY, homeX, homeY, vx: 0, vy: 0, ch: glyphs[gi % glyphs.length] });
        gi++;
      }
    }
    particles = next;
    staticPattern.style.display = 'none';
  }

  function updatePointer(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches && e.touches[0];
    mouseX = (touch ? touch.clientX : e.clientX) - rect.left;
    mouseY = (touch ? touch.clientY : e.clientY) - rect.top;
  }

  function onLeave() {
    mouseX = -9999;
    mouseY = -9999;
  }

  function animate() {
    ctx.clearRect(0, 0, w, h);
    const hasMouse = mouseX > -9000;
    const r = config.repelRadius;
    const rSq = r * r;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      let targetX = p.homeX;
      let targetY = p.homeY;
      let alpha = config.baseAlpha;

      if (hasMouse) {
        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        const distSq = dx * dx + dy * dy;
        if (distSq < rSq && distSq > 0.0001) {
          const dist = Math.sqrt(distSq);
          const force = (r - dist) / r;
          const smooth = force * force;
          targetX += (dx / dist) * smooth * config.repelStrength;
          targetY += (dy / dist) * smooth * config.repelStrength;
          alpha = config.baseAlpha + (config.peakAlpha - config.baseAlpha) * smooth;
        }
      }

      p.vx += (targetX - p.x) * config.spring;
      p.vy += (targetY - p.y) * config.spring;
      p.vx *= config.damping;
      p.vy *= config.damping;
      p.x += p.vx;
      p.y += p.vy;

      ctx.fillStyle = `rgba(15, 23, 41, ${alpha})`;
      ctx.fillText(p.ch, p.x, p.y);
    }

    rafId = isVisible ? requestAnimationFrame(animate) : null;
  }

  function start() {
    if (rafId === null) rafId = requestAnimationFrame(animate);
  }

  function stop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  heroSection.addEventListener('mousemove', updatePointer, { passive: true });
  heroSection.addEventListener('mouseleave', onLeave);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 150);
  });

  new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    if (isVisible) start();
    else stop();
  }, { threshold: 0 }).observe(heroSection);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (isVisible) start();
  });

  async function init() {
    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch (e) {}
    }
    build();
    start();
  }

  init();
}
