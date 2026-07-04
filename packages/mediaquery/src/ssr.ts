/**
 * Server-side device detection helpers for seeding {@link MediaQueryProvider}.
 *
 * A server cannot measure the viewport, so width-based queries can only be
 * *guessed* at SSR time. The most reliable signal without JS is the request
 * `User-Agent` header (or the `Sec-CH-UA-Mobile` client hint, if you prefer —
 * pass its boolean straight to `deviceSeedFromDeviceClass`). Feed the resulting
 * seed to `<MediaQueryProvider seed={...}>` so the first server + client render
 * agree on mobile vs. desktop.
 *
 * Next.js (App Router) example:
 *
 * ```tsx
 * import { headers } from "next/headers";
 * import { MediaQueryProvider, deviceSeedFromUserAgent } from "@knitui/mediaquery";
 *
 * export default async function RootLayout({ children }) {
 *   const ua = (await headers()).get("user-agent");
 *   return (
 *     <MediaQueryProvider seed={deviceSeedFromUserAgent(ua)}>{children}</MediaQueryProvider>
 *   );
 * }
 * ```
 */
import type { MediaSeed } from "./context";

export type DeviceClass = "mobile" | "tablet" | "desktop";

// Order matters: tablets (notably iPad) can also match the phone patterns.
const TABLET_RE = /ipad|tablet|playbook|silk|(android(?!.*mobile))/i;
const MOBILE_RE = /android|iphone|ipod|iemobile|blackberry|bada|windows phone|opera mini|mobile/i;

/** Representative viewport for each device class, used to seed width-based queries. */
export const DEVICE_SEEDS: Record<DeviceClass, { width: number; height: number }> = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 820, height: 1180 },
  desktop: { width: 1280, height: 800 },
};

/** Classify a `User-Agent` string as mobile / tablet / desktop (best effort). */
export function detectDeviceClass(userAgent: string | null | undefined): DeviceClass {
  if (!userAgent) return "desktop";
  if (TABLET_RE.test(userAgent)) return "tablet";
  if (MOBILE_RE.test(userAgent)) return "mobile";
  return "desktop";
}

/** A representative {@link MediaSeed} for a device class. */
export function deviceSeedFromDeviceClass(device: DeviceClass): MediaSeed {
  return { ...DEVICE_SEEDS[device] };
}

/** Build a {@link MediaSeed} from a request `User-Agent` header. */
export function deviceSeedFromUserAgent(userAgent: string | null | undefined): MediaSeed {
  return deviceSeedFromDeviceClass(detectDeviceClass(userAgent));
}
