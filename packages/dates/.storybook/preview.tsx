import * as React from "react";

import type { Decorator, Preview } from "@storybook/react-vite";

import { type ColorScheme, Provider } from "@knitui/core";

import { DatesProvider } from "../src/DatesProvider";

/**
 * Wrap every story in the design-system `Provider` (TamaguiProvider + the
 * light/dark controller) and a `DatesProvider` so locale / first-day-of-week is
 * consistent across the catalogue. A global toolbar control drives the color
 * scheme so stories can be inspected on both backgrounds.
 *
 * `DatesProvider` is optional for the components (they fall back to sane
 * defaults), but mounting it here documents how an app would set the locale once
 * at the root.
 */
const withProviders: Decorator = (Story, context) => {
  const colorScheme = (context.globals.colorScheme as ColorScheme) ?? "light";

  return (
    <Provider forceColorScheme={colorScheme}>
      <DatesProvider settings={{ locale: "en", firstDayOfWeek: 1 }}>
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
      </DatesProvider>
    </Provider>
  );
};

const preview: Preview = {
  decorators: [withProviders],
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
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
