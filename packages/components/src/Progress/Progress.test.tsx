import * as React from "react";

import type { GetRef } from "@knitui/core";

import { baseValue } from "../__tests__/css-rules.test.helper";
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

describe("Progress v3 style resolution (web CSS)", () => {
  it("paints a color4 track and a color9 section sized to the value", () => {
    render(<Progress testID="p" value={40} />);
    const track = screen.getByTestId("p");
    expect(baseValue(track, "background-color")).toBe("var(--color4)");
    expect(baseValue(track, "border-radius")).toBe("var(--t-radius-xl)");
    const section = track.firstElementChild!;
    expect(baseValue(section, "background-color")).toBe("var(--color9)");
    expect(baseValue(section, "width")).toBe("40%");
  });

  it.each([
    ["xxs", "2px"],
    ["md", "8px"],
    ["xxl", "20px"],
  ] as const)("size=%s sets the track thickness to %s", (size, px) => {
    render(<Progress testID="p" value={10} size={size} />);
    expect(baseValue(screen.getByTestId("p"), "height")).toBe(px);
  });

  it("vertical turns the thickness into a width and never sets a variant height", () => {
    render(
      <>
        <Progress testID="v" value={50} size="lg" orientation="vertical" height={100} />
        <Progress testID="n" value={50} size={7} orientation="vertical" height={100} />
      </>,
    );
    const v = screen.getByTestId("v");
    expect(baseValue(v, "width")).toBe("12px");
    expect(baseValue(v, "height")).toBe("100px");
    expect(baseValue(v, "flex-direction")).toBe("column");
    expect(baseValue(v.firstElementChild!, "height")).toBe("50%");
    expect(baseValue(screen.getByTestId("n"), "width")).toBe("7px");
  });

  it("clamps the section extent to 0–100%", () => {
    render(<Progress testID="p" value={140} />);
    expect(baseValue(screen.getByTestId("p").firstElementChild!, "width")).toBe("100%");
  });

  it("animated stripes run a repeating shimmer; plain stripes stay still", () => {
    render(
      <>
        <Progress testID="a" value={50} animated />
        <Progress testID="s" value={50} striped />
      </>,
    );
    const row = (id: string) =>
      screen.getByTestId(id).firstElementChild!.firstElementChild!.firstElementChild as HTMLElement;
    expect(row("a").style.animationName).toBe("knitui-loop-shimmer-X-20");
    expect(row("a").style.flexDirection).toBe("row");
    expect(row("s").style.animationName).toBe("none");
    expect(row("s").children).toHaveLength(8);
  });
});
