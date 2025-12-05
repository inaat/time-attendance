import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import './i18n/config';
import Dashboard from "./containers/Dashboard";

const container = document.querySelector("#container");
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Dashboard />
  </React.StrictMode>
);
