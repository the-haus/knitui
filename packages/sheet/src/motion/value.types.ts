/**
 * A number (or flag) the sheet animates and listens to — the panel `offset`, the
 * closing flag, a nested list's scroll offset.
 *
 * On native it IS a reanimated `SharedValue` (`value.native.ts`): written and
 * read on the UI thread by worklets. On the web it is a plain observable
 * (`value.ts`), written by a `requestAnimationFrame` spring and by pointer drags.
 * This interface is the subset both share, so platform-agnostic code (the
 * motion controller, the sheet itself, the painters) never names either.
 */
export interface SheetValue<T> {
  value: T;
  /** Call `listener` on every write. `id` must be unique per subscription. */
  addListener(id: number, listener: (value: T) => void): void;
  removeListener(id: number): void;
}
