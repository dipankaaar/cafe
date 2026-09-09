import React from 'react';
import { formatINR, getProductRating, getProductPricingInfo } from '../../utils/formatters';

/**
 * Renders e-commerce style rating badge and price row:
 * [ 3.7 ★ ] (285)
 * ₹1,499  ₹3,499  57% off
 */
export default function ProductPriceRating({
  product,
  mode = 'online',
  theme = 'dark', // 'dark' | 'light'
  showRating = true,
  size = 'md', // 'sm' | 'md' | 'lg'
  className = ''
}) {
  if (!product) return null;

  const { rating, count } = getProductRating(product);
  const { sellingPrice, originalPrice, discountPercent } = getProductPricingInfo(product, mode);

  const isLight = theme === 'light';

  return (
    <div className={`space-y-1 ${className}`}>
      {/* 1. Rating Badge row: [3.7 ★] (285) */}
      {showRating && (
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-0.5 bg-[#267e3e] text-white text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded leading-none shadow-xs tracking-tight">
            <span>{rating}</span>
            <span className="text-[9px] leading-none">★</span>
          </span>
          <span className={`text-[11px] sm:text-xs font-medium ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
            ({count})
          </span>
        </div>
      )}

      {/* 2. Price Row: ₹1,499  ₹3,499  57% off */}
      <div className="flex items-baseline gap-2 flex-wrap font-sans">
        {/* Main Selling Price */}
        <span
          className={`font-black tracking-tight ${
            size === 'sm' ? 'text-sm sm:text-base' : size === 'lg' ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'
          } ${isLight ? 'text-[#111111]' : 'text-white'}`}
        >
          {formatINR(sellingPrice, { whole: true })}
        </span>

        {/* Strikethrough Original Price */}
        {originalPrice > sellingPrice && (
          <>
            <span
              className={`line-through font-normal text-xs sm:text-[13px] ${
                isLight ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              {formatINR(originalPrice, { whole: true })}
            </span>

            {/* Discount % in Green */}
            <span className="text-xs sm:text-[13px] font-bold text-[#388e3c]">
              {discountPercent}% off
            </span>
          </>
        )}
      </div>
    </div>
  );
}
