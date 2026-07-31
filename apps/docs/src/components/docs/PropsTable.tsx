import Link from "next/link";

import { componentProps, type PropRecord, propsData } from "@/lib/registry";

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
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Slot</th>
                  <th>Usage</th>
                </tr>
              </thead>
              <tbody>
                {data.slots.map((slot) => (
                  <tr key={slot}>
                    <td>
                      <code>{slot}</code>
                    </td>
                    <td>
                      <code>{`styles={{ ${slot}: { … } }}`}</code>
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
      <td>{prop.description ?? ""}</td>
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
