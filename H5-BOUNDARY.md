# H5 Boundary

H5 lives in `frontend/src/h5` and is a standalone module.

Rules:
- Desktop and H5 may only share the data layer and pure utilities such as `frontend/src/lib/api.ts`, `frontend/src/lib/types.ts`, `frontend/src/lib/analytics.ts`, `frontend/src/lib/format.ts`, and `frontend/src/shared/**`.
- Do not cross-import pages, styles, animations, or heavy interactive components between desktop and H5.
- `frontend/src/main.tsx` and `frontend/src/router.tsx` are desktop-only.
- `frontend/src/h5/main.tsx` and `frontend/src/h5/router.tsx` are H5-only.
- New requirements must not re-couple the two ends through temporary conditional branches inside desktop components.

Check:
- Run `npm run check:h5-boundary` after boundary-related changes.
