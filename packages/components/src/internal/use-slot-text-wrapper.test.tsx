import * as React from "react";

import { render, screen } from "../test-utils";
import { Text } from "../Text";
import { useSlotTextWrapper } from "./use-slot-text-wrapper";

describe("useSlotTextWrapper", () => {
  it("returns the base component unchanged when there are no slot props", () => {
    let captured: React.ComponentType<{ children: React.ReactNode }> | null = null;
    function Probe() {
      captured = useSlotTextWrapper(Text, undefined);
      return null;
    }
    render(<Probe />);
    expect(captured).toBe(Text);
  });

  it("keeps a STABLE wrapper identity across re-renders (no remount) while slot props are referentially stable", () => {
    // A stable slot-props reference, mirroring `slotStyles(...).get(key)` which
    // returns the same object while the caller's `styles` prop is stable.
    const slotProps = { color: "$blue10" } as const;
    const seen: React.ComponentType<{ children: React.ReactNode }>[] = [];

    function Probe({ tick }: { tick: number }) {
      const Wrapper = useSlotTextWrapper(Text, slotProps);
      seen.push(Wrapper);
      return <Wrapper>label-{tick}</Wrapper>;
    }

    const { rerender } = render(<Probe tick={0} />);
    rerender(<Probe tick={1} />);
    rerender(<Probe tick={2} />);

    // Same wrapper identity every render — this is what prevents React from
    // unmounting + remounting the wrapped text subtree each render.
    expect(seen).toHaveLength(3);
    expect(seen[1]).toBe(seen[0]);
    expect(seen[2]).toBe(seen[0]);
    // And it still renders the bound slot props + children.
    expect(screen.getByText("label-2")).toBeInTheDocument();
  });

  it("produces a NEW wrapper identity when the slot props reference changes", () => {
    const seen: React.ComponentType<{ children: React.ReactNode }>[] = [];
    function Probe({ slot }: { slot: React.ComponentProps<typeof Text> }) {
      seen.push(useSlotTextWrapper(Text, slot));
      return null;
    }
    const { rerender } = render(<Probe slot={{ color: "$blue10" }} />);
    rerender(<Probe slot={{ color: "$red10" }} />);
    expect(seen[1]).not.toBe(seen[0]);
  });
});
