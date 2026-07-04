export interface UseMediaQueryOptions {
  /**
   * When `true` (default), read the SSR-safe initial value on first render and
   * the real value in an effect. Overrides the provider's setting for this call.
   * Set `false` only in pure client-side apps (skips SSR-safety for immediacy).
   */
  getInitialValueInEffect?: boolean;
}
