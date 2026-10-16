(() => {
  /* ========== MENU BURGER ========== */
  const burger = document.querySelector(".burger-menu");
  const nav = document.getElementById("main-nav");

  const setMenu = (open) => {
    if (!burger || !nav) return;
    burger.classList.toggle("open", open);
    nav.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };

  if (burger && nav) {
    burger.addEventListener("click", () =>
      setMenu(!nav.classList.contains("open")),
    );

    // Tutup menu setelah salah satu link diklik
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });

    // Tutup dengan tombol Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setMenu(false);
    });

    // Reset otomatis saat layar kembali ke ukuran desktop
    window.matchMedia("(min-width: 901px)").addEventListener("change", (e) => {
      if (e.matches) setMenu(false);
    });
  }

  /* ========== ABOUT: KATA MENYALA SAAT SCROLL ========== */
  const statement = document.getElementById("aboutStatement");

  if (statement) {
    // Pecah teks jadi <span class="word">, class highlight (.hl) ikut diturunkan
    const frag = document.createDocumentFragment();
    statement.childNodes.forEach((node) => {
      const cls = node.nodeType === 1 ? node.className : "";
      node.textContent
        .split(/\s+/)
        .filter(Boolean)
        .forEach((text) => {
          const span = document.createElement("span");
          span.className = `word ${cls}`.trim();
          span.textContent = text;
          frag.appendChild(span);
          frag.appendChild(document.createTextNode(" "));
        });
    });
    statement.textContent = "";
    statement.appendChild(frag);

    const words = statement.querySelectorAll(".word");
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      words.forEach((w) => w.classList.add("on"));
    } else {
      let lastLit = 0;
      let ticking = false;

      const update = () => {
        const rect = statement.getBoundingClientRect();
        const vh = window.innerHeight;
        // 0 saat bagian atas teks masuk di 85% layar, 1 saat bawah teks mencapai 50% layar
        const progress = (vh * 0.85 - rect.top) / (vh * 0.35 + rect.height);
        const lit = Math.round(
          Math.min(Math.max(progress, 0), 1) * words.length,
        );

        if (lit !== lastLit) {
          const from = Math.min(lit, lastLit);
          const to = Math.max(lit, lastLit);
          for (let i = from; i < to; i++) {
            words[i].classList.toggle("on", i < lit);
          }
          lastLit = lit;
        }
        ticking = false;
      };

      const onScroll = () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      };

      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      update();
    }
  }

  /* ========== SERVICES: AKORDEON ========== */
  const services = document.querySelectorAll(".service");

  const setService = (item, open) => {
    const btn = item.querySelector(".service-head");
    item.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", String(open));
  };

  services.forEach((item) => {
    const btn = item.querySelector(".service-head");
    btn.addEventListener("click", () => {
      const willOpen = !item.classList.contains("is-open");

      // Mode satu terbuka: tutup yang lain dulu
      services.forEach((other) => {
        if (other !== item) setService(other, false);
      });

      setService(item, willOpen);
    });
  });

  /* ========== REVEAL SAAT SCROLL ========== */
  {
    const items = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("in");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 },
      );
      items.forEach((el) => io.observe(el));
    } else {
      items.forEach((el) => el.classList.add("in"));
    }
  }

  /* ========== PROJECTS: SLIDER, FILTER, DRAG, TILT ========== */
  {
    const track = document.getElementById("pTrack");

    if (track) {
      const cards = [...track.querySelectorAll(".pcard")];
      const bar = document.getElementById("pBar");
      const count = document.getElementById("pCount");
      const prev = document.getElementById("pPrev");
      const next = document.getElementById("pNext");
      const filters = document.querySelectorAll("[data-filter]");
      const cursor = document.getElementById("dragCursor");
      const finePointer = window.matchMedia(
        "(hover: hover) and (pointer: fine)",
      ).matches;
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const pad2 = (n) => String(n).padStart(2, "0");
      const realCards = () =>
        cards.filter((c) => !c.hidden && !c.classList.contains("pcard-cta"));

      /* Progress bar + counter */
      const updateProgress = () => {
        const max = track.scrollWidth - track.clientWidth;
        const p = max > 0 ? track.scrollLeft / max : 1;
        bar.style.transform = `scaleX(${0.08 + p * 0.92})`;

        const padLeft = parseFloat(getComputedStyle(track).paddingLeft) || 0;
        const list = realCards();
        let idx = 0;
        let best = Infinity;
        list.forEach((c, i) => {
          const d = Math.abs(c.offsetLeft - padLeft - track.scrollLeft);
          if (d < best) {
            best = d;
            idx = i;
          }
        });
        count.textContent = `${pad2(Math.min(idx + 1, list.length))} / ${pad2(list.length)}`;
      };

      track.addEventListener("scroll", updateProgress, { passive: true });
      window.addEventListener("resize", updateProgress);

      /* Tombol panah */
      const step = () => {
        const first = cards.find((c) => !c.hidden);
        return (first ? first.offsetWidth : 320) + 24;
      };
      prev.addEventListener("click", () =>
        track.scrollBy({ left: -step(), behavior: "smooth" }),
      );
      next.addEventListener("click", () =>
        track.scrollBy({ left: step(), behavior: "smooth" }),
      );

      /* Filter */
      filters.forEach((btn) => {
        btn.addEventListener("click", () => {
          const f = btn.dataset.filter;
          filters.forEach((b) => {
            const on = b === btn;
            b.classList.toggle("is-active", on);
            b.setAttribute("aria-pressed", String(on));
          });
          cards.forEach((c) => {
            const show =
              c.hasAttribute("data-always") ||
              f === "all" ||
              c.dataset.cat.split(" ").includes(f);
            c.hidden = !show;
            if (show) {
              c.classList.remove("pop");
              void c.offsetWidth; // restart animasi
              c.classList.add("pop");
            }
          });
          track.scrollTo({ left: 0, behavior: "smooth" });
          updateProgress();
        });
      });

      /* Drag dengan mouse (touch sudah native swipe) */
      let down = false;
      let moved = false;
      let startX = 0;
      let startLeft = 0;

      track.addEventListener("pointerdown", (e) => {
        if (e.pointerType !== "mouse" || e.button !== 0) return;
        down = true;
        moved = false;
        startX = e.clientX;
        startLeft = track.scrollLeft;
      });

      window.addEventListener("pointermove", (e) => {
        if (!down) return;
        const dx = e.clientX - startX;
        if (!moved && Math.abs(dx) > 4) {
          moved = true;
          track.classList.add("is-dragging");
        }
        if (moved) track.scrollLeft = startLeft - dx;
      });

      window.addEventListener("pointerup", () => {
        if (!down) return;
        down = false;
        track.classList.remove("is-dragging");
      });

      // Cegah klik link setelah drag
      track.addEventListener(
        "click",
        (e) => {
          if (moved) {
            e.preventDefault();
            e.stopPropagation();
            moved = false;
          }
        },
        true,
      );

      /* Kursor "Drag" */
      if (cursor && finePointer) {
        track.addEventListener("pointermove", (e) => {
          if (e.pointerType !== "mouse") return;
          cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
          cursor.classList.add("show");
        });
        track.addEventListener("pointerleave", () =>
          cursor.classList.remove("show"),
        );
      }

      /* Tilt 3D + glare */
      if (finePointer && !reduceMotion) {
        cards.forEach((card) => {
          const cover = card.querySelector(".pcard-cover");
          if (!cover) return;

          card.addEventListener("pointermove", (e) => {
            if (down) return;
            const r = cover.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width;
            const y = (e.clientY - r.top) / r.height;
            cover.style.setProperty("--ry", `${(x - 0.5) * 12}deg`);
            cover.style.setProperty("--rx", `${(0.5 - y) * 12}deg`);
            cover.style.setProperty("--gx", `${x * 100}%`);
            cover.style.setProperty("--gy", `${y * 100}%`);
          });

          card.addEventListener("pointerleave", () => {
            cover.style.setProperty("--rx", "0deg");
            cover.style.setProperty("--ry", "0deg");
          });
        });
      }

      updateProgress();
    }
  }

  /* ========== CONTACT ========== */
  {
    const FORM_ENDPOINT = ""; // isi URL Formspree / Getform / API kamu; kosong = simulasi saja
    const STUDIO_TZ = "Asia/Jakarta"; // zona waktu studio untuk jam & status online
    const OPEN_HOUR = 9;
    const CLOSE_HOUR = 18;

    /* Jam + status studio */
    const statusBox = document.getElementById("studioStatus");
    const statusText = document.getElementById("studioStatusText");
    const timeEl = document.getElementById("studioTime");

    if (statusBox && statusText && timeEl) {
      const timeFmt = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: STUDIO_TZ,
      });
      const hourFmt = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        hour12: false,
        timeZone: STUDIO_TZ,
      });

      const tick = () => {
        const now = new Date();
        const hour = Number(hourFmt.format(now));
        const open = hour >= OPEN_HOUR && hour < CLOSE_HOUR;
        timeEl.textContent = timeFmt.format(now);
        statusText.textContent = open
          ? "We're online now"
          : "Offline, we'll reply in the morning";
        statusBox.classList.toggle("is-off", !open);
      };

      tick();
      setInterval(tick, 30000);
    }

    /* Salin email */
    const copyBtn = document.getElementById("copyMail");
    const hint = document.getElementById("mailHint");

    if (copyBtn && hint) {
      const copyText = async (text) => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
      };

      copyBtn.addEventListener("click", async () => {
        await copyText(copyBtn.dataset.email);
        hint.textContent = "Copied!";
        copyBtn.classList.add("copied");
        setTimeout(() => {
          hint.textContent = "Copy";
          copyBtn.classList.remove("copied");
        }, 1800);
      });
    }

    /* Form */
    const form = document.getElementById("contactForm");
    const success = document.getElementById("formSuccess");
    const formError = document.getElementById("formError");
    const sendBtn = document.getElementById("sendBtn");
    const resetBtn = document.getElementById("formReset");
    const fName = document.getElementById("cName");
    const fEmail = document.getElementById("cEmail");
    const fMsg = document.getElementById("cMsg");
    const counter = document.getElementById("cCount");

    if (form) {
      const updateCount = () => {
        counter.textContent = `${fMsg.value.length} / ${fMsg.maxLength}`;
      };

      const setErr = (input, msg) => {
        const field = input.closest(".field");
        field.classList.toggle("has-error", Boolean(msg));
        field.querySelector(".field-err").textContent = msg || "";
        input.setAttribute("aria-invalid", msg ? "true" : "false");
      };

      const validate = () => {
        const name = fName.value.trim();
        const email = fEmail.value.trim();
        const msg = fMsg.value.trim();
        let firstBad = null;

        if (name.length < 2) {
          setErr(fName, "Please tell us your name.");
          firstBad = firstBad || fName;
        } else setErr(fName, "");

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          setErr(fEmail, "Please enter a valid email address.");
          firstBad = firstBad || fEmail;
        } else setErr(fEmail, "");

        if (msg.length < 10) {
          setErr(fMsg, "A few more words please (at least 10 characters).");
          firstBad = firstBad || fMsg;
        } else setErr(fMsg, "");

        if (firstBad) firstBad.focus();
        return !firstBad;
      };

      [fName, fEmail, fMsg].forEach((input) =>
        input.addEventListener("input", () => setErr(input, "")),
      );
      fMsg.addEventListener("input", updateCount);

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        formError.hidden = true;
        if (!validate()) return;

        const payload = {
          name: fName.value.trim(),
          email: fEmail.value.trim(),
          services: [
            ...form.querySelectorAll('input[name="service"]:checked'),
          ].map((i) => i.value),
          budget:
            form.querySelector('input[name="budget"]:checked')?.value || "",
          message: fMsg.value.trim(),
        };

        sendBtn.disabled = true;
        sendBtn.classList.add("is-loading");
        sendBtn.querySelector(".btn-send-label").textContent = "Sending…";

        try {
          if (FORM_ENDPOINT) {
            const res = await fetch(FORM_ENDPOINT, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Request failed");
          } else {
            await new Promise((r) => setTimeout(r, 900)); // simulasi
          }

          form.reset();
          updateCount();
          form.hidden = true;
          success.hidden = false;
        } catch {
          formError.hidden = false;
        } finally {
          sendBtn.disabled = false;
          sendBtn.classList.remove("is-loading");
          sendBtn.querySelector(".btn-send-label").textContent = "Send message";
        }
      });

      resetBtn.addEventListener("click", () => {
        success.hidden = true;
        form.hidden = false;
        fName.focus();
      });
    }

    /* Tahun di footer */
    const year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
  }
})();
