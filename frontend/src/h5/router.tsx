import { Suspense, lazy, type ReactNode } from "react";
import { createHashRouter } from "react-router-dom";

// Legacy/frozen H5-only route tree. Keep it stable for compatibility, but do
// not add new routes or new feature work here. Desktop/mobile mainline routes
// now live in src/router.tsx.
const MobileHomePage = lazy(() => import("./pages/MobileHomePage").then((module) => ({ default: module.MobileHomePage })));
const MobileOccupationPage = lazy(() => import("./pages/MobileOccupationPage").then((module) => ({ default: module.MobileOccupationPage })));
const MobileNotFoundPage = lazy(() => import("./pages/MobileNotFoundPage").then((module) => ({ default: module.MobileNotFoundPage })));

function withSuspense(element: ReactNode) {
  return (
    <Suspense fallback={<div className="h5-shell"><div className="h5-page"><div className="h5-panel h5-empty-state">Loading…</div></div></div>}>
      {element}
    </Suspense>
  );
}

export const router = createHashRouter([
  {
    path: "/",
    element: withSuspense(<MobileHomePage />)
  },
  {
    path: "/occupation",
    element: withSuspense(<MobileOccupationPage />)
  },
  {
    path: "/occupation/:socCode",
    element: withSuspense(<MobileOccupationPage />)
  },
  {
    path: "*",
    element: withSuspense(<MobileNotFoundPage />)
  }
]);
