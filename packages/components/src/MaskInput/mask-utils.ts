/**
 * Pure, framework-free mask engine. Ported from the PURE half of Mantine's
 * `@mantine/hooks` `use-mask` (parse / apply / extract / complete / display) —
 * the DOM-listener, cursor-tracking, and undo/redo halves are intentionally NOT
 * ported (web-only, not cross-platform via Box/Text). No `any`.
 */

/** Default single-char token → matcher map (mirrors Mantine). */
export const DEFAULT_TOKENS: Record<string, RegExp> = {
  "9": /[0-9]/,
  a: /[A-Za-z]/,
  A: /[A-Z]/,
  "*": /[A-Za-z0-9]/,
  "#": /[-+0-9]/,
};

export type MaskPattern = string | Array<string | RegExp>;

interface MaskSlot {
  type: "token" | "literal";
  char: string;
  pattern?: RegExp;
  optional?: boolean;
}

/** Parse a mask pattern into an ordered list of literal/token slots. */
export function parseMask(mask: MaskPattern, tokens: Record<string, RegExp>): MaskSlot[] {
  if (Array.isArray(mask)) {
    return mask.map((item) =>
      item instanceof RegExp
        ? { type: "token", char: "_", pattern: item }
        : { type: "literal", char: item },
    );
  }

  const slots: MaskSlot[] = [];
  let optional = false;

  for (let i = 0; i < mask.length; i++) {
    const char = mask[i];

    if (char === "\\" && i + 1 < mask.length) {
      i++;
      slots.push({ type: "literal", char: mask[i] });
      continue;
    }

    if (char === "?") {
      optional = true;
      continue;
    }

    const token = tokens[char];
    if (token) {
      slots.push({ type: "token", char, pattern: token, optional });
    } else {
      slots.push({ type: "literal", char, optional });
    }
  }

  return slots;
}

const getSlotChar = (slotCharOption: string | null | undefined, index: number): string => {
  if (slotCharOption === null || slotCharOption === "" || slotCharOption === undefined) {
    return "";
  }
  if (slotCharOption.length > 1) {
    return slotCharOption[index] || "_";
  }
  return slotCharOption;
};

/** Map a string of raw (token) characters onto the slot template. */
export function applyMaskToRaw(
  raw: string,
  slots: MaskSlot[],
  transform?: (char: string) => string,
): string {
  let result = "";
  let rawIndex = 0;

  for (let slotIndex = 0; slotIndex < slots.length; slotIndex++) {
    const slot = slots[slotIndex];
    if (slot.type === "literal") {
      result += slot.char;
    } else if (rawIndex < raw.length) {
      const ch = transform ? transform(raw[rawIndex]) : raw[rawIndex];
      if (slot.pattern && slot.pattern.test(ch)) {
        result += ch;
        rawIndex++;
      } else {
        rawIndex++;
        slotIndex--;
      }
    } else {
      break;
    }
  }

  return result;
}

/**
 * Walk a free-form input string onto the slots, copying literals and consuming
 * input characters into token slots until one matches the slot's pattern.
 */
export function processInput(
  inputValue: string,
  slots: MaskSlot[],
  transform?: (char: string) => string,
): string {
  let result = "";
  let inputIndex = 0;

  for (
    let slotIndex = 0;
    slotIndex < slots.length && inputIndex <= inputValue.length;
    slotIndex++
  ) {
    const slot = slots[slotIndex];

    if (slot.type === "literal") {
      result += slot.char;
      if (inputIndex < inputValue.length && inputValue[inputIndex] === slot.char) {
        inputIndex++;
      }
      continue;
    }

    if (inputIndex >= inputValue.length) {
      break;
    }

    let matched = false;
    while (inputIndex < inputValue.length) {
      const ch = transform ? transform(inputValue[inputIndex]) : inputValue[inputIndex];
      inputIndex++;
      if (slot.pattern && slot.pattern.test(ch)) {
        result += ch;
        matched = true;
        break;
      }
    }

    if (!matched && result.length <= slotIndex) {
      break;
    }
  }

  return result;
}

/** Append the remaining placeholder slot characters after the filled content. */
export function buildDisplayValue(
  value: string,
  slots: MaskSlot[],
  slotCharOption: string | null | undefined,
  showSlots: boolean,
): string {
  if (!showSlots) {
    return value;
  }

  let display = value;

  for (let i = value.length; i < slots.length; i++) {
    const slot = slots[i];
    if (slot.type === "literal") {
      display += slot.char;
    } else {
      const sc = getSlotChar(slotCharOption, i);
      if (!sc) {
        break;
      }
      display += sc;
    }
  }

  return display;
}

/** Extract the raw (token-only) characters from a masked string. */
export function extractRaw(masked: string, slots: MaskSlot[]): string {
  let raw = "";
  for (let i = 0; i < masked.length && i < slots.length; i++) {
    if (slots[i].type === "token") {
      raw += masked[i];
    }
  }
  return raw;
}

/** Whether every required (non-optional) token slot is filled and valid. */
export function checkComplete(masked: string, slots: MaskSlot[]): boolean {
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    if (slot.type === "token" && !slot.optional) {
      if (i >= masked.length) {
        return false;
      }
      if (slot.pattern && !slot.pattern.test(masked[i])) {
        return false;
      }
    }
  }
  return true;
}
