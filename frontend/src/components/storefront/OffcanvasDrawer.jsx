import React, { useEffect } from 'react';
import { X, MapPin, Phone, Mail, Clock, ChevronRight, ShoppingBag, Utensils, QrCode, Armchair } from 'lucide-react';
import BrandLogo from '../common/BrandLogo';

export default function OffcanvasDrawer({ isOpen, onClose, onNavigate, onOpenTrackOrder, onNavigateToAdmin }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNav = (path) => {
    onClose();
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.hash = path.replace('/', '');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Site menu">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#161616] text-white shadow-2xl border-l border-white/10 flex flex-col justify-between overflow-y-auto">
          
          {/* Header & Logo */}
          <div className="p-8">
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
              <BrandLogo size="default" light={true} />
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Navigation Links */}
            <div className="py-6 border-b border-white/10">
              <h4 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-4">Main Menu</h4>
              <div className="space-y-3">
                
                {/* 1. Order Online */}
                <button
                  onClick={() => handleNav('/order-online')}
                  className="w-full flex items-center justify-between text-base font-bold text-[#DD5903] hover:text-[#DD5903] py-1 transition-colors text-left cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Order Online</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-[#DD5903]/20 text-[#DD5903] rounded-full border border-[#DD5903]/30">Delivery</span>
                </button>

                {/* 2. Explore Menu */}
                <button
                  onClick={() => handleNav('/menu')}
                  className="w-full flex items-center justify-between text-base font-medium text-gray-300 hover:text-[#DD5903] py-1 transition-colors text-left cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-[#DD5903]" />
                    <span>Explore Menu</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>

                {/* 3. Scan Table QR */}
                <button
                  onClick={() => handleNav('/scan-table')}
                  className="w-full flex items-center justify-between text-base font-medium text-gray-300 hover:text-[#DD5903] py-1 transition-colors text-left cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-[#DD5903]" />
                    <span>Scan Table QR</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>

                {/* 4. Find a Table */}
                <button
                  onClick={() => handleNav('/find-table')}
                  className="w-full flex items-center justify-between text-base font-medium text-gray-300 hover:text-[#DD5903] py-1 transition-colors text-left cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Armchair className="w-4 h-4 text-[#DD5903]" />
                    <span>Find a Table (Reserve)</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>

                {onOpenTrackOrder && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenTrackOrder();
                    }}
                    className="w-full flex items-center justify-between text-base font-medium text-gray-400 hover:text-[#DD5903] py-1 transition-colors text-left cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Track Order Status</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2 pt-4">
                  <button
                    onClick={() => handleNav('/order-online')}
                    className="dinenos-btn text-center text-xs py-2.5 font-bold uppercase tracking-wider shadow-md cursor-pointer"
                  >
                    Order Online
                  </button>
                  <button
                    onClick={() => handleNav('/find-table')}
                    className="dinenos-btn-outline text-center text-xs py-2.5 font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Find a Table
                  </button>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="py-6 space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#222222] text-[#DD5903] rounded-md mt-1 flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">Our Location</h4>
                  <p className="text-sm font-semibold text-gray-200">Salboni, Sakadihi-Ailakundi Road</p>
                  <p className="text-xs text-gray-400 mt-0.5">Near Salboni High School, Salboni, West Bengal 722102</p>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Salboni,+Sakadihi-Ailakundi+Road+Near+Salboni+High+School+Salboni+West+Bengal+722102"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[#DD5903] hover:underline mt-1.5 inline-block"
                  >
                    View on Google Maps →
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#222222] text-[#DD5903] rounded-md mt-1 flex-shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">Call Us</h4>
                  <a href="tel:+919932148058" className="text-sm font-semibold text-gray-200 hover:text-[#DD5903] transition-colors block">
                    +91 9932148058
                  </a>
                  <a href="tel:+916292314286" className="text-sm font-semibold text-gray-200 hover:text-[#DD5903] transition-colors block mt-0.5">
                    +91 6292314286
                  </a>
                  <p className="text-xs text-gray-400 mt-0.5">Direct reservation & ordering hotline</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#222222] text-[#DD5903] rounded-md mt-1 flex-shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">Email Inquiries</h4>
                  <a href="mailto:petukaddacafe@gmail.com" className="text-sm font-semibold text-gray-200 hover:text-[#DD5903] transition-colors break-all">
                    petukaddacafe@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#222222] text-[#DD5903] rounded-md mt-1 flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">Business Hours</h4>
                  <p className="text-sm font-semibold text-gray-200">Morning: 09:00 AM – 01:30 PM</p>
                  <p className="text-sm font-semibold text-gray-200">Evening: 04:30 PM – 10:30 PM</p>
                  <p className="text-xs text-emerald-400 font-semibold mt-0.5">Open All Days (Mon - Sun)</p>
                </div>
              </div>
            </div>

          </div>

          {/* Social Footer */}
          <div className="p-8 border-t border-white/10 bg-[#111111] text-center">
            <p className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-3">Follow Petuk Adda Cafe</p>
            <div className="flex items-center justify-center space-x-3">
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full bg-[#222222] text-gray-300 hover:text-white hover:bg-[#DD5903] flex items-center justify-center text-sm transition-all duration-200 hover:scale-110"
                title="Instagram"
              >
                <i className="fab fa-instagram"></i>
              </a>
              <a
                href="tel:+919932148058"
                aria-label="Phone"
                className="w-9 h-9 rounded-full bg-[#222222] text-gray-300 hover:text-white hover:bg-[#DD5903] flex items-center justify-center text-sm transition-all duration-200 hover:scale-110"
                title="Call +91 9932148058"
              >
                <Phone className="w-4 h-4" />
              </a>
              <a
                href="https://wa.me/919932148058"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-9 h-9 rounded-full bg-[#222222] text-gray-300 hover:text-white hover:bg-[#25D366] flex items-center justify-center text-sm transition-all duration-200 hover:scale-110"
                title="WhatsApp"
              >
                <i className="fab fa-whatsapp"></i>
              </a>
              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 rounded-full bg-[#222222] text-gray-300 hover:text-white hover:bg-[#1877F2] flex items-center justify-center text-sm transition-all duration-200 hover:scale-110"
                title="Facebook"
              >
                <i className="fab fa-facebook-f"></i>
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
