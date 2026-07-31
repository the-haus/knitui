/**
 * The Knit UI mark: two interlocking links on the brand ramp.
 *
 * The motif is the product name taken literally — two loops that pass through
 * each other, one over and one under, the smallest unit of a knit. It reads as a
 * link/knot at 16px and still holds together at hero size.
 *
 * The over-under is done without masks: each link is stroked twice, first with a
 * fat "casing" stroke painted in the *same* gradient as the tile behind it, then
 * with the white stroke on top. The casing erases whatever it crosses. That only
 * works because the gradient is `userSpaceOnUse` — with the default
 * `objectBoundingBox` every element would resolve its own gradient box and the
 * casing would no longer line up with the tile.
 */

/*
 * Two stadium links (rx = height / 2) overlapping by three units. The overlap is
 * deliberately small: their end arcs — centred at x=12 and x=20, both r=5.5 —
 * then cross at exactly two points, (16, 12.2) and (16, 19.8), which is what
 * produces a chain-link read. Widen the overlap and the arcs meet at a shallow
 * angle instead, and the middle collapses into a lens.
 */
const LINK_A = { x: 4.5, y: 10.5, width: 13, height: 11, rx: 5.5 } as const;
const LINK_B = { x: 14.5, y: 10.5, width: 13, height: 11, rx: 5.5 } as const;

const STROKE = 2.6;
const CASING = 5.8;

export function BrandMark({
  size = 24,
  className,
  title = "Knit UI",
  id = "knit-mark",
}: {
  size?: number;
  className?: string;
  title?: string;
  /**
   * Namespaces the `<defs>`. Two marks on one page must not share it — an
   * auto-incrementing counter would drift between the server pass and
   * hydration, so the caller names them instead.
   */
  id?: string;
}) {
  const gradient = `${id}-g`;
  const clip = `${id}-clip`;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label={title}
    >
      <defs>
        <linearGradient id={gradient} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="0.55" stopColor="#a855f7" />
          <stop offset="1" stopColor="#ec4899" />
        </linearGradient>
        {/*
         * The band around the UPPER crossing at (16, 12.2), where link A is
         * lifted back over B. Without it A passes behind B at both crossings and
         * the pair reads as two loose loops rather than a knot; with it, A goes
         * over at the top and under at the bottom — an actual interlock.
         */}
        <clipPath id={clip}>
          <rect x="13.5" y="6" width="5" height="10" />
        </clipPath>
      </defs>

      <rect width="32" height="32" rx="8.5" fill={`url(#${gradient})`} />

      {/* A under */}
      <rect {...LINK_A} stroke="#fff" strokeWidth={STROKE} />

      {/* B over A — casing first, so B's stroke lands on a clean tile */}
      <rect {...LINK_B} stroke={`url(#${gradient})`} strokeWidth={CASING} />
      <rect {...LINK_B} stroke="#fff" strokeWidth={STROKE} />

      {/* …and A back over B, in one band only: the knot */}
      <g clipPath={`url(#${clip})`}>
        <rect {...LINK_A} stroke={`url(#${gradient})`} strokeWidth={CASING} />
        <rect {...LINK_A} stroke="#fff" strokeWidth={STROKE} />
      </g>
    </svg>
  );
}
