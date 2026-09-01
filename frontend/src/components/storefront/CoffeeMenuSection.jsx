import React, { useState, useMemo } from 'react';
import { Plus, ShoppingBag, Leaf, Sparkles, Check } from 'lucide-react';
import { useCafe } from '../../context/CafeContext';

export default function CoffeeMenuSection({ onAddToCart, onOpenReservation }) {
  const { products, categories } = useCafe();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [addedId, setAddedId] = useState(null);

  // Available categories
  const activeCategories = useMemo(() => {
    if (!categories || categories.length === 0) return [];
    return categories.slice(0, 6);
  }, [categories]);

  // Filtered menu items
  const menuItems = useMemo(() => {
    if (!products || products.length === 0) return [];
    const available = products.filter(p => p.isAvailable);
    if (selectedCategory === 'all') return available.slice(0, 10);
    return available.filter(p => p.category === selectedCategory || p.categoryId === selectedCategory);
  }, [products, selectedCategory]);

  const col1 = useMemo(() => menuItems.slice(0, Math.ceil(menuItems.length / 2)), [menuItems]);
  const col2 = useMemo(() => menuItems.slice(Math.ceil(menuItems.length / 2)), [menuItems]);

  const handleAddClick = (item) => {
    onAddToCart(item);
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  return (
    <section id="menu" className="py-20 lg:py-28 bg-[#FAFAFA] relative overflow-hidden text-[#111111]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img
              src="https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/02/title-shape.png"
              alt="Shape"
              className="h-6 w-auto"
            />
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-[54px] text-[#111111] font-['Arapey',serif] font-normal leading-tight">
            Our Centralized <br />
            <span className="italic text-[#DD5903]">Artisanal Menu</span>
          </h2>
          <div className="diamond-divider !my-3">
            <div className="diamond-shape"></div>
          </div>
          <p className="text-sm text-gray-600 max-w-lg mx-auto">
            Freshly ground single-origin coffees, handcrafted teas, and oven-fresh bakery delights.
          </p>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#DD5903] text-white shadow-md shadow-orange-500/20'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              All Items
            </button>
            {activeCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name || cat.id)}
                className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                  selectedCategory === (cat.name || cat.id)
                    ? 'bg-[#DD5903] text-white shadow-md shadow-orange-500/20'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Dual Column Menu Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          
          {/* Column 1 */}
          <div className="space-y-4">
            {col1.map((item) => {
              const isAdded = addedId === item.id;
              const price = item.sellingPrice || item.price || 150;

              return (
                <div
                  key={item.id}
                  className="group bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md hover:border-[#DD5903]/30 transition-all duration-300 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-black flex-shrink-0 relative">
                      <img
                        src={item.image || item.imageUrl || 'https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/03/latte.jpg'}
                        alt={item.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {item.isVeg && (
                        <span className="absolute top-1 left-1 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center p-0.5 shadow-xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 block"></span>
                        </span>
                      )}
                    </div>
                    
                    <div className="min-w-0">
                      <h4 className="text-xl sm:text-2xl text-[#111111] font-['Arapey',serif] font-bold group-hover:text-[#DD5903] transition-colors truncate">
                        {item.name}
                      </h4>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                        {item.description || 'Crafted with premium selected ingredients.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xl sm:text-2xl font-bold font-['Arapey',serif] text-[#DD5903]">
                      ₹{price.toFixed(0)}
                    </span>
                    <button
                      onClick={() => handleAddClick(item)}
                      className={`p-2.5 rounded-full transition-all duration-200 cursor-pointer shadow-xs ${
                        isAdded 
                          ? 'bg-emerald-600 text-white scale-105' 
                          : 'bg-[#FAFAFA] group-hover:bg-[#DD5903] text-gray-600 group-hover:text-white hover:scale-110'
                      }`}
                      title="Add to order"
                    >
                      {isAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
            {col2.map((item) => {
              const isAdded = addedId === item.id;
              const price = item.sellingPrice || item.price || 150;

              return (
                <div
                  key={item.id}
                  className="group bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md hover:border-[#DD5903]/30 transition-all duration-300 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-black flex-shrink-0 relative">
                      <img
                        src={item.image || item.imageUrl || 'https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/03/latte.jpg'}
                        alt={item.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {item.isVeg && (
                        <span className="absolute top-1 left-1 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center p-0.5 shadow-xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 block"></span>
                        </span>
                      )}
                    </div>
                    
                    <div className="min-w-0">
                      <h4 className="text-xl sm:text-2xl text-[#111111] font-['Arapey',serif] font-bold group-hover:text-[#DD5903] transition-colors truncate">
                        {item.name}
                      </h4>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                        {item.description || 'Crafted with premium selected ingredients.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xl sm:text-2xl font-bold font-['Arapey',serif] text-[#DD5903]">
                      ₹{price.toFixed(0)}
                    </span>
                    <button
                      onClick={() => handleAddClick(item)}
                      className={`p-2.5 rounded-full transition-all duration-200 cursor-pointer shadow-xs ${
                        isAdded 
                          ? 'bg-emerald-600 text-white scale-105' 
                          : 'bg-[#FAFAFA] group-hover:bg-[#DD5903] text-gray-600 group-hover:text-white hover:scale-110'
                      }`}
                      title="Add to order"
                    >
                      {isAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Bottom Booking Callout */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-lg border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-[#DD5903]">Experience Dinenos Ambiance</span>
            <h3 className="text-2xl sm:text-3xl font-['Arapey',serif] font-bold text-[#111111] mt-1">Reserve Your Private Table or Terrace Spot</h3>
            <p className="text-xs text-gray-500 mt-1">Instant online table booking with priority barista service.</p>
          </div>
          <button
            onClick={onOpenReservation}
            className="dinenos-btn !py-3.5 !px-8 text-xs uppercase tracking-wider font-bold whitespace-nowrap shadow-xl"
          >
            Find a Table Now
          </button>
        </div>

      </div>
    </section>
  );
}
