/**
 * Open modal sheets, oldest first, so Escape and Android back reach only the topmost.
 * Modal sheets open in the order the user sees them stack, whichever mounted first.
 */
const stack: symbol[] = [];

/** Record a sheet as the new topmost. Returns the call that removes it. */
export function pushSheet(id: symbol): () => void {
  stack.push(id);
  return () => {
    const i = stack.lastIndexOf(id);
    if (i >= 0) stack.splice(i, 1);
  };
}

/** Whether `id` is the topmost open modal sheet. */
export function isTopSheet(id: symbol): boolean {
  return stack[stack.length - 1] === id;
}

/** Whether any modal sheet is open. */
export function hasOpenSheet(): boolean {
  return stack.length > 0;
}

let bodyLocks = 0;
let bodyOverflow = "";

/**
 * Lock page scroll while any modal sheet is open. Counted, because sheets close in any
 * order: each saving and restoring the value itself leaves the page locked for good
 * when the first one opened closes first. Returns the call that releases this lock.
 */
export function lockBodyScroll(): () => void {
  if (typeof document === "undefined") return () => {};
  if (bodyLocks === 0) {
    bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  bodyLocks += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    bodyLocks -= 1;
    if (bodyLocks === 0) document.body.style.overflow = bodyOverflow;
  };
}
