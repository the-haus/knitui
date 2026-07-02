import type { Meta, StoryObj } from "@storybook/react-vite";

import { AMSTERDAM, asStyle, EUROPE_CENTER } from "../_storybook-demo";
import { Camera } from "../components/Camera";
import { Map } from "../components/MapView";
import {
  darkMatterStyle,
  klokantechBasicStyle,
  osmLibertyCustomStyle,
  osmLibertyStyle,
  positronStyle,
  voyagerStyle,
  yodaDarkStyle,
  yodaLightStyle,
  zoomstackNightStyle,
} from "./index";

const meta = {
  title: "Map/Styles",
  component: Map,
  args: {
    mapStyle: asStyle(voyagerStyle),
  },
  parameters: {
    docs: {
      description: {
        component:
          "The package ships nine vendored MapLibre basemap styles as JSON. Each is a " +
          "complete, keyless `StyleSpecification` that you hand to the map's `mapStyle` " +
          "prop. The gallery below shows the same camera under every bundled style; the " +
          "final story lets you switch between them with a Storybook control.",
      },
    },
  },
} satisfies Meta<typeof Map>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Overview-level camera (continental Europe). */
const EUROPE_VIEW = { center: EUROPE_CENTER, zoom: 4 } as const;

/** Street-level camera for detailed basemaps. */
const STREET_VIEW = { center: AMSTERDAM, zoom: 11 } as const;

export const Voyager: Story = {
  render: () => (
    <Map mapStyle={asStyle(voyagerStyle)}>
      <Camera initialViewState={EUROPE_VIEW} />
    </Map>
  ),
  parameters: {
    docs: { description: { story: "Carto Voyager — a balanced, colourful basemap." } },
  },
};

export const Positron: Story = {
  render: () => (
    <Map mapStyle={asStyle(positronStyle)}>
      <Camera initialViewState={EUROPE_VIEW} />
    </Map>
  ),
  parameters: {
    docs: {
      description: { story: "Carto Positron — a light, low-contrast basemap good for overlays." },
    },
  },
};

export const DarkMatter: Story = {
  render: () => (
    <Map mapStyle={asStyle(darkMatterStyle)}>
      <Camera initialViewState={EUROPE_VIEW} />
    </Map>
  ),
  parameters: {
    docs: { description: { story: "Carto Dark Matter — a dark counterpart to Positron." } },
  },
};

export const KlokantechBasic: Story = {
  render: () => (
    <Map mapStyle={asStyle(klokantechBasicStyle)}>
      <Camera initialViewState={STREET_VIEW} />
    </Map>
  ),
  parameters: {
    docs: { description: { story: "Klokantech Basic — a plain street-level reference basemap." } },
  },
};

export const OsmLiberty: Story = {
  render: () => (
    <Map mapStyle={asStyle(osmLibertyStyle)}>
      <Camera initialViewState={STREET_VIEW} />
    </Map>
  ),
  parameters: {
    docs: { description: { story: "OSM Liberty — a vivid OpenStreetMap-derived street style." } },
  },
};

export const OsmLibertyCustom: Story = {
  render: () => (
    <Map mapStyle={asStyle(osmLibertyCustomStyle)}>
      <Camera initialViewState={STREET_VIEW} />
    </Map>
  ),
  parameters: {
    docs: { description: { story: "A customised variant of OSM Liberty." } },
  },
};

export const YodaLight: Story = {
  render: () => (
    <Map mapStyle={asStyle(yodaLightStyle)}>
      <Camera initialViewState={EUROPE_VIEW} />
    </Map>
  ),
  parameters: {
    docs: { description: { story: "Yoda Light — a soft, light themed basemap." } },
  },
};

export const YodaDark: Story = {
  render: () => (
    <Map mapStyle={asStyle(yodaDarkStyle)}>
      <Camera initialViewState={EUROPE_VIEW} />
    </Map>
  ),
  parameters: {
    docs: { description: { story: "Yoda Dark — a dark themed basemap." } },
  },
};

export const ZoomstackNight: Story = {
  render: () => (
    <Map mapStyle={asStyle(zoomstackNightStyle)}>
      <Camera initialViewState={EUROPE_VIEW} />
    </Map>
  ),
  parameters: {
    docs: { description: { story: "OS Zoomstack Night — a dark, night-oriented basemap." } },
  },
};

/**
 * Switch the active basemap with the `mapStyle` select control in the Controls
 * panel. Each option maps to one of the nine bundled styles.
 */
export const StyleSwitcher: Story = {
  argTypes: {
    mapStyle: {
      control: "select",
      options: [
        "voyager",
        "positron",
        "darkMatter",
        "klokantechBasic",
        "osmLiberty",
        "osmLibertyCustom",
        "yodaLight",
        "yodaDark",
        "zoomstackNight",
      ],
      mapping: {
        voyager: asStyle(voyagerStyle),
        positron: asStyle(positronStyle),
        darkMatter: asStyle(darkMatterStyle),
        klokantechBasic: asStyle(klokantechBasicStyle),
        osmLiberty: asStyle(osmLibertyStyle),
        osmLibertyCustom: asStyle(osmLibertyCustomStyle),
        yodaLight: asStyle(yodaLightStyle),
        yodaDark: asStyle(yodaDarkStyle),
        zoomstackNight: asStyle(zoomstackNightStyle),
      },
    },
  },
  args: {
    mapStyle: "voyager" as unknown as ReturnType<typeof asStyle>,
  },
  render: (args) => (
    <Map mapStyle={args.mapStyle}>
      <Camera initialViewState={EUROPE_VIEW} />
    </Map>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Pick any bundled style from the `mapStyle` control to swap the basemap live. " +
          "The camera stays centred on Europe so you can compare styles directly.",
      },
    },
  },
};
