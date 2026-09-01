import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, ChevronDown, Menu, X, Shield, Clock } from 'lucide-react';

export default function Navbar({
  onOpenOffcanvas,
  onOpenCart,
  onOpenSearch,
  onOpenReservation,
  onOpenTrackOrder,
  onNavigateToAdmin,
  cartCount
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#111111]/95 backdrop-blur-md py-3 shadow-xl border-b border-white/10'
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <a href="#" className="flex-shrink-0 flex items-center group">
            <img
              src="https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/02/dineos-logo-white.svg"
              alt="Dinenos Cafe"
              className="h-10 sm:h-12 w-auto transition-transform duration-300 group-hover:scale-105"
            />
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-7">
            <a
              href="#"
              className="text-[14px] font-bold text-[#DD5903] hover:text-[#DD5903] transition-colors"
            >
              Home
            </a>

            <a
              href="#about"
              className="text-[14px] font-bold text-white hover:text-[#DD5903] transition-colors"
            >
              About
            </a>

            <a
              href="#menu"
              className="text-[14px] font-bold text-white hover:text-[#DD5903] transition-colors"
            >
              Menu & Ordering
            </a>

            {/* Track Order Link */}
            <button
              onClick={onOpenTrackOrder}
              className="flex items-center gap-1.5 text-[14px] font-bold text-gray-200 hover:text-[#DD5903] transition-colors cursor-pointer"
            >
              <Clock className="w-4 h-4 text-[#DD5903]" />
              Track Order
            </button>

            {/* Admin Portal Direct Toggle */}
            <button
              onClick={onNavigateToAdmin}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-[#DD5903] hover:bg-[#DD5903] hover:text-white border border-[#DD5903]/30 text-xs font-bold transition-all cursor-pointer shadow-sm"
              title="Switch to Admin & POS Operations Portal"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin & POS Suite</span>
            </button>
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            
            {/* Search Icon */}
            <button
              onClick={onOpenSearch}
              className="text-white hover:text-[#DD5903] transition-colors p-2 cursor-pointer"
              title="Search menu"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Cart Icon with badge */}
            <button
              onClick={onOpenCart}
              className="relative text-white hover:text-[#DD5903] transition-colors p-2 cursor-pointer"
              title="View Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#DD5903] text-white text-[11px] font-bold rounded-full h-5 w-5 flex items-center justify-center animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>

            {/* CTA Button: Find a Table */}
            <button
              onClick={onOpenReservation}
              className="hidden sm:inline-flex dinenos-btn !py-2.5 !px-5 text-xs font-bold cursor-pointer shadow-lg hover:shadow-orange-900/30"
            >
              Find a Table
            </button>

            {/* Offcanvas 4-Dots Hamburger Button */}
            <button
              onClick={onOpenOffcanvas}
              className="p-2 text-white hover:text-[#DD5903] transition-colors cursor-pointer group flex flex-col items-center justify-center w-10 h-10 rounded-full hover:bg-white/10"
              title="Open Navigation"
            >
              <div className="grid grid-cols-2 gap-1 w-4 h-4">
                <span className="w-1.5 h-1.5 bg-current rounded-full group-hover:scale-125 transition-transform"></span>
                <span className="w-1.5 h-1.5 bg-current rounded-full group-hover:scale-125 transition-transform"></span>
                <span className="w-1.5 h-1.5 bg-current rounded-full group-hover:scale-125 transition-transform"></span>
                <span className="w-1.5 h-1.5 bg-current rounded-full group-hover:scale-125 transition-transform"></span>
              </div>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
}
