import * as React from "react";

import type { Decorator, Preview } from "@storybook/react-vite";

import { Flex } from "@knitui/components";
import { type ColorScheme, Provider } from "@knitui/core";

/**
 * Every story is wrapped in the design-system `Provider` (so `@knitui/components`
 * chrome themes correctly) and rendered FULL-BLEED: the frame fills the entire
 * preview canvas, and each story's top-level `<Map style={{ flex: 1 }}>` fills
 * the frame. A global toolbar control drives the color scheme.
 */
const withProvider: Decorator = (Story, context) => {
  const colorScheme = (context.globals.colorScheme as ColorScheme) ?? "light";

  return (
    <Provider forceColorScheme={colorScheme}>
      <Flex pos="absolute" inset={0} direction="column">
        <Story />
      </Flex>
    </Provider>
  );
};

const preview: Preview = {
  decorators: [withProvider],
  parameters: {
    layout: "fullscreen",
    controls: {
      matchers: {
        color: /(background|color)$/i,
      },
    },
  },
  globalTypes: {
    colorScheme: {
      description: "Color scheme",
      defaultValue: "light",
      toolbar: {
        title: "Scheme",
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
