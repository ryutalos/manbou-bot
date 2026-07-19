import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { storage } from "./lib/storage";
import TabiShiori from "./App";
import "./index.css";

// モック由来のコンポーネントは window.storage を通して永続化する。
// 実アプリでは IndexedDB 実装を注入する。
window.storage = storage;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TabiShiori />
  </StrictMode>
);
