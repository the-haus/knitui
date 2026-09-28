/** What {@link share} hands to the platform share sheet. Give `message`, `url`, or both. */
export interface ShareContent {
  /** Subject line / sheet title where the platform shows one (email subject, Android chooser title). */
  title?: string;
  /** The text to share. */
  message?: string;
  /** A link to share. */
  url?: string;
}

/**
 * How a {@link share} call ended.
 * - `shared` — the reader picked a target.
 * - `dismissed` — the reader closed the sheet; don't fall back to anything else.
 * - `unavailable` — there is no share sheet here, or it refused the payload; a
 *   caller may fall back (copy to the clipboard, show the link).
 */
export type ShareResult = "shared" | "dismissed" | "unavailable";
