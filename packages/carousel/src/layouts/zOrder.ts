/**
 * How many pages from the centre the paint-order ramp stays strictly
 * decreasing. A mounted window rarely spans more than ±8 pages (the default
 * large-data window is 11), so 16 leaves headroom for wide custom windows.
 */
export const Z_RAMP_PAGES = 16;

/** zIndex step per page of distance from the centre. */
export const Z_STEP = 100;

/**
 * Paint order for a layout that stacks slides around the centre (fade, depth,
 * flip, cube, coverflow, parallax): highest at the centre, STRICTLY decreasing
 * with distance across the whole mounted window, never negative.
 *
 * Every one of those layouts used to clamp `zIndex` to 0 from one page away, so
 * all farther slides tied at 0 and painted in mount order: on the trailing side
 * a slide two pages out painted OVER the one a page out. The ramp keeps the
 * nearer slide on top at any distance. A worklet: it runs inside the layout
 * worklets on the UI thread and in the web painter.
 */
export function distanceZ(progress: number): number {
  "worklet";
  const dist = Math.min(Math.abs(progress), Z_RAMP_PAGES);
  return Math.round((Z_RAMP_PAGES - dist) * Z_STEP);
}
