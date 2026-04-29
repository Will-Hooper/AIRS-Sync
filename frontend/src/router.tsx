import { Suspense, lazy, type ReactNode } from "react";
import { createHashRouter } from "react-router-dom";

// Primary responsive route tree. AIRS now treats this as the only active
// product line for both desktop and mobile browsers. Legacy H5 routes remain
// isolated in src/h5/router.tsx and should only receive blocker fixes.
const HomePage = lazy(() => import("./pages/HomePage").then((module) => ({ default: module.HomePage })));
const OccupationPage = lazy(() => import("./pages/OccupationPage").then((module) => ({ default: module.OccupationPage })));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then((module) => ({ default: module.NotFoundPage })));

function withSuspense(element: ReactNode) {
  return (
    <Suspense fallback={<div className="airs-shell text-white/50">Loading…</div>}>
      {element}
    </Suspense>
  );
}

export const router = createHashRouter([
  {
    path: "/",
    element: withSuspense(<HomePage />)
  },
  {
    path: "/occupation",
    element: withSuspense(<OccupationPage />)
  },
  {
    path: "/occupation/:socCode",
    element: withSuspense(<OccupationPage />)
  },
  {
    path: "*",
    element: withSuspense(<NotFoundPage />)
  }
]);
