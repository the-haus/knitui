import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Text } from "@knitui/components";

import { AMSTERDAM, STREETS_STYLE } from "../../_storybook-demo";
import { Camera } from "../Camera";
import { Map } from "../MapView";
import { Marker } from "../MarkerView";
import { Callout } from "./index";

const meta = {
  title: "Markers & Annotations/Callout",
  component: Callout,
  parameters: {
    docs: {
      description: {
        component:
          "`Callout` is a speech-bubble that belongs to a marker's selected state on native (`@maplibre/maplibre-react-native`). On web it has no native marker host, so it renders as a best-effort inline bubble — here it is placed inside a `Marker` so it appears anchored on the map. Treat web rendering as a preview; the authoritative behaviour is on native.",
      },
    },
  },
} satisfies Meta<typeof Callout>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A simple callout bubble with a title and content (web best-effort). */
export const Basic: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: AMSTERDAM, zoom: 11 }} />
      <Marker lngLat={AMSTERDAM} anchor="bottom">
        <Box
          minWidth={160}
          px={12}
          py={10}
          borderRadius={10}
          backgroundColor="white"
          borderWidth={1}
          borderColor="#e5e7eb"
          shadowColor="#000"
          shadowOpacity={0.15}
          shadowRadius={12}
          shadowOffset={{ width: 0, height: 4 }}
        >
          <Callout title="Amsterdam">
            <Text fontSize={13} fontWeight="700" color="#111827">
              Amsterdam
            </Text>
            <Text fontSize={11} color="#6b7280">
              Tap a marker on native to reveal its callout.
            </Text>
          </Callout>
        </Box>
      </Marker>
    </Map>
  ),
};

/** Title-only callout — children fall back to the `title` text. */
export const TitleOnly: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: AMSTERDAM, zoom: 11 }} />
      <Marker lngLat={AMSTERDAM} anchor="bottom">
        <Box
          px={12}
          py={8}
          borderRadius={9999}
          backgroundColor="white"
          borderWidth={1}
          borderColor="#e5e7eb"
          shadowColor="#000"
          shadowOpacity={0.2}
          shadowRadius={6}
          shadowOffset={{ width: 0, height: 2 }}
        >
          <Callout title="Amsterdam" />
        </Box>
      </Marker>
    </Map>
  ),
};
