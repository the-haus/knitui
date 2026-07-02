/**
 * Tests for the marker-slot helper (`./slots`): slot detection by reference,
 * default/positional pooling, fragment flattening, undefined-safety, and
 * dev-only warnings for duplicates / foreign slots / missing-required.
 */
import * as React from "react";

import { createSlot, defineSlots, type SlotBag } from "./slots";

const Demo = defineSlots({
  Left: createSlot<"Left">("Left"),
  Label: createSlot<"Label">("Label"),
  Right: createSlot<"Right">("Right"),
});

// A slot from a *different* component (foreign-slot warning path).
const Other = createSlot<"Other">("Other");

describe("createSlot", () => {
  it("creates a marker that renders nothing", () => {
    expect(Demo.markers.Left({ children: "x" })).toBeNull();
  });

  it("carries a readable displayName", () => {
    expect(Demo.markers.Left.displayName).toBe("Slot(Left)");
  });
});

describe("defineSlots.collect", () => {
  it("detects marker slots in any order, keyed by registered names", () => {
    const bag = Demo.collect(
      <>
        <Demo.markers.Right>R</Demo.markers.Right>
        <Demo.markers.Left>L</Demo.markers.Left>
      </>,
    );
    expect(bag.Left?.children).toBe("L");
    expect(bag.Right?.children).toBe("R");
    expect(bag.Label).toBeUndefined();
  });

  it("exposes marker props (minus children) on the entry", () => {
    type WithPos = { position?: "start" | "end" };
    const Slots = defineSlots({ Media: createSlot<"Media", WithPos>("Media") });
    const bag = Slots.collect(<Slots.markers.Media position="end">icon</Slots.markers.Media>);
    expect(bag.Media?.props).toEqual({ position: "end" });
    expect(bag.Media?.children).toBe("icon");
  });

  it("pools plain children into `default` when no defaultSlot is given", () => {
    const bag = Demo.collect(<>plain text</>);
    expect(bag.default).toEqual(["plain text"]);
    expect(bag.Label).toBeUndefined();
  });

  it("folds plain children into the configured defaultSlot", () => {
    const bag = Demo.collect("plain text", { defaultSlot: "Label" });
    expect(bag.Label?.children).toEqual(["plain text"]);
    expect(bag.default).toBeUndefined();
  });

  it("keeps an explicit default-slot marker over pooled plain children", () => {
    const bag = Demo.collect(
      <>
        <Demo.markers.Label>explicit</Demo.markers.Label>
        loose text
      </>,
      { defaultSlot: "Label" },
    );
    expect(bag.Label?.children).toBe("explicit");
    expect(bag.default).toEqual(["loose text"]);
  });

  it("flattens one level of fragments", () => {
    const bag = Demo.collect(
      <>
        <>
          <Demo.markers.Left>L</Demo.markers.Left>
        </>
      </>,
    );
    expect(bag.Left?.children).toBe("L");
  });

  it("ignores null, undefined, and booleans", () => {
    const bag = Demo.collect(
      <>
        {null}
        {undefined}
        {false}
        {true}
      </>,
      { defaultSlot: "Label" },
    );
    expect(bag.Label).toBeUndefined();
    expect(bag.default).toBeUndefined();
  });

  it("is safe for undefined children", () => {
    const bag = Demo.collect(undefined);
    expect(bag.Left).toBeUndefined();
    expect(bag.default).toBeUndefined();
  });

  it("resolves aliases onto the canonical key", () => {
    const Alt = createSlot<"Alt">("Alt");
    const bag = Demo.collect(<Alt>aliased</Alt>, { aliases: { Left: [Alt] } });
    expect(bag.Left?.children).toBe("aliased");
  });
});

describe("dev warnings", () => {
  const original = process.env.NODE_ENV;
  let spy: jest.SpyInstance;
  beforeEach(() => {
    process.env.NODE_ENV = "development";
    spy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
  });
  afterEach(() => {
    process.env.NODE_ENV = original;
    spy.mockRestore();
  });

  it("warns on a duplicate slot and keeps the last", () => {
    const bag = Demo.collect(
      <>
        <Demo.markers.Left>first</Demo.markers.Left>
        <Demo.markers.Left>second</Demo.markers.Left>
      </>,
      { displayName: "Demo" },
    );
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("Duplicate"));
    expect(bag.Left?.children).toBe("second");
  });

  it("warns on a foreign slot from another component (and does not match it as a slot)", () => {
    const bag = Demo.collect(<Other>nope</Other>, { displayName: "Demo" });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("Other"));
    // It matches no registered key; the plan's collector then pools it as
    // default content rather than dropping it silently.
    expect(bag.Left).toBeUndefined();
    expect(bag.default).toHaveLength(1);
  });

  it("warns when a required slot is missing", () => {
    Demo.collect(<Demo.markers.Left>L</Demo.markers.Left>, {
      required: ["Label"],
      displayName: "Demo",
    });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("Label"));
  });

  it("does not warn in production", () => {
    process.env.NODE_ENV = "production";
    Demo.collect(
      <>
        <Demo.markers.Left>a</Demo.markers.Left>
        <Demo.markers.Left>b</Demo.markers.Left>
        <Other>x</Other>
      </>,
      { required: ["Label"], displayName: "Demo" },
    );
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("type surface", () => {
  it("keys the bag by exactly the registry keys", () => {
    const bag: SlotBag<typeof Demo.markers> = Demo.collect(undefined);
    // `bag.Left` is `SlotEntry<…> | undefined`; `default` is ReactNode.
    const left = bag.Left;
    const fallback = bag.default;
    expect(left).toBeUndefined();
    expect(fallback).toBeUndefined();
    // @ts-expect-error — `Nope` is not a registered slot key.
    void bag.Nope;
  });
});
