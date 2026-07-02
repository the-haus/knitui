import type { Meta, StoryObj } from "@storybook/react-vite";

import { AMSTERDAM, STREETS_STYLE } from "../../_storybook-demo";
import { Camera } from "../Camera";
import { Map } from "../MapView";
import { UserLocationPuck } from "../UserLocationPuck";

const NATIVE_ONLY_NOTE =
  "**Native-only component.** `UserLocationPuck` renders the modern MapLibre Native " +
  '"location puck" on iOS and Android, with `visible`, `puckBearing` (`heading` | ' +
  "`course`), and `puckBearingEnabled` to control whether and how the puck points. On web " +
  "it is a deliberate no-op — it renders nothing and logs a development warning. Because " +
  "Storybook runs on the web, this story produces no visible output; it exists purely as " +
  "API documentation. On real devices, mount it as a child of `<Map>` to show the puck.";

const meta = {
  title: "User Location/User Location Puck",
  component: UserLocationPuck,
  parameters: {
    docs: {
      description: {
        component: NATIVE_ONLY_NOTE,
      },
    },
  },
} satisfies Meta<typeof UserLocationPuck>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Documentation: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: AMSTERDAM, zoom: 11 }} />
      <UserLocationPuck />
    </Map>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "This is a documentation-only story. On web you will see the basemap but no puck, " +
          "since `UserLocationPuck` is a no-op outside iOS/Android. Run the component on a " +
          "device or simulator to see the native location puck.",
      },
    },
  },
};
