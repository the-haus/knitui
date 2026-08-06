import { isMarker, markerSource, printValue } from "./markers";

/**
 * Print a bag of args as the JSX that would produce them.
 *
 * This is the playground's snippet: regenerated on every control change so the
 * code under the stage always matches what is on the stage. It lives here rather
 * than inside the component so the guardrail
 * (`scripts/docs/check-live-highlight.mjs`) can print every component's snippet
 * and check the client highlighter colours it the way Shiki would.
 *
 * An arg the generator could only capture as a marker is printed as its original
 * source text (`ratio={16 / 9}`, `icon={<Text>ⓘ</Text>}`) — that is what the story
 * file says, and it's what a reader can paste.
 */
export function toJsx(componentName: string, args: Record<string, unknown>): string {
  const entries = Object.entries(args).filter(([, value]) => value !== undefined);
  const children = entries.find(([key]) => key === "children")?.[1];

  const attributes = entries
    .filter(([key]) => key !== "children")
    .map(([key, value]) => {
      if (value === true) return key;
      if (typeof value === "string") return `${key}=${JSON.stringify(value)}`;
      const printed = printValue(value);
      return printed === undefined ? null : `${key}={${printed}}`;
    })
    .filter(Boolean) as string[];

  const open = attributes.length
    ? `<${componentName}\n  ${attributes.join("\n  ")}\n`
    : `<${componentName}`;

  const body =
    typeof children === "string" && children.length
      ? children
      : isMarker(children)
        ? indentChildren(markerSource(children)!)
        : undefined;

  if (body !== undefined) {
    return `${open}>\n  ${body}\n</${componentName}>`;
  }
  return `${open}${attributes.length ? "/>" : " />"}`;
}

/**
 * Marker children as JSX, re-indented one level under the opening tag.
 *
 * The source text arrives with whatever indentation it had in the story file, so
 * the common leading indent of the continuation lines is stripped first.
 */
function indentChildren(source: string): string {
  const text = source.startsWith("<") ? source : `{${source}}`;
  const lines = text.replace(/\t/g, "  ").split("\n");
  const indents = lines
    .slice(1)
    .filter((line) => line.trim())
    .map((line) => line.match(/^ */)![0].length);
  const common = indents.length ? Math.min(...indents) : 0;
  return [lines[0], ...lines.slice(1).map((line) => line.slice(common))].join("\n  ");
}
