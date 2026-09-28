import { act, renderHook } from "@testing-library/react";

import { announce } from "./announce";
import { canOpenURL, openAppSettings, openURL } from "./linking";
import { share } from "./share";
import { getAppState, subscribeAppState, useAppState } from "./use-app-state";
import { getViewportSize } from "./use-viewport-size";

const setVisibility = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
  document.dispatchEvent(new Event("visibilitychange"));
};

afterEach(() => {
  setVisibility("visible");
  jest.useRealTimers();
});

describe("app state (web)", () => {
  it("reads and follows page visibility", () => {
    const seen: string[] = [];
    const off = subscribeAppState((s) => seen.push(s));
    expect(getAppState()).toBe("active");
    setVisibility("hidden");
    expect(getAppState()).toBe("background");
    setVisibility("visible");
    off();
    setVisibility("hidden");
    expect(seen).toEqual(["background", "active"]);
  });

  it("reports pagehide as background exactly once", () => {
    const seen: string[] = [];
    const off = subscribeAppState((s) => seen.push(s));
    window.dispatchEvent(new Event("pagehide"));
    window.dispatchEvent(new Event("pagehide"));
    off();
    expect(seen).toEqual(["background"]);
  });

  it("useAppState re-renders on change", () => {
    const { result } = renderHook(() => useAppState());
    expect(result.current).toBe("active");
    act(() => setVisibility("hidden"));
    expect(result.current).toBe("background");
  });
});

it("getViewportSize reads the window", () => {
  expect(getViewportSize()).toEqual({ width: window.innerWidth, height: window.innerHeight });
});

describe("openURL (web)", () => {
  it("opens a detached new tab", async () => {
    const tab = { opener: window } as unknown as Window;
    const open = jest.spyOn(window, "open").mockReturnValue(tab);
    await expect(openURL("https://example.com")).resolves.toBe(true);
    expect(open).toHaveBeenCalledWith("https://example.com", "_blank");
    expect(tab.opener).toBeNull();
    open.mockRestore();
  });

  it("answers the native-only questions honestly", async () => {
    await expect(canOpenURL("https://example.com")).resolves.toBe(true);
    await expect(openAppSettings()).resolves.toBe(false);
  });
});

describe("share (web)", () => {
  afterEach(() => {
    delete (navigator as { share?: unknown }).share;
  });

  it("is unavailable without the Web Share API", async () => {
    await expect(share({ url: "https://example.com" })).resolves.toBe("unavailable");
  });

  it("maps the outcomes", async () => {
    const fn = jest.fn().mockResolvedValueOnce(undefined);
    Object.assign(navigator, { share: fn });
    await expect(share({ title: "T", message: "M", url: "U" })).resolves.toBe("shared");
    expect(fn).toHaveBeenCalledWith({ title: "T", text: "M", url: "U" });

    const abort = new Error("x");
    abort.name = "AbortError";
    fn.mockRejectedValueOnce(abort);
    await expect(share({ url: "U" })).resolves.toBe("dismissed");

    fn.mockRejectedValueOnce(new TypeError("nope"));
    await expect(share({ url: "U" })).resolves.toBe("unavailable");
  });
});

it("announce writes to one polite live region after a tick", () => {
  jest.useFakeTimers();
  announce("12 results");
  announce("12 results");
  const regions = document.querySelectorAll('[data-knitui-announcer="polite"]');
  expect(regions).toHaveLength(1);
  expect(regions[0]!.getAttribute("aria-live")).toBe("polite");
  expect(regions[0]!.textContent).toBe("");
  jest.runAllTimers();
  expect(regions[0]!.textContent).toBe("12 results");
});
