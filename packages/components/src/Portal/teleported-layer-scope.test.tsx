import * as React from "react";

import { render } from "../test-utils";
import {
  resolvePersistTaps,
  useRegisterTeleportedLayer,
  useTeleportedLayerScope,
} from "./teleported-layer-scope";

/** A scroller stand-in: reports its resolved persist-taps value. */
function Scroller({
  name,
  log,
  children,
}: {
  name: string;
  log: string[];
  children?: React.ReactNode;
}) {
  const scope = useTeleportedLayerScope();
  log.push(`${name}:${String(resolvePersistTaps(undefined, scope.hasOpenLayer))}`);
  return <scope.Provider value={scope.register}>{children}</scope.Provider>;
}

function Layer({ open }: { open: boolean }) {
  useRegisterTeleportedLayer(open);
  return null;
}

const last = (log: string[], name: string) =>
  [...log].reverse().find((l) => l.startsWith(`${name}:`));

describe("teleported layer scope", () => {
  it("switches every enclosing scroller to 'handled' while a layer inside is open", () => {
    const log: string[] = [];
    const tree = (open: boolean) => (
      <Scroller name="outer" log={log}>
        <Scroller name="inner" log={log}>
          <Layer open={open} />
        </Scroller>
      </Scroller>
    );
    const { rerender, unmount } = render(tree(false));
    expect(last(log, "outer")).toBe("outer:undefined");
    expect(last(log, "inner")).toBe("inner:undefined");

    rerender(tree(true));
    expect(last(log, "outer")).toBe("outer:handled");
    expect(last(log, "inner")).toBe("inner:handled");

    rerender(tree(false));
    expect(last(log, "outer")).toBe("outer:undefined");
    expect(last(log, "inner")).toBe("inner:undefined");
    unmount();
  });

  it("keeps an explicit keyboardShouldPersistTaps", () => {
    expect(resolvePersistTaps("never", true)).toBe("never");
    expect(resolvePersistTaps("always", false)).toBe("always");
    expect(resolvePersistTaps(undefined, false)).toBeUndefined();
  });

  it("is inert outside any scroller", () => {
    expect(() => render(<Layer open />)).not.toThrow();
  });
});
