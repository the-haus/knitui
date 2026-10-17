/**
 * The sheet's spring settings, shared by both platforms and by the public
 * `animationConfig` prop. Its own type (not reanimated's `WithSpringConfig`) so
 * the web build never reaches into a native-only library for a type: the native
 * motion (`animate.native.ts`) hands it straight to reanimated's `withSpring`,
 * which reads the same fields; the web motion (`animate.ts`) integrates it
 * itself (`spring.ts`).
 */
export interface SheetSpringConfig {
  /** Spring stiffness (k). Higher is snappier. */
  stiffness?: number;
  /** Damping coefficient (c). Ignored when `dampingRatio` is given. */
  damping?: number;
  /** Mass of the panel (m). */
  mass?: number;
  /** Stop at the target instead of overshooting past it. */
  overshootClamping?: boolean;
  /**
   * Damping as a ratio of critical damping (1 = no overshoot). Together with
   * `duration` this is reanimated's duration-based spring; the web motion
   * derives an equivalent stiffness/damping from the pair.
   */
  dampingRatio?: number;
  /** Approximate settle time (ms) of a duration-based spring. */
  duration?: number;
  /** Rest threshold of reanimated's spring (native only). */
  energyThreshold?: number;
}

/**
 * Default spring for sheet motion. Tuned for a natural bottom-sheet settle:
 * roughly a 0.84 damping ratio (`damping / (2·√(stiffness·mass))`) so the panel
 * lands with a hint of overshoot rather than a robotic dead-stop. Overridable
 * per-instance via the `animationConfig` prop.
 */
export const DEFAULT_SPRING: SheetSpringConfig = {
  damping: 29,
  stiffness: 300,
  mass: 1,
  overshootClamping: false,
};
