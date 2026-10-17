/**
 * Combined-state precedence. In Tamagui v3 (3.0.18) two variants that set the
 * same style property resolve by PROP KEY ORDER: the order the props are passed,
 * except that keys listed in `defaultVariants` keep their `defaultVariants`
 * position. These pin the strongest state LAST for every kit frame whose state
 * variants overlap on a property (found by scanning the W2/W4 frames' variant
 * bodies), so a refactor that reorders props or defaults cannot silently flip them.
 */
import * as React from "react";

import { styled, View } from "@knitui/core";

import { Avatar } from "../Avatar";
import { Checkbox } from "../Checkbox";
import { Combobox } from "../Combobox";
import { useCombobox } from "../Combobox/use-combobox";
import { render, screen } from "../test-utils";
import { baseValue, declarationsUnder } from "./css-rules.test.helper";

describe("v3 variant precedence rule", () => {
  const Probe = styled(View, {
    displayName: "PrecedenceProbe",
    variants: {
      a: { true: { backgroundColor: "red9" } },
      b: { true: { backgroundColor: "blue9" } },
    } as const,
  });
  const Defaulted = styled(View, {
    displayName: "PrecedenceDefaulted",
    variants: {
      a: { true: { backgroundColor: "red9" } },
      b: { true: { backgroundColor: "blue9" } },
    } as const,
    defaultVariants: { a: false, b: false },
  });

  it("the later-passed prop wins, unless both keys are in defaultVariants", () => {
    render(
      <>
        <Probe testID="ab" a b />
        <Probe testID="ba" b a />
        <Defaulted testID="dba" b a />
      </>,
    );
    const bg = (id: string) => baseValue(screen.getByTestId(id), "background-color");
    expect(bg("ab")).toBe("var(--blue9)");
    expect(bg("ba")).toBe("var(--red9)");
    // defaultVariants order (a, b) holds whatever the pass order
    expect(bg("dba")).toBe("var(--blue9)");
  });
});

/** Text field target: anchors via `rootRef`, kept off the DOM. */
function Field({
  rootRef: _rootRef,
  ...props
}: React.ComponentProps<"input"> & { rootRef?: React.Ref<HTMLElement> }) {
  return <input {...props} />;
}

function OpenCombobox({ children }: { children: React.ReactNode }) {
  const store = useCombobox({ defaultOpened: true });
  return (
    <Combobox store={store}>
      <Combobox.Target>
        <Field placeholder="search" />
      </Combobox.Target>
      <Combobox.Dropdown>
        <Combobox.Options>{children}</Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}

describe("Combobox.Option: selected < active < disabled", () => {
  it("a keyboard-active row shows the highlight over its selected fill", () => {
    render(
      <OpenCombobox>
        <Combobox.Option value="s" selected>
          Selected
        </Combobox.Option>
        <Combobox.Option value="sa" selected active>
          Both
        </Combobox.Option>
      </OpenCombobox>,
    );
    const [selected, both] = screen.getAllByRole("option");
    expect(baseValue(selected!, "background-color")).toBe("var(--color4)");
    expect(baseValue(both!, "background-color")).toBe("var(--color3)");
  });

  it("disabled drops the hover tint on a selected + active row and dims it", () => {
    render(
      <OpenCombobox>
        <Combobox.Option value="x" selected active disabled>
          Off
        </Combobox.Option>
      </OpenCombobox>,
    );
    const row = screen.getByRole("option");
    expect(baseValue(row, "opacity")).toBe("0.5");
    expect(baseValue(row, "pointer-events")).toBe("none");
    expect(declarationsUnder(row, ":hover")).toContain("background-color: transparent");
  });
});

describe("Checkbox.Card: withBorder < checked", () => {
  it("a checked, disabled, bordered card keeps the accent border", () => {
    render(
      <Checkbox.Card defaultChecked disabled withBorder>
        <Checkbox.Indicator />
      </Checkbox.Card>,
    );
    const card = screen.getByRole("checkbox");
    expect(baseValue(card, "border-color")).toBe("var(--color9)");
    expect(baseValue(card, "opacity")).toBe("0.6");
  });

  it("unchecked keeps the neutral border", () => {
    render(
      <Checkbox.Card>
        <Checkbox.Indicator />
      </Checkbox.Card>,
    );
    expect(baseValue(screen.getByRole("checkbox"), "border-color")).toBe("var(--borderColor)");
  });
});

describe("Avatar: variant < withinGroup", () => {
  it("a bordered variant inside a group keeps the 2px group ring", () => {
    render(
      <Avatar.Group>
        <Avatar testID="av" variant="outline" name="Ann Bee" />
      </Avatar.Group>,
    );
    const el = screen.getByTestId("av");
    expect(baseValue(el, "border-width")).toBe("2px");
    expect(baseValue(el, "border-color")).toBe("var(--background)");
  });
});
