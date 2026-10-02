import { useEffect } from "react";

// Pointer-driven touches for the landing page on desktop: the hero screenshot
// tilts towards the cursor (with the floating chips at a different depth), and
// cards marked .lp-spot light up where the pointer is. Only for a real mouse
// with motion allowed; everything here just sets CSS variables, once a frame.
export default function useLandingMotion() {
  useEffect(() => {
    const ok = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    if (!ok.matches) return undefined;

    let frame = 0;
    let last = null;

    function apply() {
      frame = 0;
      const e = last;
      if (!e) return;

      const card = e.target instanceof Element ? e.target.closest(".lp-spot") : null;
      if (card) {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      }

      const hero = document.querySelector(".lp-hero");
      const shot = hero?.querySelector(".lp-hero-shot");
      if (!shot || window.innerWidth <= 960) return;
      const h = hero.getBoundingClientRect();
      const inHero = e.clientY >= h.top && e.clientY <= h.bottom;
      const s = shot.getBoundingClientRect();
      const clamp = (v) => Math.max(-1, Math.min(1, v));
      const nx = inHero ? clamp((e.clientX - (s.left + s.width / 2)) / (s.width / 2)) : 0;
      const ny = inHero ? clamp((e.clientY - (s.top + s.height / 2)) / (s.height / 2)) : 0;
      shot.style.setProperty("--nx", nx.toFixed(3));
      shot.style.setProperty("--ny", ny.toFixed(3));
    }

    function onMove(e) {
      last = e;
      if (!frame) frame = requestAnimationFrame(apply);
    }

    function onLeave() {
      const shot = document.querySelector(".lp-hero-shot");
      shot?.style.setProperty("--nx", "0");
      shot?.style.setProperty("--ny", "0");
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, []);
}
