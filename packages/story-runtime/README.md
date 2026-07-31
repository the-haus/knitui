# @knitui/story-runtime

A headless Storybook **CSF resolver**: given an imported `*.stories.tsx` module,
it produces the same React tree Storybook would render — without any
`@storybook/*` runtime.

> **Private — not published.** `workspace:*` only.

## Why it exists

Story files are the kit's single source of truth for examples. Three surfaces
render them:

| Surface        | App                                      | What it is                                          |
| -------------- | ---------------------------------------- | --------------------------------------------------- |
| Storybook      | `apps/storybook`                         | Contributor/QA surface — all ~1,100 stories, addons |
| Device gallery | `packages/demo` → `apps/web`, `apps/app` | iOS/Android/web parity                              |
| Docs site      | `apps/docs`                              | User-facing docs, live examples in prose            |

The last two need to resolve CSF themselves. This package is that logic, once,
so the three surfaces cannot drift.

It works because story files only `import type` from `@storybook/react-vite` —
those imports are erased at compile time, so at runtime a story module is just a
default `meta` object plus named story objects.

## API

```ts
import {
  getMeta,
  getStories,
  renderStory,
  humanize,
  StoryErrorBoundary,
} from "@knitui/story-runtime";

const mod = await import("@knitui/components/src/Button/Button.stories");

getMeta(mod); // the default export (title, component, args, argTypes, …)
getStories(mod); // [["Playground", story], ["Variants", story], …] in declaration order
renderStory(meta, story); // ReactNode, decorators applied
renderStory(meta, story, { size: "lg" }); // …with live arg overrides (docs playground)
humanize("WithSections"); // "With Sections"
```

`renderStory` mirrors Storybook's semantics:

- args merge `meta.args` → `story.args` → `argOverrides`
- render resolution `story.render` → `meta.render` → `createElement(meta.component, args)`
- decorators apply story-level first (innermost), then meta-level, each level in
  reverse declaration order

`StoryErrorBoundary` is deliberately headless — it takes a
`fallback(error, label)` render prop so this package never depends on
`@knitui/components`.

## Platform

Platform-free. React only; no `react-native`, no `@knitui/*` imports.
