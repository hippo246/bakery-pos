import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * Returns whether the viewport is at/under the mobile breakpoint, and keeps
 * updating as the window is resized or the device is rotated.
 *
 * Replaces the old `typeof window !== "undefined" && window.innerWidth <= 768`
 * pattern, which only ran once at mount/render and never reacted to layout
 * changes (resizing a window, rotating a tablet, opening dev tools, etc).
 */
export function useIsMobile(breakpoint = MOBILE_BREAKPOINT) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handleChange = (e) => setIsMobile(e.matches);

    // Sync in case the breakpoint changed or we missed something between
    // the initial state calc and the listener being attached.
    setIsMobile(mediaQuery.matches);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [breakpoint]);

  return isMobile;
}

export default useIsMobile;
