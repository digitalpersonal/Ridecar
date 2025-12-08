import React from 'react';

export const RideCarLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 150 40" xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor">
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{stopColor: '#F97316'}} />
        <stop offset="100%" style={{stopColor: '#EA580C'}} />
      </linearGradient>
    </defs>
    <path d="M25.3,12.3c-2.3-2.4-5.5-3.8-8.9-3.8H5c-1.1,0-2,0.9-2,2v19c0,1.1,0.9,2,2,2h11.4c3.4,0,6.6-1.4,8.9-3.8 C28.9,26.1,30.5,22,29.9,17.8C29.3,13.6,27.7,14.7,25.3,12.3z M16.4,27.5H10v-15h6.4c2.8,0,5,2.2,5,5S19.2,27.5,16.4,27.5z" fill="url(#logoGradient)"/>
    <text x="38" y="28" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="bold" fill="#FFFFFF">
      RideCar
    </text>
  </svg>
);

export const UserIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
);

export const IdCardIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zM4 18V6h16v12H4zm6-1h4v-1h-4v1zm0-2h4v-1h-4v1zm-3-4.5c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm-1 4h6v-1H6v1z" />
    </svg>
);

// FIX: Added style prop to allow dynamic styling, specifically for rotation in the RideMap component.
export const CarIcon = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
  </svg>
);

export const PinIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
);

export const WhatsAppIcon = ({ className }: { className?: string }) => (
    <i className={`fa-brands fa-whatsapp ${className}`}></i>
);

export const ExpandIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 2h-2v3h-3v2h5v-5zm-3-4V7h-2V5h5v5h-2z"/>
    </svg>
);

export const CompressIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
    </svg>
);