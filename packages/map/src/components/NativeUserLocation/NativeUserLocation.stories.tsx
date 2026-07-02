import type { Meta, StoryObj } from "@storybook/react-vite";

import { AMSTERDAM, STREETS_STYLE } from "../../_storybook-demo";
import { Camera } from "../Camera";
import { Map } from "../MapView";
import { NativeUserLocation } from "../NativeUserLocation";

const NATIVE_ONLY_NOTE =
  "**Native-only component.** `NativeUserLocation` renders the platform's built-in " +
  "user-location indicator on iOS and Android (the native MapLibre `LocationComponent` / " +
  "Core Location puck), with `mode` (`default` | `heading` | `course`) and " +
  "`androidPreferredFramesPerSecond`. On web it is a deliberate no-op — it renders nothing " +
  "and logs a development warning. Because Storybook runs on the web, this story produces " +
  "no visible output; it exists purely as API documentation. On real devices, mount it as a " +
  "child of `<Map>` to display the OS location dot.";

const meta = {
  title: "User Location/Native User Location",
  component: NativeUserLocation,
  parameters: {
    docs: {
      description: {
        component: NATIVE_ONLY_NOTE,
      },
    },
  },
} satisfies Meta<typeof NativeUserLocation>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Documentation: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: AMSTERDAM, zoom: 11 }} />
      <NativeUserLocation />
    </Map>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "This is a documentation-only story. On web you will see the basemap but no " +
          "location indicator, since `NativeUserLocation` is a no-op outside iOS/Android. " +
          "Run the component on a device or simulator to see the native location puck.",
      },
    },
  },
};
