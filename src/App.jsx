import React from 'react';
import { THEME_CSS } from "./styles/theme";
import BrewCRM from "./components/BrewCRM";
import GuestOrder from "./pages/GuestOrder";

// Run once, synchronously, at module load — before the first paint.
if (typeof document !== "undefined" && !document.getElementById("brew-theme")) {
  const el = document.createElement("style");
  el.id = "brew-theme";
  el.textContent = THEME_CSS + "\n* { transition: background-color 0.25s ease, border-color 0.25s ease; }";
  document.head.appendChild(el);

  try {
    const saved = localStorage.getItem("brew-theme");
    if (saved === "light") document.documentElement.classList.add("light");
  } catch { /* storage blocked — default theme applies */ }

  try {
    console.log(
      "%c☕ BrewCRM booted — go make someone's day a little more caffeinated.",
      "color:#8b6914;font-weight:bold;font-size:12px;"
    );
  } catch { /* console unavailable */ }
}

export default function App() {
  // Detect /guest/<code> path — render customer-facing ordering page
  const isGuestPage = window.location.pathname.startsWith('/guest/');
  if (isGuestPage) return <GuestOrder />;
  return <BrewCRM />;
}
