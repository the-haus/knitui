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

  // The case the hook previously got WRONG, and the one that actually ships: the
  // documented usage is an inline `styles={{ label: { … } }}`, so `slotProps` is a
  // fresh object every render. Keying the memo on identity meant the wrapper was a
  // new element TYPE each render and React remounted the text subtree — the exact
  // failure this hook exists to prevent, hitting only the callers who used the
  // feature. Slot props are now compared by shallow value.
  it("keeps a STABLE wrapper identity when slot props are an INLINE literal", () => {
    const seen: React.ComponentType<{ children: React.ReactNode }>[] = [];

    function Probe({ tick }: { tick: number }) {
      // New object every render, same value — the idiomatic call.
      const Wrapper = useSlotTextWrapper(Text, { color: "$blue10" });
      seen.push(Wrapper);
      return <Wrapper>label-{tick}</Wrapper>;
    }

    const { rerender } = render(<Probe tick={0} />);
    rerender(<Probe tick={1} />);
    rerender(<Probe tick={2} />);

    expect(seen).toHaveLength(3);
    expect(seen[1]).toBe(seen[0]);
    expect(seen[2]).toBe(seen[0]);
    expect(screen.getByText("label-2")).toBeInTheDocument();
  });

  it("updates in place rather than remounting when slot props are an inline literal", () => {
    function Probe({ tick }: { tick: number }) {
      const Wrapper = useSlotTextWrapper(Text, { color: "$blue10" });
      return (
        <Wrapper>
          <Text testID="leaf">{tick}</Text>
        </Wrapper>
      );
    }

    const { rerender } = render(<Probe tick={0} />);
    const first = screen.getByTestId("leaf");

    rerender(<Probe tick={1} />);

    // Same host instance ⇒ React reconciled instead of tearing the subtree down.
    expect(screen.getByTestId("leaf")).toBe(first);
  });

  it("still produces a new wrapper when an inline slot prop is added or removed", () => {
    const seen: React.ComponentType<{ children: React.ReactNode }>[] = [];
    function Probe({ withColor }: { withColor: boolean }) {
      seen.push(useSlotTextWrapper(Text, withColor ? { color: "$blue10" } : {}));
      return null;
    }
    const { rerender } = render(<Probe withColor={false} />);
    rerender(<Probe withColor />);
    expect(seen[1]).not.toBe(seen[0]);
  });
});
