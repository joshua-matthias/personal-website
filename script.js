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
  var GLOBE_SETTINGS = {
    color: 0xffffff,            // dots and lines
    color2: 0xe11d1d,           // accent colour (red)
    backgroundColor: 0x7a,      // background behind the globe
    size: 0.8,                  // size of the dots
    scale: 1.0,
    scaleMobile: 1.0
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
     3. HERO BACKGROUND (Vanta Globe)
        - Skipped on weak devices / reduced motion (gradient used instead)
        - Destroyed when the hero leaves the screen, rebuilt when it returns
     ================================================================= */
  var heroBg = $("#heroBg");
  var vanta = null;
  var canUseGlobe =
    typeof window.VANTA !== "undefined" && typeof window.THREE !== "undefined" &&
    !!VANTA.GLOBE && !isWeakDevice && !prefersReduced;

  function startGlobe() {
    if (vanta || !canUseGlobe) return;
    try {
      vanta = VANTA.GLOBE({
        el: heroBg,
        mouseControls: true, touchControls: true, gyroControls: false,
        minHeight: 200.0, minWidth: 200.0,
        scale: GLOBE_SETTINGS.scale,
        scaleMobile: GLOBE_SETTINGS.scaleMobile,
        color: GLOBE_SETTINGS.color,
        color2: GLOBE_SETTINGS.color2,
        size: GLOBE_SETTINGS.size,
        backgroundColor: GLOBE_SETTINGS.backgroundColor
      });
    } catch (err) {
      // If anything goes wrong, quietly fall back to the navy gradient.
      vanta = null; canUseGlobe = false;
      heroBg.classList.add("is-lite");
    }
  }
  function stopGlobe() {
    if (!vanta) return;
    try { vanta.destroy(); } catch (e) { /* ignore */ }
    vanta = null;
  }

  if (canUseGlobe && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      entries[0].isIntersecting ? startGlobe() : stopGlobe();
    }, { threshold: 0 }).observe($("#hero"));
  } else if (canUseGlobe) {
    startGlobe();
  } else {
    heroBg.classList.add("is-lite"); // gradient + soft glowing orbs
  }

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
    tl.from(heroFades[0], { y: 20, opacity: 0, duration: 0.8 })
      .from(words, { yPercent: 115, rotate: 4, duration: 1.1, stagger: 0.07 }, "-=0.5")
      .from(heroFades.slice(1), { y: 24, opacity: 0, duration: 0.9, stagger: 0.12 }, "-=0.6");

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
    gsap.to(".about__photo img", {
      yPercent: 8, ease: "none",
      scrollTrigger: { trigger: ".about__photo", start: "top bottom", end: "bottom top", scrub: true }
    });

    // Count-up numbers
    $$("[data-count]").forEach(function (el) {
      var end = parseFloat(el.dataset.count), suffix = el.dataset.suffix || "", obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: "top 90%", once: true,
        onEnter: function () {
          gsap.to(obj, { v: end, duration: 1.8, ease: "power2.out",
            onUpdate: function () { el.textContent = Math.round(obj.v) + suffix; } });
        }
      });
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
