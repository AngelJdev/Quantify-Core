import { useEffect, type RefObject } from "react";
import { useVisualPreferences } from "./VisualPreferences";
export function useSurfaceMotion(ref: RefObject<HTMLElement | null>, scene: string) {
  const { reducedMotion } = useVisualPreferences();
  useEffect(() => {
    const root = ref.current;
    if (!root || reducedMotion) return;
    const cards = root.querySelectorAll<HTMLElement>(".welcome-feature, .welcome-close, .public-section");
    let observer: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed"); observer?.unobserve(entry.target);
      }), { threshold: 0.08 });
      cards.forEach((card, index) => { card.style.setProperty("--qc-stagger", `${Math.min(index % 3, 2) * 90}ms`); card.classList.add("surface-reveal"); observer?.observe(card); });
    }
    let frame = 0;
    let target: HTMLElement | null = null;
    function reset() {
      cancelAnimationFrame(frame); frame = 0;
      target?.style.removeProperty("--qc-pointer-x"); target?.style.removeProperty("--qc-pointer-y");
      target?.style.removeProperty("--qc-tilt-x"); target?.style.removeProperty("--qc-tilt-y"); target = null;
    }
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const surface = (event.target as Element).closest<HTMLElement>(".welcome-stage, .welcome-feature, .dashboard-feature, .material-sample");
      if (!surface || !root?.contains(surface)) { reset(); return; }
      if (surface !== target) { reset(); target = surface; }
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = surface.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (event.clientX - box.left) / box.width));
        const y = Math.max(0, Math.min(1, (event.clientY - box.top) / box.height));
        surface.style.setProperty("--qc-pointer-x", `${x * 100}%`);
        surface.style.setProperty("--qc-pointer-y", `${y * 100}%`);
        surface.style.setProperty("--qc-tilt-x", `${(0.5 - y) * 3}deg`);
        surface.style.setProperty("--qc-tilt-y", `${(x - 0.5) * 3}deg`);
      });
    };
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerleave", reset);
    return () => {
      observer?.disconnect(); reset();
      cards.forEach(card => { card.classList.remove("surface-reveal", "is-revealed"); card.style.removeProperty("--qc-stagger"); });
      root.removeEventListener("pointermove", move); root.removeEventListener("pointerleave", reset);
    };
  }, [ref, scene, reducedMotion]);
}
export function useFluidNavigation(ref: RefObject<HTMLElement | null>, path: string, compact: boolean) {
  useEffect(() => {
    const navs = ref.current?.querySelectorAll<HTMLElement>("#primary-navigation, .island-mobile-nav");
    if (!navs) return;
    const update = () => navs.forEach(nav => {
      const selected = nav.querySelector<HTMLElement>('[aria-current="page"]');
      if (!selected || !nav.getBoundingClientRect().width) return;
      nav.style.setProperty("--qc-nav-x", `${selected.offsetLeft}px`);
      nav.style.setProperty("--qc-nav-y", `${selected.offsetTop}px`);
      nav.style.setProperty("--qc-nav-width", `${selected.offsetWidth}px`);
      nav.style.setProperty("--qc-nav-height", `${selected.offsetHeight}px`);
      nav.dataset.fluidNav = "ready";
    });
    update();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : undefined;
    navs.forEach(nav => observer?.observe(nav));
    window.addEventListener("resize", update);
    return () => { observer?.disconnect(); window.removeEventListener("resize", update); };
  }, [ref, path, compact]);
}
