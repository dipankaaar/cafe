import React, { useState, useEffect } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { coffeeMenuCol1, coffeeMenuCol2 } from '../../data/coffeeData';

export default function SearchModal({ isOpen, onClose, onAddToCart }) {
  const [query, setQuery] = useState('');
  const allItems = [...coffeeMenuCol1, ...coffeeMenuCol2];

  useEffect(() => {
    if (isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredItems = query.trim() === ''
    ? []
    : allItems.filter(item =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
      );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/90 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="min-h-screen px-4 text-center flex flex-col items-center justify-start pt-24 pb-12 relative z-10">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-8 h-8" />
        </button>

        <div className="w-full max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-[#DD5903] font-bold mb-3">Dinenos Menu Search</p>
          <h2 className="text-3xl sm:text-4xl text-white font-['Arapey',serif] mb-8">What coffee can we brew for you?</h2>

          {/* Search Input Box */}
          <div className="relative mb-8">
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search drinks, latte, cappuccino, espresso..."
              className="w-full bg-[#1e1e1e] border-2 border-white/20 focus:border-[#DD5903] rounded-full py-4 pl-14 pr-6 text-lg text-white placeholder-gray-400 outline-none transition-all shadow-2xl"
            />
            <Search className="w-6 h-6 text-gray-400 absolute left-5 top-1/2 -translate-y-1/2" />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
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
                  <p>No matching coffee items found. Try "Latte", "Cold Brew", or "Espresso".</p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#222222]/80 hover:bg-[#282828] transition-colors border border-white/5"
                  >
                    <div className="flex items-center gap-4">
                      <img src={item.image} alt={item.name} className="w-12 h-12 rounded-full object-cover" />
                      <div>
                        <h4 className="text-white font-bold text-base flex items-center gap-2">
                          {item.name}
                          {item.badge && (
                            <span className="text-[10px] bg-[#DD5903] text-white px-2 py-0.5 rounded font-normal">
                              {item.badge}
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-gray-400">{item.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-[#DD5903] font-mono">${item.price}</span>
                      <button
                        onClick={() => {
                          onAddToCart(item);
                          onClose();
                        }}
                        className="dinenos-btn !py-1.5 !px-3.5 text-xs"
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
              {['Americano', 'Cappuccino', 'Cold Brew', 'Latte', 'Ristretto'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setQuery(tag)}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 hover:text-white rounded-full text-xs text-gray-300 transition-colors"
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
