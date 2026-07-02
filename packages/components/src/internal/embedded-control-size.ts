/**
 * Derive the size key for a control EMBEDDED inside an input field — a chip/pill/
 * tag in a `MultiSelect`/`TagsInput`/`PillsInput`, or a clear/remove `CloseButton`.
 *
 * An embedded control sized at the SAME key as its field would be exactly as tall
 * as the field (a `md` Pill is 40px, a `md` field is 40px), so it overflows once
 * the field's own border + vertical padding are added. Stepping the embedded
 * control DOWN one key keeps it comfortably inside the field height at every size
 * while preserving the visual proportion (a bigger field gets bigger chips). The
 * smallest field keys can't step below `xxs`, so they clamp there.
 *
 * The single source of truth for this relationship, so a `md` MultiSelect, a `md`
 * TagsInput pill, and an input clear button all derive the same embedded size.
 */
const EMBEDDED_CONTROL_SIZE = {
  xxs: "xxs",
  xs: "xxs",
  sm: "xs",
  md: "sm",
  lg: "md",
  xl: "lg",
  xxl: "xl",
} as const;

export type EmbeddableSizeKey = keyof typeof EMBEDDED_CONTROL_SIZE;
export type EmbeddedControlSize = (typeof EMBEDDED_CONTROL_SIZE)[EmbeddableSizeKey];

const EMBEDDABLE_SIZE_KEYS = new Set<string>(Object.keys(EMBEDDED_CONTROL_SIZE));

const isEmbeddableSizeKey = (value: unknown): value is EmbeddableSizeKey =>
  typeof value === "string" && EMBEDDABLE_SIZE_KEYS.has(value);

/**
 * Map a field size key one step down to the embedded-control key. A non-token
 * (arbitrary CSS/number) or absent size falls back to the canonical `md` field,
 * yielding an `sm` embedded control.
 */
export const toEmbeddedControlSize = (size: string | undefined): EmbeddedControlSize =>
  isEmbeddableSizeKey(size) ? EMBEDDED_CONTROL_SIZE[size] : "sm";
