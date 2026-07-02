import type { Meta, StoryObj } from "@storybook/react-vite";

import { AMSTERDAM, STREETS_STYLE } from "../../_storybook-demo";
import { Camera } from "../Camera";
import { Map } from "../MapView";
import { UserLocation } from "../UserLocation";

const meta = {
  title: "User Location/User Location",
  component: UserLocation,
  parameters: {
    docs: {
      description: {
        component:
          "`UserLocation` renders the device's current position on the map. On web it adds a " +
          "MapLibre `GeolocateControl` button to the top-right of the map; clicking it " +
          "prompts the browser for geolocation permission and, once granted, centers on and " +
          "marks your location. On native (iOS/Android) it renders the platform user-location " +
          "indicator. Drop it as a child of `<Map>`.",
      },
    },
  },
} satisfies Meta<typeof UserLocation>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: AMSTERDAM, zoom: 11 }} />
      <UserLocation />
    </Map>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The default user-location indicator. On web, look for the geolocate button in the " +
          "top-right corner of the map — clicking it requests browser geolocation permission. " +
          "Nothing appears until permission is granted.",
      },
    },
  },
};

export const HeadingAndAccuracy: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: AMSTERDAM, zoom: 11 }} />
      <UserLocation heading accuracy animated />
    </Map>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "With `heading`, `accuracy`, and `animated` enabled the indicator shows a heading " +
          "cone and an accuracy ring, and updates smoothly. As with the default, web users " +
          "must grant geolocation permission via the top-right control before anything shows.",
      },
    },
  },
};
