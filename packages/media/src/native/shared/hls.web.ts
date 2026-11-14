/**
 * HLS on browsers that cannot play it themselves.
 *
 * Safari plays an `.m3u8` straight from `src`. Chrome, Firefox and Edge do not, so
 * for them the stream is fed to the element through Media Source Extensions by
 * hls.js. The library is loaded on demand, the first time such a source is played:
 * a page that never plays HLS, and every Safari visitor, never downloads it.
 *
 * Shared by the web audio and video players, which call {@link syncHlsSource} at
 * the two moments an element's source changes and {@link detachHls} when the
 * element goes away.
 */
import type Hls from "hls.js";

export interface HlsSourceOptions {
  /** `"hls"` forces HLS for a URL that does not end in `.m3u8`. */
  contentType?: string;
  /** Request headers for the playlist and every segment (auth tokens, …). */
  headers?: Record<string, string>;
}

const HLS_MIME = "application/vnd.apple.mpegurl";

let nativeSupport: boolean | null = null;

/** Whether the browser plays HLS from `src` on its own (Safari, iOS browsers). */
function playsHlsNatively(): boolean {
  if (nativeSupport === null) {
    nativeSupport =
      typeof document !== "undefined" &&
      document.createElement("video").canPlayType(HLS_MIME) !== "";
  }
  return nativeSupport;
}

export function isHlsSource(uri: string, contentType?: string): boolean {
  return contentType === "hls" || /\.m3u8(\?|#|$)/i.test(uri);
}

/** Whether this source has to go through hls.js in this browser. */
export function needsHlsLibrary(uri: string | null | undefined, contentType?: string): boolean {
  return Boolean(uri) && isHlsSource(uri as string, contentType) && !playsHlsNatively();
}

/** One detach per element that hls.js is (or is about to be) attached to. */
const attached = new WeakMap<HTMLMediaElement, () => void>();

/** Tell the element's listeners playback failed, the way a bad `src` would. */
function reportError(media: HTMLMediaElement): void {
  media.dispatchEvent(new Event("error"));
}

function attach(media: HTMLMediaElement, uri: string, headers?: Record<string, string>): void {
  let cancelled = false;
  let instance: Hls | null = null;
  attached.set(media, () => {
    cancelled = true;
    instance?.destroy();
    instance = null;
  });

  import("hls.js").then(
    ({ default: HlsLibrary }) => {
      if (cancelled) return;
      if (!HlsLibrary.isSupported()) {
        reportError(media);
        return;
      }
      const hls = new HlsLibrary({
        xhrSetup: headers
          ? (xhr) => {
              for (const name of Object.keys(headers)) xhr.setRequestHeader(name, headers[name]);
            }
          : undefined,
      });
      instance = hls;
      // hls.js retries what it can by itself. A fatal error gets one recovery of
      // its kind (reload after a network drop, a decoder reset after a bad
      // segment); a second one is reported.
      let recoveredNetwork = false;
      let recoveredMedia = false;
      hls.on(HlsLibrary.Events.ERROR, (_event, data) => {
        if (!data.fatal || cancelled) return;
        if (data.type === HlsLibrary.ErrorTypes.NETWORK_ERROR && !recoveredNetwork) {
          recoveredNetwork = true;
          hls.startLoad();
          return;
        }
        if (data.type === HlsLibrary.ErrorTypes.MEDIA_ERROR && !recoveredMedia) {
          recoveredMedia = true;
          hls.recoverMediaError();
          return;
        }
        detachHls(media);
        reportError(media);
      });
      hls.loadSource(uri);
      hls.attachMedia(media);
    },
    () => {
      if (!cancelled) reportError(media);
    },
  );
}

/** Stop feeding the element and free the stream. Safe to call on any element. */
export function detachHls(media: HTMLMediaElement): void {
  const detach = attached.get(media);
  if (!detach) return;
  attached.delete(media);
  detach();
}

/**
 * Point the element at `uri`. Returns `true` when hls.js took the source over, in
 * which case the caller must NOT set `src` itself (hls.js owns it); `false` means
 * an ordinary source the caller assigns as usual.
 */
export function syncHlsSource(
  media: HTMLMediaElement,
  uri: string | null | undefined,
  options: HlsSourceOptions = {},
): boolean {
  detachHls(media);
  if (!uri || !needsHlsLibrary(uri, options.contentType)) return false;
  attach(media, uri, options.headers);
  return true;
}

/** TEST ONLY: forget the cached capability probe. */
export function resetHlsSupportForTests(): void {
  nativeSupport = null;
}
