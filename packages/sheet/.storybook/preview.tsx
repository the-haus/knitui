import * as React from "react";

import type { Decorator, Preview } from "@storybook/react-vite";

import { type ColorScheme, Provider } from "@knitui/core";

/**
 * Wrap every story in the design-system `Provider` (TamaguiProvider + the
 * light/dark controller + the Portal host the modal sheet teleports into). A
 * global toolbar control drives the color scheme. Mirrors @knitui/components.
 */
const withProvider: Decorator = (Story, context) => {
  const colorScheme = (context.globals.colorScheme as ColorScheme) ?? "light";

  return (
    <Provider forceColorScheme={colorScheme}>
      <div
        style={{
          padding: 32,
          minHeight: "100vh",
          boxSizing: "border-box",
          background: colorScheme === "dark" ? "#111113" : "#ffffff",
        }}
      >
        <Story />
      </div>
    </Provider>
  );
};

const preview: Preview = {
  decorators: [withProvider],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  globalTypes: {
    colorScheme: {
      description: "Design-system color scheme",
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
