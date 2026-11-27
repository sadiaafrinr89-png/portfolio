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
        // Mobile cards are ordinary stacked content, not scaled sticky panels.
        if (window.matchMedia('(max-width: 860px)').matches) {
          card.style.removeProperty('transform');
          return;
        }
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
    menuBtn.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mobileMenu.classList.contains('open')) {
      mobileMenu.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.setAttribute('aria-label', 'Open menu');
      menuBtn.focus();
    }
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 860) {
      mobileMenu.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.setAttribute('aria-label', 'Open menu');
    }
  });
  header.addEventListener('focusin', () => header.classList.remove('nav--hidden'));

  // --- Hide nav on scroll down, reveal on scroll up ---
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lastScrollY = window.scrollY;
  let scrollTicking = false;

  window.addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      const currentScrollY = Math.max(0, window.scrollY);
      const delta = currentScrollY - lastScrollY;
      const keepVisible = mobileMenu.classList.contains('open') ||
        header.querySelector(':focus-visible');

      if (currentScrollY <= 120 || keepVisible) {
        header.classList.remove('nav--hidden');
        lastScrollY = currentScrollY;
      } else if (Math.abs(delta) >= 8) {
        header.classList.toggle('nav--hidden', delta > 0);
        lastScrollY = currentScrollY;
      }
      scrollTicking = false;
    });
  }, { passive: true });

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
      if (document.body.classList.contains('cursor-over-control')) return;
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
      el.addEventListener('mouseenter', () => {
        cursorDot.classList.add('cursor-dot--hover');
        document.body.classList.add('cursor-over-control');
        particles = [];
        ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
      });
      el.addEventListener('mouseleave', () => {
        cursorDot.classList.remove('cursor-dot--hover');
        document.body.classList.remove('cursor-over-control');
      });
    });

    // Keep the cursor visible against the filled Resume action.
    document.querySelectorAll('.nav-link--resume, .mobile-menu a[href*="/file/d/1IVp_khQS7Te-f-xGHnGtP85VSrhT9bW0/"]').forEach((el) => {
      el.addEventListener('mouseenter', () => cursorDot.classList.add('cursor-dot--resume'));
      el.addEventListener('mouseleave', () => cursorDot.classList.remove('cursor-dot--resume'));
      el.addEventListener('click', () => cursorDot.classList.remove('cursor-dot--resume'));
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

// Draw the journey spine to the reading position; pulse each milestone only once.
(() => {
  const track = document.querySelector('.journey-track');
  if (!track) return;
  const steps = [...track.querySelectorAll('.journey-step')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pulsed = new WeakSet();
  let queued = false;
  track.classList.add('is-animated');
  function updateJourney() {
    queued = false;
    const rect = track.getBoundingClientRect();
    const bottomInset = innerWidth <= 860 ? 10 : 12;
    const length = Math.max(1, rect.height - 5 - bottomInset);
    const readingY = innerHeight * .68;
    const progress = reduced.matches ? 1 : Math.max(0, Math.min(1, (readingY - rect.top - 5) / length));
    track.style.setProperty('--journey-progress', String(progress));
    steps.forEach(step => {
      const reached = reduced.matches || (progress > 0 && readingY >= rect.top + step.offsetTop + 10);
      step.classList.toggle('is-reached', reached);
      if (reached) {
        step.classList.add('is-revealed');
        if (!reduced.matches && !pulsed.has(step)) {
          pulsed.add(step);
          // Off-screen milestones are filled quietly when arriving via a deep link.
          const dotY = rect.top + step.offsetTop + 10;
          if (dotY >= 0 && dotY <= innerHeight) step.classList.add('is-pulsing');
        }
      }
      if (reduced.matches) step.classList.remove('is-pulsing');
    });
  }
  function scheduleJourney() {
    if (!queued) { queued = true; requestAnimationFrame(updateJourney); }
  }
  steps.forEach(step => step.addEventListener('animationend', event => {
    if (event.animationName === 'journey-milestone') step.classList.remove('is-pulsing');
  }));
  window.addEventListener('scroll', scheduleJourney, { passive: true });
  window.addEventListener('resize', scheduleJourney);
  window.addEventListener('load', scheduleJourney);
  reduced.addEventListener('change', scheduleJourney);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(scheduleJourney).observe(track);
  document.fonts.ready.then(scheduleJourney);
  updateJourney();
})();

// Photos slide along the string; their frames sway independently of their mounts.
(() => {
  document.querySelectorAll('.about-scrapbook').forEach((board, boardIndex) => {
  const rope = board.querySelector('.about-scrapbook-string path');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const configs = { river: .21444, sky: .40807, crochet: .74140 };
  let visible = false, breezeTimer;
  const items = [...board.querySelectorAll('.about-photo-hanger')].map(hanger => ({
    hanger, photo: hanger.querySelector('.about-snapshot'), x: 0, motion: null, drag: null, glide: null,
    pin: Number(hanger.dataset.pin) || configs[hanger.dataset.photo],
  }));
  function sway(item) {
    if (reduced.matches || item.drag || item.glide || !visible) return;
    // Avoid snapping back to rest if a hover arrives during an existing breeze.
    if (item.motion?.playState === 'running') return;
    const frames = Array.from({ length: 121 }, (_, index) => {
      const t = index / 120;
      const envelope = Math.sin(Math.PI * t) ** 2 * Math.exp(-.8 * t);
      const angle = 2.2 * envelope * Math.sin(4 * Math.PI * t);
      return { transform: `rotate(${angle}deg)`, offset: t };
    });
    item.motion = item.photo.animate(frames, { duration: 4600, easing: 'linear' });
  }
  function ropeY(x, width, height) {
    const svgLeft = width * .08701, svgWidth = width * .85539;
    const targetX = clamp((x - svgLeft) / svgWidth * 349 - 1, 0, 347);
    let low = 0, high = rope.getTotalLength();
    for (let i = 0; i < 18; i++) {
      const length = (low + high) / 2;
      if (rope.getPointAtLength(length).x < targetX) low = length; else high = length;
    }
    return (rope.getPointAtLength((low + high) / 2).y + 1) / 57 * height * .24783;
  }
  function place(item, requestedX) {
    const bounds = board.getBoundingClientRect();
    const frame = item.hanger.querySelector('.about-photo-mount').getBoundingClientRect();
    // Undo the previous translation to keep bounds stable during dragging.
    const left = frame.left - bounds.left - item.x;
    const right = frame.right - bounds.left - item.x;
    const x = clamp(requestedX, 8 - left, bounds.width - 8 - right);
    const y = ropeY(item.pin * bounds.width + x, bounds.width, bounds.height)
      - ropeY(item.pin * bounds.width, bounds.width, bounds.height);
    item.x = x;
    item.hanger.style.setProperty('--photo-x', `${x}px`);
    item.hanger.style.setProperty('--photo-y', `${y}px`);
  }
  function stopGlide(item) {
    if (item.glide) cancelAnimationFrame(item.glide.frame);
    item.glide = null;
  }
  function glide(item, velocity) {
    stopGlide(item);
    if (reduced.matches || !visible || document.hidden || Math.abs(velocity) < .025) { sway(item); return; }
    const bounds = board.getBoundingClientRect();
    const frame = item.hanger.querySelector('.about-photo-mount').getBoundingClientRect();
    const low = 8 - (frame.left - bounds.left - item.x);
    const high = bounds.width - 8 - (frame.right - bounds.left - item.x);
    const speed = clamp(velocity, -1.1, 1.1);
    const target = clamp(item.x + speed / .006, low, high);
    const distance = target - item.x;
    if (Math.abs(distance) < .5) { sway(item); return; }
    const state = { start: item.x, target, time: performance.now(), duration: clamp(3 * Math.abs(distance / speed), 450, 1600), frame: null };
    item.glide = state;
    function tick(now) {
      if (item.glide !== state) return;
      const t = clamp((now - state.time) / state.duration, 0, 1);
      // Ease to zero speed at the destination, including either end stop.
      const eased = 1 - (1 - t) ** 3;
      place(item, state.start + distance * eased);
      if (t >= 1) { item.glide = null; sway(item); return; }
      state.frame = requestAnimationFrame(tick);
    }
    state.frame = requestAnimationFrame(tick);
  }
  items.forEach(item => {
    const photo = item.photo;
    photo.addEventListener('pointerenter', event => {
      if (fine.matches && event.pointerType !== 'touch') sway(item);
    });
    photo.addEventListener('focus', () => sway(item));
    photo.addEventListener('pointerdown', event => {
      if ((event.pointerType === 'mouse' && event.button !== 0) || item.drag) return;
      stopGlide(item);
      item.motion?.cancel();
      item.drag = { id: event.pointerId, startX: event.clientX, startY: event.clientY, origin: item.x, moving: false, lastTime: event.timeStamp, velocity: 0 };
      photo.setPointerCapture(event.pointerId);
    });
    photo.addEventListener('pointermove', event => {
      const drag = item.drag;
      if (!drag || event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.startX, dy = event.clientY - drag.startY;
      if (!drag.moving) {
        if (event.pointerType === 'touch' && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 6) {
          item.drag = null; photo.releasePointerCapture(event.pointerId); return;
        }
        if (Math.abs(dx) < 4) return;
        drag.moving = true; item.hanger.classList.add('is-dragging');
      }
      if (event.cancelable) event.preventDefault();
      const previousX = item.x;
      place(item, drag.origin + dx);
      const dt = Math.max(1, event.timeStamp - drag.lastTime);
      const speed = (item.x - previousX) / dt;
      drag.velocity = dt > 100 ? speed : drag.velocity * .45 + speed * .55;
      drag.lastTime = event.timeStamp;
    });
    function finish(event) {
      if (!item.drag || event.pointerId !== item.drag.id) return;
      const drag = item.drag;
      const paused = Math.max(0, event.timeStamp - drag.lastTime);
      const velocity = drag.velocity * Math.exp(-paused / 80);
      item.drag = null; item.hanger.classList.remove('is-dragging');
      if (photo.hasPointerCapture(event.pointerId)) photo.releasePointerCapture(event.pointerId);
      if (event.type === 'pointerup' && drag.moving) glide(item, velocity);
      else sway(item);
    }
    photo.addEventListener('pointerup', finish);
    photo.addEventListener('pointercancel', finish);
    photo.addEventListener('lostpointercapture', finish);
    photo.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'Enter', ' '].includes(event.key)) return;
      event.preventDefault(); stopGlide(item); item.motion?.cancel();
      if (event.key === 'Home') place(item, 0);
      else if (event.key.startsWith('Arrow')) {
        const step = board.getBoundingClientRect().width * (event.shiftKey ? .06 : .02);
        place(item, item.x + (event.key === 'ArrowRight' ? step : -step));
      }
      sway(item);
    });
  });
  // Retain the occasional middle-photo breeze, only while the collage is visible.
  function scheduleBreeze(delay = 13000) {
    clearTimeout(breezeTimer);
    if (!visible || reduced.matches || document.hidden) return;
    breezeTimer = setTimeout(() => {
      const middle = items.find(item => item.hanger.dataset.photo === 'sky');
      if (middle && !board.querySelector('.is-dragging')) sway(middle);
      scheduleBreeze();
    }, delay);
  }
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (!visible) items.forEach(stopGlide);
    scheduleBreeze(1200 + boardIndex * 2600);
  }, { threshold: .25 }).observe(board);
  reduced.addEventListener('change', () => {
    if (reduced.matches) items.forEach(item => { stopGlide(item); item.motion?.cancel(); });
    scheduleBreeze();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) items.forEach(item => { stopGlide(item); item.motion?.cancel(); });
    scheduleBreeze();
  });
  let previousWidth = board.getBoundingClientRect().width;
  new ResizeObserver(() => {
    const width = board.getBoundingClientRect().width;
    if (width === previousWidth) return;
    items.forEach(stopGlide);
    const ratio = width / (previousWidth || width);
    // Reset existing translations before recomputing their resized boundaries.
    const positions = items.map(item => item.x * ratio);
    items.forEach(item => { item.x = 0; item.hanger.style.setProperty('--photo-x', '0px'); item.hanger.style.setProperty('--photo-y', '0px'); });
    items.forEach((item, index) => place(item, positions[index]));
    previousWidth = width;
  }).observe(board);
  });
})();
