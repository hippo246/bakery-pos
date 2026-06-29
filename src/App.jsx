import { useEffect } from "react";
import { THEME_CSS } from "./styles/theme";
import BrewCRM from "./components/BrewCRM";

// Run once, synchronously, at module load — before the first paint.
// (A useEffect would only fire AFTER the initial render, causing a flash
// of unstyled content where CSS variables are undefined.)
if (typeof document !== "undefined" && !document.getElementById("brew-theme")) {
  const el = document.createElement("style");
  el.id = "brew-theme";
  el.textContent = THEME_CSS;
  document.head.appendChild(el);

  const saved = localStorage.getItem("brew-theme");
  if (saved === "light") document.documentElement.classList.add("light");
}

export default function App() {
  return <BrewCRM />;
}
