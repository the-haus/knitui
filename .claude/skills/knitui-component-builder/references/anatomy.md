# Component anatomy

The physical shape of a component in this kit. Copy this structure exactly for new components.

## Directory layout

Every component lives in a **PascalCase folder** under `packages/components/src/<Name>/`:

```
src/Button/
├── index.ts            # barrel: `export * from "./Button";`
├── Button.tsx          # implementation (single-file, cross-platform)
├── Button.stories.tsx  # Storybook stories
└── Button.test.tsx     # Jest/RTL tests
```

Conventions confirmed across all ~103 component dirs:

- `<Name>.tsx` — implementation (this is the **web/default** file)
- `<Name>.stories.tsx` — stories
- `<Name>.test.tsx` — tests
- `index.ts` — per-component barrel (`export * from "./<Name>";`)
- There are **no `<Name>.props.ts` files**. Prop types live inline in the `.tsx`, or in a `<Name>.types.ts` / `types.ts` file for split components.

### Split components (web ≠ native)

When web and native diverge structurally (real DOM host vs. an RN host), the folder splits into roles. Canonical example, `FileButton/`:

```
src/FileButton/
├── FileButton.tsx          # web impl (hidden <input type="file">)
├── FileButton.native.tsx   # native impl (pickFiles resolver, no DOM)
├── FileButton.shared.tsx   # platform-agnostic logic, imported by both
├── FileButton.types.ts     # SINGLE shared type module — both platforms import from here
├── index.ts
├── FileButton.stories.tsx
└── FileButton.test.tsx
```

Resolution rule (Metro/Metro-web): **base `.tsx` = web/default, `.native.tsx` = native override.** Metro picks `.native.tsx` on native; the web bundler falls back to the plain `.tsx`. Only two files repo-wide use an explicit `.web.tsx` suffix (`Modal/drag/*.web.tsx`) — prefer the base-`.tsx`-is-web convention.

The **shared type module is load-bearing**: both platform files import the same `FileButtonProps` / component type from `FileButton.types.ts`, so the public API can't drift between platforms. Other split examples: `Input/` (`shared.tsx` + `types.ts` + `InputNativeProps.ts` + `useAutosize.ts`), `ScrollArea/` (`ScrollArea.shared.ts`).

## The implementation file

Imports come from **`@knitui/core`** (the kit's Tamagui re-export layer), NOT `@tamagui/core` directly:

```ts
import {
  createSlot,
  createStyledContext,
  defineSlots,
  type GetProps,
  isWeb,
  styled,
  withStaticProperties,
} from "@knitui/core";
import { Box } from "../Box";
import { Text } from "../Text";
import {
  controlColorVariant,
  controlVariant,
  focusRingStyle,
  pressScaleStyle,
  radiusVariant,
  webButton,
  webCursor,
} from "../internal/style-props";
```

### 1. Build the host frame with `styled()`

Extend the kit's `Box` (or `Text`) primitive — never a bare RN/HTML element. Give it a `name`, a shared `context`, and a `variants` block whose keys are **spread from the shared ladders** in `../internal/style-props`:

```ts
const ButtonFrame = styled(Box, {
  name: "Button",
  context: ButtonContext,
  role: "button",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  ...webCursor("pointer"),
  ...pressScaleStyle,
  ...focusRingStyle, // visual focus ring (see control-systems.md)
  variants: {
    variant: { ...controlColorVariant }, // shared color ladder
    size: { ...controlVariant }, // shared size ladder
    radius: { ...radiusVariant },
    fullWidth: { true: { alignSelf: "stretch" }, false: { alignSelf: "flex-start" } },
    disabled: { true: { opacity: 0.6, pointerEvents: "none" } },
  } as const,
  defaultVariants: { variant: "filled", size: "md", fullWidth: false, radius: "md" },
});
```

### 2. Declare prop types inline

Frame props come from `GetProps<typeof Frame>`; extend with an interface for behavior props. Use `SlotStyles<...>` for the per-slot `styles` prop (see slots-and-styles.md):

```ts
type ButtonFrameProps = Omit<GetProps<typeof ButtonFrame>, "disabled">;
export interface ButtonProps extends ButtonFrameProps {
  disabled?: boolean;
  loading?: boolean;
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
  styles?: SlotStyles<ButtonStyles>;
  gradient?: GradientValue;
}
```

> Note the `Omit<..., "disabled">` — when your own-prop name collides with an RN/Tamagui frame style prop (e.g. `disabled`, `shadowColor`), `Omit` it from the frame type and redeclare. This is a recurring gotcha.

### 3. Wrap with `Frame.styleable<Props>()`

Tamagui's HOC that preserves style-prop typing + ref forwarding. Branch platforms with `isWeb`, not separate files, when the divergence is small:

```ts
const ButtonComponent = ButtonFrame.styleable<ButtonProps>(function Button(props, ref) {
  const { children, loading, disabled, leftSection, rightSection, styles,
          gradient, size = "md", variant = "filled", ...rest } = props;
  const isDisabled = !!(disabled || loading);
  const grad = useGradient(variant === "gradient" ? gradient : undefined);
  return (
    <ButtonFrame ref={ref} disabled={isDisabled} size={size} variant={variant}
      {...grad.frameProps} {...rest}
      aria-disabled={isDisabled || undefined}
      {...webButton()}>          {/* renders a real focusable <button> on web */}
      {grad.layer}{left}{renderTextChild(label, LabelText)}{right}
    </ButtonFrame>
  );
});
```

### 4. The `render` host-element prop (Tamagui v2)

To re-render a styled part as a different semantic host, pass **`render="<tag>"`** (v1's `as`/`tag` is gone). Minimal example, `Kbd`:

```ts
const KbdFrame = styled(Text, { name: "Kbd", fontFamily: "$mono" });
export const Kbd = KbdFrame.styleable<KbdProps>(function Kbd(props, ref) {
  return <KbdFrame ref={ref} {...props} render="kbd" />;   // semantic <kbd> on web
});
```

Also used in `Tree` (`render="li"`/`render="ul"`). Tests assert the real host element renders (see tests.md).

### 5. Compound components with `withStaticProperties`

Assemble sub-parts onto the root at the bottom of the file:

```ts
export const Button = withStaticProperties(ButtonComponent, {
  ...ButtonSlots.markers, // Left, Label, Right — marker slots
  Text: ButtonText, // styled(Text) label part
  Section: ButtonSection, // styled(Box) side wrapper
  Loader, // re-exported part
  Frame: ButtonFrame, // raw styled frame (escape hatch)
  Group: ButtonGroup, // Button.Group
  GroupSection: ButtonGroupSection,
});
```

## Native escape hatch: `usePropsAndStyle`

When a `.native.tsx` file must render a **bare RN host** (`TextInput`, `ScrollView`) while still accepting Tamagui token props, use `usePropsAndStyle` (from `@knitui/core`) to flatten tokens/variants to plain RN styles without rendering a styled host. Live consumer: `ScrollArea/ScrollArea.native.tsx`.

Both patterns exist: `Input.native.tsx` instead renders `styled(TextInput, …)` directly. Prefer `styled(RNHost, …)` when possible; reach for `usePropsAndStyle` when you need imperative control over the raw host.

## Barrels — the resolution chain

1. **Per-component barrel** `Button/index.ts`: `export * from "./Button";` (richer components also `export type { … } from "./types"`).
2. **Package barrel** `src/index.ts` (alphabetical) re-exports every component + its public types:
   ```ts
   export { Button, type ButtonProps, type ButtonSize, type ButtonVariant } from "./Button";
   ```

Resolution: `@knitui/components` → `src/index.ts` → `./Button` (folder `index.ts`) → `Button.tsx`.

**When you add a component, you must add its export block to `src/index.ts`** or it isn't public.

## Key supporting files to know

- `packages/core/src/essentials.ts` — the `@knitui/core` re-export surface (`styled`, `GetProps`, `isWeb`, `usePropsAndStyle`, slot helpers, …).
- `packages/components/src/internal/style-props.ts` — shared variant ladders (`controlColorVariant`, `controlVariant`, `radiusVariant`, `focusRingStyle`, `pressScaleStyle`, `webButton`, `webCursor`).
- `packages/components/src/internal/styles.ts` — `slotStyles`, `SlotStyles` (per-slot styles engine).
- `packages/components/src/control-system.ts` — public barrel of the size/color/icon tables for sibling packages.
