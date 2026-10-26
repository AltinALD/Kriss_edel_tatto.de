(() => {
  const LANG_KEY = "kris-edel-lang";
  const preloader = document.getElementById("preloader");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.getElementById("header");
  const nav = document.getElementById("nav");
  const menuToggle = document.getElementById("menuToggle");
  const year = document.getElementById("year");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxCap = document.getElementById("lightboxCap");
  const lightboxClose = document.getElementById("lightboxClose");

  const copy = {
    de: {
      title: "Kristina Edel · Tattoo Köln",
      description: "Kristina Edel tätowiert in Köln, im Studio 22 Tattoo Cologne. Ornament, Fineline und Schwarz-Grau. Schmuck fürs Leben. Sudermanstraße 7–9.",
      menuOpen: "Menü öffnen",
      menuClose: "Menü schließen",
      nav: "Hauptmenü",
      lang: "Sprache",
    },
    en: {
      title: "Kristina Edel · Tattoo Cologne",
      description: "Kristina Edel tattoos in Cologne at 22 Tattoo Cologne. Ornament, fineline and black and grey. Jewelry for a lifetime. Sudermanstraße 7–9.",
      menuOpen: "Open menu",
      menuClose: "Close menu",
      nav: "Main",
      lang: "Language",
    },
  };

  const storageGet = (key) => {
    try { return localStorage.getItem(key); } catch { return null; }
  };
  const storageSet = (key, value) => {
    try { localStorage.setItem(key, value); } catch { /* private mode */ }
  };

  let lang = storageGet(LANG_KEY) === "en" ? "en" : "de";

  const menuOpen = () => menuToggle?.getAttribute("aria-expanded") === "true";

  const setMenu = (open) => {
    if (!menuToggle) return;
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? copy[lang].menuClose : copy[lang].menuOpen);
    nav?.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
    document.body.style.overflow = open ? "hidden" : "";
  };

  const applyLang = (next) => {
    lang = next === "en" ? "en" : "de";
    document.documentElement.lang = lang;
    document.title = copy[lang].title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", copy[lang].description);
    nav?.setAttribute("aria-label", copy[lang].nav);
    document.querySelector(".lang-switch")?.setAttribute("aria-label", copy[lang].lang);

    document.querySelectorAll("[data-de]").forEach((el) => {
      const value = el.getAttribute(lang === "en" ? "data-en" : "data-de");
      if (value == null) return;
      const attr = el.getAttribute("data-i18n-attr");
      if (attr) el.setAttribute(attr, value);
      else el.textContent = value;
    });

    document.querySelectorAll(".lang-switch button").forEach((btn) => {
      const on = btn.dataset.lang === lang;
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-pressed", String(on));
    });

    if (menuToggle) {
      menuToggle.setAttribute("aria-label", menuOpen() ? copy[lang].menuClose : copy[lang].menuOpen);
    }
    storageSet(LANG_KEY, lang);
  };

  document.querySelectorAll(".lang-switch button").forEach((btn) => {
    btn.addEventListener("click", () => applyLang(btn.dataset.lang));
  });
  applyLang(lang);

  const finishPreload = () => {
    if (!preloader) {
      document.body.classList.remove("is-loading");
      return;
    }
    preloader.classList.add("is-done");
    preloader.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-loading");
    setTimeout(() => preloader.remove(), reduceMotion ? 0 : 800);
  };

  if (reduceMotion) {
    finishPreload();
  } else {
    const started = performance.now();
    const minVisible = 1200;
    const release = () => {
      const wait = Math.max(0, minVisible - (performance.now() - started));
      setTimeout(finishPreload, wait);
    };
    if (document.readyState === "complete") release();
    else window.addEventListener("load", release, { once: true });
    setTimeout(finishPreload, 3800);
  }

  if (year) year.textContent = String(new Date().getFullYear());

  const onScroll = () => {
    header?.classList.toggle("is-solid", window.scrollY > 24);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  menuToggle?.addEventListener("click", () => setMenu(!menuOpen()));
  nav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  const reveals = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  }

  document.querySelectorAll(".hero .reveal").forEach((el, i) => {
    el.style.transitionDelay = `${0.08 + i * 0.08}s`;
    requestAnimationFrame(() => el.classList.add("is-in"));
  });

  const openLightbox = (src, alt, cap) => {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightboxImg.alt = alt || "";
    if (lightboxCap) lightboxCap.textContent = cap || "";
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    if (lightboxImg) lightboxImg.removeAttribute("src");
    if (!document.body.classList.contains("menu-open")) document.body.style.overflow = "";
  };

  document.querySelectorAll(".gallery-item").forEach((item) => {
    item.tabIndex = 0;
    const open = () => {
      const img = item.querySelector("img");
      const cap = item.querySelector("figcaption span");
      if (!img) return;
      openLightbox(img.currentSrc || img.src, img.alt, cap?.textContent || "");
    };
    item.addEventListener("click", open);
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  });

  lightboxClose?.addEventListener("click", closeLightbox);
  lightbox?.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (lightbox && !lightbox.hidden) closeLightbox();
    else setMenu(false);
  });

  const heroVideo = document.querySelector(".hero-video");
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) heroVideo?.play?.().catch(() => {});
  });
})();
