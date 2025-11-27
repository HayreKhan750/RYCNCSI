import React, { useState, useEffect, useRef, useMemo } from 'react';

/**
 * A reusable VirtualList component for efficiently rendering large lists.
 * 
 * @param {Array} items - The array of items to render.
 * @param {Function} renderItem - Function to render each item. Receives (item, index).
 * @param {number} itemHeight - Fixed height of each item in pixels.
 * @param {number} containerHeight - Height of the scrollable container in pixels.
 * @param {string} className - Optional class name for the container.
 */
const VirtualList = ({ items, renderItem, itemHeight, containerHeight, className = '' }) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const totalHeight = items.length * itemHeight;

  // Calculate visible range
  const { startIndex, endIndex } = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    // Add buffer
    const end = Math.min(items.length, start + visibleCount + 5);
    const bufferedStart = Math.max(0, start - 5);
    return { startIndex: bufferedStart, endIndex: end };
  }, [scrollTop, items.length, itemHeight, containerHeight]);

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
    }));
  }, [items, startIndex, endIndex]);

  const onScroll = (e) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        height: containerHeight,
        overflowY: 'auto',
        position: 'relative',
      }}
      onScroll={onScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: index * itemHeight,
              left: 0,
              width: '100%',
              height: itemHeight,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VirtualList;
