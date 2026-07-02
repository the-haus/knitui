import * as React from "react";

import type { GetRef } from "@knitui/core";

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
});
