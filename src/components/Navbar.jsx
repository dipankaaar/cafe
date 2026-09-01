import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, ChevronDown, Menu, X } from 'lucide-react';

export default function Navbar({
  onOpenOffcanvas,
  onOpenCart,
  onOpenSearch,
  onOpenReservation,
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
          <nav className="hidden lg:flex items-center space-x-8">
            
            {/* Home Link with Dropdown */}
            <div
              className="relative group py-2"
              onMouseEnter={() => setActiveDropdown('home')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <a
                href="#"
                className="flex items-center gap-1 text-[15px] font-bold text-[#DD5903] hover:text-[#DD5903] transition-colors"
              >
                Home <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
              </a>
              {activeDropdown === 'home' && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-[#181818] border border-white/10 rounded-md shadow-2xl py-2 z-50 text-sm animate-fadeIn">
                  {[
                    { name: 'Home One', active: false },
                    { name: 'Home Two', active: false },
                    { name: 'Home Three', active: false },
                    { name: 'Burger Home', active: false },
                    { name: 'Seafood Home', active: false },
                    { name: 'Restaurant Home (Dark)', active: false },
                    { name: 'Pizza Home', active: false },
                    { name: 'Food Landing', active: false },
                    { name: 'Coffee House Home', active: true },
                  ].map((item, idx) => (
                    <a
                      key={idx}
                      href="#"
                      className={`block px-4 py-2 hover:bg-[#222222] transition-colors ${
                        item.active
                          ? 'text-[#DD5903] font-semibold border-l-2 border-[#DD5903] pl-3.5 bg-[#222222]/50'
                          : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Pages Link with Dropdown */}
            <div
              className="relative group py-2"
              onMouseEnter={() => setActiveDropdown('pages')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <a
                href="#about"
                className="flex items-center gap-1 text-[15px] font-bold text-white hover:text-[#DD5903] transition-colors"
              >
                Pages <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
              </a>
              {activeDropdown === 'pages' && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-[#181818] border border-white/10 rounded-md shadow-2xl py-2 z-50 text-sm">
                  {['About', 'Our Chef', 'Meet The Chef', 'Reservation', 'Contact'].map((page, idx) => (
                    <a
                      key={idx}
                      href={page === 'About' ? '#about' : '#reservation'}
                      onClick={(e) => {
                        if (page === 'Reservation') {
                          e.preventDefault();
                          onOpenReservation();
                        }
                      }}
                      className="block px-4 py-2 text-gray-300 hover:text-[#DD5903] hover:bg-[#222222] transition-colors"
                    >
                      {page}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Menus Link with Mega Dropdown */}
            <div
              className="relative group py-2"
              onMouseEnter={() => setActiveDropdown('menus')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <a
                href="#menu"
                className="flex items-center gap-1 text-[15px] font-bold text-white hover:text-[#DD5903] transition-colors"
              >
                Menus <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
              </a>
              {activeDropdown === 'menus' && (
                <div className="absolute top-full -left-20 mt-1 w-[460px] bg-[#181818] border border-white/10 rounded-md shadow-2xl p-4 z-50 grid grid-cols-2 gap-3">
                  {[
                    { title: 'Menu Tab', img: 'https://reactheme.com/products/wordpress/dinenos//wp-content/uploads/2023/03/menu-1.webp' },
                    { title: 'Menu List', img: 'https://reactheme.com/products/wordpress/dinenos//wp-content/uploads/2023/03/menu-2.webp' },
                    { title: 'Menu List 2', img: 'https://reactheme.com/products/wordpress/dinenos//wp-content/uploads/2023/03/menu-3.webp' },
                    { title: 'Menu Section', img: 'https://reactheme.com/products/wordpress/dinenos//wp-content/uploads/2023/03/menu-4.webp' },
                  ].map((m, idx) => (
                    <a
                      key={idx}
                      href="#menu"
                      className="group/item block rounded overflow-hidden p-2 bg-[#222222]/60 hover:bg-[#262626] border border-white/5 hover:border-[#DD5903]/40 transition-all text-center"
                    >
                      <img src={m.img} alt={m.title} className="w-full h-24 object-cover rounded mb-2 group-hover/item:scale-102 transition-transform" />
                      <span className="text-xs font-semibold text-gray-200 group-hover/item:text-[#DD5903]">{m.title}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Shop Link */}
            <div
              className="relative group py-2"
              onMouseEnter={() => setActiveDropdown('shop')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <a
                href="#menu"
                className="flex items-center gap-1 text-[15px] font-bold text-white hover:text-[#DD5903] transition-colors"
              >
                Shop <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
              </a>
              {activeDropdown === 'shop' && (
                <div className="absolute top-full left-0 mt-1 w-44 bg-[#181818] border border-white/10 rounded-md shadow-2xl py-2 z-50 text-sm">
                  {['Shop Menu', 'Cart Details', 'Checkout', 'My Account'].map((item, idx) => (
                    <a
                      key={idx}
                      href={item === 'Cart Details' ? '#' : '#menu'}
                      onClick={(e) => {
                        if (item === 'Cart Details') {
                          e.preventDefault();
                          onOpenCart();
                        }
                      }}
                      className="block px-4 py-2 text-gray-300 hover:text-[#DD5903] hover:bg-[#222222] transition-colors"
                    >
                      {item}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Blog Link */}
            <a
              href="#testimonials"
              className="text-[15px] font-bold text-white hover:text-[#DD5903] transition-colors"
            >
              Blog
            </a>
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            
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
              className="hidden sm:inline-flex dinenos-btn !py-2.5 !px-6 text-sm cursor-pointer shadow-lg hover:shadow-orange-900/30"
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
