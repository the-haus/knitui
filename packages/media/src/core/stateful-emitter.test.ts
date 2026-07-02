/**
 * Verifies the per-field channels added to {@link StatefulEmitter} — the
 * state-level isolation primitive. A `subscribeKeys` listener must fire ONLY when
 * one of its fields actually moves (never on an unrelated field, never on a
 * no-op), exactly once per transition even when several of its fields move at
 * once, and stop firing after unsubscribe / dispose. The coarse `change` event
 * and the granular `deriveEvents` fan-out are unaffected (covered elsewhere).
 */
import { StatefulEmitter } from "./stateful-emitter";

interface S {
  a: number;
  b: number;
  c: number;
}
interface E {
  change: S;
}

/** Minimal concrete store exposing the inherited `setState` for the test to drive. */
class Store extends StatefulEmitter<S, E> {
  constructor() {
    super({ a: 0, b: 0, c: 0 });
  }
  push(patch: Partial<S>): boolean {
    return this.setState(patch);
  }
}

describe("StatefulEmitter per-field channels", () => {
  it("notifies a field listener only when that field changes", () => {
    const s = new Store();
    const onA = jest.fn();
    s.subscribeKeys(["a"], onA);

    s.push({ b: 1 }); // unrelated field
    expect(onA).not.toHaveBeenCalled();

    s.push({ a: 1 });
    expect(onA).toHaveBeenCalledTimes(1);

    s.push({ a: 1 }); // no-op (same value) → no notify
    expect(onA).toHaveBeenCalledTimes(1);
    s.dispose();
  });

  it("fires a multi-field listener once even when several of its fields move together", () => {
    const s = new Store();
    const onAC = jest.fn();
    s.subscribeKeys(["a", "c"], onAC);

    // Both `a` and `c` move in ONE setState → the listener fires exactly once
    // (deduped across changed keys), not once per key.
    s.push({ a: 1, c: 1 });
    expect(onAC).toHaveBeenCalledTimes(1);

    // A field it doesn't read moves → no fire.
    s.push({ b: 9 });
    expect(onAC).toHaveBeenCalledTimes(1);

    // One of its fields moves → fire.
    s.push({ c: 2 });
    expect(onAC).toHaveBeenCalledTimes(2);
    s.dispose();
  });

  it("isolates field channels from each other", () => {
    const s = new Store();
    const onA = jest.fn();
    const onB = jest.fn();
    s.subscribeKeys(["a"], onA);
    s.subscribeKeys(["b"], onB);

    s.push({ a: 5 });
    expect(onA).toHaveBeenCalledTimes(1);
    expect(onB).not.toHaveBeenCalled();

    s.push({ b: 5 });
    expect(onA).toHaveBeenCalledTimes(1);
    expect(onB).toHaveBeenCalledTimes(1);
    s.dispose();
  });

  it("stops notifying after unsubscribe", () => {
    const s = new Store();
    const onA = jest.fn();
    const off = s.subscribeKeys(["a"], onA);
    s.push({ a: 1 });
    expect(onA).toHaveBeenCalledTimes(1);
    off();
    s.push({ a: 2 });
    expect(onA).toHaveBeenCalledTimes(1);
    s.dispose();
  });

  it("keeps notifying other field listeners when one throws", () => {
    const s = new Store();
    const bad = jest.fn(() => {
      throw new Error("boom");
    });
    const good = jest.fn();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    s.subscribeKeys(["a"], bad);
    s.subscribeKeys(["a"], good);
    s.push({ a: 1 });
    expect(bad).toHaveBeenCalledTimes(1);
    expect(good).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
    s.dispose();
  });

  it("drops field listeners on dispose", () => {
    const s = new Store();
    const onA = jest.fn();
    s.subscribeKeys(["a"], onA);
    s.dispose();
    s.push({ a: 1 });
    expect(onA).not.toHaveBeenCalled();
  });
});
