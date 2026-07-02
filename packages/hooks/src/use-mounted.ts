import { useEffect, useState } from "react";

/**
 * `false` during the initial render, `true` after mount — port of Mantine's
 * `useMounted`. Useful for deferring client-only / post-mount UI. Pure React, so
 * identical on web and native.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
