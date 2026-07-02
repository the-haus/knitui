import * as React from "react";

import { fireEvent, render, screen } from "../test-utils";
import { FileInput } from "./FileInput";

describe("FileInput", () => {
  it("renders the placeholder when no file is picked", () => {
    render(<FileInput placeholder="Upload a file" />);
    expect(screen.getByText("Upload a file")).toBeInTheDocument();
  });

  it("renders as a button trigger", () => {
    render(<FileInput placeholder="Upload" />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("shows the file name for a controlled value", () => {
    const file = new File(["x"], "report.pdf");
    render(<FileInput value={file} />);
    expect(screen.getByText("report.pdf")).toBeInTheDocument();
  });

  it("joins multiple file names", () => {
    const files = [new File(["a"], "a.txt"), new File(["b"], "b.txt")];
    render(<FileInput multiple value={files} />);
    expect(screen.getByText("a.txt, b.txt")).toBeInTheDocument();
  });

  it("renders a clear button when clearable and a value is present", () => {
    const file = new File(["x"], "report.pdf");
    render(<FileInput clearable value={file} />);
    expect(screen.getByLabelText("Clear file")).toBeInTheDocument();
  });

  it("clears the value via the clear button (uncontrolled)", () => {
    const onChange = jest.fn();
    const file = new File(["x"], "report.pdf");
    render(<FileInput clearable defaultValue={file} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("Clear file"));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("does not render a clear button when no value is present", () => {
    render(<FileInput clearable placeholder="Upload" />);
    expect(screen.queryByLabelText("Clear file")).not.toBeInTheDocument();
  });

  it("does not render a clear button when disabled", () => {
    const file = new File(["x"], "report.pdf");
    render(<FileInput clearable disabled value={file} />);
    expect(screen.queryByLabelText("Clear file")).not.toBeInTheDocument();
  });

  it("does not render a clear button when readOnly", () => {
    const file = new File(["x"], "report.pdf");
    render(<FileInput clearable readOnly value={file} />);
    expect(screen.queryByLabelText("Clear file")).not.toBeInTheDocument();
  });

  it("marks the trigger aria-disabled when readOnly", () => {
    render(<FileInput readOnly placeholder="Upload" />);
    expect(screen.getByRole("button", { name: "Upload" })).toHaveAttribute("aria-disabled", "true");
  });

  it("passes fileInputProps to the hidden file input", () => {
    const { container } = render(
      <FileInput fileInputProps={{ "aria-label": "Native picker", "data-testid": "picker" }} />,
    );
    const input = container.querySelector("input");
    expect(input).toHaveAttribute("aria-label", "Native picker");
    expect(input).toHaveAttribute("data-testid", "picker");
  });

  it("reaches the clear button through a styles slot", () => {
    const file = new File(["x"], "report.pdf");
    render(<FileInput clearable value={file} styles={{ clearButton: { testID: "clear-slot" } }} />);
    expect(screen.getByTestId("clear-slot")).toBeInTheDocument();
  });

  it("reaches the placeholder through a styles slot", () => {
    render(<FileInput placeholder="Upload" styles={{ placeholder: { testID: "ph-slot" } }} />);
    expect(screen.getByTestId("ph-slot")).toBeInTheDocument();
  });

  it("reaches the default value display through a styles slot", () => {
    const file = new File(["x"], "report.pdf");
    render(<FileInput value={file} styles={{ value: { testID: "value-slot" } }} />);
    expect(screen.getByTestId("value-slot")).toBeInTheDocument();
  });

  it("forwards field-chrome styles through to the label", () => {
    render(<FileInput label="Upload" styles={{ label: { testID: "label-slot" } }} />);
    expect(screen.getByTestId("label-slot")).toBeInTheDocument();
  });

  it("lets the deprecated clearButtonProps win over the styles slot", () => {
    const file = new File(["x"], "report.pdf");
    render(
      <FileInput
        clearable
        value={file}
        styles={{ clearButton: { "aria-label": "from-slot" } }}
        clearButtonProps={{ "aria-label": "from-explicit" }}
      />,
    );
    expect(screen.getByLabelText("from-explicit")).toBeInTheDocument();
    expect(screen.queryByLabelText("from-slot")).not.toBeInTheDocument();
  });
});
