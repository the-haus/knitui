import * as React from "react";

import type { GetRef } from "@knitui/core";

import { render, screen } from "../test-utils";
import { NumberFormatter } from "./NumberFormatter";

describe("NumberFormatter", () => {
  it("renders a plain number value", () => {
    render(<NumberFormatter value={1234} />);
    expect(screen.getByText("1234")).toBeInTheDocument();
  });

  it("inserts the thousands separator character into the output", () => {
    render(<NumberFormatter value={1234567} thousandSeparator />);
    expect(screen.getByText("1,234,567")).toBeInTheDocument();
  });

  it("uses a custom thousands separator character", () => {
    render(<NumberFormatter value={1234567} thousandSeparator="." />);
    expect(screen.getByText("1.234.567")).toBeInTheDocument();
  });

  it("supports lakh and wan grouping styles", () => {
    render(
      <>
        <NumberFormatter value={1234567890} thousandSeparator thousandsGroupStyle="lakh" />
        <NumberFormatter value={1234567890} thousandSeparator thousandsGroupStyle="wan" />
      </>,
    );

    expect(screen.getByText("1,23,45,67,890")).toBeInTheDocument();
    expect(screen.getByText("12,3456,7890")).toBeInTheDocument();
  });

  it("adds a prefix and suffix", () => {
    render(<NumberFormatter value={99} prefix="$" suffix=" USD" />);
    expect(screen.getByText("$99 USD")).toBeInTheDocument();
  });

  it("pads decimals with fixedDecimalScale", () => {
    render(<NumberFormatter value={5} decimalScale={2} fixedDecimalScale />);
    expect(screen.getByText("5.00")).toBeInTheDocument();
  });

  it("converts negatives to positive when allowNegative is false", () => {
    render(<NumberFormatter value={-42} allowNegative={false} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders no number text for an empty value", () => {
    const { container } = render(<NumberFormatter value="" />);
    expect(container.textContent).toBe("");
  });

  it("forwards refs to the text frame", () => {
    const ref = React.createRef<GetRef<typeof NumberFormatter>>();
    render(<NumberFormatter ref={ref} value={1234} />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });
});
