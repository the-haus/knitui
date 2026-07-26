import {
  bars,
  barsInto,
  decodeShapes,
  dots,
  dotsInto,
  encodeShapes,
  line,
  lineInto,
  mirror,
  mirrorInto,
  radial,
  radialInto,
  registerVisualizerVariant,
  resolveVariant,
  resolveVariantWriter,
  SHAPE_END,
  shapeBufferSize,
  strokeWidthOf,
  type VariantOptions,
  type VisualizerCircle,
  type VisualizerLine,
  type VisualizerRect,
  type VisualizerShape,
  type VisualizerVariant,
  visualizerVariantNames,
  type VisualizerVariantWriter,
  wave,
  waveInto,
} from "./geometry";

/**
 * Unit tests for the pure, worklet-safe variant geometry: each variant's
 * shape output, the shared empty-input guards, and the variant registry.
 * No Skia / reanimated — the `"worklet"` directive is an inert string here.
 */
const OPTS: VariantOptions = { gap: 2, radius: 2 };

describe("bars", () => {
  it("emits one bottom-anchored rect per level with gap-aware widths", () => {
    const shapes = bars([1, 0], 10, 100, OPTS) as VisualizerRect[];
    expect(shapes).toHaveLength(2);
    // bw = (10 - gap*(n-1))/n = (10-2)/2 = 4.
    expect(shapes[0]).toMatchObject({ kind: "rect", x: 0, y: 0, w: 4, h: 100, r: 2 });
    // Second bar: x = i*(bw+gap) = 6; a 0 level floors the height to 1px.
    expect(shapes[1]).toMatchObject({ kind: "rect", x: 6, w: 4, h: 1, y: 99 });
  });

  it("clamps levels above 1 and corner radius to half the bar width", () => {
    const [bar] = bars([5], 3, 100, { gap: 2, radius: 50 }) as VisualizerRect[];
    expect(bar.h).toBe(100); // clamped to height, not 5×
    expect(bar.r).toBe(bar.w / 2); // radius capped at bw/2
  });
});

describe("mirror", () => {
  it("centers each bar about the vertical middle", () => {
    const shapes = mirror([1, 0], 10, 100, OPTS) as VisualizerRect[];
    expect(shapes[0]).toMatchObject({ y: 0, h: 100 }); // full height ⇒ y=0
    expect(shapes[1]).toMatchObject({ h: 1, y: 49.5 }); // (100-1)/2
  });
});

describe("dots", () => {
  it("emits a centered circle per level whose radius tracks the level", () => {
    const shapes = dots([1, 0], 20, 100, OPTS) as VisualizerCircle[];
    // step = width/n = 10; maxR = min(step/2, height/2) = 5.
    expect(shapes[0]).toMatchObject({ kind: "circle", x: 5, y: 50, r: 5 });
    expect(shapes[1]).toMatchObject({ x: 15, y: 50, r: 1 }); // min radius 1
  });
});

describe("line", () => {
  it("emits a single open polyline tracing each level", () => {
    const [shape] = line([0, 1], 10, 100, OPTS) as VisualizerLine[];
    expect(shape).toMatchObject({ kind: "line", closed: false, strokeWidth: 2 });
    // step = width/(n-1) = 10. y = height - level*height.
    expect(shape.points).toEqual([0, 100, 10, 0]);
  });
});

describe("wave", () => {
  it("emits a closed, mirrored envelope with 4·n points", () => {
    const [shape] = wave([1, 0], 10, 100, OPTS) as VisualizerLine[];
    expect(shape).toMatchObject({ kind: "line", closed: true, strokeWidth: 0 });
    expect(shape.points).toHaveLength(8);
    // top L→R then bottom R→L, around mid=50.
    expect(shape.points).toEqual([0, 0, 10, 50, 10, 50, 0, 100]);
  });
});

describe("radial", () => {
  it("emits one spoke per level as an open 2-point line", () => {
    const shapes = radial([0, 0, 0, 0], 100, 100, OPTS) as VisualizerLine[];
    expect(shapes).toHaveLength(4);
    shapes.forEach((s) => {
      expect(s.kind).toBe("line");
      expect(s.closed).toBe(false);
      expect(s.points).toHaveLength(4);
    });
  });
});

describe("empty / degenerate input guards", () => {
  it("returns [] for empty levels", () => {
    for (const v of [bars, mirror, dots, line, wave, radial]) {
      expect(v([], 100, 100, OPTS)).toEqual([]);
    }
  });

  it("returns [] for a zero-width canvas", () => {
    for (const v of [bars, mirror, dots, line, wave, radial]) {
      expect(v([1, 1], 0, 100, OPTS)).toEqual([]);
    }
  });
});

describe("flat shape buffer", () => {
  const WRITERS: Array<[string, VisualizerVariantWriter, VisualizerVariant]> = [
    ["bars", barsInto, bars],
    ["mirror", mirrorInto, mirror],
    ["dots", dotsInto, dots],
    ["line", lineInto, line],
    ["wave", waveInto, wave],
    ["radial", radialInto, radial],
  ];

  it("decodes to exactly the object-form shapes, across a size/level matrix", () => {
    // The correctness bar for the renderer switching to the flat buffer: identical
    // numbers, identical order. `Float64Array` round-trips doubles exactly, so this
    // is `toEqual`, not `toBeCloseTo`.
    const levelSets = [[0], [1, 0, 0.5], [0.25, 0.75], [0, 0.1, 0.9, 1, 0.33, 0.66]];
    for (const [name, writer, variant] of WRITERS) {
      for (const levels of levelSets) {
        for (const [w, h] of [
          [100, 48],
          [7, 3],
          [640, 200],
        ]) {
          for (const opts of [
            { gap: 2, radius: 2 },
            { gap: 0, radius: 0 },
            { gap: 6, radius: 30 },
          ]) {
            expect({ name, shapes: decodeShapes(writer(levels, w, h, opts)) }).toEqual({
              name,
              shapes: variant(levels, w, h, opts),
            });
          }
        }
      }
    }
  });

  it("reuses a caller-owned buffer and never leaks stale records past the terminator", () => {
    // The whole point: the renderer hands the same buffer back every frame. A frame
    // with FEWER shapes must not resurrect the previous frame's tail.
    const buffer = new Float64Array(shapeBufferSize(8));
    const opts: VariantOptions = { gap: 2, radius: 2 };

    const many = barsInto([1, 1, 1, 1, 1, 1, 1, 1], 100, 50, opts, buffer);
    expect(many).toBe(buffer); // no allocation
    expect(decodeShapes(many)).toHaveLength(8);

    const few = barsInto([1, 1], 100, 50, opts, buffer);
    expect(few).toBe(buffer);
    expect(decodeShapes(few)).toEqual(bars([1, 1], 100, 50, opts));

    const none = barsInto([], 100, 50, opts, buffer);
    expect(none[0]).toBe(SHAPE_END);
    expect(decodeShapes(none)).toEqual([]);
  });

  it("grows past a buffer that is too small, leaving the caller's untouched", () => {
    const tiny = new Float64Array(3);
    const grown = radialInto([1, 1, 1, 1], 100, 100, { gap: 2, radius: 2 }, tiny);
    expect(grown).not.toBe(tiny);
    expect(decodeShapes(grown)).toHaveLength(4);
    expect([...tiny]).toEqual([0, 0, 0]);
  });

  it("sizes shapeBufferSize for the worst-case built-in (radial)", () => {
    for (const count of [1, 4, 48, 256]) {
      const buffer = new Float64Array(shapeBufferSize(count));
      const levels = new Array<number>(count).fill(1);
      for (const [, writer] of WRITERS) {
        expect(writer(levels, 300, 120, { gap: 2, radius: 2 }, buffer)).toBe(buffer);
      }
    }
  });

  it("round-trips object shapes through encodeShapes (the foreign-variant shim)", () => {
    const shapes: VisualizerShape[] = [
      { kind: "rect", x: 1, y: 2, w: 3, h: 4, r: 0.5 },
      { kind: "circle", x: 5, y: 6, r: 7 },
      { kind: "line", points: [0, 1, 2, 3, 4, 5], closed: true, strokeWidth: 0 },
      { kind: "line", points: [8, 9, 10, 11], closed: false, strokeWidth: 2.5 },
    ];
    expect(decodeShapes(encodeShapes(shapes))).toEqual(shapes);
  });

  it("reads the first open line's stroke width out of the buffer", () => {
    const opts: VariantOptions = { gap: 2, radius: 3 };
    expect(strokeWidthOf(lineInto([0, 1], 100, 50, opts))).toBe(3);
    expect(strokeWidthOf(radialInto([0, 1], 100, 100, opts))).toBeGreaterThan(0);
    expect(strokeWidthOf(waveInto([0, 1], 100, 50, opts))).toBe(0); // closed → fill
    expect(strokeWidthOf(barsInto([0, 1], 100, 50, opts))).toBe(0);
    expect(strokeWidthOf(dotsInto([0, 1], 100, 50, opts))).toBe(0);
  });
});

describe("resolveVariantWriter", () => {
  const OPTS2: VariantOptions = { gap: 2, radius: 2 };

  it("maps built-ins (by name and by reference) to their allocation-free writers", () => {
    const buffer = new Float64Array(shapeBufferSize(4));
    for (const variant of ["bars", "mirror", "wave", "line", "dots", "radial"] as const) {
      expect(resolveVariantWriter(variant)([1, 0.5, 0, 1], 100, 50, OPTS2, buffer)).toBe(buffer);
    }
    expect(resolveVariantWriter(radial)([1, 0.5], 100, 50, OPTS2, buffer)).toBe(buffer);
    expect(resolveVariantWriter(undefined)).toBe(resolveVariantWriter("bars"));
  });

  it("shims a foreign object-shaped variant unchanged", () => {
    const custom: VisualizerVariant = (levels, width, height) => [
      { kind: "rect", x: 0, y: 0, w: width, h: height * levels.length, r: 1 },
      { kind: "circle", x: 1, y: 2, r: 3 },
    ];
    registerVisualizerVariant("shim-test", custom);
    const writer = resolveVariantWriter("shim-test");
    expect(decodeShapes(writer([0.5, 0.5], 10, 20, OPTS2))).toEqual(
      custom([0.5, 0.5], 10, 20, OPTS2),
    );
    // Foreign variants also accept the non-array level views the renderer may pass.
    expect(decodeShapes(writer(new Float64Array([0.5, 0.5]), 10, 20, OPTS2))).toEqual(
      custom([0.5, 0.5], 10, 20, OPTS2),
    );
  });
});

describe("resolveVariant / registry", () => {
  it("resolves built-in names to their functions", () => {
    expect(resolveVariant("bars")).toBe(bars);
    expect(resolveVariant("radial")).toBe(radial);
  });

  it("passes a function variant straight through", () => {
    const custom = bars;
    expect(resolveVariant(custom)).toBe(custom);
  });

  it("falls back to bars for unknown names and undefined", () => {
    expect(resolveVariant("nope")).toBe(bars);
    expect(resolveVariant(undefined)).toBe(bars);
  });

  it("resolves variants registered via registerVisualizerVariant", () => {
    const custom = (_l: number[]) => [];
    registerVisualizerVariant("test-variant", custom);
    expect(resolveVariant("test-variant")).toBe(custom);
    expect(visualizerVariantNames()).toEqual(expect.arrayContaining(["bars", "test-variant"]));
  });
});
