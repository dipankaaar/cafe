import React, { useState, useMemo } from 'react';
import { Plus, Search, Check, SlidersHorizontal, AlertCircle, Coffee } from 'lucide-react';
import { useCafe } from '../../context/CafeContext';
import ProductCustomizeModal from './ProductCustomizeModal';
import ProductPriceRating from '../common/ProductPriceRating';
import { formatINR, getProductImage, getProductPrice, isProductOnlineEnabled, handleImageFallback } from '../../utils/formatters';

function MenuSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start" aria-hidden="true">
      {[0, 1].map((col) => (
        <div key={col} className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 flex items-center gap-4 animate-pulse">
              <div className="w-16 h-16 rounded-xl bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
              <div className="h-6 w-14 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function DietBadge({ isVeg }) {
  return (
    <span
      title={isVeg ? 'Veg' : 'Non-veg'}
      className={`w-4 h-4 rounded-[4px] border-2 flex items-center justify-center p-[2px] bg-white flex-shrink-0 ${
        isVeg ? 'border-emerald-600' : 'border-rose-600'
      }`}
    >
      <span className={`w-full h-full rounded-full ${isVeg ? 'bg-emerald-600' : 'bg-rose-600'} block`} />
    </span>
  );
}

export default function CoffeeMenuSection({ onAddToCart, onOpenReservation }) {
  const { products, categories } = useCafe();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dietFilter, setDietFilter] = useState('all'); // all | veg | nonveg
  const [addedId, setAddedId] = useState(null);
  const [customizing, setCustomizing] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [isLoading] = useState(false);

  const categoryIdByName = useMemo(() => {
    const map = {};
    (categories || []).forEach((c) => {
      if (c?.name) map[String(c.name).toLowerCase()] = c.id;
      if (c?.id) map[String(c.id).toLowerCase()] = c.id;
    });
    return map;
  }, [categories]);

  const resolveCategoryId = (p) => {
    if (!p) return '';
    if (typeof p.category === 'string') return p.category;
    return p.categoryId || p.categoryName || '';
  };

  // Filtered menu items: live API only, no mock data
  const menuItems = useMemo(() => {
    try {
      if (!products || products.length === 0) return [];
      const q = searchQuery.trim().toLowerCase();
      return products.filter((p) => {
        if (p.isAvailable === false || !isProductOnlineEnabled(p)) return false;
        if (selectedCategory !== 'all') {
          const pid = resolveCategoryId(p);
          const target = categoryIdByName[String(selectedCategory).toLowerCase()] || selectedCategory;
          const selectedName = (categories || []).find((c) => c.id === selectedCategory)?.name;
          const match =
            pid === selectedCategory ||
            pid === target ||
            p.categoryName === selectedCategory ||
            (selectedName && (pid === selectedName || p.categoryName === selectedName));
          if (!match) return false;
        }
        if (dietFilter === 'veg' && !p.isVeg) return false;
        if (dietFilter === 'nonveg' && p.isVeg) return false;
        if (q) {
          const hay = `${p.name || ''} ${p.description || ''} ${p.categoryName || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
    } catch (err) {
      setLoadError('Could not filter the menu. Please refresh.');
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, selectedCategory, categories, searchQuery, dietFilter, categoryIdByName]);

  const col1 = useMemo(() => menuItems.slice(0, Math.ceil(menuItems.length / 2)), [menuItems]);
  const col2 = useMemo(() => menuItems.slice(Math.ceil(menuItems.length / 2)), [menuItems]);

  const handleQuickAdd = (item) => {
    onAddToCart?.(item, 1, 'Standard', []);
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  const handleCustomConfirm = (product, quantity, variant, addons, unitPrice) => {
    onAddToCart?.(product, quantity, variant, addons, unitPrice);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  const renderCard = (item) => {
    const isAdded = addedId === item.id;
    const price = getProductPrice(item) || 150;
    return (
      <div
        key={item.id}
        className="group bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md hover:border-[#DD5903]/30 transition-all duration-300 flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 relative">
            <img
              src={getProductImage(item)}
              alt={item.name}
              loading="lazy"
              decoding="async"
              onError={handleImageFallback}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <span className="absolute top-1 left-1 rounded-full bg-white p-[3px] shadow-xs">
              <DietBadge isVeg={!!item.isVeg} />
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-lg sm:text-xl text-[#111111] font-['Arapey',serif] font-bold group-hover:text-[#DD5903] transition-colors truncate">
                {item.name}
              </h4>
            </div>

            {/* Price & Rating (E-commerce Style) */}
            <ProductPriceRating product={item} mode="online" theme="light" size="sm" className="my-1" />

            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
              {item.description || 'Crafted with premium selected ingredients.'}
            </p>
            <button
              onClick={() => setCustomizing(item)}
              className="mt-1 text-[11px] font-bold text-[#DD5903] hover:underline cursor-pointer"
            >
              Customize →
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => handleQuickAdd(item)}
            aria-label={`Add ${item.name} to cart`}
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
  };

  return (
    <section id="menu" className="py-20 lg:py-28 bg-[#FAFAFA] relative overflow-hidden text-[#111111]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto">
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

          {/* Search + veg filter */}
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search latte, biryani, paneer…"
                aria-label="Search menu"
                className="w-full bg-white border border-gray-200 rounded-full py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#DD5903] shadow-sm"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full p-1 text-xs font-bold" role="group" aria-label="Dietary filter">
              {[
                { id: 'all', label: 'All' },
                { id: 'veg', label: '🟢 Veg' },
                { id: 'nonveg', label: '🔴 Non-veg' }
              ].map((o) => (
                <button
                  key={o.id}
                  onClick={() => setDietFilter(o.id)}
                  aria-pressed={dietFilter === o.id}
                  className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                    dietFilter === o.id ? 'bg-[#DD5903] text-white shadow' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
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
            {(categories || []).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#DD5903] text-white shadow-md shadow-orange-500/20'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Error toast (inline) */}
        {loadError && (
          <div className="max-w-xl mx-auto flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm" role="alert">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{loadError}</span>
          </div>
        )}

        {/* Menu grid / skeletons / empty state */}
        {isLoading ? (
          <MenuSkeleton />
        ) : menuItems.length === 0 ? (
          <div className="max-w-xl mx-auto bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-orange-50 text-[#DD5903] flex items-center justify-center mx-auto">
              <Coffee className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold font-['Arapey',serif]">No dishes found</h3>
            <p className="text-sm text-gray-500">
              {searchQuery || selectedCategory !== 'all' || dietFilter !== 'all'
                ? 'Try clearing your search or filters to see more of the menu.'
                : 'Our menu is being updated. Please check back shortly.'}
            </p>
            {(searchQuery || selectedCategory !== 'all' || dietFilter !== 'all') && (
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setDietFilter('all'); }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#DD5903] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
            <div className="space-y-4">{col1.map(renderCard)}</div>
            <div className="space-y-4">{col2.map(renderCard)}</div>
          </div>
        )}

        {/* Bottom Booking Callout */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-lg border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-[#DD5903]">Experience Petuk Adda Cafe Ambiance</span>
            <h3 className="text-2xl sm:text-3xl font-['Arapey',serif] font-bold text-[#111111] mt-1">Reserve Your Table at Petuk Adda Cafe</h3>
            <p className="text-xs text-gray-500 mt-1">Instant online table booking with premium hospitality in Salboni.</p>
          </div>
          <button
            onClick={onOpenReservation}
            className="dinenos-btn !py-3.5 !px-8 text-xs uppercase tracking-wider font-bold whitespace-nowrap shadow-xl cursor-pointer"
          >
            Find a Table Now
          </button>
        </div>
      </div>

      {customizing && (
        <ProductCustomizeModal
          product={customizing}
          onClose={() => setCustomizing(null)}
          onConfirm={handleCustomConfirm}
        />
      )}
    </section>
  );
}
