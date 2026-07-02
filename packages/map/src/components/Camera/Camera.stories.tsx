import { useRef } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Button, Group } from "@knitui/components";

import { AMSTERDAM, BERLIN, EUROPE_CENTER, PARIS, STREETS_STYLE } from "../../_storybook-demo";
import { Camera, type CameraRef } from "../Camera";
import { Map } from "../MapView";

// Local fixtures (kept in-file per authoring rules).

/** Rough bounding box covering the Benelux + northern France [west, south, east, north]. */
const BENELUX_BOUNDS: [number, number, number, number] = [2.0, 48.5, 7.5, 53.5];

/** Bounding box covering western Europe [west, south, east, north]. */
const WEST_EUROPE_BOUNDS: [number, number, number, number] = [-5.5, 41.0, 16.5, 55.5];

/** Fill the preview frame; every map is `flex: 1` so it renders full-bleed on web and native. */
const FILL = { flex: 1 } as const;

const meta = {
  title: "Camera/Camera",
  component: Camera,
  parameters: {
    docs: {
      description: {
        component:
          "Camera controls the map viewport — both declaratively (via props such as " +
          "`center`, `zoom`, `bearing`, `pitch`, `padding`, and `initialViewState`) and " +
          "imperatively (via a `CameraRef` exposing `flyTo`, `easeTo`, `jumpTo`, " +
          "`fitBounds`, and `zoomTo`). Coordinates are `[longitude, latitude]`; bounds " +
          "are `[west, south, east, north]`.",
      },
    },
  },
} satisfies Meta<typeof Camera>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Set the starting viewport once, declaratively, via `initialViewState`. */
export const Declarative: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE} style={FILL}>
      <Camera initialViewState={{ center: AMSTERDAM, zoom: 11 }} />
    </Map>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The simplest case: `initialViewState` sets the camera's starting center and " +
          "zoom one time on mount. Centered on Amsterdam at zoom 11.",
      },
    },
  },
};

/** Drive center + zoom directly as controlled props. */
export const CenterAndZoom: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE} style={FILL}>
      <Camera center={PARIS} zoom={13} />
    </Map>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Passing `center` and `zoom` directly (instead of `initialViewState`) makes the " +
          "viewport reflect those props. Here the camera sits over Paris at a close zoom of 13.",
      },
    },
  },
};

/** A tilted, rotated 3D-style view via `bearing` + `pitch`. */
export const BearingAndPitch: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE} style={FILL}>
      <Camera center={BERLIN} zoom={14} bearing={-30} pitch={55} />
    </Map>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "`bearing` rotates the map (degrees clockwise from north) and `pitch` tilts the " +
          "camera toward the horizon (0–60°). Combined they produce an oblique, 3D-feeling " +
          "view — here Berlin rotated -30° and pitched 55°.",
      },
    },
  },
};

/**
 * `padding` insets the focal point so the center sits off to one side — handy when a
 * sidebar or panel overlaps part of the map.
 */
export const Padding: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE} style={FILL}>
      <Camera center={AMSTERDAM} zoom={12} padding={{ left: 240, top: 80 }} />
    </Map>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "`padding` reserves space (in pixels) on each edge of the viewport, shifting the " +
          "effective center. With `left: 240` and `top: 80`, Amsterdam is pushed toward the " +
          "bottom-right — simulating a left sidebar overlapping the map.",
      },
    },
  },
};

/** Fit a bounding box on mount by passing `bounds` to `initialViewState`. */
export const FitBoundsOnMount: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE} style={FILL}>
      <Camera
        initialViewState={{
          bounds: BENELUX_BOUNDS,
          padding: { top: 24, right: 24, bottom: 24, left: 24 },
        }}
      />
    </Map>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Instead of a center+zoom, `initialViewState.bounds` ([west, south, east, north]) " +
          "frames a region on mount — the camera computes the center and zoom that fit the box. " +
          "Here it frames the Benelux with 24px of padding on every side.",
      },
    },
  },
};

/** Constrain interaction with `minZoom` / `maxZoom` / `maxBounds`. */
export const Constraints: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE} style={FILL}>
      <Camera
        initialViewState={{ center: EUROPE_CENTER, zoom: 4 }}
        minZoom={3}
        maxZoom={6}
        maxBounds={WEST_EUROPE_BOUNDS}
      />
    </Map>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "`minZoom`/`maxZoom` clamp how far the user can zoom and `maxBounds` pens the map " +
          "inside a region. Try to zoom or pan past the limits — the camera resists. Here zoom " +
          "is locked to 3–6 and panning is confined to western Europe.",
      },
    },
  },
};

/**
 * Imperative control via a `CameraRef`. The on-screen buttons call `flyTo`, `easeTo`,
 * `jumpTo`, `fitBounds`, and `zoomTo` to move the camera between cities.
 */
export const ImperativeControls: Story = {
  render: () => {
    const cameraRef = useRef<CameraRef>(null);

    return (
      <Box flex={1}>
        <Group gap="$xs" p="$sm" wrap="wrap">
          <Button
            size="xs"
            variant="default"
            onPress={() =>
              cameraRef.current?.flyTo({
                center: AMSTERDAM,
                zoom: 12,
                duration: 2500,
                easing: "fly",
              })
            }
          >
            flyTo Amsterdam
          </Button>
          <Button
            size="xs"
            variant="default"
            onPress={() => cameraRef.current?.easeTo({ center: BERLIN, zoom: 11, duration: 1500 })}
          >
            easeTo Berlin
          </Button>
          <Button
            size="xs"
            variant="default"
            onPress={() => cameraRef.current?.flyTo({ center: PARIS, zoom: 13, duration: 2000 })}
          >
            flyTo Paris
          </Button>
          <Button
            size="xs"
            variant="default"
            onPress={() => cameraRef.current?.jumpTo({ center: EUROPE_CENTER, zoom: 4 })}
          >
            jumpTo Europe
          </Button>
          <Button
            size="xs"
            variant="default"
            onPress={() =>
              cameraRef.current?.fitBounds(BENELUX_BOUNDS, {
                padding: { top: 40, right: 40, bottom: 40, left: 40 },
                duration: 1500,
              })
            }
          >
            fitBounds Benelux
          </Button>
          <Button
            size="xs"
            variant="default"
            onPress={() => cameraRef.current?.zoomTo(15, { duration: 800 })}
          >
            zoomTo 15
          </Button>
        </Group>
        <Map mapStyle={STREETS_STYLE} style={FILL}>
          <Camera ref={cameraRef} initialViewState={{ center: AMSTERDAM, zoom: 6 }} />
        </Map>
      </Box>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Grab a `useRef<CameraRef>` and call the imperative methods on it. " +
          '`flyTo` arcs out and back (great with `easing: "fly"`), `easeTo` glides linearly, ' +
          "`jumpTo` snaps instantly with no animation, `fitBounds` frames a box, and `zoomTo` " +
          "changes only the zoom. Each button moves the camera between European cities.",
      },
    },
  },
};
