/* A travelling breeze: anchored roots, flowing hair and a localized sleeve flutter; bodice and scarf stay still.
   No generated frames or copied image bands; the original is the fallback. */
(() => {
  'use strict';
  const portrait = document.querySelector('.hero-portrait');
  if (!portrait) return;
  const image = portrait.querySelector('.hero-portrait-still');
  const canvas = portrait.querySelector('canvas');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let gl, program, frame = 0, elapsed = 0, last = 0;
  let inView = false, ready = false;
  let paint = null;
  const vertex = `
    attribute vec2 position;
    varying vec2 uv;
    void main() {
      uv = (position + 1.0) * 0.5;
      gl_Position = vec4(position.x, -position.y, 0.0, 1.0);
    }`;
  const fragment = `
    precision mediump float;
    uniform sampler2D artwork;
    uniform float time;
    varying vec2 uv;
    void main() {
      float hairLeft = 0.49 + 0.19 * smoothstep(0.55, 0.98, uv.y);
      float hair = smoothstep(hairLeft, hairLeft + 0.10, uv.x)
        * smoothstep(0.42, 0.62, uv.y)
        * (1.0 - smoothstep(0.94, 1.0, uv.x))
        * (1.0 - smoothstep(0.94, 1.0, uv.y));
      vec2 crownPoint = (uv - vec2(0.30, 0.27)) / vec2(0.15, 0.12);
      float crown = 1.0 - smoothstep(0.55, 1.0, length(crownPoint));
      float backHair = 1.0 - smoothstep(0.40, 1.0,
        length((uv - vec2(0.245, 0.545)) / vec2(0.055, 0.075)));
      // The visible outer sleeve lies left of the diagonal scarf edge.
      float sleeveEdge = 0.24 - 0.11 * smoothstep(0.65, 1.0, uv.y);
      float sleeve = smoothstep(0.69, 0.86, uv.y)
        * smoothstep(0.01, 0.055, uv.x)
        * (1.0 - smoothstep(sleeveEdge - 0.035, sleeveEdge, uv.x))
        * (1.0 - smoothstep(0.95, 1.0, uv.y));
      float sleeveWave = sin(time * 1.25 - uv.y * 7.0);
      float rootSway = sin(time * 1.05 - uv.y * 5.0);
      float rootFollow = sin(time * 1.05 - uv.y * 5.0 - 0.5);
      float breeze = sin(time * 1.7 - uv.y * 8.0);
      float follow = sin(time * 1.7 - uv.y * 8.0 - 0.65);
      vec2 flow = vec2(breeze * (hair * 0.018)
                       + rootSway * (crown * 0.006 + backHair * 0.007)
                       + sleeveWave * sleeve * 0.0045,
                       follow * (hair * 0.009)
                       + rootFollow * (crown * 0.0025 + backHair * 0.003)
                       + sleeveWave * sleeve * 0.002);
      gl_FragColor = texture2D(artwork, clamp(uv + flow, 0.0, 1.0));
    }`;

  function shader(type, source) {
    const result = gl.createShader(type);
    gl.shaderSource(result, source);
    gl.compileShader(result);
    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw new Error('Portrait shader unavailable');
    return result;
  }
  function stop() { cancelAnimationFrame(frame); frame = 0; last = 0; }
  function tick(now) {
    frame = 0;
    if (!ready || motion.matches || !inView || document.hidden) { last = 0; return; }
    // Limit draw work to 30 fps; phase freezes while offscreen or paused.
    if (!last || now - last >= 1000 / 30) {
      if (last) elapsed += Math.min(now - last, 100) / 1000;
      last = now;
      paint(elapsed);
    }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    stop();
    portrait.classList.toggle('is-ready', ready && !motion.matches);
    if (ready && !motion.matches && inView && !document.hidden) frame = requestAnimationFrame(tick);
  }
  // Canvas drawing also works when this portfolio is opened as a local file,
  // where browsers may prohibit uploading file images to WebGL textures.
  function initLocalCanvas() {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const smooth = (a, b, v) => { const t = Math.max(0, Math.min(1, (v-a)/(b-a))); return t*t*(3-2*t); };
    const point = (x, y, time) => {
      const left = .49 + .19 * smooth(.55,.98,y);
      const hair = smooth(left,left+.10,x) * smooth(.42,.62,y)
        * (1-smooth(.94,1,x)) * (1-smooth(.94,1,y));
      const crown = 1-smooth(.55,1,Math.hypot((x-.30)/.15,(y-.27)/.12));
      const backHair = 1-smooth(.40,1,Math.hypot((x-.245)/.055,(y-.545)/.075));
      const sleeveEdge = .24-.11*smooth(.65,1,y);
      const sleeve = smooth(.69,.86,y)*smooth(.01,.055,x)
        *(1-smooth(sleeveEdge-.035,sleeveEdge,x))*(1-smooth(.95,1,y));
      const sleeveWave = Math.sin(time*1.25-y*7);
      const rootSway = Math.sin(time*1.05-y*5);
      const rootFollow = Math.sin(time*1.05-y*5-.5);
      const breeze = Math.sin(time*1.7-y*8);
      const follow = Math.sin(time*1.7-y*8-.65);
      return [(x-breeze*(hair*.018)-rootSway*(crown*.006+backHair*.007)-sleeveWave*sleeve*.0045)*canvas.width,
        (y-follow*(hair*.009)-rootFollow*(crown*.0025+backHair*.003)-sleeveWave*sleeve*.002)*canvas.height];
    };
    function triangle(source, target) {
      const [a,b,c] = source, [p,q,r] = target;
      const det = (b[0]-a[0])*(c[1]-a[1])-(c[0]-a[0])*(b[1]-a[1]);
      const m0 = ((q[0]-p[0])*(c[1]-a[1])-(r[0]-p[0])*(b[1]-a[1]))/det;
      const m2 = ((r[0]-p[0])*(b[0]-a[0])-(q[0]-p[0])*(c[0]-a[0]))/det;
      const m1 = ((q[1]-p[1])*(c[1]-a[1])-(r[1]-p[1])*(b[1]-a[1]))/det;
      const m3 = ((r[1]-p[1])*(b[0]-a[0])-(q[1]-p[1])*(c[0]-a[0]))/det;
      ctx.save(); ctx.beginPath();
      // Small clip overlap prevents antialiased seams between mesh triangles.
      const cx=(p[0]+q[0]+r[0])/3, cy=(p[1]+q[1]+r[1])/3;
      target.forEach((v,i) => {
        const dx=v[0]-cx, dy=v[1]-cy, length=Math.hypot(dx,dy)||1;
        const x=v[0]+dx/length*.5, y=v[1]+dy/length*.5;
        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      });
      ctx.closePath(); ctx.clip();
      ctx.setTransform(m0,m1,m2,m3,p[0]-m0*a[0]-m2*a[1],p[1]-m1*a[0]-m3*a[1]);
      ctx.drawImage(image,0,0); ctx.restore();
    }
    paint = time => {
      ctx.setTransform(1,0,0,1,0,0);
      ctx.drawImage(image,0,0,canvas.width,canvas.height);
      const n=28;
      for(let row=3;row<n;row++) for(let col=0;col<n;col++) {
        const coords=[[col/n,row/n],[(col+1)/n,row/n],[col/n,(row+1)/n],[(col+1)/n,(row+1)/n]];
        const src=coords.map(v=>[v[0]*image.naturalWidth,v[1]*image.naturalHeight]);
        const dst=coords.map(v=>point(v[0],v[1],time));
        triangle([src[0],src[1],src[2]],[dst[0],dst[1],dst[2]]);
        triangle([src[2],src[1],src[3]],[dst[2],dst[1],dst[3]]);
      }
    };
    new ResizeObserver(() => {
      canvas.width=canvas.height=Math.min(640,Math.max(1,Math.round(portrait.clientWidth*Math.min(devicePixelRatio||1,2))));
      paint(elapsed);
    }).observe(portrait);
    ready=true; sync();
  }
  function init() {
    if (ready) return;
    if (location.protocol === 'file:') { initLocalCanvas(); return; }
    try {
      gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, preserveDrawingBuffer: false });
      if (!gl) return;
      program = gl.createProgram();
      gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex));
      gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Portrait renderer unavailable');
      gl.useProgram(program);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      const resize = () => {
        const size = Math.min(800, Math.round(portrait.clientWidth * Math.min(devicePixelRatio || 1, 2)));
        canvas.width = canvas.height = Math.max(1, size);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      };
      new ResizeObserver(resize).observe(portrait);
      resize();
      paint = time => {
        gl.uniform1f(gl.getUniformLocation(program, 'time'), time);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      };
      ready = true;
      sync();
    } catch (_) {
      // Local file restrictions or unsupported graphics leave the real image intact.
      ready = false;
      sync();
    }
  }
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); ready = false; sync();
  });
  new IntersectionObserver(entries => { inView = entries[0].isIntersecting; sync(); }).observe(portrait);
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', () => { if (!motion.matches && !ready) init(); sync(); });
  if (image.complete && image.naturalWidth) { if (!motion.matches) init(); }
  else image.addEventListener('load', () => { if (!motion.matches) init(); }, { once: true });
})();
