"use client";

import { CopyButton } from "../example/CopyButton";
import { useSharedChoice } from "./Tabs";

type Variant = { value: string; command: string; html: string };

/**
 * The interactive half of `<InstallCommand>`: a segmented package-manager picker
 * in the code block's header, and the matching pre-highlighted command below it.
 *
 * Only the selected variant is in the DOM — the alternatives are one line of
 * shell each, and the copy button has to copy exactly what is on screen.
 */
export function InstallCommandClient({ variants }: { variants: Variant[] }) {
  const [active, select] = useSharedChoice(
    "package-manager",
    variants.map((variant) => variant.value),
  );
  const current = variants.find((variant) => variant.value === active) ?? variants[0];

  return (
    <div className="code">
      <div className="code__head">
        <div className="segmented" role="group" aria-label="Package manager">
          {variants.map((variant) => (
            <button
              key={variant.value}
              type="button"
              className="segmented__item"
              aria-pressed={variant.value === current.value}
              data-active={variant.value === current.value}
              onClick={() => select(variant.value)}
            >
              {variant.value}
            </button>
          ))}
        </div>
        <span className="header__spacer" />
        <CopyButton value={current.command} />
      </div>
      <div dangerouslySetInnerHTML={{ __html: current.html }} />
    </div>
  );
}
