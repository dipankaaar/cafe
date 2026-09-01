import React from 'react';
import { X, MapPin, Phone, Mail, Clock, ChevronRight } from 'lucide-react';

export default function OffcanvasDrawer({ isOpen, onClose, onOpenReservation }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#161616] text-white shadow-2xl border-l border-white/10 flex flex-col justify-between overflow-y-auto">
          
          {/* Header & Logo */}
          <div className="p-8">
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
              <img
                src="https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/02/dineos-logo-white.svg"
                alt="Dinenos"
                className="h-10 w-auto"
              />
              <button
                onClick={onClose}
                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Mobile Navigation List (Visible on mobile screens) */}
            <div className="lg:hidden py-6 border-b border-white/10">
              <p className="text-xs uppercase tracking-widest text-[#DD5903] font-bold mb-4">Quick Navigation</p>
              <div className="flex flex-col space-y-3">
                {[
                  { name: 'Coffee House Home', href: '#' },
                  { name: 'About Our Cafe', href: '#about' },
                  { name: 'Coffee & Drinks Menu', href: '#menu' },
                  { name: 'Customer Testimonials', href: '#testimonials' },
                  { name: 'Photo Gallery', href: '#gallery' },
                ].map((link, idx) => (
                  <a
                    key={idx}
                    href={link.href}
                    onClick={onClose}
                    className="flex items-center justify-between text-base font-medium text-gray-300 hover:text-[#DD5903] py-1 transition-colors"
                  >
                    <span>{link.name}</span>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </a>
                ))}
                <button
                  onClick={() => {
                    onClose();
                    onOpenReservation();
                  }}
                  className="w-full mt-3 dinenos-btn text-center text-sm py-2.5"
                >
                  Book a Table Now
                </button>
              </div>
            </div>

            {/* Contact Details */}
            <div className="py-6 space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#222222] text-[#DD5903] rounded-md mt-1">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">Our Location</h4>
                  <p className="text-sm font-semibold text-gray-200">18/B, New Ave 1000 New York</p>
                  <p className="text-xs text-gray-400 mt-0.5">12 Creek Street, Brisbane CBD</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#222222] text-[#DD5903] rounded-md mt-1">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">Call Us</h4>
                  <a href="tel:99988899900" className="text-sm font-semibold text-gray-200 hover:text-[#DD5903] transition-colors">
                    999 888 999 00
                  </a>
                  <p className="text-xs text-gray-400 mt-0.5">Toll free reservation hotline</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#222222] text-[#DD5903] rounded-md mt-1">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">Email Inquiries</h4>
                  <a href="mailto:office@webmailfree.com" className="text-sm font-semibold text-gray-200 hover:text-[#DD5903] transition-colors">
                    office@webmailfree.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#222222] text-[#DD5903] rounded-md mt-1">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">Opening Hours</h4>
                  <p className="text-sm text-gray-300">Mon - Thu: <span className="text-white font-medium">10 AM - 02 AM</span></p>
                  <p className="text-sm text-gray-300">Fri - Sun: <span className="text-[#DD5903] font-medium">10 AM - 02 AM</span></p>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Socials */}
          <div className="p-8 border-t border-white/10 bg-[#121212]">
            <p className="text-xs text-gray-400 uppercase tracking-wider text-center mb-4">Follow Dinenos Cafe</p>
            <div className="flex items-center justify-center space-x-3">
              {[
                { icon: 'fa-facebook-f', href: '#' },
                { icon: 'fa-twitter', href: '#' },
                { icon: 'fa-behance', href: '#' },
                { icon: 'fa-youtube', href: '#' },
                { icon: 'fa-linkedin-in', href: '#' },
                { icon: 'fa-instagram', href: '#' },
              ].map((s, idx) => (
                <a
                  key={idx}
                  href={s.href}
                  className="w-9 h-9 rounded-full bg-[#222222] text-gray-300 hover:text-white hover:bg-[#DD5903] flex items-center justify-center text-sm transition-all duration-200 hover:scale-110"
                >
                  <i className={`fab ${s.icon}`}></i>
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
