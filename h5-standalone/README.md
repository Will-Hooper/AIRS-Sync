# AIRS H5 Standalone

This repository is the standalone H5 extraction of AIRS. The project root is the H5 app itself. There is no desktop entry, desktop route tree, or desktop UI code in this repo.

## Run

```powershell
npm install
npm run dev
```

## Build

```powershell
npm run typecheck
npm run build
```

## Structure

```text
.
├─ index.html
├─ public/
│  └─ backend/data/airs_data.json
└─ src/
   ├─ main.tsx
   ├─ router.tsx
   ├─ styles.css
   ├─ animations/
   ├─ components/
   ├─ hooks/
   ├─ lib/
   ├─ pages/
   ├─ share/
   └─ shared/
```

## Boundary

- `src/pages`, `src/components`, `src/styles.css`, `src/animations`, `src/share`, and `src/hooks` are H5-only UI/runtime code.
- `src/lib` and `src/shared` only contain the data layer and pure utilities required by H5.
- Do not add desktop pages, desktop styles, or conditional dual-endpoint branching back into this repository.

## Data

The runtime data file is included at `public/backend/data/airs_data.json`.
