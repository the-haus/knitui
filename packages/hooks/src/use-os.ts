import { useEffect, useState } from "react";

import type { OS } from "./use-os.shared";

function getOS(): OS {
  if (typeof navigator === "undefined") return "undetermined";

  const ua = navigator.userAgent;
  if (/(iPhone|iPad|iPod)/i.test(ua)) return "ios";
  if (/(Macintosh|MacIntel|MacPPC|Mac68K)/i.test(ua)) return "macos";
  if (/(Win32|Win64|Windows|WinCE)/i.test(ua)) return "windows";
  if (/Android/i.test(ua)) return "android";
  if (/Linux/i.test(ua)) return "linux";
  return "undetermined";
}

/**
 * Detect the operating system from the user agent (web) — port of Mantine's
 * `useOs`. Resolves after mount to stay SSR-safe (`undetermined` first render).
 * The `use-os.native` sibling reads React Native's `Platform.OS`.
 */
export function useOs(): OS {
  const [os, setOs] = useState<OS>("undetermined");

  useEffect(() => {
    setOs(getOS());
  }, []);

  return os;
}
