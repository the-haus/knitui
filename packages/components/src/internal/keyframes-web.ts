/**
 * Web-only `@keyframes` injection. The kit's web target is Tamagui-DOM, NOT
 * react-native-web, so Tamagui's `animationKeyframes` style prop is unavailable —
 * looping motion is achieved instead by injecting a CSS `@keyframes` block ONCE
 * into a shared `<style>` tag (keyed by name, deduped) and referencing it from an
 * inline `animationName`. The loop then runs on the compositor with zero React
 * re-renders. Native has no analogue (it drives reanimated shared values), so
 * this file has no `.native` sibling and must only be imported from `.tsx`.
 */

/** The single injected stylesheet; created lazily on first use. */
let sheet: HTMLStyleElement | undefined;
/** Names already written to {@link sheet}, so identical keyframes inject once. */
const injected = new Set<string>();

/**
 * Ensure a `@keyframes <name> { <body> }` rule exists in the shared stylesheet.
 * Idempotent per `name` (the body is assumed stable for a given name). No-op when
 * there is no DOM (SSR / non-web), returning the name regardless so callers can
 * reference it unconditionally.
 *
 * @returns the `name` — pass straight to an inline `animationName`.
 */
export function injectKeyframes(name: string, body: string): string {
  if (typeof document === "undefined") return name;
  if (injected.has(name)) return name;

  if (!sheet) {
    sheet = document.createElement("style");
    sheet.setAttribute("data-knitui-loop-keyframes", "");
    document.head.appendChild(sheet);
  }
  sheet.appendChild(document.createTextNode(`@keyframes ${name}{${body}}`));
  injected.add(name);
  return name;
}

/** TEST-ONLY: reset injection state so a suite can assert first-injection. */
export function __resetKeyframesForTest(): void {
  if (sheet?.parentNode) sheet.parentNode.removeChild(sheet);
  sheet = undefined;
  injected.clear();
}
