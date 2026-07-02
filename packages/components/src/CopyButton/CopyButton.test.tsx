import * as React from "react";

import { act, fireEvent, render, screen } from "../test-utils";
import { CopyButton } from "./CopyButton";

describe("CopyButton", () => {
  const originalClipboard = navigator.clipboard;

  afterEach(() => {
    jest.useRealTimers();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: originalClipboard,
    });
  });

  it("renders via its render-prop child with the initial copied flag false", () => {
    render(
      <CopyButton value="hello">
        {({ copied }) => <span>{copied ? "Copied" : "Copy"}</span>}
      </CopyButton>,
    );
    expect(screen.getByText("Copy")).toBeInTheDocument();
  });

  it("passes a copy action to the child", () => {
    const seen: { copied: boolean; copy: () => void }[] = [];
    render(
      <CopyButton value="abc">
        {(payload) => {
          seen.push(payload);
          return <span>render</span>;
        }}
      </CopyButton>,
    );
    expect(screen.getByText("render")).toBeInTheDocument();
    expect(typeof seen[0].copy).toBe("function");
    expect(seen[0].copied).toBe(false);
  });

  it("copies the provided value and resets copied after the timeout", async () => {
    jest.useFakeTimers();
    const copiedValues: string[] = [];
    const writeText = jest.fn((value: string) => {
      copiedValues.push(value);
      return Promise.resolve();
    });

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(
      <CopyButton value="payload" timeout={500}>
        {({ copied, copy }) => (
          <button type="button" onClick={copy}>
            {copied ? "Copied" : "Copy now"}
          </button>
        )}
      </CopyButton>,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledWith("payload");
    expect(copiedValues).toEqual(["payload"]);
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.getByRole("button", { name: "Copy now" })).toBeInTheDocument();
  });

  it("renders custom content driven by the render prop", () => {
    render(
      <CopyButton value="x" timeout={500}>
        {() => <span>custom-child</span>}
      </CopyButton>,
    );
    expect(screen.getByText("custom-child")).toBeInTheDocument();
  });
});
