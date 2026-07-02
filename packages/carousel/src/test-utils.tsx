/**
 * Shared test helper. Re-exports @testing-library/react and overrides `render`
 * so every component tree is wrapped in the kit's <Provider> (Tamagui theming).
 * Import from here in *.test.tsx instead of from @testing-library/react directly
 * — the carousel's styled chrome (`Carousel.Frame`, `Carousel.Dot`, …) needs a
 * theme context to resolve tokens.
 *
 *   import { render, screen, fireEvent } from "../test-utils";
 */
import * as React from "react";

import { type RenderOptions, render as rtlRender } from "@testing-library/react";

import { Provider } from "@knitui/core";

function Wrapper({ children }: { children: React.ReactNode }) {
  return <Provider defaultColorScheme="light">{children}</Provider>;
}

function render(ui: React.ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

export * from "@testing-library/react";
export { render };
