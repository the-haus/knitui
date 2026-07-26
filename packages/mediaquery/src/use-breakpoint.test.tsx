import * as React from "react";

import { act, render, renderHook, screen } from "@testing-library/react";

import { MediaQueryProvider } from "./context";
import { useBreakpoint } from "./use-breakpoint";

const setWidth = (width: number): void => {
  (window as unknown as { innerWidth: number }).innerWidth = width;
  act(() => {
    window.dispatchEvent(new Event("resize"));
  });
};

describe("useBreakpoint", () => {
  it("resolves the band for the current viewport width", () => {
    // Bands (min-width): base <480, xxs 480, xs 576, sm 768, md 992, lg 1200, …
    setWidth(400);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe("base");

    setWidth(600);
    expect(result.current).toBe("xs");

    setWidth(1000);
    expect(result.current).toBe("md");
  });

  it("falls back to the provider seed width before the DOM reports one", () => {
    // Width 0 is the pre-mount / no-viewport case; the seed stands in for it.
    setWidth(0);
    const { result } = renderHook(() => useBreakpoint(), {
      wrapper: ({ children }) => (
        <MediaQueryProvider seed={{ width: 1250 }}>{children}</MediaQueryProvider>
      ),
    });
    expect(result.current).toBe("lg");
  });

  it("does NOT re-render for resizes inside the same band", () => {
    setWidth(1000);
    let renders = 0;
    function Probe() {
      renders++;
      return <span data-testid="band">{useBreakpoint()}</span>;
    }
    render(<Probe />);
    const initial = renders;
    expect(screen.getByTestId("band").textContent).toBe("md");

    // Six resize events well inside the `md` band — a window drag. None of these
    // may wake the component (the pre-store implementation re-rendered on each).
    for (const w of [1001, 1010, 1020, 1050, 1080, 1099]) setWidth(w);
    expect(renders).toBe(initial);

    // Crossing into the next band DOES re-render, exactly once.
    setWidth(1250);
    expect(renders).toBe(initial + 1);
    expect(screen.getByTestId("band").textContent).toBe("lg");
  });
});
