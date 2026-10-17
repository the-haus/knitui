/**
 * Tamagui v3 test guard (docs/v3/conventions.md §8).
 *
 * Fails the running test as soon as anything logs one of the messages that mean
 * v2-era styling leaked into a v3 render:
 *
 *  - React's "does not recognize the `hoverStyle` prop on a DOM element" (any
 *    `…Style` prop): v3 no longer consumes condition objects (`hoverStyle`,
 *    `pressStyle`, `focusVisibleStyle`, `enterStyle`, …), so they fall through to
 *    the host element and the interaction silently stops working;
 *  - Tamagui's "… was removed in v3" deprecation errors;
 *  - Tamagui's `no "$" prefix` warning for sigil-prefixed token values.
 *
 * Install it from a package's `jest.setup.ts`:
 *
 *   import { installTamaguiV3Guard } from "../../scripts/jest/v3-guard";
 *   installTamaguiV3Guard();
 *
 * It wraps whatever `console.error` / `console.warn` are at install time, so
 * install it BEFORE a setup file's own message filters (those then still run
 * first for their benign messages).
 */
const { format } = require("node:util");

/** @type {{ test: (text: string) => boolean, reason: string }[]} */
const RULES = [
  {
    // React formats this as "React does not recognize the `%s` prop on a DOM
    // element…", so match against the FORMATTED message.
    test: (text) => /does not recognize the `?\w*Style`? prop/.test(text),
    reason:
      'a v2 `…Style` condition prop reached the DOM (use flat values: `bg="color2 hover:color3"`)',
  },
  {
    test: (text) => text.includes("was removed in v3"),
    reason: "a Tamagui API removed in v3 was used",
  },
  {
    test: (text) => text.includes('no "$" prefix'),
    reason: 'a `$`-prefixed token value was used (v3 tokens are bare: `p="md"`)',
  },
];

const toText = (args) => {
  try {
    const [first, ...rest] = args;
    if (first instanceof Error) return [first.message, ...rest.map(String)].join(" ");
    return format(first, ...rest);
  } catch {
    return args.map(String).join(" ");
  }
};

/** Exposed for the guard's own tests. */
const findViolation = (args) => {
  const text = toText(args);
  const rule = RULES.find((r) => r.test(text));
  return rule ? { reason: rule.reason, text } : null;
};

function installTamaguiV3Guard() {
  for (const method of ["error", "warn"]) {
    const original = console[method].bind(console);
    console[method] = (...args) => {
      const violation = findViolation(args);
      if (violation) {
        original(...args);
        throw new Error(
          `[tamagui-v3-guard] console.${method}: ${violation.reason}.\n  ${violation.text.split("\n")[0]}`,
        );
      }
      original(...args);
    };
  }
}

module.exports = { installTamaguiV3Guard, findViolation };
