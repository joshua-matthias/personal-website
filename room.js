/* =====================================================================
   ROOM.JS  -  the landing "brainstorm room"
   What this file does:
     1. Pins the small background notes and photos to the wall
     2. Strings the red thread between them
     3. Runs the magnifying glass: you can pick it up, throw it, and it
        falls back onto the desk. It zooms in on whatever is behind it.
     4. When the glass is held over one of the three big notes it sticks
        there and shows a project picture. Clicking the glass opens it.

   Everything you are likely to change is in the SETTINGS block below.
   ===================================================================== */

(function () {
  "use strict";

  /* ---------------- SETTINGS  [EDIT ME] ---------------- */

  // Which project each big note opens.
  //   project: the id of a case study <template> in index.html (the same id the Work cards use)
  //   image:   the picture shown inside the glass
  //   focus:   which part of the picture to centre on (left% top%)
  var PROJECTS = {
    business: { label: "Business", title: "MadeForYou PR Launch Event", project: "case-madeforyou-launch",    image: "images/madeforyou-launch.jpg",    focus: "50% 62%" },
    policy:   { label: "Policy",   title: "Breaking the Silence",       project: "case-breaking-the-silence", image: "images/breaking-the-silence.jpg", focus: "50% 45%" },
    tech:     { label: "Tech",     title: "Just Say, Ah!",              project: "case-just-say-ahh",         image: "images/just-say-ahh.jpg",         focus: "50% 50%" }
  };

  var ZOOM = 2;          // how much the glass magnifies (2 = twice as big)
  var EDGE_BEND = 0.2;   // how much the glass bends the picture near its edge (0 = flat glass)

  // The small notes in the dark. x and y are positions across and down the wall (0 to 100).
  // colour: y (yellow), p (pink), b (blue), g (green), o (orange). small: false hides it on phones.
  var BITS = [
    { id: "a", x: 6,    y: 17, colour: "y", tilt: -6, text: "why now?" },
    { id: "b", x: 15.5, y: 36, colour: "p", tilt: 5,  text: "who is this for?", small: false },
    { id: "c", x: 5,    y: 47, colour: "g", tilt: 3,  text: "talk to 5 users" },
    { id: "d", x: 94,   y: 16, colour: "b", tilt: 6,  text: "ship it small" },
    { id: "e", x: 85,   y: 34, colour: "y", tilt: -4, text: "what would a regulator ask?", small: false },
    { id: "f", x: 95.5, y: 46, colour: "p", tilt: -3, text: "risks?" },
    { id: "g", x: 34.5, y: 86, colour: "g", tilt: -5, text: "pilot first" },
    { id: "h", x: 65.5, y: 87, colour: "o", tilt: 4,  text: "measure it" },
    { id: "i", x: 6,    y: 88, colour: "b", tilt: -4, text: "story > slides", small: false },
    { id: "j", x: 94,   y: 89, colour: "y", tilt: 5,  text: "edge cases!", small: false },
    { id: "k", x: 35,   y: 60, colour: "o", tilt: 4,  text: "explain it simply", small: false },
    { id: "l", x: 65,   y: 59, colour: "b", tilt: -6, text: "what if it fails?", small: false },
    // Photos pinned to the wall
    { id: "p1", x: 27,   y: 22, tilt: -7, photo: "images/grid/award-night.jpg", small: false },
    { id: "p2", x: 74,   y: 21, tilt: 6,  photo: "images/grid/apple-developer-center.jpg", small: false },
    { id: "p3", x: 9.5,  y: 67, tilt: 5,  photo: "images/grid/mof.jpg", small: false }
  ];

  // Red thread: each pair is strung between two notes (use the ids above, or business / policy / tech).
  var THREADS = [
    ["a", "b"], ["b", "c"], ["a", "p1"], ["b", "business"], ["c", "p3"], ["p3", "i"], ["i", "g"],
    ["d", "e"], ["e", "f"], ["d", "p2"], ["e", "tech"], ["f", "j"], ["j", "h"],
    ["g", "policy"], ["h", "policy"], ["k", "business"], ["k", "p1"], ["l", "tech"], ["l", "p2"], ["k", "l"]
  ];
  // These ones stay lit, joining the three big notes.
  var LIT_THREADS = [["business", "policy"], ["policy", "tech"]];

  /* ---------------- Setup ---------------- */
  var scene = document.getElementById("roomScene");
  if (!scene) return;
  var hero = document.getElementById("hero"),
      world = document.getElementById("roomWorld"),
      wall = document.getElementById("wall"),
      bitsBox = document.getElementById("wallBits"),
      threadSvg = document.getElementById("wallThreads"),
      litSvg = document.getElementById("wallThreadsLit"),
      hint = document.getElementById("roomHint"),
      mag = document.getElementById("mag"),
      arm = document.getElementById("magArm"),
      shadow = document.getElementById("magShadow"),
      shadowHandle = shadow.querySelector(".mag__shadow-handle"),
      view = document.getElementById("magView"),
      preview = document.getElementById("magPreview"),
      magImg = document.getElementById("magImg"),
      magCat = document.getElementById("magCat"),
      magTitle = document.getElementById("magTitle");

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var keyEls = {}, keyNames = Object.keys(PROJECTS);
  keyNames.forEach(function (k) { keyEls[k] = wall.querySelector('.keynote[data-key="' + k + '"]'); });
  keyNames = keyNames.filter(function (k) { return keyEls[k]; });

  // Load the preview pictures early so they appear instantly
  keyNames.forEach(function (k) { var im = new Image(); im.src = PROJECTS[k].image; });

  /* ---------------- 1. Background notes ---------------- */
  var bitEls = {};
  BITS.forEach(function (b) {
    var el = document.createElement("div");
    el.className = "bit " + (b.photo ? "bit--photo" : "bit--" + (b.colour || "y")) + (b.small === false ? " bit--hide-sm" : "");
    el.style.left = b.x + "%"; el.style.top = b.y + "%";
    el.style.transform = "translate(-50%, -50%) rotate(" + (b.tilt || 0) + "deg)";
    if (b.photo) { var im = document.createElement("img"); im.src = b.photo; im.alt = ""; el.appendChild(im); }
    else el.appendChild(document.createTextNode(b.text || ""));
    var pin = document.createElement("i"); pin.className = "pin"; el.appendChild(pin);
    bitsBox.appendChild(el);
    bitEls[b.id] = { el: el, tilt: b.tilt || 0 };
  });
  keyNames.forEach(function (k) {
    bitEls[k] = { el: keyEls[k], tilt: parseFloat(getComputedStyle(keyEls[k]).getPropertyValue("--rot")) || 0 };
  });

  /* ---------------- 2. Red thread ---------------- */
  // Where the pin of a note sits on the wall
  function pinOf(id) {
    var b = bitEls[id];
    if (!b || !b.el.offsetWidth) return null; // hidden (for example on phones)
    var cx = b.el.offsetLeft, cy = b.el.offsetTop, d = b.el.offsetHeight / 2 - 11, t = b.tilt * Math.PI / 180;
    return { x: cx + Math.sin(t) * d, y: cy - Math.cos(t) * d };
  }
  function drawThreads(svg, pairs) {
    var out = "";
    pairs.forEach(function (p, i) {
      var a = pinOf(p[0]), b = pinOf(p[1]);
      if (!a || !b) return;
      var len = Math.hypot(b.x - a.x, b.y - a.y), sag = Math.min(46, len * 0.09) * (0.7 + (i % 3) * 0.25);
      var d = "M" + a.x.toFixed(1) + " " + a.y.toFixed(1) + " Q" + ((a.x + b.x) / 2).toFixed(1) + " " + ((a.y + b.y) / 2 + sag).toFixed(1) + " " + b.x.toFixed(1) + " " + b.y.toFixed(1);
      out += '<path class="t-shadow" d="' + d + '"/><path class="t-line" d="' + d + '"/>';
    });
    svg.innerHTML = out;
  }

  /* ---------------- 3. The magnifying glass ---------------- */
  var W = 0, H = 0, R = 90, PAD = 0, floorY = 0, snapR = 0;
  var keyPos = {};          // centre of each big note, in scene pixels
  var copy = null;          // the zoomed copy of the room shown inside the lens
  var useBend = EDGE_BEND > 0 && !/^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);

  // The glass. x,y = centre of the lens. a = angle of the handle (0 = straight down).
  var S = { x: 0, y: 0, vx: 0, vy: 0, a: -62, va: 0, lift: 0, mode: "free", near: null, tx: 0, ty: 0 };
  var running = false, raf = 0, last = 0, visible = true, shown = null, everStuck = false;

  // The curved-glass effect: a small map that tells the browser how far to bend each pixel
  function buildBend() {
    var old = document.getElementById("roomBendSvg");
    if (old) old.remove();
    view.style.filter = "";
    if (!useBend) return;
    var D = Math.round(2 * (R + PAD)), c = document.createElement("canvas");
    c.width = c.height = D;
    var ctx = c.getContext("2d"), img = ctx.createImageData(D, D), px = img.data, mid = D / 2, i = 0;
    for (var y = 0; y < D; y++) {
      for (var x = 0; x < D; x++, i += 4) {
        var dx = x + 0.5 - mid, dy = y + 0.5 - mid, r = Math.sqrt(dx * dx + dy * dy), t = Math.min(1, r / R);
        var k = r > 0 ? Math.pow(t, 3.2) / r : 0;       // bend grows quickly towards the rim
        px[i] = 127.5 + 127.5 * dx * k; px[i + 1] = 127.5 + 127.5 * dy * k; px[i + 2] = 128; px[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = "roomBendSvg"; svg.setAttribute("width", "0"); svg.setAttribute("height", "0");
    svg.style.position = "absolute";
    svg.innerHTML = '<filter id="roomBend" x="0" y="0" width="' + D + '" height="' + D + '" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">' +
      '<feImage href="' + c.toDataURL() + '" x="0" y="0" width="' + D + '" height="' + D + '" preserveAspectRatio="none" result="map"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="map" scale="' + (2 * PAD) + '" xChannelSelector="R" yChannelSelector="G"/></filter>';
    document.body.appendChild(svg);
    view.style.filter = "url(#roomBend)";
  }

  // Make the zoomed copy of the room that sits inside the lens
  function buildCopy() {
    if (copy) copy.remove();
    copy = world.cloneNode(true);
    copy.removeAttribute("id");
    copy.className = "room__world mag__copy";
    Array.prototype.forEach.call(copy.querySelectorAll("[id]"), function (n) { n.removeAttribute("id"); });
    Array.prototype.forEach.call(copy.querySelectorAll("button"), function (n) { n.tabIndex = -1; });
    copy.setAttribute("aria-hidden", "true");
    copy.inert = true;
    copy.style.width = W + "px"; copy.style.height = H + "px"; copy.style.inset = "auto";
    view.insertBefore(copy, preview);
  }

  function measure() {
    W = scene.clientWidth; H = scene.clientHeight;
    R = Math.round(Math.max(56, Math.min(100, W * 0.078, H * 0.118)));
    PAD = useBend ? Math.round(R * EDGE_BEND) : 0;
    mag.style.setProperty("--r", R + "px");
    mag.style.setProperty("--pad", PAD + "px");
    floorY = H - R * 1.3 - 12;
    var keySize = 0;
    keyNames.forEach(function (k) {
      var el = keyEls[k];
      keyPos[k] = { x: el.offsetLeft, y: el.offsetTop };
      keySize = el.offsetWidth;
    });
    snapR = keySize * 0.5 + R * 0.3;
    drawThreads(threadSvg, THREADS);
    drawThreads(litSvg, LIT_THREADS);
    buildBend();
    buildCopy();
  }

  function setNear(k) {
    if (S.near === k) return;
    if (S.near) keyEls[S.near].classList.remove("is-on");
    S.near = k;
    if (k) {
      keyEls[k].classList.add("is-on");
      if (shown !== k) {
        var p = PROJECTS[k];
        magImg.src = p.image; magImg.style.objectPosition = p.focus || "50% 50%";
        magCat.textContent = p.label; magTitle.textContent = p.title;
        shown = k;
      }
      if (!everStuck) { everStuck = true; hint.classList.remove("is-on"); }
    }
    mag.classList.toggle("is-preview", !!k);
  }

  function clampX(x) { return Math.max(R * 0.6, Math.min(W - R * 0.6, x)); }
  function clampY(y) { return Math.max(R * 0.6, Math.min(floorY, y)); }

  function step(dt) {
    var onFloor = false, k, c, aT, ak, ac;
    if (S.mode === "free") {
      S.vy += 2700 * dt;
      S.vx *= Math.exp(-0.5 * dt);
      S.x += S.vx * dt; S.y += S.vy * dt;
      if (S.y >= floorY) {                       // lands on the desk
        S.y = floorY; onFloor = true;
        if (S.vy > 0) S.vy = S.vy < 90 ? 0 : -S.vy * 0.3;
        S.vx *= Math.exp(-9 * dt);                // slides to a stop
      }
      if (S.y < R * 0.6) { S.y = R * 0.6; S.vy = Math.abs(S.vy) * 0.4; }
      if (S.x < R * 1.15) { S.x = R * 1.15; S.vx = Math.abs(S.vx) * 0.45; }
      if (S.x > W - R * 1.15) { S.x = W - R * 1.15; S.vx = -Math.abs(S.vx) * 0.45; }
    } else {
      // held in the hand, or stuck to a note: pulled towards a target like a spring
      if (S.mode === "stuck" && S.near) { S.tx = keyPos[S.near].x; S.ty = keyPos[S.near].y; }
      k = S.mode === "held" && !S.near ? 520 : 210; c = S.mode === "held" && !S.near ? 38 : 21;
      S.vx += (k * (S.tx - S.x) - c * S.vx) * dt;
      S.vy += (k * (S.ty - S.y) - c * S.vy) * dt;
      S.x += S.vx * dt; S.y += S.vy * dt;
    }

    // The handle swings behind the movement, then settles
    var side = S.x > W * 0.72 ? 1 : -1;            // lie with the handle pointing into the room
    if (onFloor) { aT = 62 * side; ak = 160; ac = 15; }
    else if (S.near) { aT = -34; ak = 120; ac = 12; }
    else { aT = -30 + Math.max(-42, Math.min(42, S.vx * 0.045)); ak = 110; ac = 9; }
    S.va += (ak * (aT - S.a) - ac * S.va) * dt;
    S.a += S.va * dt;

    var liftT = onFloor ? 0 : 1;
    S.lift += (liftT - S.lift) * Math.min(1, dt * 9);

    // Has everything come to rest?
    var still = Math.abs(S.vx) < 3 && Math.abs(S.vy) < 3 && Math.abs(S.va) < 2 && Math.abs(aT - S.a) < 0.3;
    if (S.mode === "free") return still && onFloor && S.lift < 0.01;
    if (S.mode === "stuck") return still && Math.hypot(S.tx - S.x, S.ty - S.y) < 0.4;
    return false;
  }

  function render() {
    mag.style.transform = "translate3d(" + S.x.toFixed(2) + "px," + S.y.toFixed(2) + "px,0)";
    arm.style.transform = "rotate(" + S.a.toFixed(2) + "deg)";
    var half = R + PAD;
    if (copy) copy.style.transform = "translate(" + (half - S.x * ZOOM).toFixed(2) + "px," + (half - S.y * ZOOM).toFixed(2) + "px) scale(" + ZOOM + ")";
    var l = S.lift;
    shadow.style.transform = "translate(" + (4 + l * R * 0.2).toFixed(1) + "px," + (6 + l * R * 0.42).toFixed(1) + "px) scale(" + (1 + l * 0.05).toFixed(3) + ")";
    shadow.style.opacity = (0.7 - l * 0.34).toFixed(2);
    shadowHandle.style.transform = "rotate(" + S.a.toFixed(2) + "deg)";
  }

  function frame(now) {
    var dt = Math.min(0.034, (now - last) / 1000); last = now;
    var rest = false, n = 2;
    for (var i = 0; i < n; i++) rest = step(dt / n);
    render();
    if (rest || !visible) { running = false; return; }
    raf = requestAnimationFrame(frame);
  }
  function wake() {
    if (running || !visible) return;
    running = true; last = performance.now(); raf = requestAnimationFrame(frame);
  }

  /* ---------------- Picking it up ---------------- */
  var drag = null; // { id, ox, oy, sx, sy, moved, wasStuck }

  function scenePoint(e) { var r = scene.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }

  function nearestKey(x, y, radius) {
    var best = null, bestD = radius;
    keyNames.forEach(function (k) {
      var d = Math.hypot(keyPos[k].x - x, keyPos[k].y - y);
      if (d < bestD) { bestD = d; best = k; }
    });
    return best;
  }

  function onDown(e) {
    if (drag || (e.pointerType === "mouse" && e.button !== 0)) return;
    var p = scenePoint(e);
    drag = { id: e.pointerId, ox: p.x - S.x, oy: p.y - S.y, sx: p.x, sy: p.y, moved: false, wasStuck: S.mode === "stuck" && !!S.near, target: e.currentTarget };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
    e.preventDefault();
    if (!drag.wasStuck) { S.mode = "held"; S.tx = S.x; S.ty = S.y; mag.classList.add("is-held"); }
    hint.classList.remove("is-on");
    wake();
  }
  function onMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var p = scenePoint(e);
    if (!drag.moved) {
      if (Math.hypot(p.x - drag.sx, p.y - drag.sy) < 6) return;
      drag.moved = true; S.mode = "held"; mag.classList.add("is-held");
    }
    var x = clampX(p.x - drag.ox), y = clampY(p.y - drag.oy);
    // Close to a big note? Stick to it. Pull further away to let go.
    var k = nearestKey(x, y, S.near ? snapR * 1.45 : snapR);
    if (S.near && k !== S.near && Math.hypot(keyPos[S.near].x - x, keyPos[S.near].y - y) < snapR * 1.45) k = S.near;
    setNear(k);
    if (k) { S.tx = keyPos[k].x; S.ty = keyPos[k].y; } else { S.tx = x; S.ty = y; }
    wake();
  }
  function onUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag; drag = null;
    try { d.target.releasePointerCapture(e.pointerId); } catch (err) {}
    mag.classList.remove("is-held");
    if (!d.moved && d.wasStuck && e.type === "pointerup") { openProject(S.near); return; }
    if (S.near) S.mode = "stuck";
    else {
      S.mode = "free";
      var sp = Math.hypot(S.vx, S.vy), top = reduced ? 0 : 2400;   // cap how hard it can be thrown
      if (sp > top) { S.vx *= top / sp; S.vy *= top / sp; }
    }
    wake();
  }
  [document.getElementById("magHit"), document.getElementById("magHandle")].forEach(function (el) {
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("dragstart", function (e) { e.preventDefault(); });
  });

  function openProject(k) {
    if (!k || !PROJECTS[k]) return;
    if (typeof window.JMOpenCase === "function") window.JMOpenCase(PROJECTS[k].project);
  }

  // Clicking (or pressing Enter on) a big note sends the glass over to it.
  // If the glass is already there, it opens the project.
  keyNames.forEach(function (k) {
    keyEls[k].addEventListener("click", function () {
      if (S.near === k && S.mode === "stuck") { openProject(k); return; }
      setNear(k);
      S.mode = "stuck";
      if (reduced) { S.x = keyPos[k].x; S.y = keyPos[k].y; S.vx = S.vy = 0; S.lift = 1; }
      wake(); render();
    });
  });

  /* ---------------- Start ---------------- */
  function place() {
    measure();
    if (S.mode === "stuck" && S.near) { S.x = keyPos[S.near].x; S.y = keyPos[S.near].y; }
    else { S.x = clampX(S.x); S.y = Math.min(S.y, floorY); if (S.mode === "free") S.y = S.y > floorY - 40 ? floorY : S.y; }
    render(); wake();
  }

  measure();
  S.x = W * 0.5; S.y = reduced ? floorY : floorY - Math.min(260, H * 0.3); S.a = reduced ? -62 : -20; S.vx = reduced ? 0 : 60;
  render();
  mag.classList.add("is-ready");
  wake();
  setTimeout(function () { if (!everStuck && !drag) hint.classList.add("is-on"); }, 1600);

  var rt;
  window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(place, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(place); // note sizes settle once fonts load
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) wake(); }).observe(hero);
  }
})();
