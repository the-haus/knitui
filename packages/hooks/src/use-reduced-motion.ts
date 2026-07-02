import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Whether the user prefers reduced motion (web) — port of Mantine's
 * `useReducedMotion`. Tracks the `prefers-reduced-motion` media query; SSR-safe.
 * The `use-reduced-motion.native` sibling uses React Native's
 * `AccessibilityInfo`. Use it to gate animations (`Skeleton`, `Spinner`,
 * `Collapse`).
 */
export function useReducedMotion(initialValue = false): boolean {
  const [reduced, setReduced] = useState(initialValue);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;

    const mql = window.matchMedia(QUERY);
    const update = () => setReduced(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return reduced;
}
