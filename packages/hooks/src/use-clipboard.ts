import { useEffect, useRef, useState } from "react";

export interface UseClipboardOptions {
  /** Time in ms after which the `copied` state resets. @default 2000 */
  timeout?: number;
}

export interface UseClipboardReturnValue {
  /** Copy a string value to the clipboard. */
  copy: (value: string) => void;
  /** Reset the `copied` state and any error. */
  reset: () => void;
  /** The error if the last copy failed, otherwise `null`. */
  error: Error | null;
  /** `true` for `timeout` ms after a successful copy. */
  copied: boolean;
}

/**
 * Copy-to-clipboard state — port of Mantine's `useClipboard`. Guarded for
 * native/SSR: when `navigator.clipboard` is unavailable it records an `error`
 * instead of assuming a global. `copied` flips `true` for `timeout` ms after a
 * successful copy. Backs `CopyButton`.
 */
export function useClipboard({
  timeout = 2000,
}: UseClipboardOptions = {}): UseClipboardReturnValue {
  const [error, setError] = useState<Error | null>(null);
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    },
    [],
  );

  const handleCopyResult = (value: boolean) => {
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), timeout);
    setCopied(value);
  };

  const copy = (value: string) => {
    if (typeof navigator !== "undefined" && "clipboard" in navigator && navigator.clipboard) {
      navigator.clipboard
        .writeText(value)
        .then(() => {
          setError(null);
          handleCopyResult(true);
        })
        .catch((err: Error) => setError(err));
    } else {
      setError(new Error("useClipboard: navigator.clipboard is not supported"));
    }
  };

  const reset = () => {
    setCopied(false);
    setError(null);
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
  };

  return { copy, reset, error, copied };
}
