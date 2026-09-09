import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Shield, QrCode, Utensils, Armchair, User } from 'lucide-react';
import BrandLogo from '../common/BrandLogo';

export default function Navbar({
  onNavigate,
  onOpenOffcanvas,
  onOpenCart,
  onOpenSearch,
  onOpenReservation,
  onOpenTrackOrder,
  onOpenQrScanner,
  onOpenCustomerProfile,
  onNavigateToAdmin,
  cartCount
}) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 30);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNav = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.hash = path.replace('/', '');
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#111111]/95 backdrop-blur-md py-3 shadow-xl border-b border-white/10'
          : 'bg-transparent py-5 sm:py-6'
      }`}
    >
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:text-black focus:px-3 focus:py-1.5 focus:rounded-md text-xs font-bold">
        Skip to content
      </a>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <button 
            onClick={() => handleNav('/')}
            aria-label="Petuk Adda Cafe — home"
            className="flex-shrink-0 flex items-center group cursor-pointer text-left mr-4 lg:mr-8"
          >
            <BrandLogo size="default" light={true} />
          </button>

          {/* Desktop Navigation Links */}
          <nav aria-label="Primary" className="hidden lg:flex items-center gap-6 xl:gap-8">
            {/* 1. Order Online */}
            <button
              onClick={() => handleNav('/order-online')}
              className="flex items-center gap-1.5 text-[13px] uppercase tracking-wider font-bold text-[#DD5903] hover:text-amber-400 transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Order Online</span>
            </button>

            {/* 2. Explore Menu */}
            <button
              onClick={() => handleNav('/menu')}
              className="flex items-center gap-1.5 text-[13px] uppercase tracking-wider font-bold text-gray-200 hover:text-[#DD5903] transition-colors cursor-pointer"
            >
              <Utensils className="w-3.5 h-3.5 text-[#DD5903]" />
              <span>Explore Menu</span>
            </button>

            {/* 3. Scan Table QR */}
            <button
              onClick={() => handleNav('/scan-table')}
              className="flex items-center gap-1.5 text-[13px] uppercase tracking-wider font-bold text-gray-200 hover:text-[#DD5903] transition-colors cursor-pointer"
              title="Scan Table QR Code with Camera"
            >
              <QrCode className="w-4 h-4 text-[#DD5903]" />
              <span>Scan Table QR</span>
            </button>

            {/* 4. Find a Table */}
            <button
              onClick={() => handleNav('/find-table')}
              className="flex items-center gap-1.5 text-[13px] uppercase tracking-wider font-bold text-gray-200 hover:text-[#DD5903] transition-colors cursor-pointer"
            >
              <Armchair className="w-3.5 h-3.5 text-[#DD5903]" />
              <span>Find a Table</span>
            </button>
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Customer Profile & Orders Button */}
            <button
              onClick={onOpenCustomerProfile}
              aria-label="My Profile and Orders"
              className="flex items-center gap-1.5 text-white hover:text-[#DD5903] transition-colors p-2 rounded-full hover:bg-white/5 cursor-pointer group"
              title="My Customer Profile, Orders & Rewards"
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" aria-hidden="true" />
            </button>

            {/* Search Icon */}
            <button
              onClick={onOpenSearch}
              aria-label="Search menu"
              className="text-white hover:text-[#DD5903] transition-colors p-2 rounded-full hover:bg-white/5 cursor-pointer"
              title="Search menu"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
            </button>

            {/* Cart Icon with badge -> Open Order Online */}
            <button
              onClick={() => handleNav('/order-online')}
              aria-label={cartCount > 0 ? `View cart, ${cartCount} items` : 'View cart and order online'}
              className="relative text-white hover:text-[#DD5903] transition-colors p-2 rounded-full hover:bg-white/5 cursor-pointer"
              title="View Cart & Order Online"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#DD5903] text-white text-[10px] font-bold rounded-full h-[18px] w-[18px] flex items-center justify-center animate-bounce shadow-md">
                  {cartCount}
                </span>
              )}
            </button>

            {/* CTA Button: Find a Table -> /find-table */}
            <button
              onClick={() => handleNav('/find-table')}
              aria-label="Find a table and reserve"
              className="hidden sm:inline-flex dinenos-btn !py-2.5 !px-5 !text-xs !font-bold cursor-pointer"
            >
              Find a Table
            </button>

            {/* Offcanvas 4-Dots Hamburger Button */}
            <button
              onClick={onOpenOffcanvas}
              aria-label="Open navigation menu"
              aria-haspopup="dialog"
              className="p-2 text-white hover:text-[#DD5903] transition-colors cursor-pointer group flex flex-col items-center justify-center w-9 h-9 rounded-full hover:bg-white/10"
              title="Open Navigation"
            >
              <div className="grid grid-cols-2 gap-1 w-3.5 h-3.5">
                <span className="w-1 h-1 bg-current rounded-full group-hover:scale-125 transition-transform"></span>
                <span className="w-1 h-1 bg-current rounded-full group-hover:scale-125 transition-transform"></span>
                <span className="w-1 h-1 bg-current rounded-full group-hover:scale-125 transition-transform"></span>
                <span className="w-1 h-1 bg-current rounded-full group-hover:scale-125 transition-transform"></span>
              </div>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
}
