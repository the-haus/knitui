import * as React from "react";

import { type GetRef } from "@knitui/core";

import { fireEvent, render, screen } from "../test-utils";
import { Spoiler } from "./Spoiler";

let mockElementHeight = 0;

jest.mock("@knitui/hooks", () => {
  const actual = jest.requireActual("@knitui/hooks");

  return {
    ...actual,
    useElementSize: jest.fn(() => ({
      ref: { current: null },
      rootProps: {},
      width: 0,
      height: mockElementHeight,
    })),
  };
});

describe("Spoiler", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    mockElementHeight = 0;
  });

  it("renders its content inside a region", () => {
    render(
      <Spoiler showLabel="Show more" hideLabel="Hide">
        <span>spoiler body</span>
      </Spoiler>,
    );
    expect(screen.getByText("spoiler body")).toBeInTheDocument();
    expect(screen.getByRole("region")).toBeInTheDocument();
  });

  it("does not render the toggle when content does not overflow", () => {
    render(
      <Spoiler showLabel="Show more" hideLabel="Hide">
        <span>short</span>
      </Spoiler>,
    );
    // useElementSize reports 0 height in jsdom, so the toggle stays hidden.
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders without throwing when controlled expanded", () => {
    render(
      <Spoiler showLabel="Show" hideLabel="Hide" expanded>
        <span>controlled body</span>
      </Spoiler>,
    );
    expect(screen.getByText("controlled body")).toBeInTheDocument();
  });

  it("does not forward accessibilityRole to the DOM toggle", () => {
    mockElementHeight = 120;
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    render(
      <Spoiler maxHeight={64} showLabel="Show more" hideLabel="Hide">
        <span>overflowing body</span>
      </Spoiler>,
    );

    const button = screen.getByRole("button", { name: "Show more" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).not.toHaveAttribute("accessibilityRole");
    expect(
      consoleError.mock.calls.some((call) =>
        call.some((argument) => String(argument).includes("accessibilityRole")),
      ),
    ).toBe(false);
    expect(screen.getByRole("region")).toHaveAttribute("aria-labelledby", button.id);
  });

  it("toggles uncontrolled state with pointer and keyboard activation", () => {
    mockElementHeight = 120;
    const onExpandedChange = jest.fn();

    render(
      <Spoiler
        maxHeight={64}
        showLabel="Show more"
        hideLabel="Hide"
        onExpandedChange={onExpandedChange}
      >
        <span>overflowing body</span>
      </Spoiler>,
    );

    const button = screen.getByRole("button", { name: "Show more" });

    fireEvent.click(button);
    expect(onExpandedChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole("button", { name: "Hide" })).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(screen.getByRole("button", { name: "Hide" }), { key: "Enter" });
    expect(onExpandedChange).toHaveBeenLastCalledWith(false);
    expect(screen.getByRole("button", { name: "Show more" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("forwards a ref to the root element", () => {
    const ref = React.createRef<GetRef<typeof Spoiler>>();
    render(
      <Spoiler ref={ref} showLabel="Show" hideLabel="Hide">
        <span>body</span>
      </Spoiler>,
    );
    expect(ref.current).not.toBeNull();
  });

  it("exposes styled subparts", () => {
    render(<Spoiler.Control data-testid="control">Control</Spoiler.Control>);
    expect(screen.getByTestId("control")).toBeInTheDocument();
  });

  it("distributes the styles map onto its slots", () => {
    mockElementHeight = 200;
    render(
      <Spoiler
        maxHeight={64}
        showLabel="Show more"
        hideLabel="Hide"
        styles={{
          root: { testID: "spoiler-root" },
          region: { testID: "spoiler-region" },
          control: { testID: "spoiler-control" },
          fade: { testID: "spoiler-fade" },
        }}
      >
        <span>overflowing body</span>
      </Spoiler>,
    );
    expect(screen.getByTestId("spoiler-root")).toBeInTheDocument();
    expect(screen.getByTestId("spoiler-region")).toBeInTheDocument();
    expect(screen.getByTestId("spoiler-control")).toBeInTheDocument();
    expect(screen.getByTestId("spoiler-fade")).toBeInTheDocument();
  });
});
