import * as React from "react";

import { assignRef, useCallbackRef, useUncontrolled } from "@knitui/hooks";

import { InputBase, type InputBaseProps } from "../InputBase";
import {
  applyMaskToRaw,
  buildDisplayValue,
  checkComplete,
  DEFAULT_TOKENS,
  extractRaw,
  type MaskPattern,
  parseMask,
  processInput,
} from "./mask-utils";

type MaskInputBaseProps = Omit<
  InputBaseProps,
  "value" | "defaultValue" | "onChange" | "onChangeText" | "type" | "mask" | "transform"
>;

export interface MaskInputProps extends MaskInputBaseProps {
  /** Mask pattern string (e.g. `"+1 (999) 000-0000"`) or array of literals/RegExps. */
  mask: MaskPattern;

  /** Override or extend the default token map (`9` `a` `A` `*` `#`). */
  tokens?: Record<string, RegExp>;

  /** Character shown in unfilled slots. `"_"` by default; `null` to hide. */
  slotChar?: string | null;

  /** Show the mask template even when empty/unfocused. @default false */
  alwaysShowMask?: boolean;

  /** Show the mask template on focus. @default true */
  showMaskOnFocus?: boolean;

  /** Transform each character before validation/insertion. */
  transform?: (char: string) => string;

  /** Clear the value on blur when the mask is incomplete. @default false */
  autoClear?: boolean;

  /** Called on every change with the raw (unmasked) and masked values. */
  onChangeRaw?: (rawValue: string, maskedValue: string) => void;

  /** Called when all required mask slots are first filled. */
  onComplete?: (maskedValue: string, rawValue: string) => void;

  /** Controlled masked display value. */
  value?: string;

  /** Uncontrolled default masked display value. */
  defaultValue?: string;

  /** Called when the masked display value changes. */
  onChange?: (maskedValue: string) => void;

  /** Ref populated with a function that clears the value. */
  resetRef?: React.Ref<() => void>;

  /**
   * Accepted for Mantine API parity but NOT implemented (require DOM
   * cursor/selection tracking, which is web-only and not reproduced
   * cross-platform — the documented divergence): decoupled raw/display
   * (`separate`), per-keystroke option overrides (`modify`), and the
   * `beforeMaskedStateChange` cursor escape hatch.
   */
  separate?: boolean;
  /** See `separate`. */
  modify?: (value: string) => unknown;
}

/**
 * MaskInput — a text field that formats input against a `mask` pattern as the
 * user types. Mirrors Mantine's `MaskInput` public API and is built on
 * `InputBase`; the masking engine (`mask-utils.ts`) is a cross-platform port of
 * the PURE half of Mantine's `use-mask`, so formatting works on web AND native.
 * Fine-grained DOM cursor/selection management and undo/redo (the rest of
 * Mantine's hook) are web-only and intentionally not reproduced. Accent/theme
 * comes from the Tamagui `theme` prop + palette ramp — never a Mantine `color`
 * prop.
 */
export const MaskInput = InputBase.styleable<MaskInputProps>(function MaskInput(props, ref) {
  const {
    mask,
    tokens,
    slotChar = "_",
    alwaysShowMask = false,
    showMaskOnFocus = true,
    transform,
    autoClear = false,
    onChangeRaw,
    onComplete,
    value,
    defaultValue,
    onChange,
    resetRef,
    onFocus,
    onBlur,
    separate: _separate,
    modify: _modify,
    ...others
  } = props;
  void _separate;
  void _modify;

  const slots = React.useMemo(
    () => parseMask(mask, { ...DEFAULT_TOKENS, ...tokens }),
    [mask, tokens],
  );

  const emptyTemplate = React.useMemo(
    () => (alwaysShowMask ? buildDisplayValue("", slots, slotChar, true) : ""),
    [alwaysShowMask, slots, slotChar],
  );

  const [display, setDisplay] = useUncontrolled<string>({
    value,
    defaultValue,
    finalValue: emptyTemplate,
    onChange,
  });

  const [focused, setFocused] = React.useState(false);
  const wasComplete = React.useRef(false);

  const showSlots = alwaysShowMask || (focused && showMaskOnFocus);

  const commit = React.useCallback(
    (rawText: string, withSlots: boolean, prevDisplay?: string) => {
      // Strip placeholder chars so they are never re-consumed as input.
      const cleaned = slotChar ? rawText.split(slotChar).join("") : rawText;
      let masked = processInput(cleaned, slots, transform);
      let raw = extractRaw(masked, slots);

      // Deletion handling: the mask auto-inserts trailing literals (e.g. the
      // "-" after "123" for "999-999"), so backspacing one of those literals
      // re-normalizes to the *same* raw value and the change looks like a
      // no-op. Detect that case — text got shorter but the raw is unchanged —
      // and drop the last raw character so backspace actually removes input.
      // (Mid-string edits aren't reconstructable without cursor info, which is
      // the documented cross-platform divergence.)
      if (prevDisplay !== undefined && rawText.length < prevDisplay.length) {
        const prevCleaned = slotChar ? prevDisplay.split(slotChar).join("") : prevDisplay;
        const prevRaw = extractRaw(processInput(prevCleaned, slots, transform), slots);
        if (raw === prevRaw && raw.length > 0) {
          raw = raw.slice(0, -1);
          // `raw` already holds transformed characters — don't transform again.
          masked = applyMaskToRaw(raw, slots);
        }
      }

      const nextDisplay = buildDisplayValue(masked, slots, slotChar, withSlots);

      setDisplay(nextDisplay);
      onChangeRaw?.(raw, nextDisplay);

      const complete = checkComplete(masked, slots);
      if (complete && !wasComplete.current) {
        onComplete?.(nextDisplay, raw);
      }
      wasComplete.current = complete;
      return { masked, raw };
    },
    [slots, slotChar, transform, setDisplay, onChangeRaw, onComplete],
  );

  const handleChangeText = React.useCallback(
    (text: string) => {
      commit(text, showSlots, display);
    },
    [commit, showSlots, display],
  );

  // Stable identity (always invokes the latest closure) so the publishing
  // effect doesn't re-run and republish on every render when `emptyTemplate` /
  // `onChangeRaw` change identity.
  const reset = useCallbackRef(() => {
    wasComplete.current = false;
    setDisplay(emptyTemplate);
    onChangeRaw?.("", emptyTemplate);
  });

  React.useEffect(() => {
    assignRef(resetRef, reset);
  }, [resetRef, reset]);

  const handleFocus: NonNullable<MaskInputBaseProps["onFocus"]> = (event) => {
    setFocused(true);
    if ((showMaskOnFocus || alwaysShowMask) && display.length === 0) {
      setDisplay(buildDisplayValue("", slots, slotChar, true));
    }
    onFocus?.(event);
  };

  const handleBlur: NonNullable<MaskInputBaseProps["onBlur"]> = (event) => {
    setFocused(false);
    const cleaned = slotChar ? display.split(slotChar).join("") : display;
    const masked = processInput(cleaned, slots, transform);
    const complete = checkComplete(masked, slots);

    if (autoClear && !complete && masked.length > 0) {
      wasComplete.current = false;
      setDisplay(emptyTemplate);
      onChangeRaw?.("", emptyTemplate);
    } else if (!alwaysShowMask) {
      setDisplay(buildDisplayValue(masked, slots, slotChar, false));
    }
    onBlur?.(event);
  };

  return (
    <InputBase
      ref={ref}
      component="input"
      value={display}
      onChangeText={handleChangeText}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...others}
    />
  );
});

MaskInput.displayName = "MaskInput";
