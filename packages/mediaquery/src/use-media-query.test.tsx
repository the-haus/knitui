import { act, renderHook } from "@testing-library/react";

import { useMediaQuery } from "./use-media-query";

type Listener = () => void;
const registry = new Map<string, { matches: boolean; listeners: Set<Listener> }>();
const calls: string[] = [];

function installMatchMedia(matchesFor: (query: string) => boolean): void {
  window.matchMedia = ((query: string) => {
    calls.push(query);
    let entry = registry.get(query);
    if (!entry) {
      entry = { matches: matchesFor(query), listeners: new Set() };
      registry.set(query, entry);
    }
    const current = entry;
    return {
      get matches() {
        return current.matches;
      },
      media: query,
      onchange: null,
      addEventListener: (_type: string, cb: Listener) => current.listeners.add(cb),
      removeEventListener: (_type: string, cb: Listener) => current.listeners.delete(cb),
      addListener: (cb: Listener) => current.listeners.add(cb),
      removeListener: (cb: Listener) => current.listeners.delete(cb),
      dispatchEvent: () => false,
    } as unknown as MediaQueryList;
  }) as typeof window.matchMedia;
}

function emit(query: string, matches: boolean): void {
  const entry = registry.get(query);
  if (!entry) return;
  entry.matches = matches;
  act(() => entry.listeners.forEach((cb) => cb()));
}

beforeEach(() => {
  registry.clear();
  calls.length = 0;
});

describe("useMediaQuery (web)", () => {
  it("reflects the matchMedia result after mount", () => {
    installMatchMedia((q) => q === "(min-width: 768px)");
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(true);
  });

  it("updates when the media query list changes", () => {
    installMatchMedia(() => false);
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(false);
    emit("(min-width: 768px)", true);
    expect(result.current).toBe(true);
  });

  it("serialises a structured descriptor before calling matchMedia", () => {
    installMatchMedia(() => true);
    renderHook(() => useMediaQuery({ minWidth: 768, orientation: "landscape" }));
    expect(calls).toContain("(min-width: 768px) and (orientation: landscape)");
  });

  it("honors initialValue on the first render", () => {
    installMatchMedia(() => true);
    const { result } = renderHook(() =>
      useMediaQuery("(min-width: 768px)", false, { getInitialValueInEffect: false }),
    );
    // getInitialValueInEffect:false reads matchMedia immediately -> true
    expect(result.current).toBe(true);
  });
});
