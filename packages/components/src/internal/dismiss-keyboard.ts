/**
 * Cross-platform "dismiss the keyboard / blur the focused input". Web variant —
 * blurs the active element so focus-driven triggers (e.g. a searchable `Select`)
 * reset and can reopen. The `.native` sibling uses React Native's `Keyboard`.
 */
export function dismissKeyboard(): void {
  if (typeof document === "undefined") return;
  const el = document.activeElement;
  if (el instanceof HTMLElement) el.blur();
}
