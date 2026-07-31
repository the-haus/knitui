/**
 * Typing for MDX content modules.
 *
 * `@types/mdx` only declares the default export. The docs' content files also
 * export `meta` (title / description / noindex) — the catch-all route reads it in
 * `generateMetadata`, so it has to be part of the module's type.
 */
declare module "*.mdx" {
  import type { ComponentType } from "react";

  const MDXContent: ComponentType<Record<string, unknown>>;
  export default MDXContent;

  export const meta:
    | {
        title?: string;
        description?: string;
        noindex?: boolean;
      }
    | undefined;
}
