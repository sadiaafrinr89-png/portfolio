/* --- Footer flower playground ---
   Four flowers extracted from "Four Flowers — Editable SVG.svg" (original
   600x600 canvas), each given its own tight viewBox computed directly from
   its path coordinates (not estimated), background path removed. Petal fill
   + outline pairs are grouped by their shared index (Petal Fill 0N / Petal
   Outline 0N) since that's the pairing the source file's own IDs already
   imply. Each petal group carries --dx/--dy/--rot custom properties — the
   direction from the flower's own bbox center to that petal's centroid,
   computed from the real path geometry, scaled to an 11-unit spread — so
   the CSS bloom transition pushes petals outward along their actual
   position instead of a guessed direction.

   Physics: Matter.js (CDN), circular bodies approximating each flower's
   footprint (per the brief: no pixel-perfect SVG collision). Dragging is
   custom pointer-event code, not Matter's MouseConstraint, so touch-action
   can be scoped to individual flower elements only — dragging a flower
   never blocks page scroll elsewhere in the footer. */
document.addEventListener('DOMContentLoaded', () => {
  const footer = document.getElementById('contact');
  const layer = document.getElementById('footerFlowers');
  if (!footer || !layer || typeof Matter === 'undefined') return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 860px)').matches;

  // --- Keeps flowers (physics-settled or reduced-motion-scattered) from
  // resting on top of the sitemap: a rect in layer-local coordinates
  // spanning from just above the sitemap column down to the floor, so a
  // flower can only be deflected away from it, never placed inside it. ---
  const sitemapEl = footer.querySelector('.ftr-sitemap');
  function sitemapExclusionRect() {
    if (!sitemapEl) return null;
    const pad = 20;
    const layerRect = layer.getBoundingClientRect();
    const r = sitemapEl.getBoundingClientRect();
    return {
      left: r.left - layerRect.left - pad,
      top: r.top - layerRect.top - pad,
      right: r.right - layerRect.left + pad,
      bottom: layerRect.height + pad,
    };
  }
  function overlapsRect(x, y, size, rect) {
    return !!rect && x < rect.right && x + size > rect.left && y < rect.bottom && y + size > rect.top;
  }

  // --- Flower definitions: viewBox + fill/outline colors + 5 petal pairs,
  // each petal's bloom vector (dx, dy, rot) derived from its own centroid
  // relative to the flower's bbox center. ---
  const FLOWERS = [
    {
      viewBox: '94 92 206 197',
      fill: '#A7B39A',
      outline: '#B58C87',
      petals: [
        { dx: -3.8, dy: -10.3, rot: -6, fillD: 'M195 182C175 161 131 135 141 118C148 105 172 105 182 115C194 130 195 160 195 182Z', outlineD: 'M195 175C176 159 151 124 159 109C165 97.9998 184 104 192 117C205 134 201 157 195 175Z' },
        { dx: 7.8, dy: -7.7, rot: 5, fillD: 'M192 183C196 151 209 106 235 103C258 99.9997 270 114 263 134C256 156 219 171 192 183Z', outlineD: 'M202 174C222 150 241 121 264 129C284 136 286 154 273 170C261 184 235 182 213 189' },
        { dx: 9.4, dy: 5.8, rot: -4, fillD: 'M196 185C225 183 262 175 278 190C294 205 286 233 270 240C241 252 218 219 196 185Z', outlineD: 'M213 189C238 200 276 218 278 239C281 257 268 270 252 269C226 270 210 235 204 195' },
        { dx: -3.7, dy: 10.4, rot: 6, fillD: 'M200 185C206 213 209 260 193 273C181 283 169 272 170 255C169 228 183 204 200 185Z', outlineD: 'M204 195C201 226 186 268 170 274C149 283 150 260 158 239C164 222 172 209 178 202' },
        { dx: -10.9, dy: -1.1, rot: -5, fillD: 'M198 183C169 174 123 150 110 168C100 183 104 215 120 220C141 227 173 204 198 183Z', outlineD: 'M178 202C156 203 133 213 119 201C107 192 104 164 114 154C132 135 163 160 186 170' },
      ],
    },
    {
      viewBox: '302 93 207 197',
      fill: '#B58C87',
      outline: '#A7B39A',
      petals: [
        { dx: -4.5, dy: -10.0, rot: -6, fillD: 'M401 180C384 156 353 118 364 107C372 100 389 105 396 116C407 133 404 156 401 180Z', outlineD: 'M393 168C371 156 339 128 344 116C348 104 370 105 381 117C392 132 396 155 393 168Z' },
        { dx: 7.2, dy: -8.3, rot: 5, fillD: 'M398 184C414 159 439 123 464 128C481 131 491 151 480 166C465 185 426 184 398 184Z', outlineD: 'M402 169C406 146 421 109 441 105C462 99 475 111 474 128C474 149 444 161 420 176' },
        { dx: 9.5, dy: 5.6, rot: -4, fillD: 'M405 185C430 198 466 208 478 231C489 253 474 271 453 269C426 268 414 226 405 185Z', outlineD: 'M420 176C445 179 481 184 492 200C503 216 492 235 478 240C451 250 432 222 410 189' },
        { dx: -4.2, dy: 10.2, rot: 6, fillD: 'M402 187C402 214 395 261 377 273C360 283 356 267 361 247C366 223 383 200 402 187Z', outlineD: 'M410 189C414 219 414 262 400 274C389 284 378 267 378 249C377 231 383 213 389 201' },
        { dx: -10.9, dy: -1.2, rot: -5, fillD: 'M403 180C380 172 345 138 323 150C309 157 314 187 324 200C338 217 375 200 403 193V180Z', outlineD: 'M389 201C368 210 341 229 325 217C314 209 308 184 316 172C331 153 364 168 384 169' },
      ],
    },
    {
      viewBox: '92 319 209 197',
      fill: '#B58C87',
      outline: '#A7B39A',
      petals: [
        { dx: -4.8, dy: -9.9, rot: -6, fillD: 'M188 404C174 384 145 349 154 335C160 326 177 328 186 338C198 354 196 382 188 404Z', outlineD: 'M182 395.001C163 383.001 130 357.001 134 345.001C138 331.001 157 329.001 169 343.001C180 357.001 185 379.001 182 395.001Z' },
        { dx: 7.1, dy: -8.4, rot: 5, fillD: 'M187 407C202 384 230 347 254 354C272 359 282 381 270 393C253 410 218 405 187 407Z', outlineD: 'M191 394C197 371 210 335 233 330C253 325 267 336 265 353C263 374 235 389 210 402' },
        { dx: 9.4, dy: 5.7, rot: -4, fillD: 'M194 410C218 425 254 435 268 457C279 476 264 496 244 494C216 494 204 451 194 410Z', outlineD: 'M210 402C236 405 272 409 283 426C295 443 282 461 268 466C240 476 221 449 201 416' },
        { dx: -4.4, dy: 10.1, rot: 6, fillD: 'M189 412C191 441 185 485 168 498C151 510 146 494 151 473C156 450 172 426 189 412Z', outlineD: 'M201 416C206 446 204 486 190 499C178 509 169 493 169 474C169 458 173 439 179 427' },
        { dx: -10.9, dy: -1.3, rot: -5, fillD: 'M191 403.001C168 390.001 133 362.001 113 377.001C100 387.001 103 413.001 113 426.001C127 443.001 164 425.001 191 419.001V403.001Z', outlineD: 'M179 427C156 436 132 455 116 442C105 434 98.0001 408 108 397C123 379 154 394 173 395' },
      ],
    },
    {
      viewBox: '304 318 204 197',
      fill: '#A7B39A',
      outline: '#B58C87',
      petals: [
        { dx: -4.1, dy: -10.2, rot: -6, fillD: 'M405 408.001C384 387.001 338 356.001 345 341.001C352 329.001 375 331.001 385 343.001C397 359.001 401 388.001 405 408.001Z', outlineD: 'M403 400.001C385 384.001 361 350.001 368 335.001C373 324.001 391 329.001 400 342.001C413 358.001 409 383.001 403 400.001Z' },
        { dx: 7.8, dy: -7.7, rot: 5, fillD: 'M401 409C405 377 420 333 444 329C467 326 478 340 472 359C466 381 430 397 401 409Z', outlineD: 'M410 399C431 376 452 346 474 354C493 362 496 379 482 395C468 409 446 407 423 415' },
        { dx: 9.4, dy: 5.7, rot: -4, fillD: 'M406 412.001C433 408.001 471 401.001 488 417.001C502 433.001 495 460.001 479 466.001C453 477.001 427 445.001 406 412.001Z', outlineD: 'M423 415C449 426 485 445 487 465C490 482 477 495 462 494C434 495 419 460 413 422' },
        { dx: -3.6, dy: 10.4, rot: 6, fillD: 'M410 412C418 442 418 485 403 498C390 509 378 496 379 479C379 453 394 430 410 412Z', outlineD: 'M413 422C409 454 395 492 379 499C359 509 360 485 368 464C373 449 381 435 387 428' },
        { dx: -10.9, dy: -1.1, rot: -5, fillD: 'M408 410C378 401 335 376 320 394C310 410 315 438 331 445C352 453 384 430 408 410Z', outlineD: 'M387 428C364 430 343 440 328 427C316 416 314 391 324 379C341 361 373 385 396 396' },
      ],
    },
  ];

  function flowerSVGMarkup(def) {
    const petalGroups = def.petals.map((p) => (
      `<g class="fw-petal" style="--dx:${p.dx}px;--dy:${p.dy}px;--rot:${p.rot}deg;">` +
        `<path d="${p.fillD}" fill="${def.fill}"/>` +
        `<path d="${p.outlineD}" fill="none" stroke="${def.outline}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` +
      `</g>`
    )).join('');
    return `<svg class="fw-flower-svg" viewBox="${def.viewBox}" aria-hidden="true" focusable="false">${petalGroups}</svg>`;
  }

  // --- Sizing tiers ---
  const TIERS = isMobile
    ? [{ min: 40, max: 54, weight: 0.55 }, { min: 56, max: 70, weight: 0.32 }, { min: 72, max: 82, weight: 0.13 }]
    : [{ min: 55, max: 70, weight: 0.5 }, { min: 72, max: 88, weight: 0.33 }, { min: 90, max: 105, weight: 0.17 }];

  function pickTier() {
    const r = Math.random();
    let acc = 0;
    for (const t of TIERS) {
      acc += t.weight;
      if (r <= acc) return t;
    }
    return TIERS[TIERS.length - 1];
  }

  const COUNT = isMobile
    ? 14
    : 28;

  // --- Reduced motion: static scattered arrangement, no physics, no fall. ---
  if (prefersReducedMotion) {
    const layerRect = () => layer.getBoundingClientRect();
    for (let i = 0; i < COUNT; i++) {
      const tier = pickTier();
      const size = tier.min + Math.random() * (tier.max - tier.min);
      const def = FLOWERS[i % FLOWERS.length];
      const el = document.createElement('div');
      el.className = 'fw-flower';
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.innerHTML = flowerSVGMarkup(def);
      layer.appendChild(el);
      // Placed after append so layer height is already resolved.
      requestAnimationFrame(() => {
        const r = layerRect();
        const guard = sitemapExclusionRect();
        let x, y;
        for (let attempt = 0; attempt < 8; attempt++) {
          x = Math.random() * Math.max(r.width - size, 0);
          y = r.height - size - Math.random() * (size * 1.5) - 8;
          if (!overlapsRect(x, Math.max(y, 0), size, guard)) break;
        }
        el.style.transform = `translate3d(${x}px, ${Math.max(y, 0)}px, 0) rotate(${(Math.random() - 0.5) * 50}deg)`;
      });
    }
    return;
  }

  // --- Full physics build, deferred until the footer first enters view. ---
  let started = false;
  let engine, runner, world;
  let groundBody, leftWall, rightWall, sitemapGuard;
  const flowerEls = [];
  const flowerBodies = [];

  function layerSize() {
    const r = layer.getBoundingClientRect();
    return { width: r.width, height: r.height, rect: r };
  }

  // --- Cursor-based flower repulsion: lets a visitor "part" a resting pile
  // by moving the pointer through it. Pure Matter.js forces applied on the
  // engine's own 'beforeUpdate' tick, not CSS — see applyCursorRepulsion().
  // #footerFlowers has pointer-events:none (so flowers never block footer
  // links), so cursor position is tracked on the footer element itself;
  // that way the effect still fires over empty gaps between flowers, not
  // just when hovering a flower's own hit area. Skipped entirely on
  // touch/coarse pointers (dragging stays untouched either way). ---
  const supportsHoverRepulsion = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const cursor = { active: false, x: 0, y: 0 };
  const REPULSE_RADIUS = isMobile ? 90 : 130;
  const REPULSE_DAMP_RADIUS = REPULSE_RADIUS * 1.25;
  const REPULSE_MIN_DIST = 6;
  const REPULSE_MAX_ACCEL = 0.009;
  const REPULSE_LIFT_ACCEL = 0.0032;
  const BASE_FRICTION_AIR = 0.018; // matches the frictionAir set per flower in spawnFlower()
  const REPULSE_FRICTION_AIR = 0.06;

  function applyCursorRepulsion() {
    for (let i = 0; i < flowerBodies.length; i++) {
      const body = flowerBodies[i];
      const el = flowerEls[i];
      if (el.dataset.dragging === '1') continue; // dragged flower is exempt; its neighbours still react

      if (!cursor.active) {
        if (body.frictionAir !== BASE_FRICTION_AIR) body.frictionAir = BASE_FRICTION_AIR;
        continue;
      }

      const dx = body.position.x - cursor.x;
      const dy = body.position.y - cursor.y;
      const distSq = dx * dx + dy * dy;

      if (distSq > REPULSE_DAMP_RADIUS * REPULSE_DAMP_RADIUS) {
        if (body.frictionAir !== BASE_FRICTION_AIR) body.frictionAir = BASE_FRICTION_AIR;
        continue;
      }

      // Extra air friction near the cursor damps the push/settle cycle so
      // flowers ease into a resting gap instead of oscillating against it.
      body.frictionAir = REPULSE_FRICTION_AIR;
      if (distSq >= REPULSE_RADIUS * REPULSE_RADIUS) continue;

      const dist = Math.max(Math.sqrt(distSq), REPULSE_MIN_DIST);
      let nx, ny;
      if (distSq < 1) {
        // Cursor sits almost exactly on the body's center: fall back to a
        // stable per-flower direction instead of dividing by ~0.
        const angle = (i * 2.399963) % (Math.PI * 2);
        nx = Math.cos(angle);
        ny = Math.sin(angle);
      } else {
        nx = dx / dist;
        ny = dy / dist;
      }

      const t = 1 - dist / REPULSE_RADIUS;
      const falloff = t * t * (3 - 2 * t); // smoothstep: strong at the cursor, ~0 at the radius edge
      const forceMag = REPULSE_MAX_ACCEL * falloff * body.mass;
      const liftMag = REPULSE_LIFT_ACCEL * falloff * body.mass;

      Matter.Body.applyForce(body, body.position, {
        x: nx * forceMag,
        y: ny * forceMag - liftMag, // negative y = up
      });
    }
  }

  function trackCursor(e) {
    const r = layer.getBoundingClientRect();
    cursor.x = e.clientX - r.left;
    cursor.y = e.clientY - r.top;
    cursor.active = true;
  }
  function releaseCursor() { cursor.active = false; }

  if (supportsHoverRepulsion) {
    footer.addEventListener('pointermove', trackCursor);
    footer.addEventListener('pointerleave', releaseCursor);
    footer.addEventListener('pointercancel', releaseCursor);
  }

  function buildSitemapGuard() {
    const rect = sitemapExclusionRect();
    if (!rect) return null;
    const w = rect.right - rect.left;
    const h = rect.bottom - rect.top;
    if (w <= 0 || h <= 0) return null;
    return Matter.Bodies.rectangle(rect.left + w / 2, rect.top + h / 2, w, h, { isStatic: true, friction: 0.6 });
  }

  function buildWorld() {
    engine = Matter.Engine.create();
    engine.gravity.y = 0.85;
    world = engine.world;

    const { width, height } = layerSize();
    const wallThickness = 60;
    groundBody = Matter.Bodies.rectangle(width / 2, height + wallThickness / 2, width * 2, wallThickness, { isStatic: true, friction: 0.6 });
    leftWall = Matter.Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height * 4, { isStatic: true });
    rightWall = Matter.Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height * 4, { isStatic: true });
    sitemapGuard = buildSitemapGuard();
    const boundaries = [groundBody, leftWall, rightWall];
    if (sitemapGuard) boundaries.push(sitemapGuard);
    Matter.World.add(world, boundaries);
    Matter.Events.on(engine, 'beforeUpdate', applyCursorRepulsion);

    runner = Matter.Runner.create();
  }

  function spawnFlower(index) {
    const tier = pickTier();
    const size = tier.min + Math.random() * (tier.max - tier.min);
    const def = FLOWERS[index % FLOWERS.length];
    const { width } = layerSize();

    const el = document.createElement('div');
    el.className = 'fw-flower';
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.innerHTML = flowerSVGMarkup(def);
    layer.appendChild(el);

    const margin = size / 2 + 4;
    const x = margin + Math.random() * Math.max(width - margin * 2, 1);
    const y = -size - Math.random() * 200;

    const body = Matter.Bodies.circle(x, y, size * 0.42, {
      restitution: 0.32,
      friction: 0.45,
      frictionAir: 0.018,
      density: 0.0012,
      angle: (Math.random() - 0.5) * Math.PI,
    });
    Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.18);
    Matter.Body.setVelocity(body, { x: (Math.random() - 0.5) * 2, y: 0 });

    Matter.World.add(world, body);
    flowerEls.push(el);
    flowerBodies.push(body);

    wireInteractions(el, body, size);
  }

  function syncFrame() {
    for (let i = 0; i < flowerBodies.length; i++) {
      const body = flowerBodies[i];
      const el = flowerEls[i];
      if (el.dataset.dragging === '1') continue; // dragged flower follows the pointer instead
      const size = parseFloat(el.style.width);
      const x = body.position.x - size / 2;
      const y = body.position.y - size / 2;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${body.angle}rad)`;
    }
    rafId = requestAnimationFrame(syncFrame);
  }
  let rafId = null;

  // --- Hover bloom + drag/throw, per flower. ---
  function wireInteractions(el, body, size) {
    el.style.touchAction = 'none';
    let isHovering = false;
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let lastMoves = [];

    const setBloom = (on) => el.classList.toggle('is-bloom', on);

    el.addEventListener('pointerenter', () => {
      isHovering = true;
      setBloom(true);
    });
    el.addEventListener('pointerleave', () => {
      isHovering = false;
      if (!isDragging) setBloom(false);
    });

    el.addEventListener('pointerdown', (e) => {
      isDragging = true;
      el.dataset.dragging = '1';
      el.classList.add('is-dragging');
      el.setPointerCapture(e.pointerId);
      const layerRect = layer.getBoundingClientRect();
      const px = e.clientX - layerRect.left;
      const py = e.clientY - layerRect.top;
      dragOffsetX = px - body.position.x;
      dragOffsetY = py - body.position.y;
      lastMoves = [{ x: body.position.x, y: body.position.y, t: performance.now() }];
      Matter.Body.setAngularVelocity(body, 0);
    });

    el.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const layerRect = layer.getBoundingClientRect();
      const px = e.clientX - layerRect.left - dragOffsetX;
      const py = e.clientY - layerRect.top - dragOffsetY;
      Matter.Body.setPosition(body, { x: px, y: py });
      Matter.Body.setVelocity(body, { x: 0, y: 0 });
      el.style.transform = `translate3d(${px - size / 2}px, ${py - size / 2}px, 0) rotate(${body.angle}rad)`;
      const now = performance.now();
      lastMoves.push({ x: px, y: py, t: now });
      if (lastMoves.length > 5) lastMoves.shift();
    });

    function endDrag(e) {
      if (!isDragging) return;
      isDragging = false;
      el.dataset.dragging = '0';
      el.classList.remove('is-dragging');
      if (!isHovering) setBloom(false);
      try { el.releasePointerCapture(e.pointerId); } catch (err) { /* no-op */ }

      let vx = 0, vy = 0;
      if (lastMoves.length >= 2) {
        const first = lastMoves[0];
        const last = lastMoves[lastMoves.length - 1];
        const dt = Math.max(last.t - first.t, 1);
        vx = ((last.x - first.x) / dt) * 16;
        vy = ((last.y - first.y) / dt) * 16;
      }
      const MAX_V = 28;
      vx = Math.max(-MAX_V, Math.min(MAX_V, vx));
      vy = Math.max(-MAX_V, Math.min(MAX_V, vy));
      Matter.Body.setVelocity(body, { x: vx, y: vy });
    }

    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointercancel', endDrag);

    // Participate in the site's custom cursor ring, like other hoverables.
    const cursorRing = document.querySelector('.cursor-ring');
    if (cursorRing && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      el.addEventListener('pointerenter', () => cursorRing.classList.add('cursor-ring--hover'));
      el.addEventListener('pointerleave', () => cursorRing.classList.remove('cursor-ring--hover'));
    }
  }

  function startDrop() {
    if (started) return;
    started = true;
    buildWorld();
    Matter.Runner.run(runner, engine);
    rafId = requestAnimationFrame(syncFrame);

    const dropWindowMs = 1500 + Math.random() * 1000;
    for (let i = 0; i < COUNT; i++) {
      const delay = (i / COUNT) * dropWindowMs + Math.random() * 120;
      setTimeout(() => spawnFlower(i), delay);
    }
  }

  // --- Trigger once when the footer first enters the viewport. ---
  const startObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        startDrop();
        obs.disconnect();
      }
    });
  }, { threshold: 0.15 });
  startObserver.observe(footer);

  // --- Pause the simulation (not reset) when the footer is fully out of
  // view, resume when it's back — keeps resting positions intact. ---
  const visibilityObserver = new IntersectionObserver((entries) => {
    if (!started || !runner) return;
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (!runner.enabled) { runner.enabled = true; if (!rafId) rafId = requestAnimationFrame(syncFrame); }
      } else if (runner.enabled) {
        runner.enabled = false;
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      }
    });
  }, { threshold: 0 });
  visibilityObserver.observe(footer);

  // --- Resize: move the boundaries to match the footer's new size without
  // discarding any flower's current position/velocity. ---
  let resizeTicking = false;
  window.addEventListener('resize', () => {
    if (!started || resizeTicking) return;
    resizeTicking = true;
    requestAnimationFrame(() => {
      const { width, height } = layerSize();
      Matter.Body.setPosition(groundBody, { x: width / 2, y: height + 30 });
      Matter.Body.setPosition(leftWall, { x: -30, y: height / 2 });
      Matter.Body.setPosition(rightWall, { x: width + 30, y: height / 2 });
      if (sitemapGuard) Matter.World.remove(world, sitemapGuard);
      sitemapGuard = buildSitemapGuard();
      if (sitemapGuard) Matter.World.add(world, sitemapGuard);
      resizeTicking = false;
    });
  });
});
