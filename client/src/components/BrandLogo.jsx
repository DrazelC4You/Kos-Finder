import React from 'react';

export default function BrandLogo({ className = '' }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${className}`}>
      <img src="/logo.png" alt="" className="h-full w-full object-contain" />
    </span>
  );
}
