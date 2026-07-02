import type { Meta, StoryObj } from "@storybook/react-vite";

import { STREETS_STYLE } from "../../_storybook-demo";
import { Camera } from "../Camera";
import { Map } from "../MapView";
import { RasterLayer } from "../RasterLayer";
import { ImageSource } from "./index";

/** MapLibre's canonical `ImageSource` example raster to drape over a bbox. */
const OVERLAY_IMAGE = "https://maplibre.org/maplibre-gl-js/docs/assets/radar.gif";

/**
 * Corners as `[topLeft, topRight, bottomRight, bottomLeft]`, each `[lng, lat]`,
 * placing the overlay over a small bbox around Amsterdam.
 */
const OVERLAY_COORDINATES: [
  [number, number],
  [number, number],
  [number, number],
  [number, number],
] = [
  [4.85, 52.4],
  [4.96, 52.4],
  [4.96, 52.33],
  [4.85, 52.33],
];

const meta = {
  title: "Sources/Image Source",
  component: ImageSource,
  // The story drives the source through `render`; this satisfies the required
  // `url`/`coordinates` props for the args-aware story type.
  args: { url: OVERLAY_IMAGE, coordinates: OVERLAY_COORDINATES },
  parameters: {
    docs: {
      description: {
        component:
          "`ImageSource` pins a single static image to four geographic corners. Pair it with a `RasterLayer` that targets the source `id` to render the image — useful for floorplans, historical maps, or rendered overlays georeferenced onto the map.",
      },
    },
  },
} satisfies Meta<typeof ImageSource>;

export default meta;
type Story = StoryObj<typeof meta>;

/** An image draped over a bounding box on the streets basemap. */
export const Overlay: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: [4.905, 52.365], zoom: 11 }} />
      <ImageSource id="overlay" url={OVERLAY_IMAGE} coordinates={OVERLAY_COORDINATES}>
        <RasterLayer id="overlay-layer" source="overlay" style={{ rasterOpacity: 0.85 }} />
      </ImageSource>
    </Map>
  ),
};
