import { useRef } from "react";

/**
 * `true` on the first render, `false` afterwards — port of Mantine's
 * `useIsFirstRender`. Updates during render (no effect), so it's correct even
 * before effects flush. Pure React, so identical on web and native.
 */
export function useIsFirstRender(): boolean {
  const renderRef = useRef(true);

  if (renderRef.current === true) {
    renderRef.current = false;
    return true;
  }

  return renderRef.current;
}
