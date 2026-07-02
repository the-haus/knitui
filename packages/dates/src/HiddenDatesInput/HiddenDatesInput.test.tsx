import { render } from "../test-utils";
import { HiddenDatesInput } from "./HiddenDatesInput";

/** Read the hidden `<input>` the helper renders (web-only) from a container. */
function hiddenInput(container: HTMLElement): HTMLInputElement | null {
  return container.querySelector('input[type="hidden"]');
}

describe("HiddenDatesInput", () => {
  it("renders nothing when no name is provided", () => {
    const { container } = render(
      <HiddenDatesInput name={undefined} form={undefined} value="2024-01-15" type="default" />,
    );
    expect(hiddenInput(container)).toBeNull();
  });

  it("renders a hidden input with the given name and serialized scalar value", () => {
    const { container } = render(
      <HiddenDatesInput name="date" form={undefined} value="2024-01-15" type="default" />,
    );
    const input = hiddenInput(container);
    expect(input).not.toBeNull();
    expect(input).toHaveAttribute("name", "date");
    expect(input).toHaveValue("2024-01-15");
  });

  it("marks the hidden input read-only and hidden from a11y", () => {
    const { container } = render(
      <HiddenDatesInput name="date" form={undefined} value="2024-01-15" type="default" />,
    );
    const input = hiddenInput(container);
    expect(input).toHaveAttribute("readonly");
    expect(input).toHaveAttribute("aria-hidden", "true");
    expect(input).toHaveAttribute("tabindex", "-1");
  });

  it("associates the input with a form id", () => {
    const { container } = render(
      <HiddenDatesInput name="date" form="my-form" value="2024-01-15" type="default" />,
    );
    expect(hiddenInput(container)).toHaveAttribute("form", "my-form");
  });

  it("serializes a date-only scalar (default withTime=false)", () => {
    const { container } = render(
      <HiddenDatesInput name="date" form={undefined} value="2024-01-15 13:30:00" type="default" />,
    );
    expect(hiddenInput(container)).toHaveValue("2024-01-15");
  });

  it("serializes a scalar with time when withTime is set", () => {
    const { container } = render(
      <HiddenDatesInput
        name="date"
        form={undefined}
        value="2024-01-15 13:30:00"
        type="default"
        withTime
      />,
    );
    expect(hiddenInput(container)).toHaveValue("2024-01-15 13:30:00");
  });

  it("serializes an empty string for a null scalar value", () => {
    const { container } = render(
      <HiddenDatesInput name="date" form={undefined} value={null} type="default" />,
    );
    expect(hiddenInput(container)).toHaveValue("");
  });

  it("serializes a complete range with the en-dash separator", () => {
    const { container } = render(
      <HiddenDatesInput
        name="range"
        form={undefined}
        value={["2024-01-01", "2024-01-31"]}
        type="range"
      />,
    );
    expect(hiddenInput(container)).toHaveValue("2024-01-01 – 2024-01-31");
  });

  it("serializes an incomplete range (start only) with a trailing dash", () => {
    const { container } = render(
      <HiddenDatesInput name="range" form={undefined} value={["2024-01-01", null]} type="range" />,
    );
    expect(hiddenInput(container)).toHaveValue("2024-01-01 –");
  });

  it("serializes an empty string for a range with no start", () => {
    const { container } = render(
      <HiddenDatesInput name="range" form={undefined} value={[null, null]} type="range" />,
    );
    expect(hiddenInput(container)).toHaveValue("");
  });

  it("serializes a range with time on both ends when withTime is set", () => {
    const { container } = render(
      <HiddenDatesInput
        name="range"
        form={undefined}
        value={["2024-01-01 09:00:00", "2024-01-31 17:30:00"]}
        type="range"
        withTime
      />,
    );
    expect(hiddenInput(container)).toHaveValue("2024-01-01 09:00:00 – 2024-01-31 17:30:00");
  });

  it("joins multiple values with a comma", () => {
    const { container } = render(
      <HiddenDatesInput
        name="multi"
        form={undefined}
        value={["2024-01-01", "2024-02-02", "2024-03-03"]}
        type="multiple"
      />,
    );
    expect(hiddenInput(container)).toHaveValue("2024-01-01, 2024-02-02, 2024-03-03");
  });

  it("filters falsy entries out of a multiple value", () => {
    const { container } = render(
      <HiddenDatesInput
        name="multi"
        form={undefined}
        value={["2024-01-01", null, "2024-03-03"]}
        type="multiple"
      />,
    );
    expect(hiddenInput(container)).toHaveValue("2024-01-01, 2024-03-03");
  });

  it("serializes multiple values with time when withTime is set", () => {
    const { container } = render(
      <HiddenDatesInput
        name="multi"
        form={undefined}
        value={["2024-01-01 08:00:00", "2024-03-03 20:15:00"]}
        type="multiple"
        withTime
      />,
    );
    expect(hiddenInput(container)).toHaveValue("2024-01-01 08:00:00, 2024-03-03 20:15:00");
  });

  it("serializes an empty string for an empty multiple value", () => {
    const { container } = render(
      <HiddenDatesInput name="multi" form={undefined} value={[]} type="multiple" />,
    );
    expect(hiddenInput(container)).toHaveValue("");
  });
});
