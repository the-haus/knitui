/**
 * `shadowVariant` keeps its colour as the BARE theme name `dropShadowColor`
 * embedded in a static `boxShadow` recipe. v3 resolves a recipe word that is not
 * a token as a colour against the active theme (`getSplitStyles` →
 * `grammar.embeddedTokens`), on web as the theme's CSS variable and on native as
 * the raw value — so no runtime theme read is needed. This pins the web half and
 * the theme value the variable carries.
 */
import * as React from "react";

import { renderHook } from "@testing-library/react";

import { getConfig, Provider, resolveToken, styled, useTheme, View } from "@knitui/core";

import { cssRulesOf } from "../__tests__/css-rules.test.helper";
import { render, screen } from "../test-utils";
import { shadowVariant } from "./style-props";

const Shadowed = styled(View, {
  displayName: "ShadowProbe",
  variants: { shadow: shadowVariant } as const,
});

describe("shadowVariant colour resolution", () => {
  it("is a static recipe naming the theme key (no `$`, no runtime theme read)", () => {
    for (const { boxShadow } of Object.values(shadowVariant)) {
      expect(boxShadow).toMatch(/^0px \d+px \d+px 0px dropShadowColor$/);
    }
  });

  it("resolves the embedded theme name to its CSS variable on web", () => {
    render(<Shadowed testID="card" shadow="md" />);
    const rule = cssRulesOf(screen.getByTestId("card")).find((r) => r.includes("box-shadow"));
    expect(rule).toContain("box-shadow: 0px 5px 12px 0px var(--dropShadowColor)");
  });

  it('works per clause (`shadow="xs md:lg"`)', () => {
    render(<Shadowed testID="responsive" shadow="xs md:lg" />);
    const css = cssRulesOf(screen.getByTestId("responsive")).join("\n");
    expect(css).toContain("0px 1px 3px 0px var(--dropShadowColor)");
    expect(css).toMatch(/@media[^{]*\{[^}]*0px 8px 20px 0px var\(--dropShadowColor\)/);
  });

  it("the variable carries the active theme's shadow colour (light vs dark)", () => {
    const themes = (getConfig() as unknown as { themes: Record<string, Record<string, unknown>> })
      .themes;
    const wrapper = (scheme: "light" | "dark") =>
      function Wrapper({ children }: { children: React.ReactNode }) {
        return <Provider defaultColorScheme={scheme}>{children}</Provider>;
      };
    for (const scheme of ["light", "dark"] as const) {
      const { result } = renderHook(() => useTheme(), { wrapper: wrapper(scheme) });
      const resolved = resolveToken("dropShadowColor", "color", { theme: result.current });
      const expected = themes[scheme]?.dropShadowColor as { val?: string } | string | undefined;
      expect(resolved).toBe(typeof expected === "object" ? expected?.val : expected);
      expect(String(resolved)).toMatch(/^rgba\(0,0,0,0\.\d+\)$/);
    }
  });
});
