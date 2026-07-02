import type { Preview } from "@storybook/react-vite";

/**
 * The root manager only renders its own Welcome page; every real story lives in
 * a composed package Storybook (see `main.ts` refs), each of which brings its
 * own decorators/providers. So this preview stays intentionally minimal.
 */
const preview: Preview = {
  parameters: {
    options: {
      storySort: { method: "alphabetical" },
    },
  },
};

export default preview;
