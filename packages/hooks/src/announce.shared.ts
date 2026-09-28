export interface AnnounceOptions {
  /**
   * `polite` (default) waits for the reader to finish what it's saying;
   * `assertive` interrupts — keep that for errors.
   */
  politeness?: "polite" | "assertive";
}
