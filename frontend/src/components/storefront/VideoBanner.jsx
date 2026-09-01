import React, { useState } from 'react';
import { Play, X, Sparkles } from 'lucide-react';

export default function VideoBanner() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section className="relative py-28 sm:py-36 bg-[#111111] overflow-hidden flex items-center justify-center">
      
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/03/restaurant.webp"
          alt="Coffee Roasting Process"
          className="w-full h-full object-cover opacity-35 transform scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-black/40 to-[#111111]" />
      </div>

      {/* Center Play Button & Content */}
      <div className="relative z-10 text-center max-w-3xl mx-auto px-4">
        
        <button
          onClick={() => setIsPlaying(true)}
          className="group relative inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#DD5903] text-white hover:bg-white hover:text-[#111111] transition-all duration-300 shadow-2xl cursor-pointer hover:scale-110 mb-8"
          title="Play Coffee Story"
        >
          <span className="absolute inset-0 rounded-full bg-[#DD5903] animate-ping opacity-30"></span>
          <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1" />
        </button>

        <p className="text-xs uppercase tracking-[0.25em] text-[#DD5903] font-bold mb-3">
          Behind The Cup
        </p>

        <h3 className="text-3xl sm:text-5xl text-white font-['Arapey',serif] font-normal leading-tight mb-4">
          Discover The Art of Specialty Coffee Brewing
        </h3>

        <p className="text-sm sm:text-base text-gray-300 max-w-xl mx-auto font-light">
          Watch how our master roasters and baristas craft each pour-over and espresso drink with artisanal passion.
        </p>

      </div>

      {/* Video Modal Popup */}
      {isPlaying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl aspect-video border border-white/20">
            <button
              onClick={() => setIsPlaying(false)}
              className="absolute top-4 right-4 z-10 p-2 text-white bg-black/60 hover:bg-[#DD5903] rounded-full transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/yJYiko1W0i8?autoplay=1"
              title="Dinenos Coffee Experience"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

    </section>
  );
}
