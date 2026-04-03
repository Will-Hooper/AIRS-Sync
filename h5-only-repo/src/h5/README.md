# H5 Module Boundary

`src/h5` is the standalone H5 application module in this repository.

Rules:
- H5 pages, components, styles, animations, share logic, and route wiring must stay inside `src/h5`.
- The project root enters H5 through `src/main.tsx` and `src/router.tsx`, but UI implementation still stays inside `src/h5`.
- H5 may only share data-layer and pure-tool modules such as `src/lib/api.ts`, `src/lib/types.ts`, `src/lib/analytics.ts`, `src/lib/format.ts`, and `src/shared/**`.
- Do not reintroduce desktop pages, desktop styles, or dual-endpoint branching into this repository.
