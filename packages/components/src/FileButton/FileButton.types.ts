import type * as React from "react";

import type { ButtonProps } from "../Button";

/* -------------------------------------------------------------------------- */
/* Public types — shared across web and native                                */
/* -------------------------------------------------------------------------- */

type FileButtonOwnedInputProps =
  | "accept"
  | "capture"
  | "disabled"
  | "form"
  | "multiple"
  | "name"
  | "onChange"
  | "style"
  | "type";

/** Props spread onto the hidden web `<input>`, excluding props owned by FileButton. */
export type FileButtonInputProps = Omit<
  React.ComponentPropsWithoutRef<"input">,
  FileButtonOwnedInputProps
> & {
  /** Arbitrary `data-*` attributes forwarded to the hidden input. */
  [dataAttribute: `data-${string}`]: unknown;
};

/** Payload shape delivered to `onChange`, narrowed by the `multiple` flag. */
export type FileButtonValue<Multiple extends boolean, TFile> = Multiple extends true
  ? TFile[]
  : TFile | null;

/** Options handed to a native `pickFiles` resolver. */
export interface FileButtonPickOptions {
  /** Whether more than one file may be returned. */
  multiple: boolean;
  /** `accept`-style filter, e.g. `"image/png,image/jpeg"`. */
  accept?: string;
  /** Request a fresh capture from a device camera/mic. */
  capture?: boolean | "user" | "environment";
}

/**
 * Native file resolver. Wire this to a native picker such as
 * `expo-document-picker` or `expo-image-picker`. The returned objects flow
 * straight through to `onChange`, so `TFile` is whatever your picker yields.
 * Ignored on web, where the hidden `<input type="file">` is used instead.
 */
export type FileButtonPicker<TFile> = (
  options: FileButtonPickOptions,
) => Promise<readonly TFile[]> | readonly TFile[];

/**
 * Props forwarded to the `Button` that FileButton renders as its trigger
 * (`variant`, `size`, `leftSection`, the per-slot `styles` map, style props, …).
 * `onPress` is owned by FileButton (it opens the picker); `children` is the
 * button label. The trigger `Button` is the kit's slot pilot, so `styles`
 * (`label` / `left` / `right` / `loader`) flows straight through to it.
 */
export type FileButtonTriggerProps = Omit<ButtonProps, "onPress" | "onChange" | "children" | "ref">;

/**
 * Trigger content. Pass a node (or omit) to render the built-in `Button`
 * trigger; pass a function to take full control — it receives `{ onClick }` to
 * wire onto your own element (used internally by `FileInput`).
 */
export type FileButtonChildren =
  | React.ReactNode
  | ((props: { onClick: () => void }) => React.ReactNode);

export interface FileButtonProps<
  Multiple extends boolean = false,
  TFile = File,
> extends FileButtonTriggerProps {
  /** Ref forwarded to the underlying hidden `<input type="file">` (web only). */
  ref?: React.Ref<HTMLInputElement>;
  /** Called with the picked file(s). Shape depends on `multiple`. */
  onChange: (payload: FileButtonValue<Multiple, TFile>) => void;
  /**
   * Trigger content. A node (or nothing) renders the built-in `Button` with
   * this as its label; a `({ onClick }) => ReactNode` function renders your own
   * trigger instead.
   */
  children?: FileButtonChildren;
  /** Allow selecting more than one file. @default false */
  multiple?: Multiple;
  /** `accept` attribute, e.g. `"image/png,image/jpeg"`. */
  accept?: string;
  /** `name` attribute of the input (web only). */
  name?: string;
  /** `form` attribute of the input (web only). */
  form?: string;
  /** Ref to a function that clears the selection (`() => void`). */
  resetRef?: React.Ref<() => void>;
  /** Disable the picker (and the trigger Button). */
  disabled?: boolean;
  /** `capture` attribute — request a fresh capture from a device camera/mic. */
  capture?: boolean | "user" | "environment";
  /** Props spread onto the hidden input element (web only). */
  inputProps?: FileButtonInputProps;
  /**
   * Native-only resolver that opens a platform file/image picker and returns
   * the picked files. Required for picking on native; ignored on web.
   */
  pickFiles?: FileButtonPicker<TFile>;
}

/**
 * Internal, non-generic prop shape shared by both platform implementations.
 * The public component is generic over `Multiple`/`TFile`; inside the
 * implementation the `onChange` payload is widened to `unknown` so a single
 * handler covers either case without `any`.
 */
export interface FileButtonInternalProps extends FileButtonTriggerProps {
  onChange: (payload: unknown) => void;
  children?: FileButtonChildren;
  multiple?: boolean;
  accept?: string;
  name?: string;
  form?: string;
  resetRef?: React.Ref<() => void>;
  disabled?: boolean;
  capture?: boolean | "user" | "environment";
  inputProps?: FileButtonInputProps;
  pickFiles?: FileButtonPicker<unknown>;
}

/** Public, generic call signature both platform files cast their impl to. */
export type FileButtonComponent = (<Multiple extends boolean = false, TFile = File>(
  props: FileButtonProps<Multiple, TFile>,
) => React.ReactElement) & { displayName?: string };
