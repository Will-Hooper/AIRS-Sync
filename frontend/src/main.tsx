import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import "./styles.css";

const rootElement = document.getElementById("root")!;

document.body.dataset.airsEntry = "desktop";
rootElement.dataset.airsRoot = "desktop";

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
