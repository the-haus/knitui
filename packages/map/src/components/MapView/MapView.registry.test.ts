import { describe, expect, it } from "vitest";

import { Registry, type SourceEntry } from "./MapView.registry";

describe("Registry", () => {
  it("stores and retrieves entries by id", () => {
    const registry = new Registry<SourceEntry>();
    registry.set({ id: "src-1", type: "geojson", config: {} });

    expect(registry.get("src-1")).toEqual({ id: "src-1", type: "geojson", config: {} });
    expect(registry.has("src-1")).toBe(true);
    expect(registry.size).toBe(1);
  });

  it("updates entries with the same id", () => {
    const registry = new Registry<SourceEntry>();
    registry.set({ id: "src-1", type: "geojson", config: { data: "old" } });
    registry.set({ id: "src-1", type: "geojson", config: { data: "new" } });

    expect(registry.size).toBe(1);
    expect(registry.get("src-1")?.config).toEqual({ data: "new" });
  });

  it("deletes entries by id", () => {
    const registry = new Registry<SourceEntry>();
    registry.set({ id: "src-1", type: "geojson", config: {} });
    registry.set({ id: "src-2", type: "vector", config: {} });

    expect(registry.delete("src-1")).toBe(true);
    expect(registry.has("src-1")).toBe(false);
    expect(registry.size).toBe(1);
  });

  it("returns false when deleting a non-existent entry", () => {
    const registry = new Registry<SourceEntry>();
    expect(registry.delete("nope")).toBe(false);
  });

  it("returns undefined for non-existent get", () => {
    const registry = new Registry<SourceEntry>();
    expect(registry.get("nope")).toBeUndefined();
  });

  it("preserves insertion order in values()", () => {
    const registry = new Registry<SourceEntry>();
    registry.set({ id: "alpha", type: "geojson", config: {} });
    registry.set({ id: "beta", type: "vector", config: {} });
    registry.set({ id: "gamma", type: "raster", config: {} });

    const ids = registry.values().map((e) => e.id);
    expect(ids).toEqual(["alpha", "beta", "gamma"]);
  });

  it("clear removes all entries", () => {
    const registry = new Registry<SourceEntry>();
    registry.set({ id: "a", type: "geojson", config: {} });
    registry.set({ id: "b", type: "vector", config: {} });

    registry.clear();
    expect(registry.size).toBe(0);
    expect(registry.values()).toEqual([]);
  });

  it("maintains insertion order after update", () => {
    const registry = new Registry<SourceEntry>();
    registry.set({ id: "a", type: "geojson", config: {} });
    registry.set({ id: "b", type: "vector", config: {} });
    registry.set({ id: "a", type: "geojson", config: { updated: true } });

    // Map.set updates in place, preserving original insertion order
    const ids = registry.values().map((e) => e.id);
    expect(ids).toEqual(["a", "b"]);
  });
});
