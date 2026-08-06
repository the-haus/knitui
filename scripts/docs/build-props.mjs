#!/usr/bin/env node
/**
 * build-props.mjs
 * ---------------
 * Generates the props tables for every documented component, from the real
 * TypeScript types — never hand-maintained.
 *
 * The hard part is not extraction, it's CLASSIFICATION. Every kit component is a
 * Tamagui `styled(Box)` frame, so its prop type transitively includes ~1,500
 * style props and shorthands. Dumping those into a table is worse than useless,
 * so each prop is bucketed by where it is DECLARED:
 *
 *   own       declared in this package's own src/  -> the main table
 *   system    the kit's cross-component contract (size/variant/theme/styles/…)
 *             -> rendered once from a shared definition
 *   style     declared in @tamagui/* or react-native -> collapsed disclosure
 *   react     HTML/ARIA attributes from @types/react -> collapsed disclosure
 *
 * Descriptions come from JSDoc on the declaration; where a story's `argTypes`
 * carries a better one (they were written for the Storybook controls panel),
 * that wins. A hand-authored override file wins over both — the escape hatch for
 * the cases type extraction gets wrong:
 *
 *   apps/docs/content/overrides/<Component>.props.json
 *
 * Writes: apps/docs/src/generated/props.json
 *
 * Usage: node scripts/docs/build-props.mjs [--package=components] [--only=Button,Combobox]
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..", "..");
const OUT_DIR = join(REPO_ROOT, "apps/docs/src/generated");
const OVERRIDE_DIR = join(REPO_ROOT, "apps/docs/content/overrides");

/**
 * The kit's cross-component contract. These mean the same thing on every
 * component, so the docs render one shared explanation instead of repeating them
 * in 103 tables. (They're still listed per component — just tagged `system`.)
 */
const SYSTEM_PROPS = new Set([
  "size",
  "variant",
  "theme",
  "radius",
  "shadow",
  "styles",
  "gradient",
  "disabled",
  "fullWidth",
]);

/** Longest type string we keep; Tamagui unions can run to tens of kB. */
const MAX_TYPE_LENGTH = 240;

const args = process.argv.slice(2);
const packageFilter = args.find((a) => a.startsWith("--package="))?.slice("--package=".length);
const onlyFilter = args
  .find((a) => a.startsWith("--only="))
  ?.slice("--only=".length)
  ?.split(",");

const registry = JSON.parse(readFileSync(join(OUT_DIR, "registry.json"), "utf8"));

/** Group the registry's documented components by package, keeping only real ones. */
function targetsByPackage() {
  const byPackage = new Map();
  for (const entry of registry.entries) {
    if (!entry.componentName || !entry.componentPath || entry.internal) continue;
    if (packageFilter && entry.package !== packageFilter) continue;
    if (onlyFilter && !onlyFilter.includes(entry.componentName)) continue;
    const list = byPackage.get(entry.package) ?? [];
    list.push(entry);
    byPackage.set(entry.package, list);
  }
  return byPackage;
}

/** A ts.Program over one package's sources, using that package's tsconfig. */
function createProgram(pkg, rootNames) {
  const configPath = join(REPO_ROOT, "packages", pkg, "tsconfig.json");
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    join(REPO_ROOT, "packages", pkg),
  );
  return ts.createProgram({
    rootNames,
    options: { ...parsed.options, noEmit: true, skipLibCheck: true, declaration: false },
  });
}

/**
 * The props type of an exported component symbol.
 *
 * Tamagui components are callable objects (`withStaticProperties` attaches the
 * compound parts), so the props are the first parameter of the call signature.
 * `React.forwardRef` results and plain function components resolve the same way.
 */
function propsTypeOf(checker, symbol, location) {
  const type = checker.getTypeOfSymbolAtLocation(symbol, location);
  const signatures = type.getCallSignatures();
  if (signatures.length) {
    const [signature] = signatures;
    const [param] = signature.getParameters();
    if (param) return checker.getTypeOfSymbolAtLocation(param, location);
  }
  // A styled() component can also present as an object with a `propTypes`-less
  // JSX signature; fall back to the JSX element attributes type.
  const jsxSignatures = type.getConstructSignatures();
  if (jsxSignatures.length) {
    const [param] = jsxSignatures[0].getParameters();
    if (param) return checker.getTypeOfSymbolAtLocation(param, location);
  }
  return undefined;
}

/** Where a prop's declaration lives -> which bucket it belongs in. */
function classify(declarationPath, propName, pkg) {
  if (SYSTEM_PROPS.has(propName)) return "system";
  if (!declarationPath) return "style";
  const normalised = declarationPath.split(sep).join("/");
  if (normalised.includes(`/packages/${pkg}/src/`)) return "own";
  if (normalised.includes("/packages/core/src/") || normalised.includes("/packages/hooks/src/")) {
    return "own";
  }
  if (normalised.includes("/@types/react/")) return "react";
  if (normalised.includes("/@tamagui/") || normalised.includes("/react-native")) return "style";
  return "style";
}

/**
 * The printed type of a prop.
 *
 * `getTypeOfSymbol` resolves through Tamagui's variant machinery where a
 * declaration-scoped lookup reduces to `unknown`; the declaration-scoped call is
 * kept as a fallback for symbols the first form can't type.
 */
function typeStringOf(checker, prop, declaration, location) {
  const flags = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.InTypeAlias;
  const print = (type) => (type ? checker.typeToString(type, location, flags) : undefined);

  const direct = print(checker.getTypeOfSymbol?.(prop));
  if (direct && direct !== "unknown" && direct !== "any") return direct;
  if (declaration) {
    const scoped = print(checker.getTypeOfSymbolAtLocation(prop, declaration));
    if (scoped && scoped !== "unknown" && scoped !== "any") return scoped;
  }
  return direct ?? "unknown";
}

/** The value set a prop accepts, as authored in the story's `argTypes`. */
function optionsFor(entry, propName) {
  const config = entry.argTypes?.[propName];
  if (!config || typeof config !== "object" || !Array.isArray(config.options)) return undefined;
  const options = config.options.filter((o) => o === null || typeof o !== "object");
  return options.length ? options : undefined;
}

/**
 * The per-slot `styles` keys of a component, read off the type of its `styles`
 * prop (`SlotStyles<ButtonStyles>` -> `root`, `label`, `leftSection`, …).
 *
 * Every public component in the kit has a `styles` prop, so this replaces a
 * hand-authored slot table on 100+ pages.
 *
 * The TSDoc on each key comes along with it. The slot interfaces already document
 * which part every key targets ("Props for the label text (`.Label` / `.Text`)"),
 * and without it the docs could only print the key name back at the reader — which
 * tells you nothing for a component whose slots are `track` / `thumb` / `mark`.
 */
function slotsOf(checker, propsType) {
  const styles = checker.getPropertyOfType(propsType, "styles");
  if (!styles) return undefined;
  const type = checker.getNonNullableType(checker.getTypeOfSymbol(styles));
  const slots = checker
    .getPropertiesOfType(type)
    .filter((symbol) => !symbol.getName().startsWith("__"))
    .map((symbol) => ({ name: symbol.getName(), description: docOf(checker, symbol) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return slots.length ? slots : undefined;
}

/**
 * Printed types, made readable.
 *
 * The checker expands `ReactNode` into its full 8-member union and qualifies
 * every import inline, which turns a one-word prop type into 300 characters of
 * noise. These rewrites are cosmetic only — the underlying type is unchanged.
 */
/**
 * Fold React's fully-expanded `ReactNode` union back into the word `ReactNode`.
 *
 * React 19's ReactNode expands to ~10 members (including a `Promise<…>` arm for
 * async children), and the checker prints all of them for every `children` /
 * section / icon prop. Matching is anchored on the union's distinctive head
 * (`string | number | bigint | boolean`) and tail (`| null | undefined`) rather
 * than a nested-generic-aware regex, which is not expressible here.
 */
function collapseReactNode(text) {
  const head = "string | number | bigint | boolean |";
  const tail = "| null | undefined";
  const start = text.indexOf(head);
  if (start === -1 || !text.includes("ReactPortal")) return text;
  const end = text.lastIndexOf(tail);
  if (end === -1 || end < start) return text;
  const before = text.slice(0, start);
  const after = text.slice(end + tail.length);
  return `${before}ReactNode${after}`.trim();
}

function truncate(text) {
  const collapsed = collapseReactNode(text.replace(/\s+/g, " "))
    .replace(/import\("[^"]+"\)\./g, "")
    .replace(/\bReact\./g, "")
    .trim();
  return collapsed.length > MAX_TYPE_LENGTH ? `${collapsed.slice(0, MAX_TYPE_LENGTH)}…` : collapsed;
}

/** JSDoc text of a symbol, first sentence-ish, collapsed to one line. */
function docOf(checker, symbol) {
  const parts = symbol.getDocumentationComment(checker);
  const text = ts.displayPartsToString(parts).replace(/\s+/g, " ").trim();
  return text || undefined;
}

/** `@default md` / `@defaultValue md` tags, when the author wrote one. */
function defaultOf(symbol) {
  for (const tag of symbol.getJsDocTags?.() ?? []) {
    if (tag.name !== "default" && tag.name !== "defaultValue") continue;
    const text = ts.displayPartsToString(tag.text ?? []).trim();
    if (text) return text;
  }
  return undefined;
}

/** Descriptions authored for the Storybook controls panel, keyed by prop. */
function argTypeDescriptions(entry) {
  const out = {};
  for (const [prop, config] of Object.entries(entry.argTypes ?? {})) {
    if (config && typeof config === "object" && typeof config.description === "string") {
      out[prop] = config.description;
    }
  }
  return out;
}

/** Default values the story's `args` reveal (Storybook's own default display). */
function argDefaults(entry) {
  const out = {};
  for (const [prop, value] of Object.entries(entry.args ?? {})) {
    if (value === null || ["string", "number", "boolean"].includes(typeof value)) {
      out[prop] = typeof value === "string" ? value : JSON.stringify(value);
    }
  }
  return out;
}

function loadOverride(componentName) {
  const path = join(OVERRIDE_DIR, `${componentName}.props.json`);
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    console.warn(
      `[props] ignoring malformed override ${componentName}.props.json: ${error.message}`,
    );
    return {};
  }
}

const out = {};
const stats = { components: 0, own: 0, system: 0, style: 0, react: 0, unresolved: [] };

/**
 * Inherited style props are deduplicated GLOBALLY, not stored per component.
 *
 * Every kit component is a `styled(Box)` frame, so all ~500 of them inherit the
 * SAME Tamagui/RN style surface. Writing that list into 171 component records
 * produced a 23 MB file; the docs only ever render it as one collapsed "style
 * props inherited from Box" disclosure, so one shared table plus a per-component
 * count carries exactly the same information.
 */
const styleProps = new Map();

for (const [pkg, entries] of targetsByPackage()) {
  const barrelPath = join(REPO_ROOT, "packages", pkg, "src/index.ts");
  const rootNames = [
    ...new Set([...entries.map((e) => join(REPO_ROOT, e.componentPath)), barrelPath]),
  ];
  const program = createProgram(pkg, rootNames);
  const checker = program.getTypeChecker();
  // Fallback lookup: a story's `component:` sometimes names a barrel alias
  // (@knitui/map exports `MapView` as `Map`), so the sibling file has no export
  // under that name. The package barrel does.
  const barrel = program.getSourceFile(barrelPath);
  const barrelSymbol = barrel ? checker.getSymbolAtLocation(barrel) : undefined;
  const barrelExports = barrelSymbol ? checker.getExportsOfModule(barrelSymbol) : [];

  for (const entry of entries) {
    const absolute = join(REPO_ROOT, entry.componentPath);
    const sourceFile = program.getSourceFile(absolute);
    if (!sourceFile) {
      stats.unresolved.push(`${entry.id} (no source file)`);
      continue;
    }

    const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
    const exports = moduleSymbol ? checker.getExportsOfModule(moduleSymbol) : [];
    const found =
      exports.find((s) => s.getName() === entry.componentName) ??
      barrelExports.find((s) => s.getName() === entry.componentName);
    if (!found) {
      stats.unresolved.push(`${entry.id} (no export named ${entry.componentName})`);
      continue;
    }
    // Barrel exports are aliases; resolve to the declaration they point at.
    const symbol = found.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(found) : found;

    const propsType = propsTypeOf(checker, symbol, sourceFile);
    if (!propsType) {
      stats.unresolved.push(`${entry.id} (no call signature)`);
      continue;
    }

    const descriptions = argTypeDescriptions(entry);
    const defaults = argDefaults(entry);
    const override = loadOverride(entry.componentName);
    const props = [];
    let styleCount = 0;

    for (const prop of checker.getPropertiesOfType(propsType)) {
      const name = prop.getName();
      if (name.startsWith("__")) continue;
      const declaration = prop.declarations?.[0];
      const declarationPath = declaration?.getSourceFile().fileName;
      const bucket = classify(declarationPath, name, pkg);

      const type = truncate(typeStringOf(checker, prop, declaration, sourceFile));
      stats[bucket] += 1;

      if (bucket === "style") {
        if (!styleProps.has(name)) styleProps.set(name, type);
        styleCount += 1;
        continue;
      }

      props.push({
        name,
        bucket,
        type,
        // Tamagui's `variants` produce prop types the checker can only reduce to
        // `unknown`; the story's `argTypes.options` (authored for the controls
        // panel) carries the real value set, so surface it either way.
        options: optionsFor(entry, name),
        required: !(prop.flags & ts.SymbolFlags.Optional),
        description: override[name]?.description ?? descriptions[name] ?? docOf(checker, prop),
        default: override[name]?.default ?? defaultOf(prop) ?? defaults[name],
        declaredIn: declarationPath
          ? relative(REPO_ROOT, declarationPath).split(sep).join("/")
          : undefined,
      });
    }

    props.sort((a, b) => Number(b.required) - Number(a.required) || a.name.localeCompare(b.name));
    out[entry.id] = {
      component: entry.componentName,
      sourcePath: entry.componentPath,
      slots: slotsOf(checker, propsType),
      props,
      counts: props.reduce((acc, p) => ({ ...acc, [p.bucket]: (acc[p.bucket] ?? 0) + 1 }), {
        style: styleCount,
      }),
    };
    stats.components += 1;
  }
}

writeFileSync(
  join(OUT_DIR, "props.json"),
  `${JSON.stringify(
    {
      generatedBy: "scripts/docs/build-props.mjs",
      systemProps: [...SYSTEM_PROPS],
      // The shared inherited-style surface every `styled(Box)` frame carries.
      styleProps: [...styleProps.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, type]) => ({ name, type })),
      components: out,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(
  `[props] ${stats.components} components · own=${stats.own} system=${stats.system} react=${stats.react} · style=${stats.style} (${styleProps.size} unique, shared)`,
);
if (stats.unresolved.length) {
  console.log(`[props] unresolved (${stats.unresolved.length}):`);
  for (const item of stats.unresolved.slice(0, 20)) console.log(`  - ${item}`);
  if (stats.unresolved.length > 20) console.log(`  … ${stats.unresolved.length - 20} more`);
}
