(() => {
  const preloader = document.getElementById("preloader");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    const minVisible = 1500;
    const release = () => {
      const wait = Math.max(0, minVisible - (performance.now() - started));
      setTimeout(finishPreload, wait);
    };
    if (document.readyState === "complete") release();
    else window.addEventListener("load", release, { once: true });
    setTimeout(finishPreload, 4200);
  }

  const header = document.getElementById("header");
  const nav = document.getElementById("nav");
  const menuToggle = document.getElementById("menuToggle");
  const year = document.getElementById("year");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxCap = document.getElementById("lightboxCap");
  const lightboxClose = document.getElementById("lightboxClose");

  const audio = document.getElementById("bgAudio");
  const soundToggle = document.getElementById("soundToggle");
  const MUTED_KEY = "allgood-music-off";
  const storageGet = (key) => {
    try { return sessionStorage.getItem(key); } catch { return null; }
  };
  const storageSet = (key, value) => {
    try {
      if (value == null) sessionStorage.removeItem(key);
      else sessionStorage.setItem(key, value);
    } catch { /* private mode */ }
  };
  let wantSound = storageGet(MUTED_KEY) !== "1";
  let musicStart = null;

  const setSoundUi = (on) => {
    if (!soundToggle) return;
    soundToggle.setAttribute("aria-pressed", String(on));
    const copy = window.ALLGOOD || {};
    soundToggle.setAttribute("aria-label", on ? (copy.musicOff || "Turn music off") : (copy.musicOn || "Turn music on"));
  };

  const fadeMusic = () => {
    if (!audio) return;
    const target = 0.42;
    const startedAt = performance.now();
    const step = (now) => {
      if (!wantSound || audio.paused) return;
      const t = Math.min(1, (now - startedAt) / 1400);
      audio.volume = target * t;
      if (t < 1) requestAnimationFrame(step);
    };
    audio.volume = 0;
    requestAnimationFrame(step);
  };

  const startMusic = () => {
    if (!audio || !wantSound) return Promise.resolve(false);
    if (!audio.paused) return Promise.resolve(true);
    if (musicStart) return musicStart;
    musicStart = audio.play().then(() => {
      if (!wantSound) {
        audio.pause();
        setSoundUi(false);
        return false;
      }
      setSoundUi(true);
      fadeMusic();
      window.removeEventListener("pointerdown", unlockMusic, true);
      window.removeEventListener("keydown", unlockMusic, true);
      return true;
    }).catch(() => {
      setSoundUi(false);
      return false;
    }).finally(() => {
      musicStart = null;
    });
    return musicStart;
  };

  const unlockMusic = () => {
    if (!wantSound || (audio && !audio.paused)) return;
    startMusic();
  };

  if (audio) {
    audio.loop = true;
    audio.volume = 0;
    setSoundUi(false);
    startMusic();
    window.addEventListener("pointerdown", unlockMusic, true);
    window.addEventListener("keydown", unlockMusic, true);
  }

  soundToggle?.addEventListener("click", () => {
    if (!audio) return;
    if (!audio.paused) {
      wantSound = false;
      storageSet(MUTED_KEY, "1");
      audio.pause();
      setSoundUi(false);
      return;
    }
    wantSound = true;
    storageSet(MUTED_KEY, null);
    startMusic();
  });

  if (year) year.textContent = String(new Date().getFullYear());

  const onScroll = () => {
    header?.classList.toggle("is-solid", window.scrollY > 24);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const setMenu = (open) => {
    menuToggle?.setAttribute("aria-expanded", String(open));
    const copy = window.ALLGOOD || {};
    menuToggle?.setAttribute("aria-label", open ? (copy.menuClose || "Close menu") : (copy.menuOpen || "Open menu"));
    nav?.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
    document.body.style.overflow = open ? "hidden" : "";
  };

  menuToggle?.addEventListener("click", () => {
    setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  nav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
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
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
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
    if (lightboxImg) lightboxImg.src = "";
    if (!document.body.classList.contains("menu-open")) {
      document.body.style.overflow = "";
    }
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
