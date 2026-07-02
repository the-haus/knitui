import * as React from "react";

const isTextNode = (child: React.ReactNode): child is string | number =>
  typeof child === "string" || typeof child === "number";

/**
 * Auto-wrap text children (`string`/`number`) in the given text `Wrapper` so
 * they render as themed text, while passing element/node children through
 * untouched. DRYs the `typeof children === "string" ? <Wrapper>{children}</Wrapper>
 * : children` idiom shared by `Blockquote` / `Badge` / `List.Item` /
 * `Breadcrumbs` (mirrors how `transitionProps` hoists a repeated idiom).
 *
 * Three cases, so content-rich containers (`Modal` / `Drawer` / `Dialog` bodies)
 * can hold arbitrary children, not just text:
 *
 * 1. **Pure text** — including mixed inline runs like `{cond ? "Hide" : "Show"}
 *    details` (which arrive as an array `["Hide", " details"]`) — wrap the whole
 *    thing once so the run stays contiguous. A bare `typeof children === "string"`
 *    check would miss the array form and leak a raw string into a View (RN's
 *    "Text strings must be rendered within a <Text>").
 * 2. **Pure elements** — passed through untouched.
 * 3. **Mixed text + elements** (`"Confirm " <Button/>`) — wrap only the
 *    *contiguous* text/number runs in `Wrapper`, leaving element nodes as
 *    siblings. Wrapping the whole `children` here would nest the elements inside
 *    a `<Text>`, which breaks on native (a View cannot live inside RN `<Text>`)
 *    and wrongly cascades text styling onto them.
 *
 * `Wrapper` is the component's OWN styled text element (`BadgeText`,
 * `ListItemLabel`, the primitive `Text`, …) so each component keeps its styling.
 * Typed precisely — `Wrapper` only needs to accept `children`; styled components
 * (whose other props are all optional) satisfy this without a cast.
 */
export function renderTextChild(
  children: React.ReactNode,
  Wrapper: React.ComponentType<{ children: React.ReactNode }>,
): React.ReactNode {
  const array = React.Children.toArray(children);

  // (2) No text at all → pass elements through untouched.
  if (!array.some(isTextNode)) return children;

  // (1) Entirely text/number → wrap once, preserving the original `children`
  // (and any inline run) verbatim.
  if (array.every(isTextNode)) return <Wrapper>{children}</Wrapper>;

  // (3) Mixed → wrap each contiguous text run; keep elements as siblings.
  const out: React.ReactNode[] = [];
  let run: React.ReactNode[] = [];
  const flushRun = () => {
    if (run.length > 0) {
      out.push(<Wrapper key={`text-${out.length}`}>{run}</Wrapper>);
      run = [];
    }
  };
  for (const child of array) {
    if (isTextNode(child)) {
      run.push(child);
    } else {
      flushRun();
      out.push(child);
    }
  }
  flushRun();
  return out;
}
