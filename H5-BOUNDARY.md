# H5 Legacy Boundary

H5 lives in `frontend/src/h5` and remains in the repository as a frozen legacy surface.

Status:
- The responsive main site in `frontend/src` is the only active product line.
- `frontend/src/h5`, `frontend/m`, and the root `m/` compatibility entries stay online for old links and `m.airsindex.com`.
- Do not add new features, new modules, new interaction work, or new visual work to H5.

Allowed H5 work:
- Fix blocker issues such as blank screens, broken search, or failures to open core pages.
- Preserve compatibility for existing H5 links during the freeze window.

Boundary rules:
- Desktop and H5 may only share the data layer and pure utilities such as `frontend/src/lib/api.ts`, `frontend/src/lib/types.ts`, `frontend/src/lib/analytics.ts`, `frontend/src/lib/format.ts`, and `frontend/src/shared/**`.
- Do not cross-import pages, styles, animations, or heavy interactive components between desktop and H5.
- `frontend/src/main.tsx` and `frontend/src/router.tsx` are the primary responsive entry and route tree.
- `frontend/src/h5/main.tsx` and `frontend/src/h5/router.tsx` are legacy-only and should remain isolated.
- New requirements must not re-couple the two ends through temporary conditional branches inside desktop components.

Check:
- Run `npm run check:h5-boundary` after boundary-related changes that still touch H5.
