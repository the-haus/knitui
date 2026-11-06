/**
 * Web: the home-indicator area comes from CSS, and a browser page has no status bar
 * to clear.
 */
export function useSafeInsets(bottomOverride: number | undefined) {
  return { top: 0, bottom: bottomOverride ?? "env(safe-area-inset-bottom, 0px)" } as {
    top: number;
    bottom: number | string;
  };
}
