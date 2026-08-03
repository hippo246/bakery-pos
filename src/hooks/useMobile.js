import { useState, useEffect } from 'react';

export function useMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") return window.innerWidth <= 700;
    return false;
  });
  
  const [isTablet, setIsTablet] = useState(() => {
    if (typeof window !== "undefined") return window.innerWidth > 700 && window.innerWidth <= 1024;
    return false;
  });

  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== "undefined") return window.innerWidth > 1024;
    return true;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 700);
      setIsTablet(width > 700 && width <= 1024);
      setIsDesktop(width > 1024);
    };

    window.addEventListener("resize", handleResize);
    // Call once initially to ensure correct state on mount
    handleResize();
    
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return { isMobile, isTablet, isDesktop };
}
