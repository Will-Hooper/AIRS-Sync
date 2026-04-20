import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { applyTheme, getInitialTheme } from "./shared/theme";
import "./styles.css";

const rootElement = document.getElementById("root")!;

document.body.dataset.airsEntry = "desktop";
rootElement.dataset.airsRoot = "desktop";
applyTheme(getInitialTheme());

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
