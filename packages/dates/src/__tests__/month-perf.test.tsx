/**
 * Render-cost probe for the calendar hot path: a full month grid (42 `Day`
 * cells + weekday header) under jsdom + react-native-web, median of 20 runs.
 *
 * jsdom timings are NOT browser timings — use the numbers comparatively
 * (before/after a change), never as absolutes. The assertions are deliberately
 * loose ceilings so CI noise can't flake them; what they guard is an
 * order-of-magnitude regression (e.g. a per-cell allocation storm or a memo
 * boundary that stopped bailing out). Set `DATES_PERF_LOG=1` to print medians.
 */
import * as React from "react";

import { DatePicker } from "../DatePicker";
import { Month } from "../Month";
import { act, cleanup, fireEvent, render, screen } from "../test-utils";
import { TimeGrid } from "../TimeGrid";

const RUNS = 20;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function log(label: string, ms: number) {
  if (process.env.DATES_PERF_LOG) {
    // eslint-disable-next-line no-console
    console.log(`[dates perf] ${label}: ${ms.toFixed(2)}ms (median of ${RUNS})`);
  }
}

describe("month grid render cost", () => {
  it("mounts a 42-cell month grid", () => {
    // Warm-up: first mount pays module init + style injection.
    render(<Month month="2024-01-01" />);
    cleanup();

    const samples: number[] = [];
    for (let i = 0; i < RUNS; i++) {
      const start = performance.now();
      render(<Month month="2024-01-01" />);
      samples.push(performance.now() - start);
      cleanup();
    }
    const ms = median(samples);
    log("Month mount", ms);
    expect(ms).toBeLessThan(500);
  });

  it("re-renders a DatePicker on selection change (memoized cells bail out)", () => {
    function Harness() {
      const [value, setValue] = React.useState<string | null>(null);
      return <DatePicker defaultDate="2024-01-01" value={value} onChange={setValue} />;
    }
    render(<Harness />);
    const days = ["10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"];

    const samples: number[] = [];
    for (let i = 0; i < RUNS; i++) {
      const label = days[i % days.length]!;
      const button = screen.getByText(label, { selector: "span" }).closest("button")!;
      const start = performance.now();
      act(() => {
        fireEvent.click(button);
      });
      samples.push(performance.now() - start);
    }
    const ms = median(samples);
    log("DatePicker selection re-render", ms);
    expect(ms).toBeLessThan(250);
  });

  it("re-renders a 48-slot TimeGrid on selection change (memoized controls)", () => {
    const data = Array.from(
      { length: 48 },
      (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`,
    );
    render(<TimeGrid data={data} />);
    const buttons = screen.getAllByRole("button");

    const samples: number[] = [];
    for (let i = 0; i < RUNS; i++) {
      const start = performance.now();
      act(() => {
        fireEvent.click(buttons[(i * 7) % buttons.length]!);
      });
      samples.push(performance.now() - start);
    }
    const ms = median(samples);
    log("TimeGrid selection re-render", ms);
    expect(ms).toBeLessThan(250);
  });
});
