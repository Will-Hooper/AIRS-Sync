import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { applyDesktopShareMetadata } from "./lib/desktop-metadata";
import { getInitialLanguage, normalizeLanguage } from "./lib/i18n";
import { applyTheme, getInitialTheme } from "./shared/theme";
import "./styles.css";

const rootElement = document.getElementById("root")!;

document.body.dataset.airsEntry = "desktop";
rootElement.dataset.airsRoot = "desktop";
applyTheme(getInitialTheme());
applyDesktopShareMetadata(normalizeLanguage(getInitialLanguage(window.location.search)));

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
