import * as React from "react";

import type { Decorator, Preview } from "@storybook/react-vite";

import { type ColorScheme, Provider } from "@knitui/core";

/**
 * Wrap every story in the design-system `Provider` (TamaguiProvider + the
 * light/dark controller) so tokens resolve, with a toolbar control to flip the
 * color scheme. Resize the Storybook viewport to watch the hooks react.
 */
const withProviders: Decorator = (Story, context) => {
  const colorScheme = (context.globals.colorScheme as ColorScheme) ?? "light";

  return (
    <Provider forceColorScheme={colorScheme}>
      <div
        style={{
          padding: 32,
          minHeight: "100vh",
          boxSizing: "border-box",
          fontFamily: "system-ui, sans-serif",
          background: colorScheme === "dark" ? "#111113" : "#ffffff",
          color: colorScheme === "dark" ? "#ededed" : "#111113",
        }}
      >
        <Story />
      </div>
    </Provider>
  );
};

const preview: Preview = {
  decorators: [withProviders],
  globalTypes: {
    colorScheme: {
      description: "Design-system color scheme",
      defaultValue: "light",
      toolbar: {
        title: "Scheme",
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
