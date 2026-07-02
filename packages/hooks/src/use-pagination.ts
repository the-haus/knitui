import { useCallback } from "react";

import { useUncontrolled } from "./use-uncontrolled";

/** Sentinel emitted in `range` where page numbers are collapsed. */
export const DOTS = "dots";

export interface UsePaginationOptions {
  /** Total number of pages. */
  total: number;
  /** Controlled active page (1-based). */
  page?: number;
  /** Uncontrolled initial active page (1-based). @default 1 */
  initialPage?: number;
  /** Sibling pages shown on each side of the active page. @default 1 */
  siblings?: number;
  /** Pages always shown at the start and end. @default 1 */
  boundaries?: number;
  /** Called when the active page changes. */
  onChange?: (page: number) => void;
}

export interface UsePaginationReturn {
  /** The page items to render, with `'dots'` where pages collapse. */
  range: (number | typeof DOTS)[];
  /** The active page (1-based). */
  active: number;
  /** Jump to a specific page (clamped to `[1, total]`). */
  setPage: (page: number) => void;
  /** Go to the next page. */
  next: () => void;
  /** Go to the previous page. */
  previous: () => void;
  /** Go to the first page. */
  first: () => void;
  /** Go to the last page. */
  last: () => void;
}

const range = (start: number, end: number): number[] => {
  const length = end - start + 1;
  return Array.from({ length }, (_, index) => index + start);
};

/**
 * Pagination state + the classic truncated page range with `'dots'` — port of
 * Mantine's `usePagination`. Controlled/uncontrolled via `useUncontrolled`. Pure
 * computation, so identical on web and native.
 */
export function usePagination({
  total,
  page,
  initialPage = 1,
  siblings = 1,
  boundaries = 1,
  onChange,
}: UsePaginationOptions): UsePaginationReturn {
  const totalPages = Math.max(Math.trunc(total), 0);

  const [activePage, setActivePage] = useUncontrolled<number>({
    value: page,
    onChange,
    defaultValue: initialPage,
    finalValue: initialPage,
  });

  const setPage = useCallback(
    (pageNumber: number) => {
      if (pageNumber <= 0) {
        setActivePage(1);
      } else if (pageNumber > totalPages) {
        setActivePage(totalPages);
      } else {
        setActivePage(pageNumber);
      }
    },
    [setActivePage, totalPages],
  );

  const next = useCallback(() => setPage(activePage + 1), [setPage, activePage]);
  const previous = useCallback(() => setPage(activePage - 1), [setPage, activePage]);
  const first = useCallback(() => setPage(1), [setPage]);
  const last = useCallback(() => setPage(totalPages), [setPage, totalPages]);

  const paginationRange = ((): (number | typeof DOTS)[] => {
    // Total page numbers that would render without any truncation.
    const totalPageNumbers = siblings * 2 + 3 + boundaries * 2;
    if (totalPageNumbers >= totalPages) {
      return range(1, totalPages);
    }

    const leftSiblingIndex = Math.max(activePage - siblings, boundaries);
    const rightSiblingIndex = Math.min(activePage + siblings, totalPages - boundaries);

    const shouldShowLeftDots = leftSiblingIndex > boundaries + 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - (boundaries + 1);

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = siblings * 2 + boundaries + 2;
      return [
        ...range(1, leftItemCount),
        DOTS,
        ...range(totalPages - (boundaries - 1), totalPages),
      ];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = boundaries + 1 + 2 * siblings;
      return [...range(1, boundaries), DOTS, ...range(totalPages - rightItemCount + 1, totalPages)];
    }

    return [
      ...range(1, boundaries),
      DOTS,
      ...range(leftSiblingIndex, rightSiblingIndex),
      DOTS,
      ...range(totalPages - boundaries + 1, totalPages),
    ];
  })();

  return {
    range: paginationRange,
    active: activePage,
    setPage,
    next,
    previous,
    first,
    last,
  };
}
