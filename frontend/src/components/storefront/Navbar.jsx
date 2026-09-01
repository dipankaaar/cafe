import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Shield, Clock, QrCode } from 'lucide-react';

export default function Navbar({
  onOpenOffcanvas,
  onOpenCart,
  onOpenSearch,
  onOpenReservation,
  onOpenTrackOrder,
  onOpenQrScanner,
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

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#111111]/95 backdrop-blur-md py-3 shadow-xl border-b border-white/10'
          : 'bg-transparent py-5 sm:py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <a href="#" className="flex-shrink-0 flex items-center group">
            <img
              src="https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/02/dineos-logo-white.svg"
              alt="Dinenos Cafe"
              className="h-9 sm:h-11 w-auto transition-transform duration-300 group-hover:scale-105"
            />
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-6">
            <a
              href="#"
              className="text-[13px] uppercase tracking-wider font-bold text-[#DD5903] hover:text-[#DD5903] transition-colors"
            >
              Home
            </a>

            <a
              href="#about"
              className="text-[13px] uppercase tracking-wider font-bold text-white hover:text-[#DD5903] transition-colors"
            >
              About
            </a>

            <a
              href="#menu"
              className="text-[13px] uppercase tracking-wider font-bold text-white hover:text-[#DD5903] transition-colors"
            >
              Menu & Ordering
            </a>

            {/* Scan Table QR Button */}
            <button
              onClick={onOpenQrScanner}
              className="flex items-center gap-1.5 text-[13px] uppercase tracking-wider font-bold text-gray-200 hover:text-[#DD5903] transition-colors cursor-pointer"
              title="Scan Table QR Code with Camera"
            >
              <QrCode className="w-4 h-4 text-[#DD5903]" />
              <span>Scan Table QR</span>
            </button>

            {/* Track Order Link */}
            <button
              onClick={onOpenTrackOrder}
              className="flex items-center gap-1.5 text-[13px] uppercase tracking-wider font-bold text-gray-200 hover:text-[#DD5903] transition-colors cursor-pointer"
            >
              <Clock className="w-4 h-4 text-[#DD5903]" />
              <span>Track Order</span>
            </button>

            {/* Admin Portal Direct Toggle */}
            <button
              onClick={onNavigateToAdmin}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-orange-500/10 text-[#DD5903] hover:bg-[#DD5903] hover:text-white border border-[#DD5903]/30 text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="Switch to Admin & POS Operations Portal"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Suite</span>
            </button>
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Search Icon */}
            <button
              onClick={onOpenSearch}
              className="text-white hover:text-[#DD5903] transition-colors p-2 rounded-full hover:bg-white/5 cursor-pointer"
              title="Search menu"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Cart Icon with badge */}
            <button
              onClick={onOpenCart}
              className="relative text-white hover:text-[#DD5903] transition-colors p-2 rounded-full hover:bg-white/5 cursor-pointer"
              title="View Cart"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              {cartCount > 0 && (
                <span className="absolute 0 right-0 bg-[#DD5903] text-white text-[10px] font-bold rounded-full h-4.5 w-4.5 flex items-center justify-center animate-bounce shadow-md">
                  {cartCount}
                </span>
              )}
            </button>

            {/* CTA Button: Find a Table */}
            <button
              onClick={onOpenReservation}
              className="hidden sm:inline-flex dinenos-btn !py-2.5 !px-5 !text-xs !font-bold cursor-pointer"
            >
              Find a Table
            </button>

            {/* Offcanvas 4-Dots Hamburger Button */}
            <button
              onClick={onOpenOffcanvas}
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
