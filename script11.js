document.addEventListener('DOMContentLoaded', () => {
  // --- Scroll-triggered fade-ins ---
  const fadeElements = document.querySelectorAll('.fade-in');
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  fadeElements.forEach(el => observer.observe(el));

  // --- Card-stack entrance scale: each sticky work-card starts
  // enlarged ("full screen") and shrinks to its actual size as it
  // slides from the bottom of the viewport up to its pinned position
  // — matches hiss.sydney's behavior (their CSS has no scale values
  // for this — checked directly — so it's GSAP/ScrollTrigger-driven
  // there; this is a vanilla-JS equivalent, not a byte-for-byte port).
  //
  // Each .work-card-wrap is exactly 100vh with no extra spacer (same
  // as hiss's .yearbook_collection_item), so there's no separate
  // "hold" period distinct from the entrance — the card's entire
  // transition from "just entering at the bottom" to "pinned at the
  // top" IS the shrink animation. Progress is computed LIVE every
  // frame from getBoundingClientRect().top (always accurate — no
  // precomputed/cached offset that can go stale when fonts or images
  // finish loading and shift the layout, which was the actual bug in
  // the previous version of this effect: offsetTop was captured once
  // at DOMContentLoaded, before layout had settled).
  const cardWraps = Array.from(document.querySelectorAll('.work-card-wrap'));
  if (cardWraps.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const START_SCALE = 1.12;
    let cardTicking = false;

    const updateCardScales = () => {
      const viewportHeight = window.innerHeight;
      cardWraps.forEach((wrap) => {
        const card = wrap.querySelector('.work-card');
        if (!card) return;
        const top = wrap.getBoundingClientRect().top;
        // top === viewportHeight: card just entering at the bottom edge (progress 0).
        // top === 0: card fully arrived and pinned (progress 1, holds here).
        const progress = Math.min(Math.max(1 - top / viewportHeight, 0), 1);
        const scale = START_SCALE - (START_SCALE - 1) * progress;
        card.style.transform = `scale(${scale})`;
      });
      cardTicking = false;
    };

    window.addEventListener('scroll', () => {
      if (!cardTicking) {
        window.requestAnimationFrame(updateCardScales);
        cardTicking = true;
      }
    }, { passive: true });

    window.addEventListener('resize', updateCardScales);
    window.addEventListener('load', updateCardScales);

    updateCardScales();
  }

  // --- Mobile menu toggle ---
  const header = document.querySelector('header');
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  menuBtn.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(isOpen));
  });

  header.addEventListener('focusin', () => header.classList.remove('nav--hidden'));

  // --- Hide nav on scroll down, reveal on scroll up ---
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lastScrollY = window.scrollY;
  let scrollTicking = false;

  if (!prefersReducedMotion) {
    window.addEventListener('scroll', () => {
      if (scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const scrolledPastThreshold = currentScrollY > 120;
        const scrollingDown = currentScrollY > lastScrollY;

        if (!mobileMenu.classList.contains('open') && !header.contains(document.activeElement)) {
          header.classList.toggle('nav--hidden', scrollingDown && scrolledPastThreshold);
        }

        lastScrollY = currentScrollY;
        scrollTicking = false;
      });
    }, { passive: true });
  }

  // --- Custom cursor: precise dot + a trail of small roaming particles,
  // plus a ring that appears only on hover (grows further + labels "View"
  // over work cards). Only on fine-pointer devices with motion allowed —
  // touch/reduced-motion get the native cursor untouched. ---
  const cursorDot = document.querySelector('.cursor-dot');
  const cursorRing = document.querySelector('.cursor-ring');
  const cursorLabel = document.querySelector('.cursor-ring-label');
  const particleCanvas = document.querySelector('.cursor-particles');
  const supportsFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (cursorDot && cursorRing && particleCanvas && supportsFinePointer && !prefersReducedMotion) {
    document.body.classList.add('cursor-active');

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let cursorInFooter = false;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
    });

    (function animateRing() {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(animateRing);
    })();

    // Small dots spawn as the cursor moves, drift with a bit of their own
    // independent motion ("roaming"), shrink and fade, then disappear.
    const ctx = particleCanvas.getContext('2d');
    const particleColor = getComputedStyle(document.documentElement).getPropertyValue('--brand-dark').trim();
    const particleColorFooter = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    let particles = [];
    const MAX_PARTICLES = 50;

    function resizeCanvas() {
      particleCanvas.width = window.innerWidth;
      particleCanvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    window.addEventListener('mousemove', () => {
      if (particles.length >= MAX_PARTICLES) particles.shift();
      particles.push({
        x: mouseX + (Math.random() - 0.5) * 6,
        y: mouseY + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: 1.5 + Math.random() * 2,
        life: 0,
        maxLife: 40 + Math.random() * 30,
        color: cursorInFooter ? particleColorFooter : particleColor,
      });
    });

    (function animateParticles() {
      ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
      particles = particles.filter((p) => p.life < p.maxLife);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life += 1;
        const progress = p.life / p.maxLife;
        const alpha = 1 - progress;
        const radius = p.radius * (1 - progress * 0.6);
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(radius, 0), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha * 0.7;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      requestAnimationFrame(animateParticles);
    })();

    // Grow the dot itself (no ring, no label) over generic interactive
    // elements, including the nav links — a small dot-scale doesn't need
    // the nav exclusion the old 56px ring required.
    document.querySelectorAll('a, button').forEach((el) => {
      el.addEventListener('mouseenter', () => cursorDot.classList.add('cursor-dot--hover'));
      el.addEventListener('mouseleave', () => cursorDot.classList.remove('cursor-dot--hover'));
    });

    // Swap the dot's color (and, below, newly-spawned trail particles) to
    // the site's light background while over the dark maroon footer, in
    // both the dot's resting and hover-grown states.
    const footerEl = document.getElementById('contact');
    if (footerEl) {
      footerEl.addEventListener('mouseenter', () => {
        cursorDot.classList.add('cursor-dot--footer');
        cursorInFooter = true;
      });
      footerEl.addEventListener('mouseleave', () => {
        cursorDot.classList.remove('cursor-dot--footer');
        cursorInFooter = false;
      });
    }

    // Magnetic pull on primary CTAs
    document.querySelectorAll('.contact-cta').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const relX = e.clientX - (rect.left + rect.width / 2);
        const relY = e.clientY - (rect.top + rect.height / 2);
        el.style.transform = `translate(${relX * 0.25}px, ${relY * 0.25}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  // --- Smooth in-page nav, accounting for sticky header ---
  const navLinks = document.querySelectorAll('a[href^="#"]');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId.length > 1) {
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          const headerHeight = header.offsetHeight;
          const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight;
          window.scrollTo({ top: targetPosition, behavior: 'smooth' });
        }
      }
      mobileMenu.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    });
  });
});


// Match the measured Figma text positions without moving the portrait grid.
(() => {
  const hero = document.querySelector('.hero-inner');
  if (!hero) return;
  const targets = [
    [hero.querySelector('.hero-eyebrow'), 'eyebrow', .121, .305],
    [hero.querySelector('.hero-name'), 'name', .05, .350],
    [hero.querySelector('.hero-note'), 'note', .15, .758]
  ];
  let pending = false;
  function alignText() {
    pending = false;
    if (innerWidth <= 860) return;
    const base = hero.getBoundingClientRect();
    // offset positions exclude transforms, making repeated measurements stable.
    targets.forEach(([element, key, x, y]) => {
      if (!element) return;
      hero.style.setProperty(`--figma-${key}-x`, `${base.width*x-element.offsetLeft}px`);
      hero.style.setProperty(`--figma-${key}-y`, `${base.height*y-element.offsetTop}px`);
    });
    const portrait = hero.querySelector('.hero-portrait');
    const subtitle = hero.querySelector('.hero-note');
    if (portrait && subtitle) {
      const current = parseFloat(hero.style.getPropertyValue('--portrait-align-y')) || 0;
      const difference = subtitle.getBoundingClientRect().bottom - portrait.getBoundingClientRect().bottom;
      hero.style.setProperty('--portrait-align-y', `${current + difference}px`);
      const handwritten = hero.querySelector('.hero-handwritten');
      if (handwritten) {
        const portraitTop = portrait.getBoundingClientRect().top - base.top;
        hero.style.setProperty('--handwritten-top', `${portraitTop - handwritten.offsetHeight - 12}px`);
      }
    }
  }
  function schedule() {
    if (!pending) { pending = true; requestAnimationFrame(alignText); }
  }
  new ResizeObserver(schedule).observe(hero);
  window.addEventListener('resize', schedule);
  window.addEventListener('load', schedule);
  document.fonts.ready.then(schedule);
  schedule();
})();


// Active section is shared between desktop and mobile navigation.
(() => {
  const navigation = document.querySelector('header.nav');
  if (!navigation) return;
  const links = Array.from(navigation.querySelectorAll('nav a[href^="#"]'));
  const sections = ['work', 'about', 'experience', 'contact']
    .map(id => document.getElementById(id)).filter(Boolean);
  let queued = false;
  function updateLocation() {
    queued = false;
    const threshold = innerHeight * .4;
    let current = null;
    sections.forEach(section => {
      if (section.getBoundingClientRect().top <= threshold) current = section.id;
    });
    if (scrollY > 0 && scrollY + innerHeight >= document.documentElement.scrollHeight - 4) current = 'contact';
    links.forEach(link => {
      if (link.getAttribute('href') === `#${current}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function scheduleLocation() {
    if (!queued) { queued = true; requestAnimationFrame(updateLocation); }
  }
  window.addEventListener('scroll', scheduleLocation, { passive: true });
  window.addEventListener('resize', scheduleLocation);
  window.addEventListener('load', scheduleLocation);
  document.fonts.ready.then(scheduleLocation);
  scheduleLocation();
})();
