import type { Decorator, Preview } from "@storybook/react-vite";

import { type ColorScheme, Provider } from "@knitui/core";

import { MediaProvider } from "../src/provider/MediaProvider";

// react-native-web reaches for a Node-style `global`; alias it to `globalThis`
// so it resolves in the browser.
(globalThis as { global?: typeof globalThis }).global ||= globalThis;

const withProviders: Decorator = (Story, context) => {
  const colorScheme = (context.globals.colorScheme as ColorScheme) ?? "light";
  return (
    <Provider forceColorScheme={colorScheme}>
      {/* One provider owns both shared engines and teleports the single
          <audio>/<video> into whichever player is active. */}
      <MediaProvider>
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
      </MediaProvider>
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
