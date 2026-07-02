/**
 * Cross-platform floating offset value mirroring floating-ui's `offset()` axes
 * configuration — the object form Mantine accepts on `Popover`/`HoverCard`/
 * `Tooltip` `offset`. A plain `number` is the main-axis gutter; the object form
 * skids the floating element along each axis.
 *
 * This is byte-for-byte the object half of floating-ui's own `OffsetValue`
 * (`{ mainAxis?; crossAxis?; alignmentAxis? }`), so a `FloatingOffset` is
 * assignable to the `offset()` middleware param on both the web and native
 * floating layers WITHOUT a cast.
 */
export interface FloatingAxesOffsets {
  /** Distance (gutter) between the reference and floating element. @default 0 */
  mainAxis?: number;
  /** Skidding along the alignment axis. @default 0 */
  crossAxis?: number;
  /** Skidding for aligned placements only (e.g. `top-start`). */
  alignmentAxis?: number | null;
}

/** A main-axis gutter `number`, or a per-axis offset object. */
export type FloatingOffset = number | FloatingAxesOffsets;
