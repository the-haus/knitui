import {
  buildMeshUniforms,
  DEFAULT_MESH_PALETTE,
  MAX_MESH_POINTS,
  type MeshOptions,
  resolveMeshColors,
} from "./mesh";

/**
 * Unit tests for the pure, worklet-safe mesh reducer + colour helper. No Skia /
 * reanimated — the `"worklet"` directive is an inert string here. The renderer
 * (`AudioMesh.tsx`) is exercised in Storybook.
 */
function opts(points: number, overrides: Partial<MeshOptions> = {}): MeshOptions {
  return {
    points,
    softness: 0.45,
    colors: resolveMeshColors(DEFAULT_MESH_PALETTE, points),
    ...overrides,
  };
}

describe("resolveMeshColors", () => {
  it("returns one rgb triple per point, each channel in 0..1", () => {
    const rgb = resolveMeshColors(["#000000", "#ffffff"], 3);
    expect(rgb).toHaveLength(9);
    for (const c of rgb) expect(c).toBeGreaterThanOrEqual(0);
    for (const c of rgb) expect(c).toBeLessThanOrEqual(1);
    // First point = first stop (black), last = last stop (white).
    expect(rgb.slice(0, 3)).toEqual([0, 0, 0]);
    expect(rgb.slice(6, 9)).toEqual([1, 1, 1]);
    // Middle point interpolates halfway to grey.
    expect(rgb[3]).toBeCloseTo(0.5, 2);
  });

  it("parses #rgb shorthand and falls back to grey on garbage", () => {
    expect(resolveMeshColors(["#f00"], 1)).toEqual([1, 0, 0]);
    expect(resolveMeshColors(["not-a-color"], 1)).toEqual([0.5, 0.5, 0.5]);
  });

  it("repeats a single-stop palette across every point", () => {
    const rgb = resolveMeshColors(["#3366cc"], 4);
    expect(rgb).toHaveLength(12);
    expect(rgb.slice(0, 3)).toEqual(rgb.slice(9, 12));
  });

  it("clamps the point count to MAX_MESH_POINTS", () => {
    expect(resolveMeshColors(DEFAULT_MESH_PALETTE, 99)).toHaveLength(MAX_MESH_POINTS * 3);
  });
});

describe("buildMeshUniforms", () => {
  it("emits fixed-length arrays sized to MAX_MESH_POINTS regardless of active points", () => {
    const u = buildMeshUniforms([0.5, 0.5, 0.5], 400, 200, 0, opts(3));
    expect(u.u_points).toHaveLength(MAX_MESH_POINTS * 2);
    expect(u.u_intensity).toHaveLength(MAX_MESH_POINTS);
    expect(u.u_colors).toHaveLength(MAX_MESH_POINTS * 3);
    expect(u.u_count).toBe(3);
    expect(u.u_resolution).toEqual([400, 200]);
  });

  it("is deterministic for a fixed time (pure)", () => {
    const levels = [0.2, 0.8, 0.4, 0.6];
    const a = buildMeshUniforms(levels, 300, 150, 1.5, opts(4));
    const b = buildMeshUniforms(levels, 300, 150, 1.5, opts(4));
    expect(a).toEqual(b);
  });

  it("maps contiguous bands to per-point intensity, clamped 0..1", () => {
    // Two points over four levels → point 0 = mean(levels[0..1]), point 1 = mean(levels[2..3]).
    const u = buildMeshUniforms([1, 1, 0, 0], 100, 100, 0, opts(2));
    expect(u.u_intensity[0]).toBeCloseTo(1, 5);
    expect(u.u_intensity[1]).toBeCloseTo(0, 5);
    // Inactive tail is zeroed.
    expect(u.u_intensity[2]).toBe(0);
  });

  it("clamps over-unity input intensity to 1", () => {
    const u = buildMeshUniforms([5, 5], 100, 100, 0, opts(1));
    expect(u.u_intensity[0]).toBe(1);
  });

  it("places active control points inside the 0..1 canvas", () => {
    const u = buildMeshUniforms([0.5, 0.5, 0.5], 400, 200, 2.2, opts(3));
    for (let i = 0; i < 3; i++) {
      expect(u.u_points[i * 2]).toBeGreaterThanOrEqual(0);
      expect(u.u_points[i * 2]).toBeLessThanOrEqual(1);
      expect(u.u_points[i * 2 + 1]).toBeGreaterThanOrEqual(0);
      expect(u.u_points[i * 2 + 1]).toBeLessThanOrEqual(1);
    }
  });

  it("degrades gracefully on empty levels and non-positive size", () => {
    const u = buildMeshUniforms([], 0, 0, 0, opts(3));
    // Resolution is clamped ≥1 so the shader never divides by zero.
    expect(u.u_resolution).toEqual([1, 1]);
    // No levels → zero intensity everywhere.
    expect(u.u_intensity.every((v) => v === 0)).toBe(true);
  });
});
