import React, { useRef, useEffect, useState } from 'react';

// Simple virtual list component for rendering large lists efficiently
export default function VirtualList({
  items = [],
  itemHeight = 50,
  renderItem,
  overscan = 3,
  height = 400
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + height) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        height,
        overflowY: 'auto',
        position: 'relative'
      }}
    >
      <div
        style={{
          height: items.length * itemHeight,
          position: 'relative'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{
                height: itemHeight,
                position: 'absolute',
                top: index * itemHeight,
                left: 0,
                right: 0
              }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
