import React from 'react';
import { Coffee, ArrowRight, Utensils } from 'lucide-react';

export default function HeroBanner({ onOpenReservation }) {
  return (
    <section className="relative min-h-[92vh] lg:min-h-screen flex items-center justify-center bg-[#111111] overflow-hidden">
      
      {/* Background Image with Dark Vignette Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/03/restaurant.webp"
          alt="Dinenos Restaurant Ambiance"
          className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-1000 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/85" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-black/60" />
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
          <span>Coffee Eats & Treats</span>
        </div>

        {/* Arapey Heading */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[82px] text-white font-['Arapey',serif] font-normal leading-[1.1] tracking-tight mb-6 max-w-4xl mx-auto">
          Welcome To Dinenos <br className="hidden sm:inline" />
          <span className="italic text-[#DD5903]">Cafe House</span>
        </h1>

        {/* Subtitle description */}
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto font-light leading-relaxed mb-10">
          Experience the pinnacle of freshly roasted artisanal coffees, handcrafted breakfast creations, and relaxing ambiance crafted with passion since 2012.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <a
            href="#about"
            className="dinenos-btn !py-4 !px-8 text-sm uppercase tracking-wider font-bold w-full sm:w-auto shadow-2xl flex items-center justify-center gap-2 group"
          >
            <span>View More</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </a>

          <a
            href="#menu"
            className="dinenos-btn-outline !py-4 !px-8 text-sm uppercase tracking-wider font-bold w-full sm:w-auto flex items-center justify-center gap-2 group hover:shadow-xl"
          >
            <Utensils className="w-4 h-4 text-[#DD5903] group-hover:text-white" />
            <span>Food Menu</span>
          </a>
        </div>

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
