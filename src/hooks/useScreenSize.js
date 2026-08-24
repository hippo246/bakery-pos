import { useState, useEffect } from 'react';

export default function useScreenSize() {
  const [screenSize, setScreenSize] = useState('large'); // 'small', 'medium', 'tablet', 'large'

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('small'); // Mobile
      } else if (width < 1024) {
        setScreenSize('medium'); // Tablet portrait / small tablets
      } else if (width < 1366) {
        setScreenSize('tablet'); // iPad / Android tablets
      } else {
        setScreenSize('large'); // Desktop
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screenSize;
}
