import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const container = document.getElementById("root");

if (!container) {
  throw new Error(
    '[main.jsx] Root element "#root" not found. Check index.html.'
  );
}

// Keep root in module scope — attaching it to the DOM node (_reactRoot) can
// produce stale references after Vite HMR replaces the module. Module scope
// is stable across HMR re-renders as long as the file itself isn't replaced.
let root = globalThis.__BREWCRM_ROOT__;
if (!root) {
  root = createRoot(container);
  globalThis.__BREWCRM_ROOT__ = root;
}

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
