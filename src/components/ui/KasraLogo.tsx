import React from 'react';

interface KasraLogoProps {
  className?: string;
}

/**
 * Official KASRA Geometric "k" Mark (Pure White by default)
 */
export const KasraLogo: React.FC<KasraLogoProps> = ({ className = 'w-6 h-6 text-white' }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 400"
      fill="currentColor"
      className={className}
      aria-label="KASRA Logo"
    >
      <path d="M 162.5 18.5 L 162.5 182.5 A 187.8 187.8 0 0 0 93.5 248.5 L 93.5 111.5 Z" />
      <path d="M 93.5 381.5 A 164.2 164.2 0 0 1 298.5 188.5 L 251.5 251.5 A 95 95 0 0 0 165.5 381.5 Z" />
      <path d="M 232.5 277.5 L 310.5 381.5 L 223.5 381.5 L 184.5 327.5 A 72.1 72.1 0 0 1 232.5 277.5 Z" />
    </svg>
  );
};
