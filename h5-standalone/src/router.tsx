import { Suspense, lazy, type ReactNode } from "react";
import { createHashRouter } from "react-router-dom";

const HomePage = lazy(() => import("./pages/MobileHomePage").then((module) => ({ default: module.MobileHomePage })));
const OccupationPage = lazy(() => import("./pages/MobileOccupationPage").then((module) => ({ default: module.MobileOccupationPage })));
const NotFoundPage = lazy(() => import("./pages/MobileNotFoundPage").then((module) => ({ default: module.MobileNotFoundPage })));

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
