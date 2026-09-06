import React from 'react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  ChevronRight, 
  Clock, 
  Truck, 
  ExternalLink,
  ShoppingBag,
  ArrowRight,
  Utensils,
  QrCode,
  Armchair
} from 'lucide-react';
import BrandLogo from '../common/BrandLogo';

export default function Footer({ onNavigate }) {
  const googleMapsUrl = "https://www.google.com/maps/search/?api=1&query=Salboni,+Sakadihi-Ailakundi+Road+Near+Salboni+High+School+Salboni+West+Bengal+722102";

  const handleNav = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.hash = path.replace('/', '');
    }
  };

  return (
    <footer aria-label="Site footer" className="bg-[#0e0e0e] text-gray-400 text-sm relative overflow-hidden pt-20 pb-10 border-t border-white/10">
      
      {/* Decorative Warm Ambient Glow in Background */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#DD5903]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* 4-Column Grid: Responsive Desktop 4 cols, Tablet 2 cols, Mobile 1 col */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 pb-16">
          
          {/* Column 1: BRAND */}
          <div className="space-y-5">
            <button onClick={() => handleNav('/')} className="inline-block group text-left cursor-pointer">
              <BrandLogo size="default" light={true} />
            </button>
            
            <div className="space-y-2">
              <p className="text-gray-200 text-sm font-medium leading-relaxed">
                Where every sip and bite tells a story.
              </p>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                Experience premium dining and artisan coffee in Salboni.
              </p>
            </div>

            {/* Instagram and Social / Phone Icons */}
            <div className="pt-2">
              <p className="text-xs uppercase tracking-widest text-[#DD5903] font-bold mb-3">
                Connect With Us
              </p>
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Instagram */}
                <a
                  href="https://www.instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 hover:bg-[#DD5903] hover:border-[#DD5903] text-gray-300 hover:text-white flex items-center justify-center text-sm transition-all duration-300 hover:scale-110 shadow-sm"
                  title="Instagram"
                >
                  <i className="fab fa-instagram"></i>
                </a>

                {/* Primary Phone */}
                <a
                  href="tel:+919932148058"
                  aria-label="Call +91 9932148058"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 hover:bg-[#DD5903] hover:border-[#DD5903] text-gray-300 hover:text-white flex items-center justify-center text-sm transition-all duration-300 hover:scale-110 shadow-sm"
                  title="Call +91 9932148058"
                >
                  <Phone className="w-4 h-4" />
                </a>

                {/* WhatsApp Chat */}
                <a
                  href="https://wa.me/919932148058"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 hover:bg-[#25D366] hover:border-[#25D366] text-gray-300 hover:text-white flex items-center justify-center text-sm transition-all duration-300 hover:scale-110 shadow-sm"
                  title="Chat on WhatsApp"
                >
                  <i className="fab fa-whatsapp"></i>
                </a>

                {/* Facebook */}
                <a
                  href="https://www.facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 hover:bg-[#1877F2] hover:border-[#1877F2] text-gray-300 hover:text-white flex items-center justify-center text-sm transition-all duration-300 hover:scale-110 shadow-sm"
                  title="Facebook"
                >
                  <i className="fab fa-facebook-f"></i>
                </a>

                {/* Secondary Phone */}
                <a
                  href="tel:+916292314286"
                  aria-label="Call +91 6292314286"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 hover:bg-[#DD5903] hover:border-[#DD5903] text-gray-300 hover:text-white flex items-center justify-center text-sm transition-all duration-300 hover:scale-110 shadow-sm"
                  title="Call +91 6292314286"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: EXPLORE */}
          <nav aria-label="Footer" className="space-y-4">
            <h4 className="text-lg font-bold text-white font-[Playfair_Display,Arapey,serif] tracking-wide relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-10 after:h-0.5 after:bg-[#DD5903]">
              Explore
            </h4>

            <ul className="space-y-2.5 pt-2">
              {/* 1. Explore Menu -> /menu */}
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('/menu')}
                  className="flex items-center gap-2 text-gray-300 hover:text-[#DD5903] transition-colors group cursor-pointer text-left"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[#DD5903] transition-transform group-hover:translate-x-1" />
                  <span>Our Menu</span>
                </button>
              </li>

              {/* 2. Order Online -> /order-online */}
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('/order-online')}
                  className="flex items-center gap-2 text-gray-300 hover:text-[#DD5903] transition-colors group text-left cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[#DD5903] transition-transform group-hover:translate-x-1" />
                  <span className="flex items-center gap-1.5">
                    <span>Order Online</span>
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-[#DD5903]/20 text-[#DD5903] border border-[#DD5903]/30">Hot</span>
                  </span>
                </button>
              </li>

              {/* 3. Find a Table -> /find-table */}
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('/find-table')}
                  className="flex items-center gap-2 text-gray-300 hover:text-[#DD5903] transition-colors group text-left cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[#DD5903] transition-transform group-hover:translate-x-1" />
                  <span>Reservations</span>
                </button>
              </li>

              {/* 4. Scan Table QR -> /scan-table */}
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('/scan-table')}
                  className="flex items-center gap-2 text-gray-300 hover:text-[#DD5903] transition-colors group text-left cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[#DD5903] transition-transform group-hover:translate-x-1" />
                  <span>Scan Table QR</span>
                </button>
              </li>

              <li>
                <a
                  href="#about"
                  className="flex items-center gap-2 text-gray-300 hover:text-[#DD5903] transition-colors group"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[#DD5903] transition-transform group-hover:translate-x-1" />
                  <span>About Us</span>
                </a>
              </li>

              <li>
                <a
                  href="#testimonials"
                  className="flex items-center gap-2 text-gray-300 hover:text-[#DD5903] transition-colors group"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[#DD5903] transition-transform group-hover:translate-x-1" />
                  <span>Contact</span>
                </a>
              </li>

              <li>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); alert("Privacy Policy: Petuk Adda Cafe respects your privacy and protects your personal data."); }}
                  className="flex items-center gap-2 text-gray-300 hover:text-[#DD5903] transition-colors group"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[#DD5903] transition-transform group-hover:translate-x-1" />
                  <span>Privacy Policy</span>
                </a>
              </li>

              <li>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); alert("Terms & Conditions: Welcome to Petuk Adda Cafe. Dining, reservations, and online orders are subject to cafe house policies."); }}
                  className="flex items-center gap-2 text-gray-300 hover:text-[#DD5903] transition-colors group"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[#DD5903] transition-transform group-hover:translate-x-1" />
                  <span>Terms & Conditions</span>
                </a>
              </li>
            </ul>
          </nav>

          {/* Column 3: CONTACT */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-white font-[Playfair_Display,Arapey,serif] tracking-wide relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-10 after:h-0.5 after:bg-[#DD5903]">
              Contact
            </h4>

            <address className="space-y-4 pt-2 not-italic">
              {/* Address */}
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#DD5903] flex-shrink-0 mt-1" aria-hidden="true" />
                <div className="text-gray-300 leading-relaxed text-xs sm:text-sm">
                  <p className="font-semibold text-white">Salboni, Sakadihi-Ailakundi Road</p>
                  <p>Near Salboni High School</p>
                  <p>Salboni, West Bengal 722102</p>
                </div>
              </div>

              {/* Phone Numbers */}
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#DD5903] flex-shrink-0 mt-1" />
                <div className="space-y-1 text-xs sm:text-sm">
                  <a
                    href="tel:+919932148058"
                    className="text-gray-300 hover:text-[#DD5903] transition-colors block font-medium"
                  >
                    +91 9932148058
                  </a>
                  <a
                    href="tel:+916292314286"
                    className="text-gray-300 hover:text-[#DD5903] transition-colors block font-medium"
                  >
                    +91 6292314286
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#DD5903] flex-shrink-0" />
                <a
                  href="mailto:petukaddacafe@gmail.com"
                  className="text-gray-300 hover:text-[#DD5903] transition-colors text-xs sm:text-sm break-all font-medium"
                >
                  petukaddacafe@gmail.com
                </a>
              </div>

              {/* View on Google Maps Link + map placeholder */}
              <div className="pt-2 space-y-2.5">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-orange-500/10 hover:bg-[#DD5903] text-[#DD5903] hover:text-white border border-[#DD5903]/30 text-xs font-bold transition-all duration-200 shadow-sm group"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#DD5903] group-hover:text-white" aria-hidden="true" />
                  <span>View on Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#DD5903] group-hover:text-white" aria-hidden="true" />
                </a>
                {/* Map placeholder: swap with a real <iframe> embed when API key is available */}
                <div
                  role="img"
                  aria-label="Map placeholder — Dinenos Coffee House, Salboni. Open Google Maps for directions."
                  className="h-28 rounded-xl border border-white/10 bg-[#181818] bg-[linear-gradient(135deg,rgba(221,89,3,0.12),transparent_55%),repeating-linear-gradient(0deg,transparent_0_14px,rgba(255,255,255,0.04)_14px_15px),repeating-linear-gradient(90deg,transparent_0_14px,rgba(255,255,255,0.04)_14px_15px)] flex items-center justify-center text-center p-3"
                >
                  <span className="text-[11px] text-gray-400 leading-relaxed">
                    Map placeholder — Salboni, West Bengal 722102
                    <span className="block text-[#DD5903] font-bold mt-0.5">Tap “View on Google Maps” for directions</span>
                  </span>
                </div>
              </div>
            </address>
          </div>

          {/* Column 4: INFO */}
          <div className="space-y-5">
            <h4 className="text-lg font-bold text-white font-['Arapey',serif] tracking-wide relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-10 after:h-0.5 after:bg-[#DD5903]">
              Info
            </h4>

            {/* Business Hours Section */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-white font-semibold text-xs sm:text-sm uppercase tracking-wider">
                <Clock className="w-4 h-4 text-[#DD5903]" aria-hidden="true" />
                <span>Business Hours</span>
              </div>
              <div className="bg-[#181818] border border-white/5 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-gray-300">
                  <span className="text-gray-400">Morning:</span>
                  <span className="font-semibold text-white"><time>09:00 AM</time> – <time>01:30 PM</time></span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span className="text-gray-400">Evening:</span>
                  <span className="font-semibold text-white"><time>04:30 PM</time> – <time>10:30 PM</time></span>
                </div>
                <div className="pt-1 border-t border-white/10 flex items-center justify-between">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Open All Days
                  </span>
                  <span className="text-[10px] text-gray-400">Mon - Sun</span>
                </div>
              </div>
            </div>

            {/* Delivery Area Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold text-xs sm:text-sm uppercase tracking-wider">
                <Truck className="w-4 h-4 text-[#DD5903]" />
                <span>Delivery Area</span>
              </div>
              <div className="bg-[#181818] border border-white/5 rounded-xl p-3 text-xs text-gray-300 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white">Bankura Town</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Fast delivery & takeout available</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#DD5903]/20 text-[#DD5903] text-[10px] font-bold border border-[#DD5903]/30">
                    Active
                  </span>
                </div>

                {/* Direct Order Online Button */}
                <button
                  type="button"
                  onClick={() => handleNav('/order-online')}
                  className="w-full py-2 px-3 rounded-lg bg-[#DD5903] hover:bg-[#c44e02] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer hover:shadow-orange-950/50"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Order Online Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Bottom section: Thin divider line and centered copyright text */}
        <div className="border-t border-white/10 pt-8 text-center">
          <p className="text-xs text-gray-400 font-medium">
            © 2025 Petuk Adda Cafe. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}
