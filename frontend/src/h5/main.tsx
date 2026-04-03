import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { applyH5ShareMetadata } from "./lib/metadata";
import "./styles.css";

const rootElement = document.getElementById("root")!;

document.body.dataset.airsEntry = "h5";
rootElement.dataset.airsRoot = "h5";
applyH5ShareMetadata();

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
