import React from 'react';
import './Skeleton.css';

const Skeleton = ({
  variant = 'text', // text, circle, rect, card
  width,
  height,
  className = '',
  count = 1,
}) => {
  const items = Array.from({ length: count });

  return (
    <>
      {items.map((_, idx) => (
        <div
          key={idx}
          className={`skeleton skeleton-${variant} ${className}`}
          style={{
            width: width || (variant === 'circle' ? height : undefined),
            height: height || undefined,
          }}
        />
      ))}
    </>
  );
};

export default Skeleton;
