// Internal cross-platform helper — NOT exported from the public `src/index.ts`
// barrel. Shared by `Month` and `CalendarHeader` (and any future control that
// ports Mantine's `preventDefault`-on-mousedown focus guard) so the runtime
// narrowing lives in one place instead of being copied per component.

/**
 * Runtime narrowing: does `event` carry a callable `preventDefault`?
 *
 * Our cross-platform press/press-in events are typed without DOM specifics, but
 * on web they still expose `preventDefault`. This guard lets a handler call it
 * only when present (web), and skip it on native — no DOM types, no `any`.
 */
export function hasPreventDefault(event: unknown): event is { preventDefault: () => void } {
  return (
    typeof event === "object" &&
    event !== null &&
    "preventDefault" in event &&
    typeof event.preventDefault === "function"
  );
}

/**
 * Runtime narrowing: does `event` carry a callable `stopPropagation`?
 *
 * Mirrors {@link hasPreventDefault} for the `__stopPropagation` path: the inline
 * pickers' control keydown events expose `stopPropagation` on web (real DOM
 * event) but not on native. This lets a handler stop a key (e.g. Escape) from
 * bubbling out of a nested dropdown only where the method exists — no DOM types,
 * no `any`.
 */
export function hasStopPropagation(event: unknown): event is { stopPropagation: () => void } {
  return (
    typeof event === "object" &&
    event !== null &&
    "stopPropagation" in event &&
    typeof event.stopPropagation === "function"
  );
}

/**
 * Runtime narrowing: is `event` an Escape-key keydown? Reads `key` structurally
 * (web `KeyboardEvent.key`); always `false` on native events that carry no
 * `key`. Paired with {@link hasStopPropagation} for the `__stopPropagation`
 * dismiss-containment path — no DOM types, no `any`.
 */
export function isEscapeKey(event: unknown): boolean {
  return typeof event === "object" && event !== null && "key" in event && event.key === "Escape";
}
