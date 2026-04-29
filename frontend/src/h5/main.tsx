import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { applyH5ShareMetadata } from "./lib/metadata";
import { applyTheme, getInitialTheme } from "../shared/theme";
import "./styles.css";

const rootElement = document.getElementById("root")!;

// Legacy/frozen H5 entry. Keep accessible for old links, but do not add new
// product work here. Only blocker fixes should land in src/h5.
document.body.dataset.airsEntry = "h5";
rootElement.dataset.airsRoot = "h5";
applyTheme(getInitialTheme());
applyH5ShareMetadata();

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
