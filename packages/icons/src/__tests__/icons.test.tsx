/**
 * Smoke tests for @knitui/icons. Kept intentionally light: instead of importing
 * the ~6k-export barrel, we pull a single generated icon, the lazy registry, and
 * the dynamic `Icon` component directly, then render the icon to a static string
 * with `react-dom/server` (the web renderer builds a plain `<svg>`, so no jsdom /
 * react-native-svg setup is needed).
 */
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Icon } from "../Icon";
import { IconAB } from "../icons/IconAB";
import { iconRegistry } from "../registry";

describe("icon registry", () => {
  it("registers a large, non-empty set of lazy icon loaders", () => {
    const names = Object.keys(iconRegistry);
    expect(names.length).toBeGreaterThan(1000);
    for (const name of ["ab", "activity", "zzz"]) {
      expect(typeof (iconRegistry as Record<string, unknown>)[name]).toBe("function");
    }
  });
});

describe("a generated icon component", () => {
  it("is a valid React component carrying its displayName", () => {
    expect(IconAB).toBeTruthy();
    expect(["object", "function"]).toContain(typeof IconAB);
    expect((IconAB as { displayName?: string }).displayName).toBe("IconAB");
  });

  it("renders an <svg> with a <path> on the web target", () => {
    const html = renderToStaticMarkup(React.createElement(IconAB, { size: 24 }));
    expect(html).toContain("<svg");
    expect(html).toContain("<path");
    expect(html).toContain('width="24"');
  });
});

describe("the dynamic Icon component", () => {
  it("is a memoized component exported from the kit", () => {
    expect(Icon).toBeTruthy();
    expect(["object", "function"]).toContain(typeof Icon);
    expect((Icon as { displayName?: string }).displayName).toBe("Icon");
  });
});
