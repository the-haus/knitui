import * as React from "react";

import { Button } from "../Button";
import type {
  FileButtonChildren,
  FileButtonTriggerProps,
  FileButtonValue,
} from "./FileButton.types";

/* -------------------------------------------------------------------------- */
/* Shared, platform-neutral logic                                             */
/* -------------------------------------------------------------------------- */

/** Re-exported so the platform splits keep their `./FileButton.shared` import path. */
export { assignRef } from "@knitui/hooks";

/**
 * Normalise a flat list of picked files into the `onChange` payload shape:
 * the whole array when `multiple`, otherwise the first file or `null`. Used by
 * both the web (`FileList`) and native (resolver result) implementations.
 */
export function toSelection<Multiple extends boolean, TFile>(
  files: readonly TFile[] | null | undefined,
  multiple: Multiple | undefined,
): FileButtonValue<Multiple, TFile> {
  const list = files ?? [];
  return (multiple ? Array.from(list) : (list[0] ?? null)) as FileButtonValue<Multiple, TFile>;
}

/**
 * Render the FileButton trigger. By default it's the kit's `Button` (so trigger
 * props like `variant`/`size`/`leftSection` and the `children` label flow
 * through, and `onClick` opens the picker). A function child takes over
 * rendering entirely — it receives `{ onClick }` to wire onto a custom element.
 * Shared by the web and native builds so the trigger stays identical.
 */
export function renderTrigger(
  children: FileButtonChildren | undefined,
  onClick: () => void,
  triggerProps: FileButtonTriggerProps,
): React.ReactNode {
  if (typeof children === "function") {
    return children({ onClick });
  }

  return (
    <Button onPress={onClick} {...triggerProps}>
      {children}
    </Button>
  );
}
