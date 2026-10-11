// =====================================================
// Motion & presence layer
// Pure presentation — no protocol logic lives here.
//
//  01  easing everywhere        (CSS --ease)
//  02  sequenced hero           (CSS animation-delay)
//  03  choreographed scroll     (reveals, parallax, optional Lenis)
//  05  depth                    (CSS perspective tilt)
//  06  presence                 (cursor glow, spotlight, magnetic buttons)
//  09  performance              (transform/opacity only, one rAF loop)
// =====================================================

(function () {
    "use strict";

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const lerp = (a, b, t) => a + (b - a) * t;


    // -------------------------------------------------
    // Smooth scroll (Lenis, if the CDN script loaded)
    // -------------------------------------------------

    let lenis = null;

    if (window.Lenis && !reduced) {
        lenis = new window.Lenis({
            duration: 1.15,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) // expo.out
        });
    }

    function scrollToTarget(target) {
        if (lenis) {
            lenis.scrollTo(target, { offset: -24 });
        } else {
            target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
        }
    }

    document.querySelectorAll("[data-scroll]").forEach(function (link) {
        link.addEventListener("click", function (event) {
            const target = document.querySelector(link.getAttribute("href"));

            if (!target) {
                return;
            }

            event.preventDefault();
            scrollToTarget(target);

            // "Run another transmission" — reset focus on the generator
            if (link.hasAttribute("data-rerun")) {
                setTimeout(function () {
                    const button = document.getElementById("generateKeyButton");
                    if (button && !button.disabled) {
                        button.focus({ preventScroll: true });
                    }
                }, 900);
            }
        });
    });

    const brand = document.querySelector(".brand");
    if (brand) {
        brand.addEventListener("click", function (event) {
            event.preventDefault();
            if (lenis) { lenis.scrollTo(0); } else { window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }); }
        });
    }


    // -------------------------------------------------
    // Reveal on scroll — sections feed you, they don't dump
    // -------------------------------------------------

    const revealItems = document.querySelectorAll(".reveal");

    if ("IntersectionObserver" in window && !reduced) {
        const revealer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("in");
                    revealer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

        revealItems.forEach(function (el) { revealer.observe(el); });
    } else {
        revealItems.forEach(function (el) { el.classList.add("in"); });
    }


    // -------------------------------------------------
    // Section tracking — header counter + rotated side label
    // -------------------------------------------------

    const counter = document.getElementById("pageCounter");
    const sideLabel = document.getElementById("sideLabel");
    const sections = document.querySelectorAll("[data-section]");

    function setCurrent(section) {
        const index = Number(section.dataset.index || 0);
        const label = (section.dataset.section || "").toUpperCase();

        if (counter) {
            counter.innerHTML = "( " + String(index).padStart(2, "0") + " ) <i>of</i> 04";
        }

        if (sideLabel && sideLabel.textContent !== label) {
            sideLabel.classList.add("swap");
            setTimeout(function () {
                sideLabel.textContent = label;
                sideLabel.classList.remove("swap");
            }, 260);
        }
    }

    if ("IntersectionObserver" in window) {
        const tracker = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    setCurrent(entry.target);
                }
            });
        }, { rootMargin: "-45% 0px -50% 0px" });

        sections.forEach(function (s) { tracker.observe(s); });
    }


    // -------------------------------------------------
    // Pointer state
    // -------------------------------------------------

    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2, nx: 0, ny: 0, active: false };

    const glow = document.getElementById("cursorGlow");
    const stage = document.getElementById("stage");
    const scene = document.getElementById("scene");

    const glowPos = { x: pointer.x, y: pointer.y };
    const tilt = { x: 0, y: 0, tx: 0, ty: 0 };

    if (finePointer && !reduced) {
        window.addEventListener("pointermove", function (event) {
            pointer.x = event.clientX;
            pointer.y = event.clientY;
            pointer.nx = (event.clientX / window.innerWidth) * 2 - 1;
            pointer.ny = (event.clientY / window.innerHeight) * 2 - 1;

            if (!pointer.active) {
                pointer.active = true;
                glow.classList.add("on");
            }
        }, { passive: true });

        document.documentElement.addEventListener("pointerleave", function () {
            pointer.active = false;
            pointer.nx = 0;
            pointer.ny = 0;
            glow.classList.remove("on");
        });

        // Card spotlight — cursor-following light inside each card
        document.querySelectorAll(".spot").forEach(function (card) {
            card.addEventListener("pointermove", function (event) {
                const rect = card.getBoundingClientRect();
                card.style.setProperty("--mx", (event.clientX - rect.left) + "px");
                card.style.setProperty("--my", (event.clientY - rect.top) + "px");
            }, { passive: true });
        });

        // Magnetic buttons — they lean toward you, then ease back
        document.querySelectorAll(".magnetic").forEach(function (button) {
            button.addEventListener("pointermove", function (event) {
                if (button.disabled) { return; }
                const rect = button.getBoundingClientRect();
                const dx = event.clientX - (rect.left + rect.width / 2);
                const dy = event.clientY - (rect.top + rect.height / 2);
                button.style.transform = "translate3d(" + (dx * 0.18).toFixed(1) + "px," + (dy * 0.28).toFixed(1) + "px,0)";
            }, { passive: true });

            button.addEventListener("pointerleave", function () {
                button.style.transform = "";
            });
        });
    }


    // -------------------------------------------------
    // Starfield — a quiet backdrop, deliberately sparse
    // -------------------------------------------------

    const canvas = document.getElementById("field");
    const ctx = canvas ? canvas.getContext("2d") : null;

    let width = 0, height = 0, dpr = 1;
    const stars = [];

    // Pantone-derived tints
    const TINTS = [
        "240,238,233",  // Cloud Dancer
        "76,143,216",   // Classic Blue (lifted)
        "165,146,232",  // Ultra Violet (lifted)
        "255,190,152",  // Peach Fuzz
        "255,111,97"    // Living Coral
    ];

    function resizeField() {
        if (!canvas) { return; }

        dpr = Math.min(window.devicePixelRatio || 1, 1.5); // 09: cap the cost on phones
        width = window.innerWidth;
        height = window.innerHeight;

        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const count = width < 700 ? 45 : 90;
        stars.length = 0;

        for (let i = 0; i < count; i++) {
            const depth = Math.random();            // 0 = far, 1 = near
            const tint = Math.random() < 0.7 ? 0 : 1 + Math.floor(Math.random() * (TINTS.length - 1));

            stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                depth: depth,
                r: 0.4 + depth * 1.5,
                tint: TINTS[tint],
                phase: Math.random() * Math.PI * 2,
                speed: 0.4 + Math.random() * 0.8
            });
        }
    }

    function drawField(time, scrollY) {
        if (!ctx) { return; }

        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < stars.length; i++) {
            const s = stars[i];

            // parallax: near stars move further as you scroll / move the pointer
            let y = (s.y - scrollY * (0.04 + s.depth * 0.22)) % height;
            if (y < 0) { y += height; }

            const x = s.x + pointer.nx * s.depth * 14;
            const twinkle = reduced ? 0.7 : 0.45 + 0.55 * Math.sin(time * 0.0007 * s.speed + s.phase);
            const alpha = (0.15 + s.depth * 0.55) * twinkle;

            ctx.beginPath();
            ctx.fillStyle = "rgba(" + s.tint + "," + alpha.toFixed(3) + ")";
            ctx.arc(x, y + pointer.ny * s.depth * 10, s.r, 0, 6.2832);
            ctx.fill();
        }
    }


    // -------------------------------------------------
    // Parallax targets
    // -------------------------------------------------

    const parallaxEls = Array.from(document.querySelectorAll("[data-parallax]")).map(function (el) {
        return { el: el, speed: parseFloat(el.dataset.parallax) || 0 };
    });

    function applyParallax() {
        const vh = window.innerHeight;

        for (let i = 0; i < parallaxEls.length; i++) {
            const item = parallaxEls[i];
            const rect = item.el.parentElement.getBoundingClientRect();

            if (rect.bottom < -200 || rect.top > vh + 200) { continue; }

            // distance of section centre from viewport centre
            const offset = (rect.top + rect.height / 2) - vh / 2;
            item.el.style.transform = "translate3d(0," + (offset * item.speed).toFixed(1) + "px,0)";
        }
    }


    // -------------------------------------------------
    // One loop for everything that moves continuously
    // -------------------------------------------------

    const progressBar = document.getElementById("progressBar");
    let running = true;

    function frame(time) {
        if (!running) { return; }

        if (lenis) { lenis.raf(time); }

        const scrollY = window.scrollY || 0;
        const doc = document.documentElement;
        const max = Math.max(1, doc.scrollHeight - window.innerHeight);

        if (progressBar) {
            progressBar.style.transform = "scaleX(" + clamp(scrollY / max, 0, 1).toFixed(4) + ")";
        }

        if (!reduced) {
            // cursor glow eases toward the pointer
            if (glow && finePointer) {
                glowPos.x = lerp(glowPos.x, pointer.x, 0.08);
                glowPos.y = lerp(glowPos.y, pointer.y, 0.08);
                glow.style.transform = "translate3d(" + glowPos.x.toFixed(1) + "px," + glowPos.y.toFixed(1) + "px,0)";
            }

            // hero depth: pointer + scroll drive rotateX / rotateY
            if (scene) {
                const heroProgress = clamp(scrollY / window.innerHeight, 0, 1);
                tilt.tx = pointer.nx * 14;
                tilt.ty = -pointer.ny * 10 + heroProgress * 24;
                tilt.x = lerp(tilt.x, tilt.tx, 0.06);
                tilt.y = lerp(tilt.y, tilt.ty, 0.06);
                scene.style.setProperty("--tiltX", tilt.x.toFixed(2));
                scene.style.setProperty("--tiltY", tilt.y.toFixed(2));

                if (stage) {
                    stage.style.opacity = "";
                }
            }

            applyParallax();
        }

        drawField(time, scrollY);

        requestAnimationFrame(frame);
    }

    resizeField();

    let resizeTimer = null;
    window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resizeField, 150);
    });

    // pause everything when the tab isn't visible
    document.addEventListener("visibilitychange", function () {
        if (document.hidden) {
            running = false;
        } else if (!running) {
            running = true;
            requestAnimationFrame(frame);
        }
    });

    requestAnimationFrame(frame);

})();
