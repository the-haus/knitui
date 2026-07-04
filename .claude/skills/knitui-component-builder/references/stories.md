# Storybook stories

**Format:** CSF3, Storybook 10.x with the **Vite** builder. Import types from `@storybook/react-vite` (NOT `@storybook/react`, NOT the RN Storybook). **Port 6006.**

## File shape

```tsx
import type { ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";

const VARIANTS = ["filled", "light", "outline", "subtle", "default"] as const;
const SIZES = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Inputs/Button", // slash-namespaced category
  component: Button,
  parameters: {
    layout: "centered",
    docs: { description: { component: "How theme/variant/size map to the palette ramp." } },
  },
  args: { children: "Button", variant: "filled", size: "md" }, // Playground baseline
  argTypes: {
    variant: { control: "select", options: VARIANTS, description: "Visual style" },
    size: { control: "inline-radio", options: SIZES },
    leftSection: { control: false }, // slot props: turn the control off
  },
} satisfies Meta<typeof Button>; // NOTE: `satisfies`, not `: Meta`
export default meta;

type Story = StoryObj<ComponentProps<typeof Button>>; // props-based, not StoryObj<typeof meta>
```

Two conventions to copy exactly:

- `meta` validated with **`satisfies Meta<typeof X>`** (not `const meta: Meta = …`).
- `Story` typed as **`StoryObj<ComponentProps<typeof X>>`**.

## Story-per-feature discipline

One named export per feature/state, each with a JSDoc `/** … */` one-liner above it (renders as the doc caption). `Playground` (empty `{}`, pure Controls) is always **first**. Declare axis arrays as `... as const` at the top and `render`-map over them.

Button's full set illustrates the discipline:

- `Playground` — empty args, Controls playground (first)
- `Variants`, `Sizes`, `Shadows` — `render` mapping over the `as const` arrays
- `Loading`, `Disabled`, `FullWidth`, `WithSections`, `Themed` — single-state, driven by `args`
- `Group`, `GroupSection` — compound / static sub-component stories
- `Matrix` — full variant × size grid "for visual regression"
- `Gradient`, `GradientPresets`, `GradientThemed`, `GradientSizes`, `GradientAngles` — one story per facet
- `Styles` — the per-slot styles demo, **placed last**

## The `Styles` story (required for any multi-part component)

Every component with per-slot styling ships a story literally named `Styles`, last:

```tsx
/** Per-slot `styles` targets individual parts — here the `label` and `right` section. */
export const Styles: Story = {
  args: {
    children: "Continue",
    variant: "default",
    rightSection: <Text>→</Text>,
    styles: {
      label: { color: "$blue11", fontWeight: "700" },
      right: { backgroundColor: "$red3" },
    },
  },
};
```

**69 stories currently export `export const Styles`.** Your component must too.

## Title categories

`title` is `Category/Name`. Existing categories include `Inputs/`, `Typography/`, `Feedback/`, `Overlays/`, `Navigation/`, `Data Display/`, `Layout/`. Slot it into the closest existing category — check the sibling components' titles.

## Config (do not touch unless extending)

- `packages/components/.storybook/main.ts` — `@storybook/react-vite`; `stories: ["../src/**/*.stories.@(ts|tsx)", "../src/**/*.mdx"]`; addon `@storybook/addon-docs`; `viteFinal` sets `TAMAGUI_TARGET="web"`, aliases `react-native` → `react-native-web`.
- `packages/components/.storybook/preview.tsx` — wraps every story in `<Provider forceColorScheme={…}>` via a `withProvider` decorator; adds a `colorScheme` light/dark toolbar.
- `packages/components/package.json`: `"storybook": "storybook dev -p 6006"`, `"build-storybook": "storybook build"`.
- Root aggregate at `apps/storybook/.storybook/main.ts` **composes** each package's built Storybook via `refs` (Storybook composition), not config merging.
