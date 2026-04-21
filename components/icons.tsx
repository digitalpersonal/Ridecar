
import React from 'react';

export const RideCarLogo = ({ 
  className, 
  horizontal = false, 
  textSize,
  customName,
  customLogoUrl,
  hideIcon = false
}: { 
  className?: string, 
  horizontal?: boolean, 
  textSize?: string,
  customName?: string,
  customLogoUrl?: string,
  hideIcon?: boolean
}) => {
  const finalTextSize = textSize || (horizontal ? 'text-2xl' : 'text-5xl');
  
  const brandName = customName || "RideCar";
  let firstPart = "";
  let lastPart = "";

  // Lógica inteligente para destacar a marca mesmo sem espaços
  if (brandName.toLowerCase() === "ridecar") {
      firstPart = "Ride";
      lastPart = "Car";
  } else {
      const nameParts = brandName.split(' ');
      if (nameParts.length > 1) {
          firstPart = nameParts[0];
          lastPart = nameParts.slice(1).join(' ');
      } else {
          // Se for só uma palavra, divide ao meio ou destaca a segunda metade
          const mid = Math.ceil(brandName.length / 2);
          firstPart = brandName.substring(0, mid);
          lastPart = brandName.substring(mid);
      }
  }

  const tagline = customName ? "GESTÃO PROFISSIONAL" : "A FERRAMENTA DO MOTORISTA";

  return (
    <div className={`flex ${horizontal && !hideIcon ? 'flex-row gap-3' : 'flex-col'} items-center justify-center ${className || ''}`}>
        {!hideIcon && (
            <div className={`relative rounded-full border-2 border-primary bg-black overflow-hidden shadow-[0_0_15px_rgba(249,115,22,0.5)] z-10 shrink-0 flex items-center justify-center aspect-square ${horizontal ? 'h-14 w-14' : 'w-40 h-40'}`}>
                <img 
                    src={customLogoUrl || "https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=500&auto=format&fit=crop"} 
                    alt="Logo" 
                    className="w-full h-full object-cover scale-110"
                />
            </div>
        )}
        
        <div className="flex flex-col items-center">
            <h1 className={`${!hideIcon && !horizontal ? 'mt-3' : ''} ${finalTextSize} font-black italic tracking-tighter text-white drop-shadow-2xl leading-none`} style={{ fontFamily: 'sans-serif' }}>
                {firstPart}<span className="text-primary">{lastPart || ""}</span>
            </h1>
            {!horizontal && (
                <p className="text-[10px] md:text-[12px] text-primary font-black uppercase tracking-[0.3em] mt-1 drop-shadow-md">
                    {tagline}
                </p>
            )}
        </div>
    </div>
  );
};

export const UserIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
);

export const WhatsAppIcon = ({ className }: { className?: string }) => (
    <i className={`fa-brands fa-whatsapp ${className}`}></i>
);

export const PinIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
);

export const ExpandIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 2h-2v3h-3v2h5v-5zm-3-4V7h-2V5h5v5h-2z"/></svg>
);

export const CompressIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
);

export const IdCardIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zM4 18V6h16v12H4zm6-1h4v-1h-4v1zm0-2h4v-1h-4v1zm-3-4.5c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm-1 4h6v-1H6v1z" /></svg>
);

export const CarIcon = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} style={style}><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" /></svg>
);
