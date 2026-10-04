import React from 'react';

// File logo punya margin kosong lebar di sekeliling glyph, jadi img di-crop
// via scale supaya mark-nya memenuhi kotak pada ukuran kecil.
export default function BrandLogo({ className = '' }) {
  return (
    <span className={`inline-flex overflow-hidden flex-shrink-0 ${className}`}>
      <img src="/logo.png" alt="" className="w-full h-full object-cover scale-[1.35]" />
    </span>
  );
}
