(() => {
  // Muted loops play while on screen; play/pause buttons and reduced motion
  // follow the Fluorescent Whisker project page.
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const videos = [...document.querySelectorAll("#hero-video, .demo-video")];
  const buttons = [...document.querySelectorAll("[data-video]")];
  const manuallyPaused = new Set();
  const inView = new Set();
  function update(video) {
    const button = buttons.find((b) => b.dataset.video === video.id);
    if (!button) return;
    const label = `${video.paused ? "Play" : "Pause"} video`;
    button.textContent = label;
    button.setAttribute("aria-label", label);
  }
  function play(video) {
    const promise = video.play();
    if (promise) promise.catch(() => update(video));
  }
  videos.forEach((video) => {
    video.addEventListener("play", () => update(video));
    video.addEventListener("pause", () => update(video));
    if (preference.matches) video.pause();
    update(video);
  });
  buttons.forEach((button) =>
    button.addEventListener("click", () => {
      const video = document.getElementById(button.dataset.video);
      if (video.paused) {
        manuallyPaused.delete(video);
        play(video);
      } else {
        manuallyPaused.add(video);
        video.pause();
      }
    }),
  );
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting) {
            inView.add(video);
            if (
              !preference.matches &&
              !manuallyPaused.has(video) &&
              !document.hidden
            )
              play(video);
          } else {
            inView.delete(video);
            video.pause();
          }
        }),
      { threshold: 0.2 },
    );
    videos.forEach((video) => observer.observe(video));
  }
  preference.addEventListener("change", () => {
    if (preference.matches) videos.forEach((video) => video.pause());
    else
      inView.forEach((video) => {
        if (!manuallyPaused.has(video)) play(video);
      });
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) videos.forEach((video) => video.pause());
    else if (!preference.matches)
      inView.forEach((video) => {
        if (!manuallyPaused.has(video)) play(video);
      });
  });

  // Hero caption: mark the run on screen. The loop shows the fixed fishtail,
  // then the translating one between the two times in data-translating.
  const hero = document.getElementById("hero-video");
  const runs = document.querySelector(".hero-foot .runs");
  if (hero && runs) {
    const [from, to] = runs.dataset.translating.split(" ").map(Number);
    const mark = () => {
      const t = hero.currentTime;
      runs.dataset.on = t >= from && t < to ? "translating" : "fixed";
    };
    hero.addEventListener("timeupdate", mark);
    hero.addEventListener("seeked", mark);
    mark();
  }

  // Fishtail run tabs. Hidden panels stop intersecting, so their videos pause
  // and the newly shown run starts through the observer above.
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  function select(tab, focus) {
    tabs.forEach((t) => {
      const selected = t === tab;
      t.setAttribute("aria-selected", String(selected));
      t.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(t.getAttribute("aria-controls"));
      panel.hidden = !selected;
      if (!selected) panel.querySelectorAll("video").forEach((v) => v.pause());
    });
    if (focus) tab.focus();
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(tab, false));
    tab.addEventListener("keydown", (e) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (step) {
        e.preventDefault();
        select(tabs[(i + step + tabs.length) % tabs.length], true);
      } else if (e.key === "Home" || e.key === "End") {
        e.preventDefault();
        select(tabs[e.key === "Home" ? 0 : tabs.length - 1], true);
      }
    });
  });

  // Figure lightbox (links still open the image when JS is off).
  const lb = document.getElementById("lightbox");
  const lbImg = lb.querySelector("img");
  let lastZoom = null;
  function closeLb() {
    if (!lb.classList.contains("open")) return;
    lb.classList.remove("open");
    lbImg.removeAttribute("src");
    document.body.style.overflow = "";
    if (lastZoom) lastZoom.focus();
  }
  document.querySelectorAll("a.zoom").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      lastZoom = a;
      document.body.style.overflow = "hidden";
      const img = a.querySelector("img");
      lbImg.src = a.getAttribute("href");
      lbImg.alt = img ? img.alt : "";
      lb.classList.add("open");
      lb.querySelector("button").focus();
    });
  });
  lb.addEventListener("click", closeLb);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLb();
    if (e.key === "Tab" && lb.classList.contains("open")) {
      e.preventDefault();
      lb.querySelector("button").focus();
    }
  });

  // Highlight the current section in the nav.
  const links = [...document.querySelectorAll(".nav a")];
  const byId = {};
  links.forEach((l) => {
    byId[l.getAttribute("href").slice(1)] = l;
  });
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting && byId[en.target.id]) {
            links.forEach((l) => l.classList.remove("active"));
            byId[en.target.id].classList.add("active");
          }
        }),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    Object.keys(byId).forEach((id) => {
      const s = document.getElementById(id);
      if (s) io.observe(s);
    });
  }
})();
