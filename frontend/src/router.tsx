import { Suspense, lazy, type ReactNode } from "react";
import { createHashRouter } from "react-router-dom";

const HomePage = lazy(() => import("./pages/HomePage").then((module) => ({ default: module.HomePage })));
const OccupationPage = lazy(() => import("./pages/OccupationPage").then((module) => ({ default: module.OccupationPage })));
const MobileHomePage = lazy(() => import("./h5/pages/MobileHomePage").then((module) => ({ default: module.MobileHomePage })));
const MobileOccupationPage = lazy(() => import("./h5/pages/MobileOccupationPage").then((module) => ({ default: module.MobileOccupationPage })));
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
    path: "/m",
    element: withSuspense(<MobileHomePage />)
  },
  {
    path: "/m/occupation",
    element: withSuspense(<MobileOccupationPage />)
  },
  {
    path: "/m/occupation/:socCode",
    element: withSuspense(<MobileOccupationPage />)
  },
  {
    path: "*",
    element: withSuspense(<NotFoundPage />)
  }
]);
