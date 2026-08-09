import React from 'react';
import { ThemeProvider } from "./theme";
import BrewCRM from "./components/BrewCRM";
import GuestOrder from "./pages/GuestOrder";
import { TerminalProvider } from "./terminal/TerminalContext.jsx";

// Add smooth transitions for theme switching
if (typeof document !== "undefined" && !document.getElementById("brew-theme-transitions")) {
  const el = document.createElement("style");
  el.id = "brew-theme-transitions";
  el.textContent = "* { transition: background-color 0.25s ease, border-color 0.25s ease, color 0.25s ease; }";
  document.head.appendChild(el);

  try {
    console.log(
      "%c☕ BrewCRM booted — go make someone's day a little more caffeinated.",
      "color:#8b6914;font-weight:bold;font-size:12px;"
    );
  } catch { /* console unavailable */ }
}

export default function App() {
  // Detect /guest/<code> path — render customer-facing ordering page
  const isGuestPage = typeof window !== "undefined" && window.location.pathname.startsWith('/guest/');
  if (isGuestPage) {
    return (
      <ThemeProvider defaultTheme="modern">
        <GuestOrder />
      </ThemeProvider>
    );
  }
  return (
    <ThemeProvider defaultTheme="modern">
      <TerminalProvider>
        <BrewCRM />
      </TerminalProvider>
    </ThemeProvider>
  );
}
