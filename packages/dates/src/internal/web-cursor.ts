// Internal cross-platform helper — NOT exported from the public `src/index.ts`
// barrel. Shared by `Day`, `PickerControl` and `CalendarHeader` (and any future
// grid control) so the web-only cursor narrowing lives in one place instead of
// being copied per component (the same extraction pattern as `cell-metrics` and
// `has-prevent-default`).

import { isWeb } from "@knitui/core";

/**
 * Cursor is a web-only affordance — passing it on native leaks to the RN host
 * node. `isWeb` is a module-load constant, so this is safe to call inside a
 * static styled-variant definition. Mirrors the kit's internal `webCursor`,
 * which is not exported from `@knitui/components`.
 */
export const webCursor = <T extends string>(cursor: T): { cursor?: T } => (isWeb ? { cursor } : {});
