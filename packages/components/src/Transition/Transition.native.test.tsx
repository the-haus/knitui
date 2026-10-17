import * as React from "react";

import { act, render } from "../test-utils";
import { Transition } from "./Transition.native";

/**
 * Tamagui decides whether a view is animated by the PRESENCE of the `transition`
 * key and runs extra hooks for an animated one, so a child that gains the key
 * after it mounted changes its hook order (a crash on native). These pin that
 * every element the native Transition returns carries the key.
 */
describe("Transition (native)", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  /** Records the props of every render of the transition's child. */
  function recorder() {
    const seen: Record<string, unknown>[] = [];
    function Child(props: Record<string, unknown>) {
      seen.push(props);
      return null;
    }
    return { seen, Child };
  }

  it("gives a keepMounted child the transition key before it is mounted, and keeps it", () => {
    jest.useFakeTimers();
    const { seen, Child } = recorder();
    const tree = (mounted: boolean) => (
      <Transition mounted={mounted} keepMounted transition="fade" duration={40}>
        {(styles) => <Child style={styles} />}
      </Transition>
    );
    const { rerender } = render(tree(false));
    expect(seen[0]).toMatchObject({ style: { display: "none" } });

    rerender(tree(true));
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(seen.length).toBeGreaterThan(1);
    for (const props of seen) {
      expect("transition" in props).toBe(true);
      // v3: the animated-property scope rides inside the transition object.
      expect(props).not.toHaveProperty("animateOnly");
      expect((props.transition as { properties: string }).properties).toContain("opacity");
    }
    expect(seen[seen.length - 1].transition).toEqual({
      duration: 40,
      easing: "ease",
      properties: "opacity",
    });
  });

  it("leaves a transition the child set itself alone", () => {
    const { seen, Child } = recorder();
    render(
      <Transition mounted={false} keepMounted>
        {(styles) => (
          <Child style={styles} transition={{ preset: "bouncy", properties: "opacity" }} />
        )}
      </Transition>,
    );
    expect(seen[0]).toMatchObject({ transition: { preset: "bouncy", properties: "opacity" } });
    expect(seen[0]).not.toHaveProperty("animateOnly");
  });

  it("renders nothing when not mounted and not kept", () => {
    const { seen, Child } = recorder();
    render(<Transition mounted={false}>{(styles) => <Child style={styles} />}</Transition>);
    expect(seen).toHaveLength(0);
  });
});
