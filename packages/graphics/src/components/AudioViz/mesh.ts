/**
 * Gradient-mesh visualizer geometry: the SkSL color field plus the pure,
 * worklet-safe reducer that turns a row of audio levels (`0..1`) + a clock into
 * the shader's uniforms. The sibling of `geometry.ts` for the `AudioMesh`
 * renderer.
 *
 * Unlike the shape variants in `geometry.ts` (rect/line/circle → one `SkPath`
 * painted with a single gradient), a flowing *mesh gradient* needs per-region
 * colour interpolation across the whole canvas — so it is NOT a `VisualizerShape`
 * and is NOT registered with `registerVisualizerVariant`. Instead a Skia
 * `RuntimeEffect` (SkSL) fills the canvas: `N` soft colour "blobs" are blended
 * with a gaussian falloff, each blob swelling with one band of the spectrum and
 * drifting on a slow orbit so the field stays alive even at silence.
 *
 * This file is pure data — no Skia, no React, no platform imports. The renderer
 * (`AudioMesh.tsx`) compiles `MESH_GRADIENT_SKSL` and feeds the object built by
 * `buildMeshUniforms` (a `"worklet"`) straight to `<Shader uniforms>`.
 */

/**
 * Max colour control points the shader declares. SkSL uniform arrays are
 * fixed-length, so `buildMeshUniforms` ALWAYS emits arrays of this length
 * (inactive points are masked out by `u_count`); only the first `points` are
 * live. Bumping this requires editing the array sizes in `MESH_GRADIENT_SKSL`.
 */
export const MAX_MESH_POINTS = 6;
/** Default number of active colour control points. */
export const DEFAULT_MESH_POINTS = 5;
/** Default base blob radius (in normalized 0..1 canvas units) before audio swell. */
export const DEFAULT_MESH_SOFTNESS = 0.45;
/** Default drift rate multiplier for the idle orbit. */
export const DEFAULT_MESH_SPEED = 1;
/** Default palette spread across the control points (cyan → indigo → pink). */
export const DEFAULT_MESH_PALETTE = ["#22d3ee", "#6366f1", "#ec4899"] as const;

/**
 * The mesh-gradient fragment shader. Each of up to `MAX_MESH_POINTS` control
 * points contributes a gaussian-weighted colour; the weights are normalized so
 * the field is a smooth blend (a "mesh gradient"). `u_count` masks the inactive
 * tail, and the x distance is aspect-corrected so blobs stay round on wide
 * canvases.
 */
export const MESH_GRADIENT_SKSL = `
uniform float2 u_resolution;
uniform float  u_count;
uniform float  u_softness;
uniform float2 u_points[${MAX_MESH_POINTS}];
uniform float  u_intensity[${MAX_MESH_POINTS}];
uniform float3 u_colors[${MAX_MESH_POINTS}];

half4 main(float2 fragcoord) {
  float2 uv = fragcoord / u_resolution;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  float3 acc = float3(0.0);
  float wsum = 0.0;
  for (int i = 0; i < ${MAX_MESH_POINTS}; i++) {
    float active = step(float(i) + 0.5, u_count);
    float2 d = uv - u_points[i];
    d.x *= aspect;
    float dist2 = dot(d, d);
    float radius = max(u_softness + u_intensity[i] * 0.45, 0.02);
    float w = exp(-dist2 / (radius * radius)) * active;
    acc += u_colors[i] * w * (0.35 + u_intensity[i]);
    wsum += w;
  }
  acc = acc / max(wsum, 0.0001);
  return half4(acc, 1.0);
}
`;

/**
 * The flat uniform values handed to `<Shader uniforms>`. Arrays are full-length.
 * A `type` (not `interface`) so it carries an implicit index signature and is
 * assignable to Skia's `Uniforms` record.
 */
export type MeshUniforms = {
  u_resolution: [number, number];
  u_count: number;
  u_softness: number;
  /** `MAX_MESH_POINTS` × `[x, y]` flattened, normalized 0..1. */
  u_points: number[];
  /** `MAX_MESH_POINTS` intensities, 0..1. */
  u_intensity: number[];
  /** `MAX_MESH_POINTS` × `[r, g, b]` flattened, 0..1. */
  u_colors: number[];
};

/** Tunables for the mesh reducer (resolved by the renderer; all required here). */
export interface MeshOptions {
  /** Active control points, `1..MAX_MESH_POINTS`. */
  points: number;
  /** Base blob radius (normalized) before audio swell. */
  softness: number;
  /**
   * Per-point colours: `points × [r, g, b]` flattened, each channel 0..1. Resolved
   * from the palette by `resolveMeshColors` on the JS side (hex parsing can't run
   * in a worklet), then padded out in the worklet.
   */
  colors: number[];
}

function clamp01(v: number): number {
  "worklet";
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/**
 * Reduce eased `levels` + a `time` (seconds) into the shader uniforms. Pure and
 * `"worklet"`-safe — called from the renderer's `useDerivedValue`. The control
 * points orbit slowly (so the field drifts even when silent) and each one's
 * intensity is the mean of one contiguous band of the spectrum, so low bands
 * pulse one blob and high bands another. Arrays are always emitted at
 * `MAX_MESH_POINTS` length (the SkSL array size); the inactive tail is zeroed and
 * masked by `u_count`.
 */
export function buildMeshUniforms(
  levels: number[],
  width: number,
  height: number,
  time: number,
  opts: MeshOptions,
): MeshUniforms {
  "worklet";
  const points = Math.max(1, Math.min(MAX_MESH_POINTS, Math.round(opts.points)));
  const u_points = new Array<number>(MAX_MESH_POINTS * 2).fill(0);
  const u_intensity = new Array<number>(MAX_MESH_POINTS).fill(0);
  const u_colors = new Array<number>(MAX_MESH_POINTS * 3).fill(0);

  const n = levels.length;
  const TWO_PI = Math.PI * 2;
  for (let i = 0; i < points; i++) {
    // Mean level of this point's contiguous band of the spectrum → blob energy.
    let intensity = 0;
    if (n > 0) {
      const lo = Math.floor((i * n) / points);
      const hi = Math.max(lo + 1, Math.floor(((i + 1) * n) / points));
      let sum = 0;
      for (let k = lo; k < hi && k < n; k++) sum += levels[k];
      intensity = clamp01(sum / (hi - lo));
    }
    u_intensity[i] = intensity;

    // Slow orbit around the centre; radius breathes a touch so blobs never sit
    // perfectly still. Energy nudges the blob toward the centre (so loud bands
    // bloom into the middle of the field).
    const angle = (i / points) * TWO_PI + time * 0.15 * (1 + (i % 2) * 0.4);
    const orbit = (0.3 + 0.06 * Math.sin(time * 0.4 + i)) * (1 - intensity * 0.25);
    u_points[i * 2] = 0.5 + Math.cos(angle) * orbit;
    u_points[i * 2 + 1] = 0.5 + Math.sin(angle) * orbit;

    // Colours: cycle the resolved per-point palette if fewer were supplied.
    const c = opts.colors.length >= 3 ? (i % (opts.colors.length / 3)) * 3 : 0;
    u_colors[i * 3] = opts.colors[c] ?? 0.5;
    u_colors[i * 3 + 1] = opts.colors[c + 1] ?? 0.5;
    u_colors[i * 3 + 2] = opts.colors[c + 2] ?? 0.5;
  }

  return {
    // Clamp ≥1 so the shader's `fragcoord / u_resolution` never divides by zero in
    // the transient frame before `<Canvas onSize>` reports the real size.
    u_resolution: [Math.max(width, 1), Math.max(height, 1)],
    u_count: points,
    u_softness: opts.softness,
    u_points,
    u_intensity,
    u_colors,
  };
}

/** Parse `#rgb` / `#rrggbb` / `#rrggbbaa` → `[r, g, b]` in 0..1 (alpha ignored). */
function parseHexColor(hex: string): [number, number, number] {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  if (h.length !== 6 && h.length !== 8) return [0.5, 0.5, 0.5];
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return [0.5, 0.5, 0.5];
  return [r / 255, g / 255, b / 255];
}

/**
 * Spread a hex `palette` across `points` control points, interpolating between
 * stops so each blob gets a distinct colour even when the palette is short.
 * Returns `points × [r, g, b]` flattened, each channel 0..1. Pure JS (hex parsing
 * isn't worklet-safe), so the renderer calls it once in a `useMemo`.
 */
export function resolveMeshColors(palette: readonly string[], points: number): number[] {
  const stops = (palette.length > 0 ? palette : DEFAULT_MESH_PALETTE).map(parseHexColor);
  const p = Math.max(1, Math.min(MAX_MESH_POINTS, Math.round(points)));
  const out = new Array<number>(p * 3);
  if (stops.length === 1) {
    for (let i = 0; i < p; i++) {
      out[i * 3] = stops[0][0];
      out[i * 3 + 1] = stops[0][1];
      out[i * 3 + 2] = stops[0][2];
    }
    return out;
  }
  for (let i = 0; i < p; i++) {
    // Map point i to a position along the palette and lerp between two stops.
    const t = p > 1 ? (i / (p - 1)) * (stops.length - 1) : 0;
    const lo = Math.min(Math.floor(t), stops.length - 2);
    const f = t - lo;
    const a = stops[lo];
    const b = stops[lo + 1];
    out[i * 3] = a[0] + (b[0] - a[0]) * f;
    out[i * 3 + 1] = a[1] + (b[1] - a[1]) * f;
    out[i * 3 + 2] = a[2] + (b[2] - a[2]) * f;
  }
  return out;
}
