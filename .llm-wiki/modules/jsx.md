---
updated: 2026-09-25
covers: [jsx, esbuild, compilation, hydration]
status: current
---

# JSX compiler (`jsx.mjs`)

esbuild wrappers that turn JSX into renderers and browser bundles. This is the "no build
step" — everything compiles in-process, on demand.

## Key files & entry points

- `jsx.mjs` — exports `isModuleSource`, `compileExpression`, `compileModuleSource`,
  `loadModuleFile`, `compileModuleFile`, `bundleClient`, `DEV`.
- Consumed by [server](server.md) (pages, `/render`) and [db](db.md) (`loadModuleFile` to render seed SVGs).

## How it works

- **`isModuleSource(src)`** — true if the source has a top-level `import`/`export`. Decides
  module page vs expression page everywhere.
- **`compileExpression`** — bare JSX expression → `(props) => element`. `props` and `React`
  are in scope; uses `React.createElement` factory. Used for expression pages.
- **`compileModuleSource`** — inline module source (no file, so no relative imports) →
  renderer, via `transform` + CJS eval.
- **`loadModuleFile` / `compileModuleFile`** — a module file on disk, **bundled** so relative
  imports work, evaluated as CJS. `react`/`react-dom` are kept **external** so the page uses
  the *same* React instance the server renders with (hooks/elements must match).
- **`bundleClient(name, pagesDir)`** — the browser bundle: imports React, `hydrateRoot`, and
  the page; reads props from `#__props`; hydrates `#root`. ESM, `platform: browser`,
  minified when not `DEV`.

## Gotchas & constraints

- **React stays external in server bundles** (`external: ["react", "react-dom", …]`) — do
  not bundle a second copy, or hydration/hooks break.
- **`NODE_PATHS`** points at the app's `node_modules` so bare imports resolve even when
  `PAGES_DIR` is outside the app tree (a bind mount, historically).
- No CSS/image loaders are configured — pages can't import stylesheets or images.
- `DEV` = `NODE_ENV !== "production"`; controls minify + React dev/prod define.

## Related

- [server](server.md), [pages](pages.md), [conventions](../conventions.md)
