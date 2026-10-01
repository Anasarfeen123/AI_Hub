import { useEffect } from "react";

// Fades sections in as they scroll into view. Content is fully visible without
// it (no JS, reduced motion), so it's an enhancement only.
export default function useReveal() {
  const motionOk =
    typeof window !== "undefined" &&
    "IntersectionObserver" in window &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Switched on once for the page's lifetime, so re-renders never flash.
  useEffect(() => {
    if (!motionOk) return undefined;
    document.documentElement.classList.add("lp-reveal-on");
    return () => document.documentElement.classList.remove("lp-reveal-on");
  }, [motionOk]);

  // Re-runs after each render to pick up sections that arrived since (the
  // live roadmap), but only ever watches ones not yet shown.
  useEffect(() => {
    const els = [...document.querySelectorAll(".lp .reveal:not(.is-visible)")];
    if (!motionOk) {
      els.forEach((el) => el.classList.add("is-visible"));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  });
}
