// This page never loads the homepage's cursor, physics, portrait, or card scripts.
(() => {
  'use strict';
  const dialog = document.querySelector('.case-image-dialog');
  const image = document.getElementById('case-image-expanded');
  const caption = document.getElementById('case-image-caption');
  const original = document.getElementById('case-image-original');
  let trigger = null;
  document.querySelectorAll('[data-image]').forEach(button => {
    button.addEventListener('click', () => {
      if (!dialog || typeof dialog.showModal !== 'function') {
        window.open(button.dataset.image, '_blank', 'noopener');
        return;
      }
      trigger = button;
      image.src = button.dataset.image;
      image.alt = button.querySelector('img').alt;
      caption.textContent = button.dataset.caption;
      original.href = button.dataset.image;
      dialog.showModal();
    });
  });
  document.getElementById('case-image-close')?.addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog?.addEventListener('close', () => trigger?.focus());

  const sections = [...document.querySelectorAll('.case-section')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!reduced.matches && 'IntersectionObserver' in window) {
    // Only hide sections below the initial viewport; content stays visible without JS.
    const reveals = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('is-pending');
          reveals.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });
    sections.forEach(section => {
      if (section.getBoundingClientRect().top > innerHeight) {
        section.classList.add('is-pending'); reveals.observe(section);
      }
    });
    document.body.classList.add('case-motion-ready');
    reduced.addEventListener('change', () => {
      if (reduced.matches) sections.forEach(section => section.classList.remove('is-pending'));
    });
  }

  const links = [...document.querySelectorAll('.case-contents a')];
  let queued = false;
  function updateReading() {
    queued = false;
    const distance = document.documentElement.scrollHeight - innerHeight;
    document.documentElement.style.setProperty('--case-progress', String(distance > 0 ? Math.max(0, Math.min(1, scrollY / distance)) : 1));
    let current = null;
    links.forEach(link => {
      const target = document.getElementById(link.hash.slice(1));
      if (target && target.getBoundingClientRect().top <= innerHeight * .35) current = link;
    });
    links.forEach(link => {
      if (link === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function scheduleReading() {
    if (!queued) { queued = true; requestAnimationFrame(updateReading); }
  }
  window.addEventListener('scroll', scheduleReading, { passive: true });
  window.addEventListener('resize', scheduleReading);
  window.addEventListener('load', scheduleReading);
  document.fonts.ready.then(scheduleReading);
  updateReading();
})();
