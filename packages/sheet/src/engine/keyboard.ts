import { clamp } from "./snap";

/** Inputs to {@link panelFrame}: one frame of panel and keyboard state. */
export interface PanelFrameInput {
  /** Panel offset (px; 0 = fully open, `viewportHeight` = closed). */
  offset: number;
  /** Viewport height (px). */
  viewportHeight: number;
  /** Height of the soft keyboard (px; 0 when hidden). */
  keyboardHeight: number;
  /** Minimum gap (px) kept between the panel top and the viewport top. */
  topGap: number;
}

/** Result of {@link panelFrame}: where to paint the panel this frame. */
export interface PanelFrame {
  /** Panel translateY (px). */
  translateY: number;
  /** Visible panel height (px), measured from its top to the keyboard or screen edge. */
  visibleHeight: number;
}

/**
 * Where the panel sits this frame, with the keyboard treated as a smaller viewport.
 * Without a keyboard this is the identity: `translateY === offset`. With one, the
 * panel's bottom edge rides on the keyboard, and a panel too tall for the space that
 * leaves is shortened at the top gap rather than pushed off the screen.
 *
 * Runs per frame on the UI thread, so it moves the panel by transform alone. A drag
 * still writes `offset`, which keeps the snap and handoff maths free of the keyboard.
 */
export function panelFrame(input: PanelFrameInput): PanelFrame {
  "worklet";
  const { offset, viewportHeight, keyboardHeight, topGap } = input;
  const bottom = viewportHeight - keyboardHeight;
  const open = viewportHeight - offset;
  if (keyboardHeight <= 0) return { translateY: offset, visibleHeight: open };
  const visibleHeight = clamp(open, 0, Math.max(0, bottom - topGap));
  return { translateY: bottom - visibleHeight, visibleHeight };
}

/**
 * The footer's translateY inside the panel, measured from the panel's top. It keeps
 * the footer on the panel's visible bottom edge at every offset, and never above the
 * panel's top. `slide` lets the footer drop by that many px, so its safe-area padding
 * tucks behind a keyboard, which already clears the home indicator.
 */
export function footerTranslate(visibleHeight: number, footerHeight: number, slide = 0): number {
  "worklet";
  return Math.max(0, visibleHeight - footerHeight + slide);
}

/**
 * The keyboard height still to lift by, given how far the sheet's layer already ends
 * above the bottom of the window. The keyboard rises from the window's bottom, so a
 * layer above a tab bar, or inside a `KeyboardAvoidingView` that made room, is that much
 * clear of it already, and lifting by the whole keyboard would overshoot.
 */
export function keyboardLift(keyboardHeight: number, bottomGap: number): number {
  "worklet";
  return Math.max(0, keyboardHeight - bottomGap);
}

/** Shrinkage below this is browser chrome (a collapsing URL bar), not a keyboard. */
const MIN_KEYBOARD_HEIGHT = 120;

/** Inputs to {@link visualKeyboardHeight}: one reading of the browser's viewports. */
export interface VisualViewportReading {
  /** `window.innerHeight`. */
  layoutHeight: number;
  /** `visualViewport.height`. */
  viewportHeight: number;
  /** `visualViewport.offsetTop`. */
  offsetTop: number;
  /** `visualViewport.scale`: pinch zoom also shrinks the visual viewport. */
  scale: number;
}

/** The soft keyboard's height on web, or 0 when none is showing. */
export function visualKeyboardHeight(reading: VisualViewportReading): number {
  const { layoutHeight, viewportHeight, offsetTop, scale } = reading;
  if (Math.abs(scale - 1) > 0.01) return 0;
  const height = Math.round(layoutHeight - viewportHeight - offsetTop);
  return height >= MIN_KEYBOARD_HEIGHT ? height : 0;
}
