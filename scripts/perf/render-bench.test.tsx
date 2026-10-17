/**
 * Web render / re-render micro-benchmark (jsdom + react-native-web), v2 vs v3.
 *
 * Run (from the repo root):
 *   node scripts/perf/run-render-bench.mjs [out.json]
 * which wraps:
 *   pnpm --dir packages/components exec jest --rootDir <repo> -c packages/components/jest.config.js \
 *     --testMatch '<repo>/scripts/perf/render-bench.test.tsx' --runInBand
 *
 * Per scenario: ITER (default 20) measured iterations after 3 warm-ups, each
 *   mount     render the tree from scratch (sync, inside act)
 *   same      re-render with identical props (memo effectiveness)
 *   change    re-render with one prop flipped on every item
 *   unmount
 * Reports the median (and p90) ms. Prints `PERF_JSON <json>` and writes
 * $PERF_OUT when set.
 */
import * as React from "react";

import { act, cleanup, render } from "@testing-library/react";

import { Button, Select, Stack, Table, TextInput } from "../../packages/components/src";

// Resolve @knitui/core exactly as the components package does (it is not
// hoisted to the repo root, and walking up from scripts/ could escape the repo).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Provider } = require(
  require.resolve("@knitui/core", {
    paths: [require("node:path").join(__dirname, "../../packages/components")],
  }),
) as typeof import("@knitui/core");

const ITER = Number(process.env.PERF_ITER ?? 20);
const WARMUP = 3;

jest.setTimeout(30 * 60_000);

type Variant = 0 | 1;
type Scenario = { name: string; count: number; Tree: React.ComponentType<{ v: Variant }> };

function Wrap({ children }: { children: React.ReactNode }) {
  return <Provider defaultColorScheme="light">{children}</Provider>;
}

const idx = (n: number) => Array.from({ length: n }, (_, i) => i);

const scenarios: Scenario[] = [
  {
    name: "Button×300",
    count: 300,
    Tree: ({ v }) => (
      <Stack>
        {idx(300).map((i) => (
          <Button key={i} variant={v ? "outline" : "filled"} size="sm">
            {`Button ${i}`}
          </Button>
        ))}
      </Stack>
    ),
  },
  {
    name: "TextInput×300",
    count: 300,
    Tree: ({ v }) => (
      <Stack>
        {idx(300).map((i) => (
          <TextInput key={i} label={`Field ${i}`} placeholder="Type here" disabled={v === 1} />
        ))}
      </Stack>
    ),
  },
  {
    name: "Select×100 (closed)",
    count: 100,
    Tree: ({ v }) => (
      <Stack>
        {idx(100).map((i) => (
          <Select
            key={i}
            data={["Alpha", "Beta", "Gamma", "Delta"]}
            placeholder={`Pick ${i}`}
            disabled={v === 1}
          />
        ))}
      </Stack>
    ),
  },
  {
    name: "Table 50×10",
    count: 500,
    Tree: ({ v }) => (
      <Table
        striped={v === 1}
        data={{
          head: idx(10).map((c) => `Col ${c}`),
          body: idx(50).map((r) => idx(10).map((c) => `r${r}c${c}`)),
        }}
      />
    ),
  },
];

// DatePicker lives in @knitui/dates; include it when importable from here.
let DatePicker: React.ComponentType<Record<string, unknown>> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  DatePicker = require("../../packages/dates/src").DatePicker;
} catch (err) {
  // eslint-disable-next-line no-console
  console.warn(`[perf] DatePicker not importable: ${String(err).slice(0, 200)}`);
}
if (DatePicker) {
  const DP = DatePicker;
  scenarios.push({
    name: "DatePicker month grid",
    count: 42,
    Tree: ({ v }) => <DP defaultDate={new Date(2026, 0, 15)} firstDayOfWeek={v ? 0 : 1} />,
  });
}

const median = (a: number[]) => {
  const s = [...a].sort((x, y) => x - y);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const p90 = (a: number[]) =>
  [...a].sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * 0.9))];
const r2 = (n: number) => Math.round(n * 100) / 100;

const results: Record<string, unknown> = {};

afterAll(() => {
  let tamagui: string | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    tamagui = require(
      require.resolve("@tamagui/core/package.json", {
        paths: [require("node:path").join(__dirname, "../../packages/components")],
      }),
    ).version;
  } catch {
    /* unknown */
  }
  const payload = { iterations: ITER, node: process.version, tamagui, results };
  // eslint-disable-next-line no-console
  console.log(`PERF_JSON ${JSON.stringify(payload)}`);
  if (process.env.PERF_OUT) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("node:fs").writeFileSync(process.env.PERF_OUT, JSON.stringify(payload, null, 2));
  }
});

for (const sc of scenarios) {
  test(sc.name, () => {
    const mount: number[] = [];
    const same: number[] = [];
    const change: number[] = [];
    const unmount: number[] = [];
    for (let it = 0; it < WARMUP + ITER; it++) {
      let t = performance.now();
      let api!: ReturnType<typeof render>;
      act(() => {
        api = render(
          <Wrap>
            <sc.Tree v={0} />
          </Wrap>,
        );
      });
      const tMount = performance.now() - t;

      t = performance.now();
      act(() => {
        api.rerender(
          <Wrap>
            <sc.Tree v={0} />
          </Wrap>,
        );
      });
      const tSame = performance.now() - t;

      t = performance.now();
      act(() => {
        api.rerender(
          <Wrap>
            <sc.Tree v={1} />
          </Wrap>,
        );
      });
      const tChange = performance.now() - t;

      t = performance.now();
      act(() => api.unmount());
      const tUnmount = performance.now() - t;
      cleanup();

      if (it >= WARMUP) {
        mount.push(tMount);
        same.push(tSame);
        change.push(tChange);
        unmount.push(tUnmount);
      }
    }
    results[sc.name] = {
      items: sc.count,
      mountMedian: r2(median(mount)),
      mountP90: r2(p90(mount)),
      rerenderSameMedian: r2(median(same)),
      rerenderSameP90: r2(p90(same)),
      rerenderChangeMedian: r2(median(change)),
      rerenderChangeP90: r2(p90(change)),
      unmountMedian: r2(median(unmount)),
    };
    expect(mount.length).toBe(ITER);
  });
}
