/**
 * Coarse foreground/background state, normalized across platforms.
 * - `active` — app/tab is focused and visible.
 * - `background` — app is backgrounded / the tab is hidden.
 * - `inactive` — transitional (iOS app switcher, incoming call).
 */
export type AppVisibility = "active" | "background" | "inactive";
