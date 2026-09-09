import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useCafe } from '../../context/CafeContext';
import { formatINR, getProductImage, getProductPrice, handleImageFallback } from '../../utils/formatters';
import ProductPriceRating from '../common/ProductPriceRating';

export default function SearchModal({ isOpen, onClose, onAddToCart }) {
  const { products } = useCafe();
  const [query, setQuery] = useState('');
  // Live API menu only — no mock data
  const allItems = products || [];

  useEffect(() => {
    if (isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();
  const filteredItems = q === ''
    ? []
    : allItems.filter((item) => {
        if (item.isAvailable === false) return false;
        return (
          (item.name && item.name.toLowerCase().includes(q)) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          (item.categoryName && item.categoryName.toLowerCase().includes(q))
        );
      }).slice(0, 20);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-label="Search menu">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/90 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="min-h-screen px-4 text-center flex flex-col items-center justify-start pt-24 pb-12 relative z-10">
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close search"
          className="absolute top-8 right-8 text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-8 h-8" />
        </button>

        <div className="w-full max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-[#DD5903] font-bold mb-3">Petuk Adda Cafe Menu Search</p>
          <h2 className="text-3xl sm:text-4xl text-white font-['Arapey',serif] mb-8">What coffee can we brew for you?</h2>

          {/* Search Input Box */}
          <div className="relative mb-8">
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search drinks, latte, cappuccino, espresso..."
              aria-label="Search menu items"
              className="w-full bg-[#1e1e1e] border-2 border-white/20 focus:border-[#DD5903] rounded-full py-4 pl-14 pr-6 text-lg text-white placeholder-gray-400 outline-none transition-all shadow-2xl"
            />
            <Search className="w-6 h-6 text-gray-400 absolute left-5 top-1/2 -translate-y-1/2" />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Search Results */}
          {query.trim() !== '' && (
            <div className="bg-[#181818] border border-white/10 rounded-2xl p-6 text-left shadow-2xl space-y-4 max-h-[60vh] overflow-y-auto">
              <p className="text-xs uppercase text-gray-400 font-semibold mb-2">
                Found {filteredItems.length} result{filteredItems.length === 1 ? '' : 's'} for "{query}"
              </p>

              {filteredItems.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No matching items found. Try "Latte", "Biryani", or "Paneer".</p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#222222]/80 hover:bg-[#282828] transition-colors border border-white/5"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <img
                        src={getProductImage(item)}
                        alt={item.name}
                        loading="lazy"
                        onError={handleImageFallback}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-white font-bold text-base flex items-center gap-2 truncate">
                          <span
                            title={item.isVeg ? 'Veg' : 'Non-veg'}
                            className={`w-3 h-3 rounded-[3px] border flex-shrink-0 ${item.isVeg ? 'border-emerald-500' : 'border-rose-500'}`}
                          >
                            <span className={`block w-full h-full rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ transform: 'scale(0.55)' }} />
                          </span>
                          <span className="truncate">{item.name}</span>
                          {item.badge && (
                            <span className="text-[10px] bg-[#DD5903] text-white px-2 py-0.5 rounded font-normal flex-shrink-0">
                              {item.badge}
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-gray-400 line-clamp-1 mb-1">{item.description}</p>
                        <ProductPriceRating product={item} mode="online" theme="dark" size="sm" showRating={true} />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <button
                        onClick={() => {
                          onAddToCart(item);
                          onClose();
                        }}
                        className="dinenos-btn !py-1.5 !px-3.5 text-xs cursor-pointer whitespace-nowrap"
                      >
                        Add to Order
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Popular Quick Suggestions */}
          {query.trim() === '' && (
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-gray-400">
              <span>Popular searches:</span>
              {['Moglai', 'Chowmin', 'Chicken Kosa', 'Paneer 65', 'Cold Coffee', 'Mojito', 'Special Roll'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setQuery(tag)}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 hover:text-white rounded-full text-xs text-gray-300 transition-colors cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
