import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowLeft,
  Coffee,
  QrCode, 
  Utensils, 
  Sparkles, 
  Tag, 
  Info, 
  Leaf, 
  Flame, 
  ShoppingBag, 
  ArrowRight,
  Filter,
  Star,
  Check
} from 'lucide-react';
import { useCafe } from '../context/CafeContext';
import BrandLogo from '../components/common/BrandLogo';
import { formatINR, getProductImage, getProductPrice, handleImageFallback } from '../utils/formatters';

export default function ExploreMenuPage({ onNavigate }) {
  const { products, categories } = useCafe();

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState('all'); // 'all' | 'veg' | 'non-veg'
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [tableCode, setTableCode] = useState('');

  const handleTableCodeSubmit = (e) => {
    e.preventDefault();
    if (!tableCode.trim()) return;
    let token = tableCode.trim();
    if (token.includes('#order/')) token = token.split('#order/')[1];
    else if (token.includes('/order/')) token = token.split('/order/')[1];
    onNavigate(`/order/${token}`);
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCat = activeCategory === 'all' || p.category === activeCategory || p.categoryId === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesDiet = dietaryFilter === 'all' || 
                          (dietaryFilter === 'veg' && p.isVeg) || 
                          (dietaryFilter === 'non-veg' && !p.isVeg);
      return matchesCat && matchesSearch && matchesDiet;
    });
  }, [products, activeCategory, searchQuery, dietaryFilter]);

  // Group products by category for structured browsing
  const groupedCategories = useMemo(() => {
    if (activeCategory !== 'all') {
      const cat = categories.find(c => c.id === activeCategory);
      return [{
        category: cat || { id: activeCategory, name: 'Menu Selection' },
        items: filteredProducts
      }];
    }

    return categories.map(cat => ({
      category: cat,
      items: filteredProducts.filter(p => p.category === cat.id || p.categoryId === cat.id)
    })).filter(g => g.items.length > 0);
  }, [categories, filteredProducts, activeCategory]);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white font-['Plus_Jakarta_Sans',sans-serif] pb-20">
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#141414]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-gray-300 hover:text-[#DD5903] transition-colors py-1 px-2 rounded-lg hover:bg-white/5 cursor-pointer"
            title="Return to Home"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
          <div className="h-4 w-px bg-white/10 hidden sm:block" />
          <BrandLogo size="small" light={true} />
        </div>

        {/* Switch to Order Online Button */}
        <button
          onClick={() => onNavigate('/order-online')}
          className="dinenos-btn !py-2 !px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Switch to</span>
          <span>Order Online</span>
        </button>
      </header>

      {/* Hero Intro */}
      <section className="relative pt-12 pb-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#DD5903]/20 border border-[#DD5903]/40 text-[#DD5903] text-xs font-bold tracking-[0.2em] uppercase">
          <Utensils className="w-3.5 h-3.5" />
          <span>Artisan Food & Specialty Coffee Catalog</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal font-['Arapey',serif] text-white">
          Explore Our <span className="italic text-[#DD5903]">Artisanal Menu</span>
        </h1>

        <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto font-light leading-relaxed">
          Browse our complete handcrafted selection of single-origin coffees, chef-curated sandwiches, breakfast specialties, and divine desserts in Salboni.
        </p>

        {/* Search & Filter Controls */}
        <div className="pt-6 max-w-2xl mx-auto space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dishes, drinks, ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#181818] border border-white/15 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder-gray-500 outline-none focus:border-[#DD5903] shadow-lg transition-colors"
            />
          </div>

          <div className="flex items-center justify-center gap-2 pt-1 flex-wrap text-xs">
            <button
              onClick={() => setDietaryFilter('all')}
              className={`px-3.5 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                dietaryFilter === 'all' ? 'bg-[#DD5903] text-white shadow-md' : 'bg-[#181818] text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setDietaryFilter('veg')}
              className={`px-3.5 py-1.5 rounded-full font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                dietaryFilter === 'veg' ? 'bg-emerald-600 text-white shadow-md' : 'bg-[#181818] text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Vegetarian</span>
            </button>
            <button
              onClick={() => setDietaryFilter('non-veg')}
              className={`px-3.5 py-1.5 rounded-full font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                dietaryFilter === 'non-veg' ? 'bg-rose-600 text-white shadow-md' : 'bg-[#181818] text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Non-Vegetarian</span>
            </button>
          </div>
        </div>
      </section>

      {/* Sticky Category Tabs */}
      <div className="sticky top-14 z-30 bg-[#0d0d0d]/90 backdrop-blur-md border-y border-white/10 py-3 px-4">
        <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
              activeCategory === 'all'
                ? 'bg-[#DD5903] text-white border-[#DD5903] shadow-md shadow-orange-950/40'
                : 'bg-[#181818] text-gray-400 hover:text-white border-white/10'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                activeCategory === cat.id
                  ? 'bg-[#DD5903] text-white border-[#DD5903] shadow-md shadow-orange-950/40'
                  : 'bg-[#181818] text-gray-400 hover:text-white border-white/10'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Menu Sections */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-12">
        {groupedCategories.length === 0 ? (
          <div className="bg-[#181818] border border-white/10 rounded-2xl p-12 text-center text-gray-400 space-y-3">
            <Info className="w-8 h-8 text-[#DD5903] mx-auto" />
            <h3 className="text-lg font-bold text-white">No menu items found</h3>
            <p className="text-xs">No items match your selected category or filter criteria.</p>
          </div>
        ) : (
          groupedCategories.map(({ category, items }) => (
            <div key={category.id} className="space-y-6">
              
              {/* Category Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#DD5903]/20 border border-[#DD5903]/40 text-[#DD5903] flex items-center justify-center font-bold">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold font-['Arapey',serif] text-white tracking-wide">
                      {category.name}
                    </h2>
                    <p className="text-[11px] text-gray-400">
                      {items.length} Handcrafted Dishes & Drinks
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((prod) => {
                  return (
                    <div
                      key={prod.id}
                      onClick={() => setSelectedProductDetails(prod)}
                      className="bg-[#181818] hover:bg-[#202020] border border-white/10 hover:border-white/20 rounded-2xl p-4 flex gap-4 transition-all duration-200 cursor-pointer group shadow-md"
                    >
                      {/* Left Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          {/* Veg / Non-Veg Indicator */}
                          <div className="flex items-center gap-2">
                            <span className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center p-0.5 ${
                              prod.isVeg ? 'border-emerald-500' : 'border-rose-500'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${prod.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            </span>
                            {prod.badge && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                                {prod.badge}
                              </span>
                            )}
                          </div>

                          {/* Item Title */}
                          <h3 className="text-base font-bold text-white group-hover:text-[#DD5903] transition-colors font-['Plus_Jakarta_Sans',sans-serif]">
                            {prod.name}
                          </h3>

                          {/* Price */}
                          <p className="text-sm font-bold text-white font-mono">
                            {formatINR(getProductPrice(prod), { whole: true })}
                          </p>

                          {/* Description */}
                          {prod.description && (
                            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                              {prod.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 text-[11px] text-[#DD5903] font-semibold flex items-center gap-1">
                          <span>View Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      {/* Right Image */}
                      <div className="w-28 h-28 rounded-xl overflow-hidden bg-black flex-shrink-0 border border-white/10 relative">
                        <img
                          src={getProductImage(prod)}
                          alt={prod.name}
                          loading="lazy"
                          onError={handleImageFallback}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          ))
        )}

        {/* Bottom Banner: Ready to Order? */}
        <div className="bg-gradient-to-r from-[#1f1610] via-[#1c1815] to-[#1f1610] border border-[#DD5903]/30 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <Sparkles className="w-8 h-8 text-[#DD5903] mx-auto" />
          <h2 className="text-2xl sm:text-3xl font-bold font-['Arapey',serif] text-white">
            Craving Petuk Adda Cafe Delights?
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 max-w-lg mx-auto">
            Order directly for fast home delivery across Bankura Town or pickup takeaway fresh from our Salboni outlet.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('/order-online')}
              className="dinenos-btn !py-3 !px-8 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xl cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Order Online Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('/find-table')}
              className="dinenos-btn-outline !py-3 !px-6 text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Book a Dining Table
            </button>
            <button
              onClick={() => onNavigate('/scan-table')}
              className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border border-white/20 flex items-center gap-2"
            >
              <QrCode className="w-4 h-4 text-[#DD5903]" />
              <span>Order from Table</span>
            </button>
          </div>
        </div>
      </main>

      {/* Item Details Modal */}
      {selectedProductDetails && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-white/15 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-scaleUp">
            <div className="h-56 bg-black relative">
              <img
                src={getProductImage(selectedProductDetails)}
                alt={selectedProductDetails.name}
                onError={handleImageFallback}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedProductDetails(null)}
                className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center p-0.5 ${
                      selectedProductDetails.isVeg ? 'border-emerald-500' : 'border-rose-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedProductDetails.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    </span>
                    <span className="text-xs text-gray-400 font-semibold uppercase">{selectedProductDetails.categoryName || (typeof selectedProductDetails.category === 'string' && selectedProductDetails.category.startsWith('cat-') ? 'Menu' : selectedProductDetails.category)}</span>
                  </div>
                  <h3 className="text-xl font-bold font-['Arapey',serif] text-white">
                    {selectedProductDetails.name}
                  </h3>
                </div>
                <span className="text-lg font-bold font-mono text-[#DD5903]">
                  {formatINR(getProductPrice(selectedProductDetails), { whole: true })}
                </span>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">
                {selectedProductDetails.description || "Prepared freshly with premium artisan ingredients and traditional cafe techniques at Petuk Adda Cafe."}
              </p>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => onNavigate('/order-online')}
                  className="dinenos-btn flex-1 !py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Order Online ({formatINR(getProductPrice(selectedProductDetails), { whole: true })})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
