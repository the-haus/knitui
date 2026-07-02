import * as React from "react";

import type { AudioRecorderController } from "../controller/recorder-controller-base";
import { RECORDING_PRESETS } from "../engine/recording-presets";
import { act, render, screen, waitFor } from "../test-utils";
import { AudioRecorder } from "./AudioRecorder";

describe("<AudioRecorder> (web)", () => {
  it("renders a labelled region and the record button", () => {
    render(<AudioRecorder label="My recorder" />);
    expect(screen.getByLabelText("Start recording")).toBeInTheDocument();
    const region = document.querySelector('[role="group"]') as HTMLElement;
    expect(region).toHaveAttribute("aria-label", "My recorder");
  });

  it("renders the duration as a timecode", () => {
    render(<AudioRecorder />);
    expect(screen.getByText("0:00")).toBeInTheDocument();
  });

  it("exposes the controller via getController", () => {
    const getController = jest.fn();
    render(<AudioRecorder getController={getController} />);
    expect(getController).toHaveBeenCalledTimes(1);
    expect(getController.mock.calls[0][0]).toHaveProperty("record");
  });

  it("transitions to recording and shows the stop affordance", async () => {
    let controller: AudioRecorderController | null = null;
    render(<AudioRecorder getController={(c) => (controller = c)} />);
    await act(async () => {
      await controller!.record();
    });
    expect(controller!.state.isRecording).toBe(true);
    await waitFor(() => expect(screen.getByLabelText("Stop recording")).toBeInTheDocument());
  });

  it("fires onRecordingChange and onStop", async () => {
    const onRecordingChange = jest.fn();
    const onStop = jest.fn();
    let controller: AudioRecorderController | null = null;
    render(
      <AudioRecorder
        getController={(c) => (controller = c)}
        onRecordingChange={onRecordingChange}
        onStop={onStop}
      />,
    );
    await act(async () => {
      await controller!.record();
    });
    expect(onRecordingChange).toHaveBeenCalledWith(true);
    await act(async () => {
      await controller!.stop();
    });
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it("hides chrome when controls={false}", () => {
    render(<AudioRecorder controls={false} />);
    expect(screen.queryByLabelText("Start recording")).not.toBeInTheDocument();
  });

  it("renders custom chrome passed to controls", () => {
    render(<AudioRecorder controls={<AudioRecorder.Record />} />);
    expect(screen.getByLabelText("Start recording")).toBeInTheDocument();
    // The default bar's duration is absent in this minimal custom chrome.
    expect(screen.queryByText("0:00")).not.toBeInTheDocument();
  });

  it("gates the level meter on the metering capability", () => {
    // Metering is on (jsdom stubs AudioContext, so canMeter resolves true).
    render(<AudioRecorder meteringEnabled options={RECORDING_PRESETS.HIGH_QUALITY} />);
    expect(screen.getByLabelText("Input level")).toBeInTheDocument();
  });
});
