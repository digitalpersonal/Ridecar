import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <i className="fa-solid fa-car-side text-primary text-xl animate-pulse"></i>
        </div>
      </div>
      <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em] animate-pulse">
        Carregando RideCar...
      </p>
    </div>
  );
};

export default LoadingSpinner;