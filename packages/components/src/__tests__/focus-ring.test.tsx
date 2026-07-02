import * as React from "react";

import { Accordion } from "../Accordion";
import { ActionIcon } from "../ActionIcon";
import { Anchor } from "../Anchor";
import { AngleSlider } from "../AngleSlider";
import { Button } from "../Button";
import { Checkbox } from "../Checkbox";
import { Chip } from "../Chip";
import { NavLink } from "../NavLink";
import { NumberInput } from "../NumberInput";
import { Pagination } from "../Pagination";
import { Radio } from "../Radio";
import { Rating } from "../Rating";
import { SegmentedControl } from "../SegmentedControl";
import { Slider } from "../Slider";
import { Switch } from "../Switch";
import { Tabs } from "../Tabs";
import { render } from "../test-utils";
import { Tree } from "../Tree";
import { UnstyledButton } from "../UnstyledButton";

/**
 * THE FOCUS-CONTRACT GUARDRAIL (see `internal/variant-colors.ts` → `FOCUS_RING`).
 *
 * The kit's focus ring is a `:focus-visible` outline (Tamagui `focusVisibleStyle`,
 * the shared `focusRingStyle`). It only ever becomes visible if the element that
 * carries it is ALSO keyboard-focusable — a styled `Box` renders a `<div>`, which
 * the browser will not tab to unless made focusable via `webButton()` (real
 * `<button>`), `useKeyboardActions` (`tabIndex`), or a roving `tabIndex`.
 *
 * A ring on a non-focusable element is a DEAD ring (a real bug that shipped on
 * NavLink/Accordion/Pagination/Tree before this contract existed). This test
 * renders every interactive component and asserts the invariant directly:
 *
 *   every element carrying the focus-visible ring class is keyboard-focusable.
 *
 * Tamagui emits the ring as classes like `_outlineColor-0focus-visible-color8`, so
 * an element opted into the ring is detectable by the `focus-visible` substring in
 * its className.
 *
 * Focusability is decided by {@link isFocusable}, NOT by the `tabIndex` property:
 * the property reports `-1` for BOTH a plain `<div>` (truly unfocusable → dead
 * ring) and a deliberate `tabindex="-1"` (a ROVING item — out of the sequential
 * tab order but still focusable via arrow keys / `.focus()`, which fires
 * `:focus-visible`). The honest distinction is the *presence* of the `tabindex`
 * attribute (or a natively-focusable host element).
 */

/** Elements whose className opts them into the `:focus-visible` outline ring. */
function ringedElements(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>('[class*="focus-visible"]'));
}

/**
 * Can this element actually receive focus (so its `:focus-visible` ring can fire)?
 * Native hosts are focusable by tag; everything else needs an explicit `tabindex`
 * (any value, including `-1` for roving items) — a plain `<div>` has none.
 */
function isFocusable(el: HTMLElement): boolean {
  const tag = el.tagName;
  if (tag === "BUTTON" || tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") {
    return !el.hasAttribute("disabled");
  }
  if (tag === "A") return el.hasAttribute("href");
  return el.hasAttribute("tabindex");
}

/** Each entry renders a representative, interactive instance of one component. */
const CASES: Array<{ name: string; element: React.ReactElement; expectRing: boolean }> = [
  { name: "Button", element: <Button>Go</Button>, expectRing: true },
  { name: "ActionIcon", element: <ActionIcon aria-label="act" />, expectRing: true },
  { name: "UnstyledButton", element: <UnstyledButton>Go</UnstyledButton>, expectRing: true },
  { name: "Chip", element: <Chip>Chip</Chip>, expectRing: true },
  { name: "Radio", element: <Radio value="a" label="Radio" />, expectRing: true },
  { name: "Switch", element: <Switch aria-label="sw" />, expectRing: true },
  { name: "Checkbox", element: <Checkbox aria-label="cb" />, expectRing: true },
  { name: "Rating", element: <Rating defaultValue={2} />, expectRing: true },
  { name: "Slider", element: <Slider defaultValue={50} />, expectRing: true },
  { name: "AngleSlider", element: <AngleSlider />, expectRing: true },
  { name: "NavLink", element: <NavLink label="Nav" />, expectRing: true },
  { name: "Pagination", element: <Pagination total={7} defaultValue={3} />, expectRing: true },
  { name: "SegmentedControl", element: <SegmentedControl data={["a", "b"]} />, expectRing: true },
  { name: "NumberInput", element: <NumberInput defaultValue={1} />, expectRing: true },
  { name: "Anchor", element: <Anchor href="#go">Link</Anchor>, expectRing: true },
  {
    name: "Tabs",
    element: (
      <Tabs defaultValue="a">
        <Tabs.List>
          <Tabs.Tab value="a">A</Tabs.Tab>
          <Tabs.Tab value="b">B</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="a">Panel A</Tabs.Panel>
        <Tabs.Panel value="b">Panel B</Tabs.Panel>
      </Tabs>
    ),
    expectRing: true,
  },
  {
    name: "Accordion",
    element: (
      <Accordion>
        <Accordion.Item value="a">
          <Accordion.Control>Control A</Accordion.Control>
          <Accordion.Panel>Panel A</Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    ),
    expectRing: true,
  },
  {
    name: "Tree",
    element: (
      <Tree
        data={[
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ]}
      />
    ),
    expectRing: true,
  },
];

describe("focus-ring contract", () => {
  for (const { name, element, expectRing } of CASES) {
    test(`${name}: every focus-ringed element is keyboard-focusable`, () => {
      const { baseElement } = render(element);
      const ringed = ringedElements(baseElement);

      if (expectRing) {
        expect(ringed.length).toBeGreaterThan(0);
      }

      // The invariant: a ring is only meaningful on a focusable element. Collect
      // any ringed-but-unfocusable offenders so the failure names the culprit
      // element instead of a bare `expected -1 to be >= 0`.
      const deadRings = ringed
        .filter((el) => !isFocusable(el))
        .map(
          (el) =>
            `${name}: <${el.tagName.toLowerCase()}> carries the focus ring but is not ` +
            `keyboard-focusable. Make the SAME frame focusable (webButton() / ` +
            `useKeyboardActions / roving tabIndex) or drop the ring.`,
        );
      expect(deadRings).toEqual([]);
    });
  }
});
