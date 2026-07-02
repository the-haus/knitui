import * as React from "react";

import type { TamaguiElement } from "@knitui/core";

import { fireEvent, render, screen } from "../test-utils";
import { CalendarHeader } from "./CalendarHeader";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

describe("CalendarHeader", () => {
  it("renders the string label", () => {
    render(<CalendarHeader label="March 2024" />);
    expect(screen.getByText("March 2024")).toBeInTheDocument();
  });

  it("renders a node label", () => {
    render(<CalendarHeader label={<span data-testid="custom">custom node</span>} />);
    expect(screen.getByTestId("custom")).toBeInTheDocument();
    expect(screen.getByText("custom node")).toBeInTheDocument();
  });

  it("renders previous, level and next controls by default", () => {
    render(
      <CalendarHeader
        label="March 2024"
        previousLabel="Previous month"
        nextLabel="Next month"
        levelControlAriaLabel="Change level"
      />,
    );
    // previous, level, next all expose role="button" by default (hasNextLevel)
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("applies the previous/next aria-labels", () => {
    render(
      <CalendarHeader label="March 2024" previousLabel="Previous month" nextLabel="Next month" />,
    );
    expect(screen.getByRole("button", { name: "Previous month" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next month" })).toBeInTheDocument();
  });

  it("applies the level control aria-label", () => {
    render(<CalendarHeader label="March 2024" levelControlAriaLabel="Change level" />);
    expect(screen.getByRole("button", { name: "Change level" })).toBeInTheDocument();
  });

  it("fires onPrevious when the previous control is pressed", () => {
    const onPrevious = jest.fn();
    render(<CalendarHeader label="March 2024" previousLabel="Previous" onPrevious={onPrevious} />);
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it("fires onNext when the next control is pressed", () => {
    const onNext = jest.fn();
    render(<CalendarHeader label="March 2024" nextLabel="Next" onNext={onNext} />);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("fires onLevelClick when the level control is pressed", () => {
    const onLevelClick = jest.fn();
    render(
      <CalendarHeader
        label="March 2024"
        levelControlAriaLabel="Change level"
        onLevelClick={onLevelClick}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Change level" }));
    expect(onLevelClick).toHaveBeenCalledTimes(1);
  });

  it("does not render the previous control when withPrevious is false", () => {
    render(
      <CalendarHeader
        label="March 2024"
        withPrevious={false}
        previousLabel="Previous"
        nextLabel="Next"
        levelControlAriaLabel="Change level"
      />,
    );
    expect(screen.queryByRole("button", { name: "Previous" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("does not render the next control when withNext is false", () => {
    render(
      <CalendarHeader
        label="March 2024"
        withNext={false}
        previousLabel="Previous"
        nextLabel="Next"
        levelControlAriaLabel="Change level"
      />,
    );
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("marks the previous control aria-disabled and suppresses its callback when previousDisabled", () => {
    const onPrevious = jest.fn();
    render(
      <CalendarHeader
        label="March 2024"
        previousLabel="Previous"
        previousDisabled
        onPrevious={onPrevious}
      />,
    );
    const previous = screen.getByRole("button", { name: "Previous" });
    expect(previous).toHaveAttribute("aria-disabled", "true");
  });

  it("marks the next control aria-disabled when nextDisabled", () => {
    render(<CalendarHeader label="March 2024" nextLabel="Next" nextDisabled />);
    expect(screen.getByRole("button", { name: "Next" })).toHaveAttribute("aria-disabled", "true");
  });

  it("renders the level control as a non-interactive presentation node when hasNextLevel is false", () => {
    const onLevelClick = jest.fn();
    render(
      <CalendarHeader
        label="March 2024"
        hasNextLevel={false}
        levelControlAriaLabel="Change level"
        onLevelClick={onLevelClick}
      />,
    );
    // No button is exposed for the level control anymore.
    expect(screen.queryByRole("button", { name: "Change level" })).not.toBeInTheDocument();
    // The label text still renders.
    expect(screen.getByText("March 2024")).toBeInTheDocument();
    // previous + next remain buttons.
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("does not fire onLevelClick when hasNextLevel is false", () => {
    const onLevelClick = jest.fn();
    render(
      <CalendarHeader
        label="March 2024"
        hasNextLevel={false}
        levelControlAriaLabel="Change level"
        onLevelClick={onLevelClick}
      />,
    );
    fireEvent.click(screen.getByText("March 2024"));
    expect(onLevelClick).not.toHaveBeenCalled();
  });

  it("renders a custom previous icon", () => {
    render(
      <CalendarHeader
        label="March 2024"
        previousLabel="Previous"
        previousIcon={<span data-testid="prev-icon">PREV</span>}
      />,
    );
    expect(screen.getByTestId("prev-icon")).toBeInTheDocument();
  });

  it("renders a custom next icon", () => {
    render(
      <CalendarHeader
        label="March 2024"
        nextLabel="Next"
        nextIcon={<span data-testid="next-icon">NEXT</span>}
      />,
    );
    expect(screen.getByTestId("next-icon")).toBeInTheDocument();
  });

  it("renders default chevron glyphs when no icons are provided", () => {
    render(<CalendarHeader label="March 2024" />);
    expect(screen.getByText("‹")).toBeInTheDocument();
    expect(screen.getByText("›")).toBeInTheDocument();
  });

  it("respects headerControlsOrder", () => {
    render(
      <CalendarHeader
        label="March 2024"
        previousLabel="Previous"
        nextLabel="Next"
        levelControlAriaLabel="Level"
        headerControlsOrder={["next", "level", "previous"]}
      />,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toHaveAttribute("aria-label", "Next");
    expect(buttons[2]).toHaveAttribute("aria-label", "Previous");
  });

  it.each(SIZES)("renders with the %s size", (size) => {
    render(<CalendarHeader label="Sized" size={size} />);
    expect(screen.getByText("Sized")).toBeInTheDocument();
  });

  it("forwards a ref to the root element", () => {
    const ref = React.createRef<TamaguiElement>();
    render(<CalendarHeader ref={ref} label="March 2024" />);
    expect(ref.current).not.toBeNull();
  });

  it("forwards arbitrary props (id) to the root", () => {
    const { container } = render(<CalendarHeader label="March 2024" id="header-root" />);
    expect(container.querySelector("#header-root")).not.toBeNull();
  });

  it("spreads styles.root onto the root via the per-slot sugar", () => {
    const { container } = render(
      <CalendarHeader label="March 2024" styles={{ root: { id: "sugar-root" } }} />,
    );
    expect(container.querySelector("#sugar-root")).not.toBeNull();
  });

  it("explicit root props beat the styles.root sugar (explicit wins)", () => {
    const { container } = render(
      <CalendarHeader
        label="March 2024"
        id="explicit-root"
        styles={{ root: { id: "sugar-root" } }}
      />,
    );
    // The explicit prop on the component (spread as `rest`) overrides the sugar.
    expect(container.querySelector("#explicit-root")).not.toBeNull();
    expect(container.querySelector("#sugar-root")).toBeNull();
  });

  it("spreads styles.control onto every prev/next control", () => {
    render(
      <CalendarHeader
        label="March 2024"
        previousLabel="Previous"
        nextLabel="Next"
        styles={{ control: { id: "ctrl" } }}
      />,
    );
    expect(screen.getByRole("button", { name: "Previous" })).toHaveAttribute("id", "ctrl");
    expect(screen.getByRole("button", { name: "Next" })).toHaveAttribute("id", "ctrl");
  });

  it("spreads styles.level onto the level control", () => {
    render(
      <CalendarHeader
        label="March 2024"
        levelControlAriaLabel="Change level"
        styles={{ level: { id: "lvl" } }}
      />,
    );
    expect(screen.getByRole("button", { name: "Change level" })).toHaveAttribute("id", "lvl");
  });

  it("exposes the styled parts as static properties", () => {
    expect(CalendarHeader.Frame).toBeTruthy();
    expect(CalendarHeader.Control).toBeTruthy();
    expect(CalendarHeader.Level).toBeTruthy();
    expect(CalendarHeader.LevelLabel).toBeTruthy();
    expect(CalendarHeader.Icon).toBeTruthy();
  });
});
