import * as React from "react";

import type { GetRef } from "@knitui/core";

import { baseValue } from "../__tests__/css-rules.test.helper";
import { controlMetrics } from "../internal/control-metrics";
import { fireEvent, render, screen } from "../test-utils";
import { Pill } from "./Pill";

describe("Pill", () => {
  it("renders its label", () => {
    render(<Pill>Label</Pill>);
    expect(screen.getByText("Label")).toBeInTheDocument();
  });

  it.each(["default", "contrast"] as const)("renders the %s variant", (variant) => {
    render(<Pill variant={variant}>{variant}</Pill>);
    expect(screen.getByText(variant)).toBeInTheDocument();
  });

  it.each(["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const)("renders size %s", (size) => {
    render(<Pill size={size}>{`s-${size}`}</Pill>);
    expect(screen.getByText(`s-${size}`)).toBeInTheDocument();
  });

  it("labels the remove button by default", () => {
    render(<Pill withRemoveButton>Removable</Pill>);
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });

  it("renders a remove button and fires onRemove when pressed", () => {
    const onRemove = jest.fn();
    render(
      <Pill withRemoveButton onRemove={onRemove} removeButtonProps={{ "aria-label": "remove" }}>
        Removable
      </Pill>,
    );
    fireEvent.click(screen.getByLabelText("remove"));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("does not render a remove button by default", () => {
    render(<Pill>Plain</Pill>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("does not fire onRemove when disabled", () => {
    const onRemove = jest.fn();
    render(
      <Pill disabled withRemoveButton onRemove={onRemove}>
        Disabled
      </Pill>,
    );
    const removeButton = screen.getByRole("button", { name: "Remove" });
    expect(removeButton).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(removeButton);
    expect(onRemove).not.toHaveBeenCalled();
  });

  it("forwards its ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof Pill>>();
    render(<Pill ref={ref}>Reffed</Pill>);
    expect(ref.current).not.toBeNull();
  });

  it("exposes Pill.RemoveButton as a static property", () => {
    expect(Pill.RemoveButton).toBeDefined();
  });

  it("reaches the remove button through a styles slot", () => {
    render(
      <Pill withRemoveButton styles={{ removeButton: { testID: "remove-slot" } }}>
        Tag
      </Pill>,
    );
    expect(screen.getByTestId("remove-slot")).toBeInTheDocument();
  });

  it("reaches the label through a styles slot", () => {
    render(<Pill styles={{ label: { testID: "label-slot" } }}>Tag</Pill>);
    expect(screen.getByTestId("label-slot")).toBeInTheDocument();
  });

  it("accepts a widened removeButtonProps (full CloseButton props)", () => {
    render(
      <Pill withRemoveButton removeButtonProps={{ testID: "rb", variant: "filled" }}>
        Tag
      </Pill>,
    );
    expect(screen.getByTestId("rb")).toBeInTheDocument();
  });

  it("lets removeButtonProps win over the styles slot for aria-label", () => {
    render(
      <Pill
        withRemoveButton
        styles={{ removeButton: { "aria-label": "from-slot" } }}
        removeButtonProps={{ "aria-label": "from-explicit" }}
      >
        Tag
      </Pill>,
    );
    expect(screen.getByRole("button", { name: "from-explicit" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "from-slot" })).not.toBeInTheDocument();
  });

  describe("Pill.Group", () => {
    it("renders child pills", () => {
      render(
        <Pill.Group>
          <Pill>One</Pill>
          <Pill>Two</Pill>
        </Pill.Group>,
      );
      expect(screen.getByText("One")).toBeInTheDocument();
      expect(screen.getByText("Two")).toBeInTheDocument();
    });

    it("forwards its ref", () => {
      const ref = React.createRef<GetRef<typeof Pill.Group>>();
      render(
        <Pill.Group ref={ref}>
          <Pill>One</Pill>
        </Pill.Group>,
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe("v3 style resolution (web CSS)", () => {
    it.each([
      ["default", "var(--color4)", "var(--color12)"],
      ["contrast", "var(--color9)", "var(--color1)"],
    ] as const)("variant=%s resolves fill and label colour", (variant, bg, fg) => {
      render(
        <Pill variant={variant} testID="p">
          L
        </Pill>,
      );
      expect(baseValue(screen.getByTestId("p"), "background-color")).toBe(bg);
      expect(baseValue(screen.getByText("L"), "color")).toBe(fg);
    });

    it("gradient paints a backgroundImage with a white label", () => {
      render(
        <Pill
          variant="gradient"
          gradient={{ from: "#f00", to: "#00f" }}
          testID="p"
          withRemoveButton
        >
          G
        </Pill>,
      );
      expect(baseValue(screen.getByTestId("p"), "background-image")).toContain("linear-gradient");
      expect(baseValue(screen.getByText("G"), "color")).toBe("var(--c-white)");
    });

    it.each(["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const)(
      "size=%s maps height, pill padding and font size",
      (size) => {
        render(
          <Pill size={size} testID="p">
            S
          </Pill>,
        );
        const pill = screen.getByTestId("p");
        expect(baseValue(pill, "height")).toBe(`var(--t-size-${size})`);
        expect(baseValue(pill, "padding-inline")).toBe(
          `var(--t-space-${controlMetrics[size].paddingHorizontalPill})`,
        );
        expect(baseValue(screen.getByText("S"), "font-size")).toBe(
          `var(--f-size-${controlMetrics[size].fontSize})`,
        );
      },
    );

    it("inherits size and disabled from Pill.Group", () => {
      render(
        <Pill.Group size="lg" disabled>
          <Pill testID="p" withRemoveButton>
            G
          </Pill>
        </Pill.Group>,
      );
      const pill = screen.getByTestId("p");
      expect(baseValue(pill, "height")).toBe("var(--t-size-lg)");
      expect(baseValue(pill, "opacity")).toBe("0.6");
      expect(screen.getByRole("button", { name: "Remove" })).toHaveAttribute(
        "aria-disabled",
        "true",
      );
    });

    it("the remove button is a real <button>", () => {
      render(<Pill withRemoveButton>X</Pill>);
      expect(screen.getByRole("button", { name: "Remove" }).tagName).toBe("BUTTON");
    });
  });
});
