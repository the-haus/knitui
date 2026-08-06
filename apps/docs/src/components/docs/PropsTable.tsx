import Link from "next/link";

import { componentProps, type PropRecord, propsData } from "@/lib/registry";

import { InlineMarkdown } from "../mdx/InlineMarkdown";

/**
 * The generated props reference.
 *
 * Three tables, in the order a reader needs them:
 *
 *  1. **Props** — everything declared by this component (plus the kit's system
 *     props, which are marked so they're recognisable across pages).
 *  2. **Style slots** — the `styles` keys, read off the component's own
 *     `SlotStyles<…>` type.
 *  3. **Inherited style props** — a count and a disclosure, never an inline dump:
 *     every component is a `styled(Box)` frame, so all ~500 are the same list.
 *
 * Types, defaults, requiredness and descriptions come from
 * `scripts/docs/build-props.mjs`. Where the checker can only reduce a Tamagui
 * variant to `unknown`, the accepted values from the story's `argTypes` are shown
 * instead — see the `options` column.
 */
export function PropsTable({ id }: { id: string }) {
  const data = componentProps(id);

  if (!data) {
    return (
      <>
        <h2 id="props">Props</h2>
        <div className="callout callout--warning">
          <span className="callout__label">Not yet generated</span>
          <p>
            Prop extraction did not resolve this component. Run
            <code> pnpm docs:generate</code>, or add an override in
            <code> apps/docs/content/overrides/</code>.
          </p>
        </div>
      </>
    );
  }

  const own = data.props.filter((prop) => prop.bucket === "own" || prop.bucket === "system");
  const aria = data.props.filter((prop) => prop.bucket === "react");
  const styleCount = data.counts.style ?? 0;

  return (
    <>
      <h2 id="props">Props</h2>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Prop</th>
              <th>Type</th>
              <th>Default</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {own.map((prop) => (
              <PropRow key={prop.name} prop={prop} />
            ))}
          </tbody>
        </table>
      </div>

      {data.slots?.length ? (
        <>
          <h3 id="style-slots">Style slots</h3>
          <p>
            Every part of {data.component} can be styled through the <code>styles</code> prop.
            Explicit props on the component always win over slot styles.
          </p>
          {/*
           * Slot, then what it targets — not the old "Usage" column, which
           * repeated `styles={{ <key>: { … } }}` on every row and so carried no
           * information the sentence above the table doesn't already give. Which
           * PART a key styles is the thing a reader can't guess, and it comes
           * free from the TSDoc on the component's slot interface.
           */}
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Slot</th>
                  <th>Targets</th>
                </tr>
              </thead>
              <tbody>
                {data.slots.map((slot) => (
                  <tr key={slot.name}>
                    <td>
                      <code>{slot.name}</code>
                    </td>
                    <td>
                      {slot.description ? (
                        <InlineMarkdown text={slot.description} />
                      ) : (
                        <span className="cell-empty">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {aria.length ? (
        <details>
          <summary>Accessibility &amp; DOM props ({aria.length})</summary>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Prop</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {aria.map((prop) => (
                  <tr key={prop.name}>
                    <td>
                      <code>{prop.name}</code>
                    </td>
                    <td>
                      <code>{prop.type}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}

      {styleCount ? (
        <p>
          Plus <strong>{styleCount} inherited style props</strong> from <code>Box</code> — the full
          Tamagui/React Native style surface, including token shorthands like <code>p</code>,{" "}
          <code>mx</code>, <code>bg</code> and <code>c</code>. See{" "}
          <Link href="/docs/foundations/tokens">Tokens</Link> for the scales they accept, or{" "}
          <Link href="/docs/api/style-props">the full list</Link>.
        </p>
      ) : null}
    </>
  );
}

function PropRow({ prop }: { prop: PropRecord }) {
  return (
    <tr>
      <td>
        <code>{prop.name}</code>
        {prop.required ? (
          <>
            {" "}
            <span className="badge badge--warn">required</span>
          </>
        ) : null}
        {prop.bucket === "system" ? (
          <>
            {" "}
            <span className="badge" title="Part of the kit's shared system props">
              system
            </span>
          </>
        ) : null}
      </td>
      <td>
        <code>{prop.type}</code>
        {prop.options?.length ? (
          <div style={{ marginTop: "0.25rem", fontSize: "0.75rem", color: "var(--docs-muted)" }}>
            {prop.options.map((option) => (option === null ? "unset" : String(option))).join(" · ")}
          </div>
        ) : null}
      </td>
      <td>{prop.default !== undefined ? <code>{prop.default}</code> : "—"}</td>
      {/*
       * An em dash, not an empty cell. A blank Description reads as a broken
       * table; a dash reads as "nothing to say here yet", which is the truth —
       * descriptions come from TSDoc on the prop, so a gap here is a gap in the
       * package (see `scripts/docs/check-coverage.mjs`, which gates on it).
       */}
      <td>{prop.description ? prop.description : <span className="cell-empty">—</span>}</td>
    </tr>
  );
}

/** The shared inherited-style-prop table, for `/docs/api/style-props`. */
export function StylePropsTable() {
  const { styleProps } = propsData();

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {styleProps.map((prop) => (
            <tr key={prop.name}>
              <td>
                <code>{prop.name}</code>
              </td>
              <td>
                <code>{prop.type}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
