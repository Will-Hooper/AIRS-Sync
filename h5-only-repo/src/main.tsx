import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import "./h5/styles.css";

const rootElement = document.getElementById("root")!;

document.body.dataset.airsEntry = "h5";
rootElement.dataset.airsRoot = "h5";

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
