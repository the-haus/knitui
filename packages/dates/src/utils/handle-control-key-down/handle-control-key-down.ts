/**
 * Cross-platform roving-focus handler for 2-D (and multi-level) calendar grids.
 *
 * Mantine's original operates on DOM `RefObject<HTMLButtonElement[][][]>` and
 * calls `.disabled` / `.getAttribute('data-hidden')` / `.getAttribute('data-outside')`.
 * This port replaces every DOM-specific surface:
 *
 *  - Node type  → `FocusableControl` (plain object, `{ focus(): void }` + optional state
 *                 flags). The Month layer populates it when it calls `__getDayRef`.
 *  - Ref type   → `React.MutableRefObject<FocusableControlsMap>` so callers can mutate the
 *                 3-D map without a DOM ref.
 *  - Event type → a minimal structural `ControlKeyboardEventInput`
 *                 (`{ key?, preventDefault? }`) satisfied by both Day and PickerControl
 *                 keydown events — never `React.KeyboardEvent<HTMLButtonElement>`.
 *  - `key`      → read directly from the cross-platform event (present on both web
 *                 NativeKeyboardEvent and React's SyntheticKeyboardEvent).
 *  - `preventDefault` → guarded via a runtime narrowing helper (same pattern as
 *                 `hasPreventDefault` in `Month.tsx`; duplicated here to keep this util
 *                 self-contained with no circular deps).
 *
 * Navigation behaviour is preserved 1-to-1 from Mantine:
 *  - ArrowUp/Down/Left/Right shift focus by one cell, wrapping at row and level edges.
 *  - Disabled / hidden / outside cells are skipped; the walk continues in the same
 *    direction until a focusable cell (or the grid boundary) is reached.
 *  - Multiple calendar levels (e.g. `numberOfColumns > 1`) are handled: focus moves
 *    from the last row of level N into row 0 of level N+1, and vice-versa.
 */

import type * as React from "react";

import type { ControlKeydownPayload } from "../../types";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The minimal interface a calendar control node must satisfy for roving focus.
 * Month.tsx populates these flags when it builds the ref callback passed to
 * `__getDayRef`; the navigation logic reads them to decide whether to skip.
 */
export interface FocusableControl {
  /** Programmatically move browser/native focus to this control. */
  focus(): void;
  /** Skip this cell during navigation (maps to the `disabled` variant). */
  disabled?: boolean;
  /** Skip this cell during navigation (maps to the `hidden` variant / `display:none`). */
  isHidden?: boolean;
  /** Skip this cell during navigation (maps to the `outside` variant). */
  isOutside?: boolean;
}

/**
 * A 3-D array indexed as `[levelIndex][rowIndex][cellIndex]`, one entry per
 * calendar control. Matches the shape of Mantine's `HTMLButtonElement[][][]`
 * without any DOM coupling.
 */
export type FocusableControlsMap = FocusableControl[][][];

/** Ref object that the Calendar layer stores and passes down. */
export type ControlsRef = React.MutableRefObject<FocusableControlsMap>;

/**
 * Minimal structural shape of a calendar keydown event. Both the `Day` event
 * (`DayProps["onKeyDown"]`, fed by `MonthLevelGroup`) and the `PickerControl`
 * event (`types.ts` `ControlKeyboardEvent`, fed by `YearLevelGroup`/
 * `DecadeLevelGroup` via `MonthsList`/`YearsList`) structurally satisfy this —
 * the body narrows both `key` and `preventDefault` at runtime via `hasKey` /
 * `hasPreventDefault`, so the engine never depends on a single event type.
 */
export interface ControlKeyboardEventInput {
  /** Pressed key name (web `KeyboardEvent.key`); absent on some native events. */
  key?: string;
  /** Web-only default-suppression; guarded at runtime before calling. */
  preventDefault?: () => void;
}

/** Input shape for the public `handleControlKeyDown` function. */
export interface HandleControlKeyDownInput {
  /** The 3-D ref map populated by `__getDayRef` / `__getControlRef` callbacks. */
  controlsRef: ControlsRef;
  /** Which calendar panel (column) the event originated from (0-based). */
  levelIndex: number;
  /** Row within that panel (0-based). */
  rowIndex: number;
  /** Cell within that row (0-based). */
  cellIndex: number;
  /** The cross-platform keyboard event from a control's `onKeyDown` handler. */
  event: ControlKeyboardEventInput;
  /** Full payload forwarded from `Month`'s `__onDayKeyDown` for convenience. */
  payload?: ControlKeydownPayload;
}

/* -------------------------------------------------------------------------- */
/* Internal helpers                                                            */
/* -------------------------------------------------------------------------- */

type Direction = "up" | "down" | "left" | "right";

interface GridPosition {
  levelIndex: number;
  rowIndex: number;
  cellIndex: number;
}

/**
 * Compute the grid position one step away in `direction` from the given
 * position. Returns `null` when already at the absolute boundary (e.g.
 * ArrowUp on row 0 of level 0).
 *
 * `size` is a 2-D array `size[levelIndex][rowIndex]` = number of cells in
 * that row, matching the shape returned by `getControlsSize`.
 */
function getNextIndex({
  direction,
  levelIndex,
  rowIndex,
  cellIndex,
  size,
}: Omit<ShiftFocusInput, "controlsRef">): GridPosition | null {
  switch (direction) {
    case "up": {
      // Already at the very first cell in the entire grid.
      if (levelIndex === 0 && rowIndex === 0) {
        return null;
      }
      // Wrap to the previous level.
      if (rowIndex === 0) {
        const prevLevel = levelIndex - 1;
        const prevLevelRows = size[prevLevel];
        if (!prevLevelRows) return null;
        const lastRowIndex = prevLevelRows.length - 1;
        const lastRowCellCount = prevLevelRows[lastRowIndex] ?? 0;
        // When `cellIndex` is within the last row of the previous level, land
        // on the last row; otherwise land on second-to-last (Mantine parity).
        const targetRow = cellIndex <= lastRowCellCount - 1 ? lastRowIndex : lastRowIndex - 1;
        return { levelIndex: prevLevel, rowIndex: Math.max(0, targetRow), cellIndex };
      }
      return { levelIndex, rowIndex: rowIndex - 1, cellIndex };
    }

    case "down": {
      const levelRows = size[levelIndex];
      if (!levelRows) return { levelIndex: levelIndex + 1, rowIndex: 0, cellIndex };
      const lastRowIndex = levelRows.length - 1;
      // On the very last row — advance to next level.
      if (rowIndex === lastRowIndex) {
        return { levelIndex: levelIndex + 1, rowIndex: 0, cellIndex };
      }
      // Second-to-last row and cellIndex is past the end of the last row →
      // also advance to next level (Mantine parity for short last weeks).
      const lastRowCellCount = levelRows[lastRowIndex] ?? 0;
      if (rowIndex === lastRowIndex - 1 && cellIndex >= lastRowCellCount) {
        return { levelIndex: levelIndex + 1, rowIndex: 0, cellIndex };
      }
      return { levelIndex, rowIndex: rowIndex + 1, cellIndex };
    }

    case "left": {
      // Absolute start.
      if (levelIndex === 0 && rowIndex === 0 && cellIndex === 0) {
        return null;
      }
      // Wrap to end of previous level's last row.
      if (rowIndex === 0 && cellIndex === 0) {
        const prevLevel = levelIndex - 1;
        const prevLevelRows = size[prevLevel];
        if (!prevLevelRows) return null;
        const lastRowIndex = prevLevelRows.length - 1;
        const lastRowCellCount = prevLevelRows[lastRowIndex] ?? 0;
        return {
          levelIndex: prevLevel,
          rowIndex: lastRowIndex,
          cellIndex: lastRowCellCount - 1,
        };
      }
      // Wrap to end of previous row in same level.
      if (cellIndex === 0) {
        const prevRowCellCount = size[levelIndex]?.[rowIndex - 1] ?? 0;
        return { levelIndex, rowIndex: rowIndex - 1, cellIndex: prevRowCellCount - 1 };
      }
      return { levelIndex, rowIndex, cellIndex: cellIndex - 1 };
    }

    case "right": {
      const levelRows = size[levelIndex];
      if (!levelRows) return { levelIndex: levelIndex + 1, rowIndex: 0, cellIndex: 0 };
      const currentRowCellCount = levelRows[rowIndex] ?? 0;
      const lastRowIndex = levelRows.length - 1;
      // End of the last row in this level → wrap to next level.
      if (rowIndex === lastRowIndex && cellIndex === currentRowCellCount - 1) {
        return { levelIndex: levelIndex + 1, rowIndex: 0, cellIndex: 0 };
      }
      // End of a mid-level row → wrap to start of next row.
      if (cellIndex === currentRowCellCount - 1) {
        return { levelIndex, rowIndex: rowIndex + 1, cellIndex: 0 };
      }
      return { levelIndex, rowIndex, cellIndex: cellIndex + 1 };
    }

    default: {
      // Unreachable at runtime (only arrow keys reach here), but TypeScript
      // requires exhaustiveness — return current position unchanged.
      return { levelIndex, rowIndex, cellIndex };
    }
  }
}

interface ShiftFocusInput {
  controlsRef: ControlsRef;
  direction: Direction;
  levelIndex: number;
  rowIndex: number;
  cellIndex: number;
  /** `size[levelIndex][rowIndex]` = cell count for that row. */
  size: number[][];
}

/**
 * Recursively walk the grid in `direction` from the given position, skipping
 * disabled / hidden / outside cells, until a focusable cell is found (and
 * `.focus()` is called on it) or the boundary is reached.
 */
function focusOnNextFocusableControl({
  controlsRef,
  direction,
  levelIndex,
  rowIndex,
  cellIndex,
  size,
}: ShiftFocusInput): void {
  const nextPos = getNextIndex({ direction, size, rowIndex, cellIndex, levelIndex });

  if (!nextPos) {
    return;
  }

  const controlToFocus =
    controlsRef.current[nextPos.levelIndex]?.[nextPos.rowIndex]?.[nextPos.cellIndex];

  if (!controlToFocus) {
    return;
  }

  if (controlToFocus.disabled || controlToFocus.isHidden || controlToFocus.isOutside) {
    // Skip and continue in the same direction.
    focusOnNextFocusableControl({
      controlsRef,
      direction,
      levelIndex: nextPos.levelIndex,
      rowIndex: nextPos.rowIndex,
      cellIndex: nextPos.cellIndex,
      size,
    });
  } else {
    controlToFocus.focus();
  }
}

/** Map an arrow-key `key` string to a navigation direction, or `null`. */
function getDirection(key: string): Direction | null {
  switch (key) {
    case "ArrowDown":
      return "down";
    case "ArrowUp":
      return "up";
    case "ArrowRight":
      return "right";
    case "ArrowLeft":
      return "left";
    default:
      return null;
  }
}

/**
 * Build the `size` lookup table from the live `controlsRef` contents:
 * `size[levelIndex][rowIndex]` = number of populated cells in that row.
 */
function getControlsSize(controlsRef: ControlsRef): number[][] {
  return controlsRef.current.map((level) => level.map((row) => row.length));
}

/** Runtime narrowing: does `event` carry a callable `preventDefault`? */
function hasPreventDefault(event: unknown): event is { preventDefault: () => void } {
  return (
    typeof event === "object" &&
    event !== null &&
    "preventDefault" in event &&
    typeof (event as { preventDefault: unknown }).preventDefault === "function"
  );
}

/** Runtime narrowing: does `event` carry a string `key` property? */
function hasKey(event: unknown): event is { key: string } {
  return (
    typeof event === "object" &&
    event !== null &&
    "key" in event &&
    typeof (event as { key: unknown }).key === "string"
  );
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Handle an arrow-key event on a calendar control, moving roving focus to the
 * next focusable cell in the indicated direction.
 *
 * Matches Mantine's `handleControlKeyDown` contract exactly, re-typed for
 * cross-platform use:
 *  - `controlsRef` holds plain `FocusableControl` descriptors, not DOM refs.
 *  - `event` is a minimal structural `ControlKeyboardEventInput`, satisfied by
 *    both Day and PickerControl keydown events, not `React.KeyboardEvent`.
 *  - `event.preventDefault()` is called only when the event supports it (web).
 */
export function handleControlKeyDown({
  controlsRef,
  levelIndex,
  rowIndex,
  cellIndex,
  event,
}: HandleControlKeyDownInput): void {
  const key: string = hasKey(event) ? event.key : "";

  const direction = getDirection(key);

  if (!direction) {
    return;
  }

  if (hasPreventDefault(event)) {
    event.preventDefault();
  }

  const size = getControlsSize(controlsRef);

  focusOnNextFocusableControl({
    controlsRef,
    direction,
    levelIndex,
    rowIndex,
    cellIndex,
    size,
  });
}
