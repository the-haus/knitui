import { breakpoints as bp } from "./scales";

/** Responsive media queries. Use as style props: `$gtSm={{ ... }}`. */
export const media = {
  xs: { maxWidth: bp.xs },
  sm: { maxWidth: bp.sm },
  md: { maxWidth: bp.md },
  lg: { maxWidth: bp.lg },
  xl: { maxWidth: bp.xl },
  gtXs: { minWidth: bp.xs + 1 },
  gtSm: { minWidth: bp.sm + 1 },
  gtMd: { minWidth: bp.md + 1 },
  gtLg: { minWidth: bp.lg + 1 },
  gtXl: { minWidth: bp.xl + 1 },
} as const;
