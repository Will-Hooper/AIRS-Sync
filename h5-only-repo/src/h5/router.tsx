import { Suspense, lazy, type ReactNode } from "react";
import { createHashRouter } from "react-router-dom";

// H5-only route tree. The project root re-exports this router from src/router.tsx.
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
