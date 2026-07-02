/**
 * Uniform per-slot style passthrough (Pillar B of `docs/styling-system-plan.md`).
 *
 * Framework-agnostic, pure-TypeScript composition primitive — no Tamagui or
 * component coupling — so it lives in `@knitui/core` beside the marker-slot system
 * (`./slots`) and is shared by every kit (`@knitui/components`, `@knitui/dates`, …).
 * Consumers import `slotStyles` / `SlotStyles` / `pick` from `@knitui/core`.
 *
 * The kit has ONE styling model: style props on the parts themselves (compose
 * `<Notification.Title color="$red9" />` and you're done). The `styles` prop is
 * thin, optional sugar over that — a map from a component's named slots to props
 * spread onto the corresponding styled part. It replaces the ad-hoc
 * `labelProps` / `iconProps` / `closeButtonProps` sprawl with one consistent
 * shape across every multi-part component.
 *
 * A component:
 *   1. declares its slot→props map once (`interface NotificationStyles { … }`),
 *   2. accepts `styles?: SlotStyles<NotificationStyles>`,
 *   3. spreads `{...styles?.title}` onto each part (optionally via the typed
 *      `getter` from `slotStyles`, which also dev-warns unknown slot keys).
 *
 * No parallel styling system: every key resolves to plain part props, so the
 * `styles` map can never express anything the composable parts can't.
 *
 * ## Precedence — "explicit beats sugar" (the ONE rule)
 *
 * The `styles` map is the LOWEST-precedence sugar. Anything more explicit wins.
 * Canonical order, low → high:
 *
 *   defaults  <  styles[slot]  <  explicit xxxProps  <  inline props on a composed part
 *
 * Use `merge(slot, explicitProps)` at every call site: it spreads the slot sugar
 * UNDER the explicit per-part props, so the explicit props always win. This is the
 * single place the direction is defined — call sites can't reorder it wrong.
 * (`get(slot)` remains for parts that have no competing explicit prop.)
 */

const isDev = (): boolean => process.env.NODE_ENV !== "production";

/**
 * A component's slot→props map: an interface whose keys are the named slots and
 * whose values are the props object of the styled part each slot targets.
 * (Unconstrained so plain `interface` declarations — which lack an implicit index
 * signature — can be used as the map.)
 */
export type SlotStyleMap = object;

/**
 * The shape of a component's `styles` prop: one optional entry per named slot,
 * typed to that slot's part props.
 */
export type SlotStyles<M> = { [K in keyof M]?: M[K] };

/**
 * The resolved value of a single slot as handed back by the accessor: a PARTIAL
 * of the part's props (with any `undefined` from the map's optional membership
 * stripped first). The `styles` map is sugar — every slot is an optional
 * override, so the accessor never forces a part's *required* props (e.g. an
 * item's `value`) onto a caller that only wants to tweak a colour. This is why
 * `get`/`merge` operate on partials even though the map stores the full shape.
 */
export type SlotValue<M, K extends keyof M> = Partial<NonNullable<M[K]>>;

/**
 * The typed accessor over a `styles` map returned by {@link slotStyles}. Shared
 * so wrappers (e.g. `internal/overlay-chrome.ts`) can re-expose the exact shape
 * without restating it.
 */
export interface SlotAccessor<M> {
  get: <K extends keyof M>(key: K) => SlotValue<M, K> | undefined;
  merge: <K extends keyof M>(key: K, explicit: SlotValue<M, K> | undefined) => SlotValue<M, K>;
}

/**
 * Build a typed accessor over a `styles` map.
 *
 * - `get(key)` returns the props for a slot (or `undefined`); spread it onto the
 *   matching part for slots that have no competing explicit prop:
 *   `{...s.get("title")}`.
 * - `merge(key, explicit)` spreads the slot sugar UNDER `explicit`, so the
 *   explicit per-part props always win (the "explicit beats sugar" rule). Use it
 *   wherever a legacy `xxxProps` competes with a slot: `{...s.merge("error", errorProps)}`.
 *   Undefined-safe on both sides.
 *
 * In development it warns once per render for keys that aren't real slots —
 * catching typos from JS callers that TypeScript wouldn't flag.
 */
export function slotStyles<M>(
  styles: SlotStyles<M> | undefined,
  knownSlots: readonly (keyof M & string)[],
  displayName?: string,
): SlotAccessor<M> {
  if (isDev() && styles) {
    const known = new Set<string>(knownSlots);
    for (const key of Object.keys(styles)) {
      if (!known.has(key)) {
        console.warn(
          `[@knitui/core] Unknown slot "${key}" in ${displayName ?? "component"} styles={…}. Known slots: ${knownSlots.join(", ")}.`,
        );
      }
    }
  }
  // The map stores the full part props; the accessor hands back a partial of
  // them (the slot is an optional override), so a single assertion re-types the
  // looked-up value — TS can't prove `M[K]` is a partial of itself generically.
  function get<K extends keyof M>(key: K): SlotValue<M, K> | undefined {
    return styles?.[key] as SlotValue<M, K> | undefined;
  }
  // The spread of two same-typed partials is a partial of the same shape; TS
  // can't prove that for a generic `M[K]`, so a single assertion re-attaches the
  // slot's type to the freshly-built object.
  function merge<K extends keyof M>(
    key: K,
    explicit: SlotValue<M, K> | undefined,
  ): SlotValue<M, K> {
    return { ...styles?.[key], ...explicit } as SlotValue<M, K>;
  }
  return { get, merge };
}

/**
 * Project a `styles` map down to a sub-map containing ONLY the requested slot keys
 * that the map actually carries.
 *
 * Used where a component forwards its `styles` sugar into a child that owns just a
 * subset of the slots (e.g. a selection control forwarding the field-chrome slots —
 * `wrapper`/`label`/`description`/`error`/`required` — to its trigger's
 * `Input.Wrapper`, while keeping the dropdown/option/pill slots flowing to the parts
 * that consume them). Without the split, the child's own `slotStyles` dev-warning
 * fires for every slot it doesn't recognise.
 *
 * The requested `keys` are the TARGET vocabulary (e.g. `InputWrapperSlots`); they
 * need not all be declared on the source map `M`. Each key is looked up on the
 * source map and forwarded only when present, and the result is typed to the
 * TARGET vocabulary `T` — the shared slots target the same parts on both maps,
 * so the value shapes line up. Returns `undefined` when `styles` is `undefined`
 * or none of the keys are present, so it can be passed straight through as an
 * optional `styles` prop.
 */
export function pick<M, T>(
  styles: SlotStyles<M> | undefined,
  keys: readonly (keyof T & string)[],
): SlotStyles<T> | undefined {
  if (!styles) return undefined;
  const source = styles as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  let any = false;
  for (const key of keys) {
    if (key in source && source[key] !== undefined) {
      out[key] = source[key];
      any = true;
    }
  }
  return any ? (out as SlotStyles<T>) : undefined;
}
