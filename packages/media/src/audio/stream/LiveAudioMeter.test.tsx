import * as React from "react";

import { fireEvent, render, screen, waitFor } from "../test-utils";
import { LiveAudioMeter } from "./LiveAudioMeter";

describe("<LiveAudioMeter>", () => {
  it("renders the meter region and a Start button", () => {
    render(<LiveAudioMeter testID="meter" />);
    expect(screen.getByText("Microphone")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
  });

  it("clicking Start does not throw and moves toward streaming", async () => {
    render(<LiveAudioMeter />);
    const button = screen.getByRole("button", { name: "Start" });
    expect(() => fireEvent.click(button)).not.toThrow();

    // getUserMedia + AudioContext are stubbed; after the async start resolves the
    // control flips to "Stop" (streaming). Robust to the stubbed graph.
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Stop" })).toBeInTheDocument();
    });
    expect(screen.getByText("Listening")).toBeInTheDocument();
  });

  it("toggling Stop returns to the idle state", async () => {
    render(<LiveAudioMeter />);
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    const stop = await screen.findByRole("button", { name: "Stop" });
    fireEvent.click(stop);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
    });
  });
});
