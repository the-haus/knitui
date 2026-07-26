/**
 * Pillar-A marker-slot system (`docs/slot-system-plan.md`).
 *
 * Framework-agnostic React composition primitive — no Tamagui, styling, or
 * component coupling — so it lives in `@knitui/core` and is shared by every kit
 * (`@knitui/components`, `@knitui/dates`, …). Consumers import `createSlot` /
 * `defineSlots` from `@knitui/core`.
 *
 * Lets users compose multi-part components semantically
 * (`<Button.Left/><Button.Label/>`) while the parent keeps owning layout,
 * styling, accessibility, and behavior. Marker slots render NOTHING themselves
 * — they carry a name in the type system; the parent extracts their props and
 * children at render via `React.Children` and renders its own controlled parts.
 *
 * Design constraints (see the plan):
 *   - Fully typed end to end. No `any` / `as any` / `as unknown as` / `@ts-*`.
 *     Two tolerated bridge casts live inside `collect`: the runtime-justified
 *     `child.props as SlotProps<…>` (guarded by a `child.type === marker`
 *     identity check on the same path), and the final `as SlotBag<R>` assembly
 *     assertion that re-attaches the precise per-key entry types to the
 *     loosely-typed accumulator (TS can't write to a generic mapped-type key).
 *   - Works at RUNTIME with no build transform. Slot collection happens via
 *     `React.Children`, never a babel plugin, so the static surface is identical
 *     on web and native and the optional Tamagui compiler stays optional.
 *   - Slots are matched by component REFERENCE (`child.type === registry.Left`),
 *     exactly like `Card` matches `CardSection`. The `unique symbol` brand only
 *     powers dev-time warnings ("this is a slot, but from another component").
 */
import * as React from "react";

const isDev = (): boolean => process.env.NODE_ENV !== "production";

/**
 * Marker slot props always allow `children` and must otherwise be all-optional
 * (the variance rule below): `React.FC` is contravariant in props, so for a
 * concrete `SlotComponent<Name, P>` to be assignable to the registry bound
 * `SlotComponent<string, unknown>`, `P` must be all-optional config.
 */
export type SlotProps<P = unknown> = P & { children?: React.ReactNode };

// `Symbol(...)` (not `Symbol.for`) yields a `unique symbol`, so it can be a
// computed key in an object literal and keep its literal type — no cast needed
// in `createSlot`. The brand is module-local, which is fine: all slots and
// collectors for a component live in one bundled module.
const SLOT_BRAND = Symbol("@knitui/components.slot");

/** A marker component: renders nothing, carries its name in the type system. */
export type SlotComponent<Name extends string, P = unknown> = React.FC<SlotProps<P>> & {
  readonly [SLOT_BRAND]: Name;
};

/**
 * Create a marker slot. Matched by reference at render; the `name` brand only
 * drives dev warnings. `P` should be all-optional config (variance rule) — if a
 * slot needs a required prop it should be a real context-driven compound
 * component instead.
 */
export function createSlot<Name extends string, P = unknown>(name: Name): SlotComponent<Name, P> {
  const Slot: React.FC<SlotProps<P>> = () => null;
  Slot.displayName = `Slot(${name})`;
  // `Object.assign` returns `typeof Slot & { [SLOT_BRAND]: Name }`, which is
  // exactly `SlotComponent<Name, P>` because SLOT_BRAND is a `unique symbol`.
  return Object.assign(Slot, { [SLOT_BRAND]: name });
}

type AnySlotComponent = SlotComponent<string, unknown>;

type SlotPropsOf<S> = S extends SlotComponent<string, infer P> ? P : never;

/** One collected marker element. */
export interface SlotEntry<P> {
  /** The marker element's props (typed per slot), minus `children`. */
  props: SlotProps<P>;
  /** The marker element's children — the renderable slot content. */
  children: React.ReactNode;
}

/**
 * The resolved bag: one optional entry per registered key (keyed by the SAME
 * keys used as statics, e.g. `Left`/`Label`/`Right`), plus pooled `default`
 * children that matched no slot.
 */
export type SlotBag<R extends Record<string, AnySlotComponent>> = {
  [K in keyof R]?: SlotEntry<SlotPropsOf<R[K]>>;
} & { default?: React.ReactNode };

export interface CollectOptions<Key extends string> {
  /** Plain (non-marker) children fold into this slot instead of `default`. */
  defaultSlot?: Key;
  /** Map alternate marker components onto a canonical key. */
  aliases?: Partial<Record<Key, readonly AnySlotComponent[]>>;
  /** Dev-only: warn if one of these keys is missing. */
  required?: readonly Key[];
  /** Component name for dev warnings. */
  displayName?: string;
}

/** Read the slot brand off a value, or `undefined` if it is not a marker. */
function getSlotName(type: unknown): string | undefined {
  return typeof type === "function" && SLOT_BRAND in type
    ? (type as { [SLOT_BRAND]?: string })[SLOT_BRAND]
    : undefined;
}

/** Props of a synthesized (non-marker) slot entry — no marker element, no props. */
const EMPTY_SLOT_PROPS = Object.freeze({});

/** The bag for children that contain nothing renderable. Read-only by contract. */
const EMPTY_BAG = Object.freeze({});

/**
 * Register a component's marker slots once and get back the markers (to spread
 * as statics) plus a typed `collect` that normalizes children into a
 * precisely-keyed `SlotBag`.
 *
 * ## Cost
 *
 * `collect` runs on every render of every slot-bearing component (`Button` calls
 * it unconditionally), so the trivial child shapes are answered before any
 * `React.Children` walk, and marker matching is a `Map` lookup rather than a
 * linear scan of the registry per child.
 */
export function defineSlots<R extends Record<string, AnySlotComponent>>(
  registry: R,
): {
  markers: R;
  collect: (children: React.ReactNode, opts?: CollectOptions<keyof R & string>) => SlotBag<R>;
} {
  type Key = keyof R & string;
  const keys = Object.keys(registry) as Key[];
  // Marker component → registry key, built ONCE. `matchSlotKey` used to loop
  // every registry key for every child on every render.
  const keyByMarker = new Map<AnySlotComponent, Key>(keys.map((key) => [registry[key], key]));

  /** Which registry key (if any) this element matches — by reference, then alias. */
  function matchSlotKey(type: unknown, aliases: CollectOptions<Key>["aliases"]): Key | undefined {
    const direct = keyByMarker.get(type as AnySlotComponent);
    if (direct !== undefined) return direct;
    if (!aliases) return undefined;
    for (const key of keys) {
      const alts = aliases[key];
      if (alts && alts.some((alt) => alt === type)) return key;
    }
    return undefined;
  }

  /** Dev-only: warn for `required` keys the bag ended up without. */
  function warnMissingRequired(named: Record<string, unknown>, opts?: CollectOptions<Key>): void {
    if (!opts?.required) return;
    const label = opts.displayName ?? "component";
    for (const key of opts.required) {
      if (!named[key]) {
        console.warn(`[@knitui] ${label} is missing required slot <${label}.${key}>.`);
      }
    }
  }

  function collect(children: React.ReactNode, opts?: CollectOptions<Key>): SlotBag<R> {
    // ---- Fast paths, before any `React.Children` walk. ----
    const childrenType = typeof children;
    // A lone string/number — the `<Button>Save</Button>` shape, i.e. most Button
    // renders. The entry keeps the CALLER's node as `children` rather than a
    // freshly-pooled `[node]` array, so a label subtree's `children` identity is
    // stable across renders (and `renderTextChild` hits its own string fast path).
    if (childrenType === "string" || childrenType === "number") {
      const bag: Record<string, unknown> = {};
      const fastDefaultSlot = opts?.defaultSlot;
      if (fastDefaultSlot) bag[fastDefaultSlot] = { props: EMPTY_SLOT_PROPS, children };
      else bag.default = children;
      if (isDev()) warnMissingRequired(bag, opts);
      return bag as SlotBag<R>;
    }
    // Nothing renderable at all.
    if (children == null || childrenType === "boolean") {
      if (isDev()) warnMissingRequired(EMPTY_BAG, opts);
      return EMPTY_BAG as SlotBag<R>;
    }
    // A single non-fragment element — `<ActionIcon><IconX/></ActionIcon>` or one
    // marker. There is exactly one candidate, so match it directly: no `visit`
    // closure, no `pooled` array, and the non-marker case keeps the caller's
    // element identity so a memoized child isn't invalidated every render.
    if (React.isValidElement(children) && children.type !== React.Fragment) {
      const bag: Record<string, unknown> = {};
      const key = matchSlotKey(children.type, opts?.aliases);
      if (key) {
        // Bridge cast, justified exactly as in `visit` below: `matchSlotKey` has
        // confirmed `children.type === registry[key]`, which pins the element's
        // prop type to this slot's.
        const marker = children.props as SlotProps<SlotPropsOf<R[Key]>>;
        const { children: slotChildren, ...props } = marker;
        bag[key] = { props, children: slotChildren };
      } else {
        if (isDev()) {
          const foreign = getSlotName(children.type);
          if (foreign !== undefined) {
            console.warn(
              `[@knitui] <${foreign}> is a slot from another component and is ignored inside ${opts?.displayName ?? "component"}.`,
            );
          }
        }
        const fastDefaultSlot = opts?.defaultSlot;
        if (fastDefaultSlot) bag[fastDefaultSlot] = { props: EMPTY_SLOT_PROPS, children };
        else bag.default = children;
      }
      if (isDev()) warnMissingRequired(bag, opts);
      return bag as SlotBag<R>;
    }

    // Accumulate named slots into a loosely-typed record (TS rejects writes to a
    // generic mapped-type key); the precise per-key entry types are re-attached
    // by the `as SlotBag<R>` assertion when the bag is assembled below.
    const named: Record<string, SlotEntry<unknown>> = {};
    const pooled: React.ReactNode[] = [];
    let defaultChildren: React.ReactNode | undefined;
    const dev = isDev();
    const label = opts?.displayName ?? "component";

    const visit = (child: React.ReactNode): void => {
      // Flatten one level of explicit fragments so `<>{slots}</>` works.
      if (React.isValidElement(child) && child.type === React.Fragment) {
        React.Children.forEach((child.props as { children?: React.ReactNode }).children, visit);
        return;
      }

      if (React.isValidElement(child)) {
        const key = matchSlotKey(child.type, opts?.aliases);
        if (key) {
          if (named[key] && dev) {
            console.warn(`[@knitui] Duplicate <${label}.${key}> slot; the last one wins.`);
          }
          // Bridge cast — the ONE tolerated cast in this helper. Justified by
          // `matchSlotKey` having confirmed `child.type === registry[key]` on
          // the path above, which pins the element's prop type to this slot's.
          // React types `element.props` as `unknown`, so a precise, guarded
          // target type is required; this is a typed bridge, not a widen.
          const marker = child.props as SlotProps<SlotPropsOf<R[Key]>>;
          const { children: slotChildren, ...props } = marker;
          named[key] = { props, children: slotChildren };
          return;
        }
        if (dev && getSlotName(child.type) !== undefined) {
          console.warn(
            `[@knitui] <${getSlotName(child.type)}> is a slot from another component and is ignored inside ${label}.`,
          );
        }
      }

      // Ignore null / undefined / booleans; pool everything else.
      if (child != null && typeof child !== "boolean") pooled.push(child);
    };

    React.Children.forEach(children, visit);

    const defaultSlot = opts?.defaultSlot;
    if (defaultSlot && pooled.length > 0 && !named[defaultSlot]) {
      named[defaultSlot] = { props: {}, children: pooled };
    } else if (pooled.length > 0) {
      defaultChildren = pooled;
    }

    if (dev) warnMissingRequired(named, opts);

    // The named entries plus the pooled `default` children form the bag; the
    // assertion re-attaches the precise per-key types (see the accumulator note).
    return { ...named, default: defaultChildren } as SlotBag<R>;
  }

  return { markers: registry, collect };
}
