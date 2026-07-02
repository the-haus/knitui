import * as React from "react";

import { fireEvent, render, screen } from "../test-utils";
import { FileButton } from "./FileButton";

describe("FileButton", () => {
  it("renders a Button trigger with the children as its label by default", () => {
    render(<FileButton onChange={() => {}}>Upload file</FileButton>);
    expect(screen.getByRole("button", { name: "Upload file" })).toBeInTheDocument();
  });

  it("clicking the default Button trigger opens the hidden file input", () => {
    const { container } = render(<FileButton onChange={() => {}}>Upload</FileButton>);
    const input = container.querySelector("input") as HTMLInputElement;
    const click = jest.spyOn(input, "click");
    fireEvent.click(screen.getByRole("button", { name: "Upload" }));
    expect(click).toHaveBeenCalledTimes(1);
  });

  it("forwards Button/styling props to the default trigger", () => {
    render(
      <FileButton
        onChange={() => {}}
        variant="outline"
        size="lg"
        leftSection={<span>icon</span>}
        aria-label="Upload files"
      >
        Upload
      </FileButton>,
    );
    const button = screen.getByRole("button", { name: "Upload files" });
    expect(button).toBeInTheDocument();
    expect(screen.getByText("icon")).toBeInTheDocument();
  });

  it("renders the trigger from a render-prop child", () => {
    render(
      <FileButton onChange={() => {}}>
        {({ onClick }) => <button onClick={onClick}>Pick a file</button>}
      </FileButton>,
    );
    expect(screen.getByRole("button", { name: "Pick a file" })).toBeInTheDocument();
  });

  it("renders the hidden file input as type=file", () => {
    const { container } = render(
      <FileButton onChange={() => {}}>
        {({ onClick }) => <button onClick={onClick}>Pick</button>}
      </FileButton>,
    );
    const input = container.querySelector("input") as HTMLElement;
    expect(input).not.toBeNull();
    expect(input).toHaveAttribute("type", "file");
  });

  it("passes accept and name through to the hidden input", () => {
    const { container } = render(
      <FileButton accept="image/png" name="upload" onChange={() => {}}>
        {({ onClick }) => <button onClick={onClick}>Pick</button>}
      </FileButton>,
    );
    const input = container.querySelector("input") as HTMLElement;
    expect(input).toHaveAttribute("accept", "image/png");
    expect(input).toHaveAttribute("name", "upload");
  });

  it("passes inputProps through to the hidden input", () => {
    const { container } = render(
      <FileButton
        inputProps={{ "aria-label": "File picker input", "data-testid": "file-input" }}
        onChange={() => {}}
      >
        {({ onClick }) => <button onClick={onClick}>Pick</button>}
      </FileButton>,
    );
    const input = container.querySelector("input") as HTMLElement;
    expect(input).toHaveAttribute("aria-label", "File picker input");
    expect(input).toHaveAttribute("data-testid", "file-input");
  });

  it("marks the hidden input disabled when disabled", () => {
    const { container } = render(
      <FileButton disabled onChange={() => {}}>
        {({ onClick }) => <button onClick={onClick}>Pick</button>}
      </FileButton>,
    );
    const input = container.querySelector("input") as HTMLElement;
    expect(input).toBeDisabled();
  });

  it("invokes the render-prop onClick when the trigger is pressed", () => {
    const triggerClick = jest.fn();
    render(
      <FileButton onChange={() => {}}>
        {({ onClick }) => (
          <button
            onClick={() => {
              triggerClick();
              onClick();
            }}
          >
            Pick
          </button>
        )}
      </FileButton>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Pick" }));
    expect(triggerClick).toHaveBeenCalledTimes(1);
  });

  it("populates resetRef with a clear function", () => {
    const resetRef = React.createRef<() => void>();
    render(
      <FileButton onChange={() => {}} resetRef={resetRef}>
        {({ onClick }) => <button onClick={onClick}>Pick</button>}
      </FileButton>,
    );
    expect(typeof resetRef.current).toBe("function");
  });

  it("forwards refs to the hidden file input", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(
      <FileButton ref={ref} onChange={() => {}}>
        {({ onClick }) => <button onClick={onClick}>Pick</button>}
      </FileButton>,
    );
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current).toHaveAttribute("type", "file");
  });

  it("threads the styles slot map through to the trigger Button", () => {
    render(
      <FileButton onChange={() => {}} styles={{ label: { testID: "label-slot" } }}>
        Upload file
      </FileButton>,
    );
    expect(screen.getByTestId("label-slot")).toBeInTheDocument();
  });
});
