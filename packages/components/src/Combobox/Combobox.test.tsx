import * as React from "react";

import type { GetRef, TamaguiElement } from "@knitui/core";

import { Combobox } from ".";
import { cssRulesOf } from "../__tests__/css-rules.test.helper";
import { Button } from "../Button";
import { fireEvent, render, screen, waitForElementToBeRemoved } from "../test-utils";
import { getComboboxOptionId } from "./Combobox";
import { useCombobox } from "./use-combobox";

/**
 * A bare text field standing in for InputBase: input targets anchor the dropdown
 * through a `rootRef` prop, which a raw `<input>` would leak to the DOM.
 */
const Field = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & { rootRef?: React.Ref<HTMLElement> }
>(function Field({ rootRef: _rootRef, ...props }, ref) {
  return <input ref={ref} {...props} />;
});

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

/** Open combobox via a self-managed store seeded open, so the dropdown renders. */
function OpenCombobox(props: React.ComponentProps<typeof Combobox>) {
  const store = useCombobox({ defaultOpened: true });
  return <Combobox store={store} {...props} />;
}

describe("Combobox", () => {
  it("renders the target child", () => {
    render(
      <Combobox>
        <Combobox.Target>
          <Field placeholder="search" />
        </Combobox.Target>
      </Combobox>,
    );
    expect(screen.getByPlaceholderText("search")).toBeInTheDocument();
  });

  it("renders dropdown options when opened", () => {
    render(
      <OpenCombobox>
        <Combobox.Target>
          <Field placeholder="search" />
        </Combobox.Target>
        <Combobox.Dropdown>
          <Combobox.Options>
            <Combobox.Option value="a">Apple</Combobox.Option>
            <Combobox.Option value="b">Banana</Combobox.Option>
          </Combobox.Options>
        </Combobox.Dropdown>
      </OpenCombobox>,
    );
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Banana")).toBeInTheDocument();
  });

  it("exposes the option role for each option", () => {
    render(
      <OpenCombobox>
        <Combobox.Target>
          <Field placeholder="search" />
        </Combobox.Target>
        <Combobox.Dropdown>
          <Combobox.Options>
            <Combobox.Option value="a">Apple</Combobox.Option>
            <Combobox.Option value="b">Banana</Combobox.Option>
          </Combobox.Options>
        </Combobox.Dropdown>
      </OpenCombobox>,
    );
    expect(screen.getAllByRole("option")).toHaveLength(2);
  });

  it("exposes the listbox role for the options container", () => {
    render(
      <OpenCombobox>
        <Combobox.Target>
          <Field placeholder="search" />
        </Combobox.Target>
        <Combobox.Dropdown>
          <Combobox.Options aria-label="Fruit">
            <Combobox.Option value="a">Apple</Combobox.Option>
          </Combobox.Options>
        </Combobox.Dropdown>
      </OpenCombobox>,
    );
    expect(screen.getByRole("listbox", { name: "Fruit" })).toBeInTheDocument();
  });

  it.each(SIZES)("renders the %s size", (size) => {
    render(
      <OpenCombobox size={size}>
        <Combobox.Target>
          <Field placeholder="search" />
        </Combobox.Target>
        <Combobox.Dropdown>
          <Combobox.Options>
            <Combobox.Option value="apple">Apple</Combobox.Option>
          </Combobox.Options>
        </Combobox.Dropdown>
      </OpenCombobox>,
    );
    expect(screen.getByRole("option", { name: "Apple" })).toBeInTheDocument();
  });

  it("fires onOptionSubmit with the option value when an option is pressed", () => {
    const onOptionSubmit = jest.fn();
    render(
      <OpenCombobox onOptionSubmit={onOptionSubmit}>
        <Combobox.Target>
          <Field placeholder="search" />
        </Combobox.Target>
        <Combobox.Dropdown>
          <Combobox.Options>
            <Combobox.Option value="apple">Apple</Combobox.Option>
          </Combobox.Options>
        </Combobox.Dropdown>
      </OpenCombobox>,
    );
    fireEvent.click(screen.getByText("Apple"));
    expect(onOptionSubmit).toHaveBeenCalledWith("apple");
  });

  it("does not submit a disabled option", () => {
    const onOptionSubmit = jest.fn();
    render(
      <OpenCombobox onOptionSubmit={onOptionSubmit}>
        <Combobox.Target>
          <Field placeholder="search" />
        </Combobox.Target>
        <Combobox.Dropdown>
          <Combobox.Options>
            <Combobox.Option value="apple" disabled>
              Apple
            </Combobox.Option>
          </Combobox.Options>
        </Combobox.Dropdown>
      </OpenCombobox>,
    );
    fireEvent.click(screen.getByText("Apple"));
    expect(onOptionSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("option")).toHaveAttribute("aria-disabled", "true");
  });

  it("marks a selected option with aria-selected", () => {
    render(
      <OpenCombobox>
        <Combobox.Target>
          <Field placeholder="search" />
        </Combobox.Target>
        <Combobox.Dropdown>
          <Combobox.Options>
            <Combobox.Option value="a" selected>
              Apple
            </Combobox.Option>
          </Combobox.Options>
        </Combobox.Dropdown>
      </OpenCombobox>,
    );
    expect(screen.getByRole("option")).toHaveAttribute("aria-selected", "true");
  });

  it("renders a group with its label", () => {
    render(
      <OpenCombobox>
        <Combobox.Target>
          <Field placeholder="search" />
        </Combobox.Target>
        <Combobox.Dropdown>
          <Combobox.Group label="Fruit">
            <Combobox.Option value="a">Apple</Combobox.Option>
          </Combobox.Group>
        </Combobox.Dropdown>
      </OpenCombobox>,
    );
    expect(screen.getByText("Fruit")).toBeInTheDocument();
    expect(screen.getByText("Apple")).toBeInTheDocument();
  });

  it("opens the dropdown when a button target is pressed", async () => {
    function ButtonCombobox() {
      const store = useCombobox();
      return (
        <Combobox store={store}>
          <Combobox.Target targetType="button">
            <Button>Pick a fruit</Button>
          </Combobox.Target>
          <Combobox.Dropdown>
            <Combobox.Options>
              <Combobox.Option value="a">Apple</Combobox.Option>
            </Combobox.Options>
          </Combobox.Dropdown>
        </Combobox>
      );
    }

    render(<ButtonCombobox />);
    expect(screen.queryByText("Apple")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Pick a fruit"));
    expect(screen.getByText("Apple")).toBeInTheDocument();

    // The dropdown animates out via the shared Transition engine, so it unmounts
    // after its exit transition rather than synchronously.
    fireEvent.click(screen.getByText("Pick a fruit"));
    await waitForElementToBeRemoved(() => screen.queryByText("Apple"));
  });

  it("forwards refs to styleable subparts", () => {
    const dropdownRef = React.createRef<GetRef<typeof Combobox.Dropdown>>();
    const optionsRef = React.createRef<GetRef<typeof Combobox.Options>>();
    const optionRef = React.createRef<GetRef<typeof Combobox.Option>>();
    const groupRef = React.createRef<GetRef<typeof Combobox.Group>>();
    const chevronRef = React.createRef<GetRef<typeof Combobox.Chevron>>();
    const clearRef = React.createRef<TamaguiElement>();

    render(
      <>
        <OpenCombobox>
          <Combobox.Target>
            <Field placeholder="search" />
          </Combobox.Target>
          <Combobox.Dropdown ref={dropdownRef}>
            <Combobox.Options ref={optionsRef}>
              <Combobox.Group ref={groupRef} label="Fruit">
                <Combobox.Option ref={optionRef} value="apple">
                  Apple
                </Combobox.Option>
              </Combobox.Group>
            </Combobox.Options>
          </Combobox.Dropdown>
        </OpenCombobox>
        <Combobox.Chevron ref={chevronRef} />
        <Combobox.ClearButton ref={clearRef} onClear={jest.fn()} />
      </>,
    );

    expect(dropdownRef.current).not.toBeNull();
    expect(optionsRef.current).not.toBeNull();
    expect(optionRef.current).not.toBeNull();
    expect(groupRef.current).not.toBeNull();
    expect(chevronRef.current).not.toBeNull();
    expect(clearRef.current).not.toBeNull();
  });
});

describe("Combobox public statics (Gaps 1 & 3)", () => {
  it("exposes OptionsDropdown and ClearButton as statics", () => {
    expect(typeof Combobox.OptionsDropdown).toBe("function");
    expect(Combobox.ClearButton).toBeDefined();
  });

  it("renders Combobox.OptionsDropdown from parsed data", () => {
    render(
      <OpenCombobox>
        <Combobox.Target>
          <Field placeholder="search" />
        </Combobox.Target>
        <Combobox.Dropdown>
          <Combobox.OptionsDropdown
            data={[
              { value: "a", label: "Apple" },
              { value: "b", label: "Banana" },
            ]}
            value="a"
          />
        </Combobox.Dropdown>
      </OpenCombobox>,
    );

    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Banana")).toBeInTheDocument();
  });

  it("renders Combobox.OptionsDropdown empty state via nothingFoundMessage", () => {
    render(
      <OpenCombobox>
        <Combobox.Target>
          <Field placeholder="search" />
        </Combobox.Target>
        <Combobox.Dropdown>
          <Combobox.OptionsDropdown data={[]} nothingFoundMessage="No results" />
        </Combobox.Dropdown>
      </OpenCombobox>,
    );

    expect(screen.getByText("No results")).toBeInTheDocument();
  });

  it("ClearButton is independently stylable and fires onClear", () => {
    const onClear = jest.fn();
    render(<Combobox.ClearButton onClear={onClear} backgroundColor="color3" />);
    fireEvent.click(screen.getByLabelText("Clear value"));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});

describe("Combobox v3 styling + a11y contract", () => {
  const css = (el: Element) => cssRulesOf(el).join("\n");

  function Open({ size }: { size?: React.ComponentProps<typeof Combobox>["size"] }) {
    return (
      <OpenCombobox size={size}>
        <Combobox.Target>
          <Field placeholder="search" />
        </Combobox.Target>
        <Combobox.Dropdown>
          <Combobox.Options aria-label="Fruit" testID="options">
            <Combobox.Group label="Group">
              <Combobox.Option value="a" active testID="active">
                Apple
              </Combobox.Option>
              <Combobox.Option value="b" selected testID="selected">
                Banana
              </Combobox.Option>
              <Combobox.Option value="c" testID="idle">
                Cherry
              </Combobox.Option>
            </Combobox.Group>
          </Combobox.Options>
          <Combobox.Empty testID="empty">Nothing</Combobox.Empty>
        </Combobox.Dropdown>
      </OpenCombobox>
    );
  }

  it("does not leak component names as DOM `name` attributes", () => {
    render(<Open />);
    expect(screen.getByRole("listbox").getAttribute("name")).toBeNull();
    for (const option of screen.getAllByRole("option")) {
      expect(option.getAttribute("name")).toBeNull();
    }
  });

  it("paints active / selected / idle rows from the variant + clause ladder", () => {
    render(<Open />);
    const resting = (id: string) =>
      cssRulesOf(screen.getByTestId(id))
        .filter((r) => r.includes("background-color") && !r.includes(":where("))
        .join("\n");
    expect(resting("active")).toMatch(/var\(--color3\)/);
    expect(resting("selected")).toMatch(/var\(--color4\)/);
    expect(resting("idle")).toBe("");
    expect(css(screen.getByTestId("idle"))).toMatch(/:hover\) \{background-color: var\(--color4\)/);
  });

  it("sizes every context-bound leaf from the root `size` (styled context)", () => {
    const { unmount } = render(<Open size="xs" />);
    const xs = css(screen.getByTestId("empty"));
    unmount();
    render(<Open size="xl" />);
    const xl = css(screen.getByTestId("empty"));
    // Different size keys resolve to different font-size / padding rules.
    expect(xs).toMatch(/font-size/);
    expect(xl).toMatch(/font-size/);
    expect(xs).not.toEqual(xl);
  });

  it("renders the group with role=group and its heading", () => {
    render(<Open />);
    const group = screen.getByRole("group");
    expect(group).toHaveTextContent("Group");
    expect(screen.getByRole("listbox", { name: "Fruit" }).contains(group)).toBe(true);
  });

  // v3 emits the individual CSS `rotate` property, not a `transform: rotate()`.
  it("rotates the chevron while opened", () => {
    render(
      <>
        <Combobox.Chevron testID="closed" />
        <Combobox.Chevron testID="open" opened />
      </>,
    );
    expect(css(screen.getByTestId("open"))).toMatch(/rotate: 180deg/);
    expect(css(screen.getByTestId("closed"))).not.toMatch(/rotate: 180deg/);
  });

  it("gives OptionsDropdown rows ids that aria-activedescendant can target", () => {
    render(
      <OpenCombobox>
        <Combobox.Target>
          <Field placeholder="search" />
        </Combobox.Target>
        <Combobox.Dropdown>
          <Combobox.OptionsDropdown
            data={[{ value: "a b", label: "Two words" }]}
            activeValue="a b"
            optionIdPrefix="list"
          />
        </Combobox.Dropdown>
      </OpenCombobox>,
    );
    const id = getComboboxOptionId("list", "a b");
    expect(id).not.toMatch(/\s/);
    expect(document.getElementById(id)).toBe(screen.getByRole("option"));
  });

  it("does not submit options in readOnly mode", () => {
    const onOptionSubmit = jest.fn();
    render(
      <OpenCombobox readOnly onOptionSubmit={onOptionSubmit}>
        <Combobox.Target>
          <Field placeholder="search" />
        </Combobox.Target>
        <Combobox.Dropdown>
          <Combobox.Options>
            <Combobox.Option value="a">Apple</Combobox.Option>
          </Combobox.Options>
        </Combobox.Dropdown>
      </OpenCombobox>,
    );
    fireEvent.click(screen.getByText("Apple"));
    expect(onOptionSubmit).not.toHaveBeenCalled();
  });

  it("keeps input focus when an option is pressed (mousedown is prevented)", () => {
    render(<Open />);
    // `fireEvent` returns `false` when a handler called `preventDefault()`.
    expect(fireEvent.mouseDown(screen.getByTestId("idle"))).toBe(false);
  });
});
