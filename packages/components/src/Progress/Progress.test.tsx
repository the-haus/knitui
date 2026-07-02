import * as React from "react";

import type { GetRef } from "@knitui/core";

import { render, screen } from "../test-utils";
import { Progress } from "./Progress";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

describe("Progress", () => {
  it("exposes the progressbar role with aria-value*", () => {
    render(<Progress value={60} />);
    const bar = screen.getAllByRole("progressbar")[0];
    expect(bar).toHaveAttribute("aria-valuenow", "60");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("has a default accessible label", () => {
    render(<Progress value={60} />);
    expect(screen.getByRole("progressbar", { name: "Progress" })).toBeInTheDocument();
  });

  it("honours a custom aria-label", () => {
    render(<Progress value={60} aria-label="Upload progress" />);
    expect(screen.getByRole("progressbar", { name: "Upload progress" })).toBeInTheDocument();
  });

  it.each([0, 25, 100])("renders with value %i", (value) => {
    render(<Progress value={value} />);
    const bar = screen.getAllByRole("progressbar")[0];
    expect(bar).toHaveAttribute("aria-valuenow", String(value));
  });

  it("clamps aria-valuenow to the 0-100 range", () => {
    render(<Progress value={120} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "100");
  });

  it.each(SIZES)("renders the %s size", (size) => {
    render(<Progress value={50} size={size} />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("accepts a numeric size", () => {
    render(<Progress value={50} size={24} />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("renders the compound Root + Section form with a label", () => {
    render(
      <Progress.Root size="lg">
        <Progress.Section value={40}>40%</Progress.Section>
      </Progress.Root>,
    );
    expect(screen.getByText("40%")).toBeInTheDocument();
  });

  it("attaches aria to a section only when withAria is set", () => {
    render(
      <Progress.Root>
        <Progress.Section value={30} withAria />
      </Progress.Root>,
    );
    const bar = screen.getByRole("progressbar", { name: "Progress section" });
    expect(bar).toHaveAttribute("aria-valuenow", "30");
  });

  it("forwards a ref to the root element", () => {
    const ref = React.createRef<GetRef<typeof Progress>>();
    render(<Progress ref={ref} value={50} />);
    expect(ref.current).not.toBeNull();
  });

  it("renders a label inside the single-bar form", () => {
    render(<Progress value={70} label="70%" />);
    expect(screen.getByText("70%")).toBeInTheDocument();
  });

  it("distributes the styles map onto its slots", () => {
    render(
      <Progress
        value={50}
        label="half"
        styles={{
          root: { testID: "progress-root" },
          section: { testID: "progress-section" },
          label: { testID: "progress-label" },
        }}
      />,
    );
    expect(screen.getByTestId("progress-root")).toBeInTheDocument();
    expect(screen.getByTestId("progress-section")).toBeInTheDocument();
    expect(screen.getByTestId("progress-label")).toBeInTheDocument();
  });
});
