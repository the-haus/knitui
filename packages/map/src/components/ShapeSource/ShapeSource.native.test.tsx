// @vitest-environment jsdom
/**
 * The native `ShapeSource` must hand `clusterProperties` to MapLibre's native
 * `GeoJSONSource`, so a native cluster can aggregate (e.g. sum) its points'
 * properties the way a web cluster does. The upstream component is stubbed: the
 * contract under test is the props this wrapper forwards.
 */
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const received: Array<Record<string, unknown>> = [];

vi.mock("react-native", () => ({}));
vi.mock("@maplibre/maplibre-react-native", () => ({
  GeoJSONSource: (props: Record<string, unknown>) => {
    received.push(props);
    return null;
  },
}));

const { ShapeSource, toNativeClusterProperties } = await import("./ShapeSource.native");

const DATA = { type: "FeatureCollection" as const, features: [] };

describe("ShapeSource (native)", () => {
  it("forwards clusterProperties, at one identity per content", () => {
    const clusterProperties = () => ({ count: ["+", ["get", "count"]] as unknown as never });
    const { rerender } = render(
      <ShapeSource id="pins" data={DATA} cluster clusterProperties={clusterProperties()} />,
    );
    // The shorthand operator is expanded to the explicit reduce form native reads.
    expect(received.at(-1)?.clusterProperties).toEqual({
      count: [
        ["+", ["accumulated"], ["get", "count"]],
        ["get", "count"],
      ],
    });
    const first = received.at(-1)?.clusterProperties;

    // A fresh but equal inline object must not reach the native source as a change.
    rerender(<ShapeSource id="pins" data={DATA} cluster clusterProperties={clusterProperties()} />);
    expect(received.at(-1)?.clusterProperties).toBe(first);
  });

  it("omits clusterProperties when not given", () => {
    render(<ShapeSource id="plain" data={DATA} />);
    expect(received.at(-1)?.clusterProperties).toBeUndefined();
  });

  it("keeps an explicit reduce expression as it is", () => {
    const explicit = {
      total: [
        ["max", ["accumulated"], ["get", "total"]],
        ["get", "size"],
      ],
    } as never;
    expect(toNativeClusterProperties(explicit)).toEqual(explicit);
  });
});
