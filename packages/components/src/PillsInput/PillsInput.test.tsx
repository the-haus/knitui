import * as React from "react";

import type { GetRef } from "@knitui/core";

import { Pill } from "../Pill";
import { render, screen } from "../test-utils";
import { PillsInput } from "./PillsInput";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

describe("PillsInput", () => {
  it("forwards the styles map to Input.Wrapper slots", () => {
    render(
      <PillsInput
        label="Tags"
        error="Required"
        styles={{ label: { testID: "pi-label" }, error: { testID: "pi-error" } }}
      >
        <PillsInput.Field aria-label="tags-field" />
      </PillsInput>,
    );
    expect(screen.getByTestId("pi-label")).toHaveTextContent("Tags");
    expect(screen.getByTestId("pi-error")).toHaveTextContent("Required");
  });

  it("renders a label", () => {
    render(
      <PillsInput label="Tags">
        <PillsInput.Field aria-label="tags-field" />
      </PillsInput>,
    );
    expect(screen.getByText("Tags")).toBeInTheDocument();
  });

  it("renders the editable field", () => {
    render(
      <PillsInput>
        <PillsInput.Field aria-label="tags-field" />
      </PillsInput>,
    );
    expect(screen.getByLabelText("tags-field")).toBeInTheDocument();
  });

  it("renders child pills alongside the field", () => {
    render(
      <PillsInput>
        <Pill.Group>
          <Pill>react</Pill>
          <Pill>jest</Pill>
        </Pill.Group>
        <PillsInput.Field aria-label="tags-field" />
      </PillsInput>,
    );
    expect(screen.getByText("react")).toBeInTheDocument();
    expect(screen.getByText("jest")).toBeInTheDocument();
  });

  it.each(SIZES)("renders the %s size", (size) => {
    render(
      <PillsInput size={size}>
        <PillsInput.Field aria-label={`tags-field-${size}`} />
      </PillsInput>,
    );
    expect(screen.getByLabelText(`tags-field-${size}`)).toBeInTheDocument();
  });

  it("renders a description", () => {
    render(
      <PillsInput description="Add some tags">
        <PillsInput.Field aria-label="tags-field" />
      </PillsInput>,
    );
    expect(screen.getByText("Add some tags")).toBeInTheDocument();
  });

  it("renders an error message", () => {
    render(
      <PillsInput error="Required">
        <PillsInput.Field aria-label="tags-field" />
      </PillsInput>,
    );
    expect(screen.getByText("Required")).toBeInTheDocument();
  });

  it("links description and error messages to the editable field", () => {
    render(
      <PillsInput description="Add some tags" error="Required">
        <PillsInput.Field aria-label="tags-field" />
      </PillsInput>,
    );

    const field = screen.getByLabelText("tags-field");
    const describedBy = field.getAttribute("aria-describedby");
    const describedByText = describedBy
      ?.split(" ")
      .map((id) => document.getElementById(id)?.textContent);

    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(describedByText).toEqual(["Add some tags", "Required"]);
  });

  it("forwards its ref to the input chrome frame", () => {
    const ref = React.createRef<GetRef<typeof PillsInput>>();

    render(
      <PillsInput ref={ref}>
        <PillsInput.Field aria-label="tags-field" />
      </PillsInput>,
    );

    expect(ref.current).not.toBeNull();
  });
});
