/**
 * v3 styling of the playlist track list: rows are the static `AudioTrackRow`
 * frame with an `active` variant (no inline condition objects), the `trackRow` /
 * `trackList` slots reach their parts, and slot styles passed AFTER the variant
 * win over it (v3 applies variants and props in call-site order).
 */
import * as React from "react";

import { declarationsOf } from "../../__tests__/css-rules.test.helper";
import { fireEvent, render, screen } from "../test-utils";
import { AudioPlaylist } from "./AudioPlaylist";

const SOURCES = [
  { uri: "https://example.com/a.mp3", name: "Track A" },
  { uri: "https://example.com/b.mp3", name: "Track B" },
];

const rowOf = (label: string): HTMLElement =>
  screen.getByText(label).closest('[role="button"]') as HTMLElement;

describe("<AudioPlaylist> v3 track rows", () => {
  it("fills the active row (also under hover) and only tints inactive rows on hover", () => {
    render(<AudioPlaylist sources={SOURCES} />);
    const active = declarationsOf(rowOf("Track A"));
    expect(active).toContain("background-color: var(--color5)");
    expect(active.filter((d) => d === "background-color: var(--color4)")).toEqual([]);
    expect(rowOf("Track A")).toHaveAttribute("aria-current", "true");
    const idle = declarationsOf(rowOf("Track B"));
    expect(idle).toContain("background-color: var(--color4)");
    expect(idle).not.toContain("background-color: var(--color5)");
    expect(rowOf("Track B")).not.toHaveAttribute("aria-current");
  });

  it("applies the trackRow and trackList slots; the slot wins over the active variant", () => {
    render(
      <AudioPlaylist
        sources={SOURCES}
        styles={{
          trackList: { testID: "list" },
          trackRow: { borderRadius: "lg", backgroundColor: "blue3" },
        }}
      />,
    );
    expect(screen.getByTestId("list")).toContainElement(rowOf("Track A"));
    const active = declarationsOf(rowOf("Track A"));
    expect(active).toContain("border-radius: var(--t-radius-lg)");
    expect(active).toContain("background-color: var(--blue3)");
    expect(active).not.toContain("background-color: var(--color5)");
  });

  it("moves the active row when a track is pressed", () => {
    render(<AudioPlaylist sources={SOURCES} />);
    fireEvent.click(rowOf("Track B"));
    expect(rowOf("Track B")).toHaveAttribute("aria-current", "true");
    expect(declarationsOf(rowOf("Track B"))).toContain("background-color: var(--color5)");
  });
});
