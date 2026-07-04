# Composition: slots + per-slot `styles`

Two framework-agnostic primitives in `packages/core/src/composition/`, re-exported from `@knitui/core`. Button is the pilot for both. New cross-kit code should import from `@knitui/core`; components historically import the `styles` engine from `../internal/styles` (a thin re-export).

- **Pillar A — marker slots** (`slots.tsx`): let users place named children (`<Button.Left/>`).
- **Pillar B — per-slot `styles` prop** (`slot-styles.ts`): sugar to style named internal parts (`styles={{ label: {...} }}`).

Design specs: `docs/slot-system-plan.md` (A), `docs/styling-system-plan.md` (B).

---

## Pillar A — marker slots (`packages/core/src/composition/slots.tsx`)

Marker slots are components that **render nothing** (`() => null`) but carry a name via a module-local `unique symbol` brand. The parent collects them from `children` via `React.Children` (no babel transform — identical web/native). Matching is by **component reference** (`child.type === registry.Left`); the brand only powers dev warnings.

### API — two functions

```ts
// One marker. P should be all-optional config props.
export function createSlot<Name extends string, P = unknown>(name: Name): SlotComponent<Name, P>;

// Register a component's markers once → { markers, collect }
export function defineSlots<R extends Record<string, AnySlotComponent>>(
  registry: R,
): {
  markers: R;
  collect: (children: React.ReactNode, opts?: CollectOptions<keyof R & string>) => SlotBag<R>;
};

export interface CollectOptions<Key extends string> {
  defaultSlot?: Key; // plain children fold into this slot
  aliases?: Partial<Record<Key, readonly AnySlotComponent[]>>; // alternate markers → canonical key
  required?: readonly Key[]; // dev-only "missing slot" warning
  displayName?: string; // for dev warnings
}
```

`collect` flattens one level of explicit fragments; matches by reference then alias; last duplicate wins (dev-warns); pools non-marker children into `defaultSlot` (else `bag.default`); dev-warns on foreign markers or missing `required` slots.

### Button usage

```ts
const ButtonSlots = defineSlots({
  Left: createSlot<"Left">("Left"),
  Label: createSlot<"Label">("Label"),
  Right: createSlot<"Right">("Right"),
});

// inside the styleable render fn:
const slots = ButtonSlots.collect(children, { defaultSlot: "Label", displayName: "Button" });
const leftContent = slots.Left?.children ?? leftSection; // marker → legacy prop → children
const rightContent = slots.Right?.children ?? rightSection;
const label = slots.Label?.children ?? slots.default;

// expose markers as statics (single source of truth):
export const Button = withStaticProperties(ButtonComponent, { ...ButtonSlots.markers /* ... */ });
```

> Button is currently the **only** `packages/components` component using marker slots (it's the pilot; `carousel` and `sheet` also use them). Most components rely on Pillar B only — that's fine. Reach for marker slots when users need to inject/reorder named regions.

---

## Pillar B — per-slot `styles` prop (`packages/core/src/composition/slot-styles.ts`)

The kit has ONE styling model: **style props on the parts themselves.** The `styles` prop is thin optional **sugar** mapping named slots to props spread onto the matching styled part. It replaces `labelProps`/`iconProps`/`closeButtonProps` sprawl.

### The one precedence rule (low → high)

```
defaults  <  styles[slot]  <  explicit xxxProps  <  inline props on a composed part
```

"Explicit beats sugar." This direction is defined in exactly one place: `merge`.

### API

```ts
export type SlotStyles<M> = { [K in keyof M]?: M[K] };            // the styles prop shape
export interface SlotAccessor<M> {
  get:   <K extends keyof M>(key: K) => SlotValue<M, K> | undefined;
  merge: <K extends keyof M>(key: K, explicit: SlotValue<M, K> | undefined) => SlotValue<M, K>;
}
export function slotStyles<M>(
  styles: SlotStyles<M> | undefined,
  knownSlots: readonly (keyof M & string)[],
  displayName?: string,
): SlotAccessor<M>;

// project a styles map down to a subset of keys (for forwarding a slice to a child)
export function pick<M, T>(styles, keys): ... ;
```

- `get(key)` → slot props (or `undefined`); spread onto parts with no competing explicit prop: `{...s.get("title")}`.
- `merge(key, explicit)` → `{ ...styles?.[key], ...explicit }` so explicit wins; undefined-safe.
- Dev-warns once per render on unknown slot keys (catches JS-caller typos TS can't).
- `pick` returns `undefined` when nothing matches (passes straight through as an optional `styles` prop). Used by `Pagination`, `Input`, `NativeSelect`.

### Text-part helper

`internal/use-slot-text-wrapper.tsx` — `useSlotTextWrapper(Component, slotProps)` memoizes a stable wrapper binding resolved slot props before `renderTextChild`, avoiding remount/state-loss from a fresh inline component each render. Returns the base component unwrapped when there are no slot props.

### Button adoption (the pattern to copy)

```ts
export interface ButtonStyles {
  left?:  GetProps<typeof ButtonSection>;
  label?: GetProps<typeof ButtonText>;
  right?: GetProps<typeof ButtonSection>;
  loader?: Partial<LoaderProps>;
}
const BUTTON_SLOT_KEYS = ["left","label","right","loader"] as const
  satisfies readonly (keyof ButtonStyles)[];

export interface ButtonProps extends ButtonFrameProps {
  styles?: SlotStyles<ButtonStyles>;
  loaderProps?: Partial<LoaderProps>;   // @deprecated legacy alias; explicit wins over styles.loader
}

// consume: merge where a legacy/explicit prop competes, get where none does
const s = slotStyles<ButtonStyles>(styles, BUTTON_SLOT_KEYS, "Button");
<Loader {...s.merge("loader", loaderProps)} />
<ButtonSection {...s.merge("left", slots.Left?.props)} />
const LabelText = useSlotTextWrapper(ButtonText, s.get("label"));
```

### Adoption is near-universal — match it

Verified across `packages/components/src` (excluding stories/tests):

- **62** source files call the `slotStyles` accessor
- **65** declare a `SlotStyles<…>`-typed `styles` prop
- **63** forward `styles={…}` to a child part
- **69** stories export `export const Styles`

A few are pure forwarders that import the `SlotStyles` type and pass `styles` straight to a child without an accessor: `HoverCard`, `Menu`, `Tooltip`, `Popover`, `ScrollArea`, `Input/types.ts`.

**Every new component with more than one visible part MUST declare a `Styles` slot map, accept `styles?: SlotStyles<...>`, and ship a `Styles` story + test.** This is the kit's composability contract.
