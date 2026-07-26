/**
 * The path builders are the only per-frame code that touches CanvasKit, so they get
 * a recording `PathBuilder` instead of the real Skia runtime: every call is captured
 * with the VALUES it was given at call time. That pins two things at once — that the
 * flat shape buffer produces exactly the ops the object-shaped shapes did, and that
 * the ONE reused rect/rrect object still hands each bar its own coordinates (the real
 * bindings copy out of it synchronously, which the mock models by snapshotting).
 */
import {
  barsInto,
  dotsInto,
  lineInto,
  mirrorInto,
  radialInto,
  shapeBufferSize,
  type VariantOptions,
  waveInto,
} from "./geometry";
import { buildFillPath, buildStrokePath } from "./paths";

type Op = [string, ...number[]];

jest.mock("@shopify/react-native-skia", () => {
  const makeBuilder = () => {
    const ops: Op[] = [];
    const builder = {
      ops,
      addRect: (r: { x: number; y: number; width: number; height: number }) => {
        ops.push(["rect", r.x, r.y, r.width, r.height]);
        return builder;
      },
      addRRect: (rr: {
        rect: { x: number; y: number; width: number; height: number };
        rx: number;
        ry: number;
      }) => {
        ops.push(["rrect", rr.rect.x, rr.rect.y, rr.rect.width, rr.rect.height, rr.rx, rr.ry]);
        return builder;
      },
      addCircle: (x: number, y: number, r: number) => {
        ops.push(["circle", x, y, r]);
        return builder;
      },
      moveTo: (x: number, y: number) => {
        ops.push(["moveTo", x, y]);
        return builder;
      },
      lineTo: (x: number, y: number) => {
        ops.push(["lineTo", x, y]);
        return builder;
      },
      close: () => {
        ops.push(["close"]);
        return builder;
      },
      detach: () => ({ ops }),
    };
    return builder;
  };
  return { Skia: { PathBuilder: { Make: makeBuilder } } };
});

/** The ops a built path recorded, or `null` for the empty-path (`""`) result. */
function opsOf(path: unknown): Op[] | null {
  return path === "" ? null : (path as { ops: Op[] }).ops;
}

const OPTS: VariantOptions = { gap: 2, radius: 2 };

describe("buildFillPath", () => {
  it("emits one rrect per bar, each with its OWN geometry from the reused object", () => {
    // bw = (10 - 2)/2 = 4, r = min(2, 2) = 2; level 1 → full height, level 0 → 1px.
    const fill = buildFillPath(barsInto([1, 0], 10, 100, OPTS));
    expect(opsOf(fill)).toEqual([
      ["rrect", 0, 0, 4, 100, 2, 2],
      ["rrect", 6, 99, 4, 1, 2, 2],
    ]);
  });

  it("mirrors bars about the vertical center", () => {
    expect(opsOf(buildFillPath(mirrorInto([1, 0], 10, 100, OPTS)))).toEqual([
      ["rrect", 0, 0, 4, 100, 2, 2],
      ["rrect", 6, 49.5, 4, 1, 2, 2],
    ]);
  });

  it("takes the cheaper addRect when the corner radius is zero", () => {
    const square: VariantOptions = { gap: 2, radius: 0 };
    expect(opsOf(buildFillPath(barsInto([1, 0], 10, 100, square)))).toEqual([
      ["rect", 0, 0, 4, 100],
      ["rect", 6, 99, 4, 1],
    ]);
  });

  it("emits a circle per dot", () => {
    expect(opsOf(buildFillPath(dotsInto([1, 0], 20, 100, OPTS)))).toEqual([
      ["circle", 5, 50, 5],
      ["circle", 15, 50, 1],
    ]);
  });

  it("closes the wave envelope and traces every point in order", () => {
    // wave([1, 0], 10, 100): top L→R then bottom R→L around mid = 50.
    expect(opsOf(buildFillPath(waveInto([1, 0], 10, 100, OPTS)))).toEqual([
      ["moveTo", 0, 0],
      ["lineTo", 10, 50],
      ["lineTo", 10, 50],
      ["lineTo", 0, 100],
      ["close"],
    ]);
  });

  it("builds NO path for stroke-only variants (never touches CanvasKit)", () => {
    expect(buildFillPath(lineInto([0, 1], 10, 100, OPTS))).toBe("");
    expect(buildFillPath(radialInto([0, 1], 100, 100, OPTS))).toBe("");
  });

  it("builds no path for an empty buffer", () => {
    expect(buildFillPath(new Float64Array(shapeBufferSize(4)))).toBe("");
    expect(buildFillPath(barsInto([], 100, 100, OPTS))).toBe("");
  });
});

describe("buildStrokePath", () => {
  it("traces an open polyline without closing it", () => {
    expect(opsOf(buildStrokePath(lineInto([0, 1], 10, 100, OPTS)))).toEqual([
      ["moveTo", 0, 100],
      ["lineTo", 10, 0],
    ]);
  });

  it("emits one moveTo/lineTo pair per radial spoke", () => {
    const ops = opsOf(buildStrokePath(radialInto([0, 0, 0, 0], 100, 100, OPTS)))!;
    expect(ops).toHaveLength(8);
    expect(ops.filter((op) => op[0] === "moveTo")).toHaveLength(4);
    expect(ops.filter((op) => op[0] === "lineTo")).toHaveLength(4);
    expect(ops.some((op) => op[0] === "close")).toBe(false);
  });

  it("builds NO path for fill-only variants", () => {
    expect(buildStrokePath(barsInto([1, 0], 10, 100, OPTS))).toBe("");
    expect(buildStrokePath(mirrorInto([1, 0], 10, 100, OPTS))).toBe("");
    expect(buildStrokePath(dotsInto([1, 0], 20, 100, OPTS))).toBe("");
    expect(buildStrokePath(waveInto([1, 0], 10, 100, OPTS))).toBe(""); // closed → fill
  });

  it("stops at the terminator when a reused buffer holds a longer previous frame", () => {
    const buffer = new Float64Array(shapeBufferSize(8));
    buildStrokePath(radialInto([1, 1, 1, 1, 1, 1, 1, 1], 100, 100, OPTS, buffer));
    const ops = opsOf(buildStrokePath(radialInto([1, 1], 100, 100, OPTS, buffer)))!;
    expect(ops).toHaveLength(4); // 2 spokes, not 8
  });
});
