import type { ReactNode } from "react";

const LABELS = {
  note: "Note",
  warning: "Warning",
  platform: "Platform",
} as const;

/**
 * Prose callout.
 *
 *   <Callout kind="platform">
 *   On Android, `readOnly` inputs receive no press events…
 *   </Callout>
 *
 * `platform` is the one that earns its place in a cross-platform kit: it marks
 * behaviour that differs between web, iOS and Android.
 */
export function Callout({
  kind = "note",
  title,
  children,
}: {
  kind?: keyof typeof LABELS;
  title?: string;
  children: ReactNode;
}) {
  return (
    <aside className={`callout callout--${kind}`}>
      <span className="callout__label">{title ?? LABELS[kind]}</span>
      {children}
    </aside>
  );
}
