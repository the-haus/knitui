/**
 * Test helper: re-exports @testing-library/react and overrides `render` to wrap
 * the tree in the design-system <Provider> (so Tamagui themes/tokens resolve),
 * mirroring @knitui/components.
 */
import * as React from "react";

import { render as rtlRender } from "@testing-library/react";

import { Provider } from "@knitui/core";

import { MediaProvider } from "../provider/MediaProvider";

function Wrapper({ children }: { children: React.ReactNode }): React.ReactElement {
  // A fresh MediaProvider per render keeps tests isolated (each gets its own
  // single teleported `<video>`), and exercises the real provider path.
  return (
    <Provider forceColorScheme="light">
      <MediaProvider>{children}</MediaProvider>
    </Provider>
  );
}

function render(
  ui: React.ReactElement,
  options?: Parameters<typeof rtlRender>[1],
): ReturnType<typeof rtlRender> {
  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

export * from "@testing-library/react";
export { render };
