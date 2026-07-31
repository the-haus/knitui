"use client";

import { useState } from "react";

/** Copy-to-clipboard for code blocks and install snippets. */
export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="button-quiet"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          // Clipboard access can be denied (permissions, insecure context);
          // silently keep the un-copied state rather than throwing in the UI.
        }
      }}
    >
      {copied ? "Copied" : label}
    </button>
  );
}
