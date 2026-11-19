import * as React from "react";

/** Key of the marker this hook adds to `history.state`. */
const KEY = "__knituiSheet";
let nextToken = 0;

/**
 * Web: let the browser's Back close an open sheet, as Android's hardware Back does.
 *
 * While `enabled`, the sheet owns one history entry: opening pushes it, Back pops it
 * (`onBack` runs), and closing the sheet any other way (✕, scrim, Escape, code)
 * steps back over it, so the page's own history is left as it was. The URL never
 * changes.
 *
 * The pushed state is a COPY of the current one plus a marker, so a router reading
 * `history.state` on popstate (Next.js, React Router, Expo Router) still finds its
 * own fields there and treats a Forward onto the entry as the page it already shows.
 * Nested sheets each own an entry, so Back closes the topmost first.
 *
 * Leaving `enabled` and coming straight back in the same task (React StrictMode's
 * effect replay) keeps the entry rather than stepping back and pushing again, which
 * would race: `history.back()` is asynchronous and would pop the new entry.
 */
export function useBrowserBack(enabled: boolean, onBack: () => void): void {
  const onBackRef = React.useRef(onBack);
  onBackRef.current = onBack;
  /** The entry this sheet owns, and a pending step back over it. */
  const ownRef = React.useRef<{ token: number; leave?: ReturnType<typeof setTimeout> } | null>(
    null,
  );

  React.useEffect(() => {
    if (!enabled || typeof window === "undefined" || !window.history) return undefined;
    const { history } = window;
    const ownsCurrent = (token: number) =>
      (history.state as Record<string, unknown> | null)?.[KEY] === token;

    let own = ownRef.current;
    if (own && own.leave !== undefined && ownsCurrent(own.token)) {
      // Re-entered before the step back ran: keep the entry.
      clearTimeout(own.leave);
      own.leave = undefined;
    } else {
      own = { token: ++nextToken };
      const state = (history.state as Record<string, unknown> | null) ?? {};
      history.pushState({ ...state, [KEY]: own.token }, "");
    }
    ownRef.current = own;
    const entry = own;

    let popped = false;
    const onPopState = () => {
      if (popped || ownsCurrent(entry.token)) return;
      // Our entry is no longer current. Only a Back from it (to the entry below)
      // closes the sheet; anything else, e.g. a jump further back, does too.
      popped = true;
      ownRef.current = null;
      onBackRef.current();
    };
    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
      if (popped) return;
      // Closed some other way: step back over our entry, unless the page has
      // already navigated past it (then it is not ours to remove).
      entry.leave = setTimeout(() => {
        entry.leave = undefined;
        if (ownRef.current === entry) ownRef.current = null;
        if (ownsCurrent(entry.token)) history.back();
      }, 0);
    };
  }, [enabled]);
}
