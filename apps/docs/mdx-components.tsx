import type { MDXComponents } from "mdx/types";

import { ComponentHeader } from "@/components/docs/ComponentHeader";
import { ComponentIndex } from "@/components/docs/ComponentIndex";
import { HookIndex, HookReference } from "@/components/docs/HookReference";
import { ExportIndex, PackageTable, PeerDependencyTable } from "@/components/docs/PackageTables";
import { PropsTable, StylePropsTable } from "@/components/docs/PropsTable";
import { ThemePreview } from "@/components/docs/ThemePreview";
import {
  AllTokenScales,
  BreakpointTable,
  ControlMetricsTable,
  MotionTable,
  SourceNote,
  TokenScale,
  ZIndexTable,
} from "@/components/docs/TokenTables";
import { Example, Examples } from "@/components/example/Example";
import { Playground } from "@/components/example/Playground";
import { Callout } from "@/components/mdx/Callout";
import { CardGrid, CardLink } from "@/components/mdx/CardGrid";
import { InlineMarkdown } from "@/components/mdx/InlineMarkdown";
import { InstallCommand } from "@/components/mdx/InstallCommand";
import { Pre } from "@/components/mdx/Pre";
import { Table } from "@/components/mdx/Table";
import { Tab, Tabs } from "@/components/mdx/Tabs";

/**
 * The MDX global scope.
 *
 * Everything exported here is available in every `page.mdx` with no import — the
 * same trick lora's docs use with a swizzled `MDXComponents`, and the reason a
 * component page is ~30 lines of prose plus a handful of tags:
 *
 *   <ComponentHeader id="components/inputs/button" />
 *   <Playground id="components/inputs/button" />
 *   <Examples id="components/inputs/button" />
 *   <PropsTable id="components/inputs/button" />
 *
 * Keep this list short and load-bearing: MDX scope is a global namespace for
 * everyone writing prose.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,

    // Element overrides: `pre` gets build-time highlighting, `table` gets a
    // horizontal scroll container so wide prop tables never break the layout.
    pre: Pre,
    table: Table,

    // Docs primitives.
    Callout,
    CardGrid,
    CardLink,
    InlineMarkdown,
    InstallCommand,
    Tab,
    Tabs,

    // Generated component sections.
    ComponentHeader,
    ComponentIndex,
    ThemePreview,
    Example,
    Examples,
    Playground,
    PropsTable,

    // Generated reference sections.
    AllTokenScales,
    BreakpointTable,
    ControlMetricsTable,
    ExportIndex,
    HookIndex,
    HookReference,
    MotionTable,
    PackageTable,
    PeerDependencyTable,
    SourceNote,
    StylePropsTable,
    TokenScale,
    ZIndexTable,
  };
}
