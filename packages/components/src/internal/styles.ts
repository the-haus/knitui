/**
 * Per-slot style passthrough (Pillar B). The implementation now lives in
 * `@knitui/core` (`composition/slot-styles.ts`) so it's shared by every kit —
 * `@knitui/components` AND `@knitui/dates` — beside the marker-slot system.
 *
 * This module is a back-compat re-export: the 60+ component call sites keep
 * importing `slotStyles` / `pick` / `SlotStyles` from `../internal/styles`
 * unchanged. New cross-kit code should import these directly from `@knitui/core`.
 */
export {
  pick,
  type SlotAccessor,
  type SlotStyleMap,
  slotStyles,
  type SlotStyles,
  type SlotValue,
} from "@knitui/core";
