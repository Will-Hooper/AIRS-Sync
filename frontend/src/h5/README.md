# H5 Legacy Module

`src/h5` is a standalone legacy H5 module.

Status:
- Frozen as of `2026-04-29`.
- Keep it available for old H5 links and `m.airsindex.com`.
- Do not use this directory for new product work.

Still allowed:
- Blank-screen fixes.
- Broken-search fixes.
- Failures that prevent opening the home page, occupation detail, moat map, or share-image flow.

Not allowed:
- New modules.
- New interactions.
- New visual optimization work.
- Syncing desktop responsive feature work back into H5.

Rules:
- H5 pages, components, styles, animations, share logic, and route wiring must stay inside `src/h5`.
- Desktop entry files in `src/main.tsx` and `src/router.tsx` must not import from `src/h5`.
- H5 may only share data-layer and pure-tool modules such as `src/lib/api.ts`, `src/lib/types.ts`, `src/lib/analytics.ts`, `src/lib/format.ts`, and `src/shared/**`.
- Do not move H5 UI back into desktop directories.
- Do not add H5 behavior to desktop components through large conditional branches.
- Run `npm run check:h5-boundary` after boundary-related changes.
