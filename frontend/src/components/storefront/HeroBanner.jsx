import React, { useState } from 'react';
import { Coffee, Utensils, QrCode, ShoppingBag, Armchair, ArrowRight } from 'lucide-react';

const HERO_IMAGE = 'https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/03/restaurant.webp';
const HERO_FALLBACK = 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1600&auto=format&fit=crop&q=80';

export default function HeroBanner({ onNavigate, onOpenReservation, onOpenCart, onOpenMenu, onOpenQrScanner }) {
  const [tableCode, setTableCode] = useState('');
  const go = (path) => {
    if (onNavigate) onNavigate(path);
    else window.location.hash = path.replace('/', '');
  };
  const handleOrderOnline = () => {
    if (onOpenCart) onOpenCart();
    else go('/order-online');
  };
  const handleExploreMenu = () => {
    if (onOpenMenu) onOpenMenu();
    else go('/menu');
  };
  const handleScanQr = () => {
    if (onOpenQrScanner) onOpenQrScanner();
    else go('/scan-table');
  };
  const handleFindTable = () => {
    if (onOpenReservation) onOpenReservation();
    else go('/find-table');
  };
  return (
    <section aria-label="Welcome to Dinenos Coffee House" className="relative min-h-[100svh] lg:min-h-screen flex items-center justify-center bg-[#3C2415] overflow-hidden">
      
      {/* Background Image with Dark Vignette Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={HERO_IMAGE}
          alt="Petuk Adda Cafe Ambiance"
          onError={(e) => { if (e.currentTarget.src !== HERO_FALLBACK) e.currentTarget.src = HERO_FALLBACK; }}
          className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-1000 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/85" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#3C2415] via-transparent to-black/60" />
      </div>

      {/* Decorative Floating Coffee Beans Background Elements */}
      <div className="absolute top-1/4 left-10 w-24 h-24 opacity-25 animate-float pointer-events-none hidden lg:block">
        <img
          src="https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/02/vector7.webp"
          alt=""
          className="w-full h-full object-contain"
        />
      </div>

      <div className="absolute bottom-24 right-12 w-28 h-28 opacity-20 animate-float-slow pointer-events-none hidden lg:block">
        <img
          src="https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/02/vector6.webp"
          alt=""
          className="w-full h-full object-contain"
        />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-16">
        
        {/* Tagline Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#DD5903]/20 border border-[#DD5903]/40 text-[#DD5903] text-xs sm:text-sm font-bold tracking-[0.2em] uppercase mb-6 backdrop-blur-sm animate-pulse-subtle">
          <Coffee className="w-3.5 h-3.5" />
          <span>Artisan Coffee & Gourmet Dining • Salboni</span>
        </div>

        {/* Arapey Heading */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[82px] text-white font-[Playfair_Display,Arapey,serif] font-normal leading-[1.1] tracking-tight mb-6 max-w-4xl mx-auto">
          Welcome To <br className="hidden sm:inline" />
          <span className="italic text-[#F5A623]">Dinenos Coffee House</span>
        </h1>

        {/* Subtitle description */}
        <p className="text-base sm:text-lg text-[#FFF8F0]/80 max-w-2xl mx-auto font-light leading-relaxed mb-10">
          Where every sip and bite tells a story. Premium espresso, artisan coffee and gourmet dining — order from your table or explore the menu.
        </p>

        {/* Primary CTAs (mission-required) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
          <button
            onClick={handleScanQr}
            aria-label="Order from your table — scan QR"
            className="dinenos-btn !py-3.5 !px-8 text-xs uppercase tracking-wider font-bold w-full sm:w-auto shadow-2xl flex items-center justify-center gap-2 group cursor-pointer"
          >
            <QrCode className="w-4 h-4" aria-hidden="true" />
            <span>Order from Table</span>
          </button>

          <button
            onClick={handleExploreMenu}
            aria-label="View full menu"
            className="dinenos-btn-outline !py-3.5 !px-8 text-xs uppercase tracking-wider font-bold w-full sm:w-auto flex items-center justify-center gap-2 group hover:shadow-xl cursor-pointer"
          >
            <Utensils className="w-4 h-4" aria-hidden="true" />
            <span>View Menu</span>
          </button>
        </div>

        {/* Secondary shortcuts */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 flex-wrap mt-4">
          
          {/* 1. ORDER ONLINE -> /order-online */}
          <button
            onClick={handleOrderOnline}
            className="px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs uppercase tracking-wider font-bold transition-all w-full sm:w-auto flex items-center justify-center gap-2 group hover:shadow-xl cursor-pointer border border-white/20"
          >
            <ShoppingBag className="w-4 h-4" aria-hidden="true" />
            <span>Order Online</span>
          </button>

          {/* 4. FIND A TABLE -> /find-table */}
          <button
            onClick={() => go('/find-table')}
            className="px-5 py-3 rounded-full bg-transparent hover:bg-white/10 text-gray-300 hover:text-white text-xs uppercase tracking-wider font-bold transition-all w-full sm:w-auto flex items-center justify-center gap-2 cursor-pointer border border-white/10"
          >
            <Armchair className="w-4 h-4 text-[#F5A623] group-hover:text-white" aria-hidden="true" />
            <span>Find a Table</span>
          </button>
        </div>

        {/* Manual table code entry — already seated, no QR scan needed */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!tableCode.trim()) { go('/scan-table'); return; }
            let token = tableCode.trim();
            if (token.includes('#order/')) token = token.split('#order/')[1];
            else if (token.includes('/order/')) token = token.split('/order/')[1];
            go(`/order/${token}`);
          }}
          className="mt-5 max-w-md mx-auto flex gap-2"
        >
          <label htmlFor="hero-table-code" className="sr-only">Enter your table code</label>
          <input
            id="hero-table-code"
            type="text"
            value={tableCode}
            onChange={(e) => setTableCode(e.target.value.toUpperCase())}
            placeholder="Already seated? Enter table code (e.g. T-02)"
            className="flex-1 bg-black/50 border border-white/20 rounded-full px-5 py-3 text-xs text-white placeholder-gray-400 outline-none focus:border-[#F5A623] font-mono font-bold backdrop-blur-sm"
          />
          <button
            type="submit"
            aria-label="Start ordering from table code"
            className="px-5 py-3 bg-[#DD5903] hover:bg-[#c44e02] text-white rounded-full text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 flex-shrink-0"
          >
            <span>Start</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </form>

      </div>

      {/* Bottom Scroll Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden sm:flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
        <span className="text-[11px] uppercase tracking-widest text-gray-400">Scroll Down</span>
        <div className="w-5 h-8 rounded-full border-2 border-gray-400 flex items-start justify-center p-1">
          <div className="w-1 h-2 bg-[#DD5903] rounded-full animate-bounce"></div>
        </div>
      </div>

    </section>
  );
}
