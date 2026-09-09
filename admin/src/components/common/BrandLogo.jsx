import React from 'react';
import { Coffee } from 'lucide-react';

export default function BrandLogo({ className = "", size = "default", light = true }) {
  const isSmall = size === "sm";
  const isLarge = size === "lg";

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Emblem Icon */}
      <div
        className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-[#DD5903] via-[#e8660e] to-[#993b00] text-white shadow-lg shadow-orange-950/40 flex-shrink-0 border border-amber-400/30 transition-transform duration-300 group-hover:scale-105 ${
          isSmall ? 'w-8 h-8' : isLarge ? 'w-12 h-12' : 'w-10 h-10'
        }`}
      >
        <Coffee className={isSmall ? 'w-4 h-4' : isLarge ? 'w-6 h-6' : 'w-5 h-5'} />
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-300 animate-ping opacity-75" />
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col leading-tight">
        <span
          className={`font-['Arapey',serif] font-bold tracking-wider uppercase transition-colors ${
            light ? 'text-white group-hover:text-amber-300' : 'text-[#111111] group-hover:text-[#DD5903]'
          } ${isSmall ? 'text-lg' : isLarge ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'}`}
        >
          PETUK ADDA
        </span>
        <span
          className={`font-['Plus_Jakarta_Sans',sans-serif] font-bold tracking-[0.28em] text-[#DD5903] uppercase ${
            isSmall ? 'text-[9px]' : isLarge ? 'text-xs' : 'text-[10px] sm:text-[11px]'
          }`}
        >
          CAFE
        </span>
      </div>
    </div>
  );
}
