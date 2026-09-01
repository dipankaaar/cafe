import React from 'react';
import { footerThumbnails } from '../data/coffeeData';
import { MapPin, Phone, Mail, ChevronRight, Heart } from 'lucide-react';

export default function Footer({ onOpenReservation }) {
  return (
    <footer className="bg-[#141414] text-gray-400 text-sm relative overflow-hidden pt-20 pb-10 border-t border-white/10">
      
      {/* Decorative Rotating Vector Element in Background */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 opacity-15 pointer-events-none">
        <img
          src="https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/02/vector7.webp"
          alt=""
          className="w-48 h-48 object-contain animate-spin"
          style={{ animationDuration: '40s' }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-16 border-b border-white/10">
          
          {/* Col 1: Logo & Info */}
          <div className="lg:col-span-4 space-y-5">
            <a href="#" className="inline-block">
              <img
                src="https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/02/dineos-logo-white.svg"
                alt="Dinenos Cafe"
                className="h-10 w-auto"
              />
            </a>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              Be the first to know about new collections, special events, and what’s going on at Our Place. We craft experiences, one cup at a time.
            </p>

            <div className="pt-2">
              <p className="text-xs uppercase tracking-widest text-[#DD5903] font-bold">Book a table direct</p>
              <a href="tel:88899900011" className="text-xl text-white font-bold font-['Arapey',serif] hover:text-[#DD5903] transition-colors block mt-0.5">
                888 999 000 11
              </a>
            </div>
          </div>

          {/* Col 2: Get In Touch */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-lg font-bold text-white font-['Arapey',serif] tracking-wide relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-10 after:h-0.5 after:bg-[#DD5903]">
              Get In Touch
            </h4>

            <ul className="space-y-3 pt-2">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#DD5903] flex-shrink-0 mt-1" />
                <span className="text-gray-300">Silk St, Barbican, London E2Y, UK</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#DD5903] flex-shrink-0" />
                <a href="tel:+39055123456" className="text-gray-300 hover:text-[#DD5903] transition-colors">
                  +39-055-123456
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#DD5903] flex-shrink-0" />
                <a href="mailto:booking@webexample.com" className="text-gray-300 hover:text-[#DD5903] transition-colors">
                  booking@webexample.com
                </a>
              </li>
            </ul>

            {/* Social Icons */}
            <div className="flex items-center gap-2 pt-2">
              {[
                { icon: 'fa-facebook-f', href: '#' },
                { icon: 'fa-twitter', href: '#' },
                { icon: 'fa-behance', href: '#' },
                { icon: 'fa-youtube', href: '#' },
                { icon: 'fa-linkedin-in', href: '#' },
              ].map((s, idx) => (
                <a
                  key={idx}
                  href={s.href}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#DD5903] text-gray-300 hover:text-white flex items-center justify-center text-xs transition-colors"
                >
                  <i className={`fab ${s.icon}`}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Col 3: Pages Links */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-lg font-bold text-white font-['Arapey',serif] tracking-wide relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-10 after:h-0.5 after:bg-[#DD5903]">
              Pages
            </h4>

            <ul className="space-y-2 pt-2">
              {[
                { name: 'About Us', href: '#about' },
                { name: 'Our Menu', href: '#menu' },
                { name: 'Pricing Plan', href: '#menu' },
                { name: 'How It Works', href: '#about' },
                { name: 'Contact Us', href: '#testimonials' },
              ].map((link, idx) => (
                <li key={idx}>
                  <a
                    href={link.href}
                    className="flex items-center gap-1.5 text-gray-300 hover:text-[#DD5903] transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-[#DD5903]" />
                    <span>{link.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Instagram Grid */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-lg font-bold text-white font-['Arapey',serif] tracking-wide relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-10 after:h-0.5 after:bg-[#DD5903]">
              Instagram Shots
            </h4>

            <div className="grid grid-cols-3 gap-2 pt-2">
              {footerThumbnails.map((img, idx) => (
                <a
                  key={idx}
                  href="#gallery"
                  className="group relative block overflow-hidden rounded aspect-square bg-[#222222]"
                >
                  <img
                    src={img}
                    alt="Instagram Post"
                    className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-[#DD5903]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs">
                    <i className="fab fa-instagram"></i>
                  </div>
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© {new Date().getFullYear()} Dinenos. Fast Food & Restaurant WordPress Theme Clone.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
