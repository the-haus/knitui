import { readFileSync } from "node:fs";
import { join } from "node:path";

type Scale = Record<string, number>;

type Tokens = {
  scales: {
    space: Scale;
    radius: Scale;
    size: Scale;
    fontSize: Scale;
    lineHeight: Scale;
  };
  breakpoints: Scale;
  zIndex: Scale;
  motion: {
    durations: Record<string, number>;
    easings: Record<string, string>;
  };
  controlMetrics: Record<string, Record<string, string>>;
  notes: Record<string, string | undefined>;
};

let cache: Tokens | undefined;

function tokens(): Tokens {
  cache ??= JSON.parse(
    readFileSync(join(process.cwd(), "src/generated/tokens.json"), "utf8"),
  ) as Tokens;
  return cache;
}

const SCALE_LABELS: Record<keyof Tokens["scales"], { title: string; unit: string; usage: string }> =
  {
    space: { title: "space", unit: "px", usage: "padding · margin · gap" },
    size: { title: "size", unit: "px", usage: "width · height · control heights" },
    radius: { title: "radius", unit: "px", usage: "borderRadius" },
    fontSize: { title: "fontSize", unit: "px", usage: "fontSize" },
    lineHeight: { title: "lineHeight", unit: "×", usage: "multiplier applied to fontSize" },
  };

/**
 * One token scale, with a rendered swatch per step.
 *
 * Values are read from `packages/core/src/config/scales.ts` at build time, so the
 * table cannot drift from the tokens the components actually resolve.
 */
export function TokenScale({ scale }: { scale: keyof Tokens["scales"] }) {
  const data = tokens().scales[scale];
  const label = SCALE_LABELS[scale];
  const isRatio = scale === "lineHeight";

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Token</th>
            <th>Value</th>
            {isRatio ? null : <th style={{ width: "50%" }}>Scale</th>}
          </tr>
        </thead>
        <tbody>
          {Object.entries(data).map(([key, value]) => (
            <tr key={key}>
              <td>
                <code>${key}</code>
              </td>
              <td>
                {value}
                {label.unit === "px" ? "px" : label.unit}
              </td>
              {isRatio ? null : (
                <td>
                  <span
                    style={{
                      display: "block",
                      height: scale === "radius" ? 24 : 12,
                      width: Math.min(Number(value) * (scale === "fontSize" ? 8 : 6), 420),
                      background: "var(--docs-accent)",
                      borderRadius: scale === "radius" ? Number(value) : 2,
                      opacity: 0.75,
                    }}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Every scale at once, each under its own heading — for `/docs/foundations/tokens`. */
export function AllTokenScales() {
  return (
    <>
      {(Object.keys(SCALE_LABELS) as (keyof Tokens["scales"])[]).map((scale) => (
        <section key={scale}>
          <h3 id={`token-${scale}`}>
            <code>{SCALE_LABELS[scale].title}</code>
          </h3>
          <p>{SCALE_LABELS[scale].usage}</p>
          <TokenScale scale={scale} />
        </section>
      ))}
    </>
  );
}

/**
 * `controlMetrics` — the sizing table every control-shaped component derives from.
 *
 * Each cell is a token KEY, not a pixel value, which is the point: `$md` resolves
 * to `size.md` on height, `space.md` on padding, `font.md` on fontSize. The
 * resolved pixels are shown in parentheses so the ladder is legible at a glance.
 */
export function ControlMetricsTable() {
  const { controlMetrics, scales } = tokens();
  const rows = Object.entries(controlMetrics);
  const columns = [
    "height",
    "fontSize",
    "paddingHorizontal",
    "paddingHorizontalPill",
    "gap",
    "borderRadius",
  ];

  const resolve = (column: string, token: string) => {
    const key = token.replace(/^\$/, "");
    const scale =
      column === "height"
        ? scales.size
        : column === "fontSize"
          ? scales.fontSize
          : column === "borderRadius"
            ? scales.radius
            : scales.space;
    return scale[key];
  };

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>size</th>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([size, metrics]) => (
            <tr key={size}>
              <td>
                <code>{size}</code>
              </td>
              {columns.map((column) => (
                <td key={column}>
                  <code>{metrics[column]}</code>
                  <span style={{ color: "var(--docs-muted)" }}>
                    {" "}
                    {resolve(column, metrics[column] ?? "")}px
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Motion tokens: durations and easings. */
export function MotionTable() {
  const { motion } = tokens();

  return (
    <>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Duration token</th>
              <th>ms</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(motion.durations).map(([key, value]) => (
              <tr key={key}>
                <td>
                  <code>{key}</code>
                </td>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Easing token</th>
              <th>Curve</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(motion.easings).map(([key, value]) => (
              <tr key={key}>
                <td>
                  <code>{key}</code>
                </td>
                <td>
                  <code>{value}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** Breakpoints, as used by `useMedia` and `@knitui/mediaquery`. */
export function BreakpointTable() {
  const { breakpoints } = tokens();

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Breakpoint</th>
            <th>Min width</th>
            <th>Media query</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(breakpoints).map(([key, value]) => (
            <tr key={key}>
              <td>
                <code>${key}</code>
              </td>
              <td>{value}px</td>
              <td>
                <code>{`(min-width: ${value}px)`}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** zIndex layers. */
export function ZIndexTable() {
  const { zIndex } = tokens();
  const meaning: Record<string, string> = {
    0: "in-flow content",
    1: "raised surfaces — sticky headers, affixed controls",
    2: "dropdowns and popovers",
    3: "overlays and drawers",
    4: "modals",
    5: "tooltips and toasts — always on top",
  };

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Token</th>
            <th>Value</th>
            <th>Typical use</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(zIndex).map(([key, value]) => (
            <tr key={key}>
              <td>
                <code>${key}</code>
              </td>
              <td>{value}</td>
              <td>{meaning[key] ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The design rationale already written above a table in the source. */
export function SourceNote({ note }: { note: keyof Tokens["notes"] }) {
  const text = tokens().notes[note];
  if (!text) return null;
  return (
    <div className="callout callout--note">
      <span className="callout__label">From the source</span>
      <p>{text}</p>
    </div>
  );
}
