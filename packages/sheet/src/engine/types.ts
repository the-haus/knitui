/**
 * @knitui/sheet engine types — platform-free, reanimated-free, DOM-free.
 */

/** Input to {@link settle}: where a drag/fling ended, and the snap geometry. */
export interface SettleInput {
  /** Current panel translateY (px; 0 = fully open, larger = pushed down). */
  offset: number;
  /** Release velocity on the Y axis (px/s; down = positive). */
  velocity: number;
  /**
   * Sorted snap offsets, ascending (index 0 = most open). Does NOT include the
   * dismiss/closed offset — that is passed separately as {@link dismissOffset}.
   */
  offsets: number[];
  /**
   * The offset that closes the sheet. When `dismissible` is true it participates
   * in settling as an extra landing target; otherwise it only bounds clamping.
   */
  dismissOffset: number;
  /** Whether a release may land on {@link dismissOffset} and dismiss the sheet. */
  dismissible: boolean;
  /** |velocity| (px/s) above which a release commits in the fling direction. @default 300 */
  flickThreshold?: number;
  /** Seconds of velocity projected past the release point. @default 0.2 */
  projection?: number;
}

/** Result of {@link settle}: where to animate, and whether that dismisses. */
export interface SettleResult {
  /** Index into the snap-points array, or `-1` when dismissing. */
  index: number;
  /** Target translateY to animate to. */
  offset: number;
  /** Whether landing here should close the sheet. */
  dismiss: boolean;
}
