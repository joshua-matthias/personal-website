/* =====================================================================
   SCRIPT.JS
   What this file does, in order:
     1. Sets up smooth scrolling (Lenis) and links it to GSAP ScrollTrigger
     2. Makes the nav bar work (menu, smooth gliding links, current-section highlight)
     3. Runs the 3D hero background (Vanta Globe) and switches it off when you scroll past
     4. Animates the hero headline, the About section, the Work cards and the filter
     5. Runs the Side Quests sideways scroll + floating parallax shapes

   Most things you'll want to tweak are in the SETTINGS block just below.
   ===================================================================== */

(function () {
  "use strict";

  /* ---------------- SETTINGS  [EDIT ME if you like] ---------------- */
  // Hero photo grid. Add or remove photos in the list. Each photo is shown in every row.   [EDIT ME]
  var GRID_IMAGES = [
    "images/grid/finlab.jpg",
    "images/grid/award-night.jpg",
    "images/grid/mof.jpg",
    "images/grid/handshake.jpg",
    "images/grid/vision-pro-team.jpg",
    "images/grid/apple-developer-center.jpg",
    "images/grid/expo.jpg",
    "images/grid/conference.jpg"
  ];
  var GRID = {
    rows: 3, aspectRatio: 1.33, gap: 16, radius: 14, angle: -12,
    speed: 24,            // how fast the rows drift (pixels per second)
    direction: "alternate", // "left", "right" or "alternate"
    parallax: 0.5,        // how much the rows slide when you move the mouse
    spotlight: 0.6,       // how much brighter the area under the mouse gets
    dim: 0.35,            // how dark the photos are overall
    fade: 0.5,            // how strongly the edges fade into navy
    grayscale: false
  };
  var SMOOTH_SCROLL_SPEED = 0.1; // lower = silkier / slower (0.05 – 0.15 is a good range)

  /* ---------------- Helpers ---------------- */
  var hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isSmallScreen = window.matchMedia("(max-width: 767px)").matches;
  var isWeakDevice = (navigator.hardwareConcurrency || 4) <= 2;

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  // Footer year
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* =================================================================
     1. SMOOTH SCROLL (Lenis) + GSAP connection
     ================================================================= */
  var lenis = null;

  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  if (typeof window.Lenis !== "undefined" && !prefersReduced) {
    lenis = new Lenis({ lerp: SMOOTH_SCROLL_SPEED, smoothWheel: true });

    if (hasGSAP) {
      // Tell ScrollTrigger every time Lenis scrolls, and let GSAP's clock drive Lenis.
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      // No GSAP? Lenis can run on its own.
      (function loop(t) { lenis.raf(t); requestAnimationFrame(loop); })(0);
    }
  }

  /* =================================================================
     2. NAVIGATION
     ================================================================= */
  var nav = $("#nav");
  var navLinks = $("#navLinks");
  var navToggle = $("#navToggle");

  // Glide to a section when any "#link" is clicked
  function goTo(hash) {
    var target = $(hash);
    if (!target) return;
    if (lenis) lenis.scrollTo(target, { duration: 1.6, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
    else target.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth" });
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var hash = a.getAttribute("href");
      if (hash.length < 2) return;
      e.preventDefault();
      closeMenu();
      goTo(hash);
    });
  });

  // Mobile menu
  function closeMenu() {
    navLinks.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    if (lenis) lenis.start();
  }
  navToggle.addEventListener("click", function () {
    var open = !navLinks.classList.contains("is-open");
    navLinks.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    if (lenis) (open ? lenis.stop() : lenis.start());
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });

  // Frosted background once you scroll down a little
  function onScrollNav() { nav.classList.toggle("is-scrolled", window.scrollY > 40); }
  window.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();

  // Highlight the link for the section you're looking at
  var linkFor = {};
  $$(".nav__links a").forEach(function (a) { linkFor[a.dataset.section] = a; });
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        Object.keys(linkFor).forEach(function (id) { linkFor[id].classList.toggle("is-active", id === entry.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" }); // "current" = whatever crosses the middle of the screen
    $$("main section[id]").forEach(function (s) { spy.observe(s); });
  }

  /* =================================================================
     CASE STUDY POP-UP
     Clicking a project card (or its "Read case study" button) opens the
     <template> whose id matches the card's data-case.
     ================================================================= */
  var modal = $("#caseModal");
  var caseContent = $("#caseContent");
  var caseIds = $$("template[id^='case-']").map(function (t) { return t.id; });
  var currentCase = null, lastFocus = null;

  function showCase(id) {
    var tpl = document.getElementById(id);
    if (!tpl) return;
    currentCase = id;
    caseContent.innerHTML = "";
    caseContent.appendChild(tpl.content.cloneNode(true));
    var title = $(".cs-title", caseContent);
    if (title) title.id = "caseTitle";
    $("#caseCrumb").textContent = tpl.dataset.title || "";
    caseContent.scrollTop = 0;
  }
  function openCase(id) {
    lastFocus = document.activeElement;
    showCase(id);
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";
    if (lenis) lenis.stop();
    $("#caseClose").focus();
  }
  function closeCase() {
    if (!modal.classList.contains("is-open")) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = "";
    if (lenis) lenis.start();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  $$("[data-case]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      if (el.tagName === "ARTICLE" && e.target.closest("a, button")) return; // the button handles its own click
      openCase(el.dataset.case);
    });
  });
  $("#caseClose").addEventListener("click", closeCase);
  $("#caseNext").addEventListener("click", function () {
    var i = caseIds.indexOf(currentCase);
    showCase(caseIds[(i + 1) % caseIds.length]);
    $("#caseContent").scrollTo({ top: 0 });
  });
  modal.addEventListener("click", function (e) { if (e.target.hasAttribute("data-close")) closeCase(); });
  document.addEventListener("keydown", function (e) {
    if (!modal.classList.contains("is-open")) return;
    if (e.key === "Escape") closeCase();
    if (e.key === "Tab") { // keep keyboard focus inside the pop-up
      var f = $$("a[href], button", modal).filter(function (n) { return n.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* =================================================================
     3. HERO BACKGROUND: tilted, drifting photo grid
        - Rows of photos slide sideways (alternating directions)
        - Mouse: rows shift slightly and a spotlight brightens the photos
        - Stops moving when the hero is off screen, and for "reduce motion"
     ================================================================= */
  (function initGrid() {
    var root = $("#gm"), dimEl = $("#gmDim"), hero = $("#hero");
    if (!root || !GRID_IMAGES.length) return;
    var rows = [], period = 0, tileW = 0, running = false, raf = 0, last = 0;
    var mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, on: 0, onT: 0 };

    // Darkness: bright under the mouse (spotlight), darker everywhere else
    function setDim() {
      var inner = GRID.dim * (1 - GRID.spotlight);
      dimEl.style.background =
        "radial-gradient(circle 380px at var(--mx, -999px) var(--my, -999px), rgba(5,11,31," + inner.toFixed(3) + ") 0%, rgba(5,11,31," + GRID.dim + ") 100%), rgba(5,11,31," + GRID.dim + ")";
    }
    function build() {
      root.innerHTML = ""; rows = [];
      var H = hero.clientHeight, W = hero.clientWidth;
      var boxW = W * 1.6, boxH = H * 1.6;
      root.style.cssText = "width:" + boxW + "px;height:" + boxH + "px;transform:translate(-50%,-50%) rotate(" + GRID.angle + "deg);gap:" + GRID.gap + "px";
      root.classList.toggle("is-gray", !!GRID.grayscale);
      var tileH = (Math.min(boxH, H * 1.45) - GRID.gap * (GRID.rows - 1)) / GRID.rows;
      tileW = tileH * GRID.aspectRatio;
      var step = tileW + GRID.gap, n = GRID_IMAGES.length;
      period = n * step;
      var count = Math.ceil((boxW + period) / step) + 1;
      for (var r = 0; r < GRID.rows; r++) {
        var row = document.createElement("div");
        row.className = "gm__row";
        row.style.cssText = "height:" + tileH + "px;gap:" + GRID.gap + "px";
        for (var i = 0; i < count; i++) {
          var img = document.createElement("img");
          img.src = GRID_IMAGES[(i + r * 2) % n];
          img.alt = ""; img.decoding = "async"; img.draggable = false;
          img.style.cssText = "width:" + tileW + "px;height:" + tileH + "px;border-radius:" + GRID.radius + "px";
          row.appendChild(img);
        }
        var dir = GRID.direction === "left" ? -1 : GRID.direction === "right" ? 1 : (r % 2 ? 1 : -1);
        rows.push({ el: row, dir: dir, off: 0 });
        root.appendChild(row);
      }
      draw();
    }
    function draw() {
      var mx = (mouse.x - 0.5) * GRID.parallax * 140;
      rows.forEach(function (row, i) {
        var base = row.dir < 0 ? -(row.off % period) : -period + (row.off % period);
        var shift = mx * (i % 2 ? 1 : -1);
        row.el.style.transform = "translate3d(" + (base + shift) + "px,0,0)";
      });
      var r = hero.getBoundingClientRect();
      dimEl.style.setProperty("--mx", (mouse.x * r.width) + "px");
      dimEl.style.setProperty("--my", ((1 - mouse.y) * r.height) + "px");
      dimEl.style.opacity = 0.35 + 0.65 * mouse.on;
    }
    function frame(ms) {
      var dt = Math.min(0.05, (ms - last) / 1000); last = ms;
      rows.forEach(function (row) { row.off += GRID.speed * dt; });
      mouse.x += (mouse.tx - mouse.x) * 0.06; mouse.y += (mouse.ty - mouse.y) * 0.06;
      mouse.on += (mouse.onT - mouse.on) * 0.06;
      draw();
      raf = requestAnimationFrame(frame);
    }
    function start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    function stop() { running = false; cancelAnimationFrame(raf); }

    setDim(); build();
    root.classList.add("is-ready");
    if (prefersReduced) { mouse.onT = 0; return; } // photos stay still
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      mouse.tx = (e.clientX - r.left) / r.width; mouse.ty = 1 - (e.clientY - r.top) / r.height; mouse.onT = 1;
    });
    hero.addEventListener("mouseleave", function () { mouse.onT = 0; });
    var t;
    window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(build, 200); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) { entries[0].isIntersecting ? start() : stop(); }).observe(hero);
    } else { start(); }
  })();

  /* =================================================================
     GALAXY BACKGROUND (Side Quests section)
     A WebGL star field. Settings are the ones from the original design.
     It only draws while the section is on screen, and is skipped for
     "reduce motion" visitors and weak devices (the navy gradient shows).
     ================================================================= */
  var GALAXY = {
    starSpeed: 0.5, density: 1, hueShift: 140, speed: 1, glowIntensity: 0.3,
    saturation: 0, mouseRepulsion: true, repulsionStrength: 2,
    twinkleIntensity: 0.3, rotationSpeed: 0.1, transparent: true,
    quality: isSmallScreen ? 0.5 : 0.75   // 1 = sharpest, lower = faster
  };
  var GALAXY_FRAG = `
precision highp float;
uniform float uTime;
uniform vec3 uResolution;
uniform vec2 uFocal;
uniform vec2 uRotation;
uniform float uStarSpeed;
uniform float uDensity;
uniform float uHueShift;
uniform float uSpeed;
uniform vec2 uMouse;
uniform float uGlowIntensity;
uniform float uSaturation;
uniform bool uMouseRepulsion;
uniform float uTwinkleIntensity;
uniform float uRotationSpeed;
uniform float uRepulsionStrength;
uniform float uMouseActiveFactor;
uniform bool uTransparent;
varying vec2 vUv;

#define NUM_LAYER 4.0
#define STAR_COLOR_CUTOFF 0.2
#define MAT45 mat2(0.7071, -0.7071, 0.7071, 0.7071)
#define PERIOD 3.0

float Hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float tri(float x) { return abs(fract(x) * 2.0 - 1.0); }
float tris(float x) {
  float t = fract(x);
  return 1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0));
}
float trisn(float x) {
  float t = fract(x);
  return 2.0 * (1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0))) - 1.0;
}
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
float Star(vec2 uv, float flare) {
  float d = length(uv);
  float m = (0.05 * uGlowIntensity) / d;
  float rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * flare * uGlowIntensity;
  uv *= MAT45;
  rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * 0.3 * flare * uGlowIntensity;
  m *= smoothstep(1.0, 0.2, d);
  return m;
}
vec3 StarLayer(vec2 uv) {
  vec3 col = vec3(0.0);
  vec2 gv = fract(uv) - 0.5;
  vec2 id = floor(uv);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 si = id + vec2(float(x), float(y));
      float seed = Hash21(si);
      float size = fract(seed * 345.32);
      float glossLocal = tri(uStarSpeed / (PERIOD * seed + 1.0));
      float flareSize = smoothstep(0.9, 1.0, size) * glossLocal;
      float red = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 1.0)) + STAR_COLOR_CUTOFF;
      float blu = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 3.0)) + STAR_COLOR_CUTOFF;
      float grn = min(red, blu) * seed;
      vec3 base = vec3(red, grn, blu);
      float hue = atan(base.g - base.r, base.b - base.r) / (2.0 * 3.14159) + 0.5;
      hue = fract(hue + uHueShift / 360.0);
      float sat = length(base - vec3(dot(base, vec3(0.299, 0.587, 0.114)))) * uSaturation;
      float val = max(max(base.r, base.g), base.b);
      base = hsv2rgb(vec3(hue, sat, val));
      vec2 pad = vec2(tris(seed * 34.0 + uTime * uSpeed / 10.0), tris(seed * 38.0 + uTime * uSpeed / 30.0)) - 0.5;
      float star = Star(gv - offset - pad, flareSize);
      float twinkle = trisn(uTime * uSpeed + seed * 6.2831) * 0.5 + 1.0;
      twinkle = mix(1.0, twinkle, uTwinkleIntensity);
      star *= twinkle;
      col += star * size * base;
    }
  }
  return col;
}
void main() {
  vec2 focalPx = uFocal * uResolution.xy;
  vec2 uv = (vUv * uResolution.xy - focalPx) / uResolution.y;
  if (uMouseRepulsion) {
    vec2 mousePosUV = (uMouse * uResolution.xy - focalPx) / uResolution.y;
    float mouseDist = length(uv - mousePosUV);
    vec2 repulsion = normalize(uv - mousePosUV) * (uRepulsionStrength / (mouseDist + 0.1));
    uv += repulsion * 0.05 * uMouseActiveFactor;
  } else {
    uv += (uMouse - vec2(0.5)) * 0.1 * uMouseActiveFactor;
  }
  float a = uTime * uRotationSpeed;
  uv = mat2(cos(a), -sin(a), sin(a), cos(a)) * uv;
  uv = mat2(uRotation.x, -uRotation.y, uRotation.y, uRotation.x) * uv;
  vec3 col = vec3(0.0);
  for (float i = 0.0; i < 1.0; i += 1.0 / NUM_LAYER) {
    float depth = fract(i + uStarSpeed * uSpeed);
    float scale = mix(20.0 * uDensity, 0.5 * uDensity, depth);
    float fade = depth * smoothstep(1.0, 0.9, depth);
    col += StarLayer(uv * scale + i * 453.32) * fade;
  }
  if (uTransparent) {
    float alpha = min(smoothstep(0.0, 0.3, length(col)), 1.0);
    gl_FragColor = vec4(col, alpha);
  } else {
    gl_FragColor = vec4(col, 1.0);
  }
}
`;

  function initGalaxy(box, area) {
    if (!box || prefersReduced || isWeakDevice) return;
    var canvas = document.createElement("canvas");
    var gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false, antialias: false });
    if (!gl) return;

    function compile(type, src) {
      var sh = gl.createShader(type);
      gl.shaderSource(sh, src); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(sh)); return null; }
      return sh;
    }
    var vs = compile(gl.VERTEX_SHADER, "attribute vec2 position; varying vec2 vUv; void main(){ vUv = position * 0.5 + 0.5; gl_Position = vec4(position, 0.0, 1.0); }");
    var fs = compile(gl.FRAGMENT_SHADER, GALAXY_FRAG);
    if (!vs || !fs) return;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    // One big triangle that covers the whole canvas
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "position");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.clearColor(0, 0, 0, 0);

    var u = {};
    ["uTime","uResolution","uFocal","uRotation","uStarSpeed","uDensity","uHueShift","uSpeed","uMouse","uGlowIntensity","uSaturation","uMouseRepulsion","uTwinkleIntensity","uRotationSpeed","uRepulsionStrength","uMouseActiveFactor","uTransparent"].forEach(function (n) { u[n] = gl.getUniformLocation(prog, n); });
    gl.uniform2f(u.uFocal, 0.5, 0.5);
    gl.uniform2f(u.uRotation, 1, 0);
    gl.uniform1f(u.uDensity, GALAXY.density);
    gl.uniform1f(u.uHueShift, GALAXY.hueShift);
    gl.uniform1f(u.uSpeed, GALAXY.speed);
    gl.uniform1f(u.uGlowIntensity, GALAXY.glowIntensity);
    gl.uniform1f(u.uSaturation, GALAXY.saturation);
    gl.uniform1i(u.uMouseRepulsion, GALAXY.mouseRepulsion ? 1 : 0);
    gl.uniform1f(u.uTwinkleIntensity, GALAXY.twinkleIntensity);
    gl.uniform1f(u.uRotationSpeed, GALAXY.rotationSpeed);
    gl.uniform1f(u.uRepulsionStrength, GALAXY.repulsionStrength);
    gl.uniform1i(u.uTransparent, GALAXY.transparent ? 1 : 0);

    box.appendChild(canvas);

    function resize() {
      var scale = Math.min(window.devicePixelRatio || 1, 1.5) * GALAXY.quality;
      var w = Math.max(1, Math.round(box.clientWidth * scale)), h = Math.max(1, Math.round(box.clientHeight * scale));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      gl.uniform3f(u.uResolution, w, h, w / h);
    }
    window.addEventListener("resize", resize);

    // Mouse: stars gently move away from the pointer
    var target = { x: 0.5, y: 0.5 }, smooth = { x: 0.5, y: 0.5 }, activeT = 0, active = 0;
    area.addEventListener("mousemove", function (e) {
      var r = box.getBoundingClientRect();
      target.x = (e.clientX - r.left) / r.width;
      target.y = 1 - (e.clientY - r.top) / r.height;
      activeT = 1;
    });
    area.addEventListener("mouseleave", function () { activeT = 0; });

    var raf = 0, running = false;
    function frame(ms) {
      var t = ms * 0.001;
      smooth.x += (target.x - smooth.x) * 0.05;
      smooth.y += (target.y - smooth.y) * 0.05;
      active += (activeT - active) * 0.05;
      gl.uniform1f(u.uTime, t);
      gl.uniform1f(u.uStarSpeed, (t * GALAXY.starSpeed) / 10.0);
      gl.uniform2f(u.uMouse, smooth.x, smooth.y);
      gl.uniform1f(u.uMouseActiveFactor, active);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    }
    function start() { if (running) return; running = true; resize(); box.classList.add("is-live"); raf = requestAnimationFrame(frame); }
    function stop() { running = false; cancelAnimationFrame(raf); }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) { entries[0].isIntersecting ? start() : stop(); }, { rootMargin: "100px" }).observe(area);
    } else { start(); }
  }
  initGalaxy($("#sqGalaxy"), $("#sqPin"));

  /* =================================================================
     Everything below needs GSAP. If it failed to load, the page simply
     shows all content with no animation.
     ================================================================= */
  if (!hasGSAP) return;

  /* ---------- Hero headline: word-by-word reveal ---------- */
  function splitWords(el) {
    // Wraps each word in a mask so it can slide up. Keeps the <span class="grad"> styling.
    var out = [], frag = document.createDocumentFragment();
    (function walk(src, dest) {
      Array.prototype.slice.call(src.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { dest.appendChild(document.createTextNode(" ")); return; }
            var w = document.createElement("span"); w.className = "word";
            var i = document.createElement("span"); i.className = "word__inner";
            i.textContent = part; w.appendChild(i); dest.appendChild(w); out.push(i);
          });
        } else if (child.nodeType === 1) {
          var copy = child.cloneNode(false);
          dest.appendChild(copy);
          walk(child, copy);
        }
      });
    })(el, frag);
    var label = el.textContent;
    el.textContent = "";
    el.appendChild(frag);
    el.setAttribute("aria-label", label);
    return out;
  }

  var heroFades = $$("[data-hero-fade]");
  if (prefersReduced) {
    gsap.from(heroFades.concat($("#heroTitle")), { opacity: 0, duration: 0.6 });
  } else {
    var words = splitWords($("#heroTitle"));
    var tl = gsap.timeline({ defaults: { ease: "power4.out" }, delay: 0.15 });
    tl.from(words, { yPercent: 115, rotate: 4, duration: 1.1, stagger: 0.07 })
      .from(heroFades, { y: 24, opacity: 0, duration: 0.9, stagger: 0.12 }, "-=0.6");

    // Gentle parallax: hero text drifts up and fades as you scroll away
    gsap.to(".hero__inner", {
      yPercent: -18, opacity: 0.2, ease: "none",
      scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true }
    });
  }

  /* ---------- Scroll reveals (About, headings, etc.) ---------- */
  if (!prefersReduced) {
    $$(".reveal").forEach(function (el) {
      gsap.from(el, {
        y: 40, opacity: 0, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true }
      });
    });

    // Stat cards: stagger in
    ScrollTrigger.batch(".reveal-card", {
      start: "top 90%", once: true,
      onEnter: function (batch) { gsap.from(batch, { y: 40, opacity: 0, scale: 0.94, duration: 0.9, stagger: 0.12, ease: "power3.out", clearProps: "transform,opacity" }); }
    });

    // Photo: slight scale as it enters
    gsap.from(".about__photo img", {
      scale: 1.25, duration: 1.8, ease: "power3.out",
      scrollTrigger: { trigger: ".about__photo", start: "top 85%", once: true }
    });
    gsap.fromTo(".about__photo img", { yPercent: -5 }, {
      yPercent: 5, ease: "none",
      scrollTrigger: { trigger: ".about__photo", start: "top bottom", end: "bottom top", scrub: true }
    });

    // Contact headline: word reveal
    var cWords = splitWords($("#contactTitle"));
    gsap.from(cWords, {
      yPercent: 115, duration: 1, stagger: 0.08, ease: "power4.out",
      scrollTrigger: { trigger: "#contactTitle", start: "top 85%", once: true }
    });
  }

  /* ---------- Work: cards stagger in on scroll ---------- */
  var cards = $$(".card");
  if (!prefersReduced) {
    ScrollTrigger.batch(cards, {
      start: "top 90%", once: true,
      onEnter: function (batch) {
        gsap.from(batch, { y: 70, opacity: 0, duration: 1, stagger: 0.12, ease: "power3.out", clearProps: "transform,opacity" });
      }
    });
  }

  /* ---------- Work: filter buttons ---------- */
  var filterBtns = $$(".filter");
  var busy = false;
  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (busy || btn.classList.contains("is-active")) return;
      filterBtns.forEach(function (b) { b.classList.toggle("is-active", b === btn); });
      var f = btn.dataset.filter;
      var show = cards.filter(function (c) { return f === "all" || c.dataset.category === f; });

      function swap() {
        cards.forEach(function (c) { c.style.display = show.indexOf(c) > -1 ? "" : "none"; });
        ScrollTrigger.refresh();
        if (prefersReduced) { busy = false; return; }
        gsap.fromTo(show, { y: 40, opacity: 0, scale: 0.96 },
          { y: 0, opacity: 1, scale: 1, duration: 0.7, stagger: 0.08, ease: "power3.out",
            clearProps: "transform,opacity", onComplete: function () { busy = false; } });
      }

      busy = true;
      if (prefersReduced) return swap();
      gsap.to(cards, { opacity: 0, y: 20, duration: 0.25, ease: "power2.in", onComplete: swap });
    });
  });

  /* =================================================================
     5. SIDE QUESTS: sideways scroll (desktop) + floating shapes (parallax)
     ================================================================= */
  var mm = gsap.matchMedia();

  // Desktop with motion allowed: pin the section and slide the cards sideways
  mm.add("(min-width: 900px) and (prefers-reduced-motion: no-preference)", function () {
    var track = $("#sqTrack");
    if ($$(".quest").length < 2) return; // one side quest: no sideways scroll needed
    var distance = function () { return Math.max(0, track.scrollWidth - window.innerWidth + 24); };
    gsap.to(track, {
      x: function () { return -distance(); },
      ease: "none",
      scrollTrigger: {
        trigger: "#sqPin", start: "top top",
        end: function () { return "+=" + distance(); },
        pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1
      }
    });
  });

  // Floating shapes at different speeds (layered parallax). Works on all screen sizes.
  mm.add("(prefers-reduced-motion: no-preference)", function () {
    $$(".shape").forEach(function (s) {
      gsap.to(s, {
        y: parseFloat(s.dataset.speed || 100), ease: "none",
        scrollTrigger: { trigger: "#sidequests", start: "top bottom", end: "bottom top", scrub: true }
      });
    });
    gsap.to(".shape--ring", { rotate: 180, ease: "none",
      scrollTrigger: { trigger: "#sidequests", start: "top bottom", end: "bottom top", scrub: true } });
  });

  // Re-measure once images and fonts have fully loaded
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
