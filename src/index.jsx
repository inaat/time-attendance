import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import Home from "./containers/Home";

const container = document.querySelector("#container");
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Home />
  </React.StrictMode>
);
