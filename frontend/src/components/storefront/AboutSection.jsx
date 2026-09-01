import React, { useState, useEffect } from 'react';
import { ArrowRight, Award, Coffee, UserCheck } from 'lucide-react';

export default function AboutSection({ onOpenReservation }) {
  const [counts, setCounts] = useState({ years: 0, items: 0, chefs: 0 });

  useEffect(() => {
    const timer = setTimeout(() => {
      setCounts({ years: 11, items: 99, chefs: 20 });
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section id="about" className="py-20 lg:py-28 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Heading, Story, and Button */}
          <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
            
            {/* Title Shape */}
            <div className="flex items-center justify-center lg:justify-start mb-2">
              <img
                src="https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/02/title-shape.png"
                alt="Decorative Shape"
                className="h-7 w-auto"
              />
            </div>

            {/* Heading */}
            <h2 className="text-4xl sm:text-5xl lg:text-[54px] text-[#111111] font-['Arapey',serif] font-normal leading-[1.15]">
              More About <br />
              <span className="italic text-[#DD5903]">Dinenos Café</span>
            </h2>

            {/* Diamond divider */}
            <div className="diamond-divider !my-4 !justify-center lg:!justify-start">
              <div className="diamond-shape"></div>
            </div>

            {/* Story description */}
            <p className="text-[#666666] text-base leading-relaxed font-normal">
              It’s the story of an everlasting love affair, Dieter Delicioz and the Atlantic Ocean. Our proximity of the sea and Portugal’s excellent produce inspire every brew we create.
            </p>

            <p className="text-[#777777] text-sm leading-relaxed font-normal">
              We source specialty beans directly from micro-lot farms across Ethiopia, Colombia, and Guatemala, lightly roasting each batch to unlock vibrant floral notes and sweet caramel undertones.
            </p>

            {/* More About Us CTA */}
            <div className="pt-2">
              <a
                href="#menu"
                className="dinenos-btn !py-3.5 !px-8 text-sm uppercase tracking-wider font-semibold group inline-flex items-center gap-2"
              >
                <span>More About Us</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>

          </div>

          {/* Middle Column: Counter Statistics */}
          <div className="lg:col-span-3 flex flex-col justify-center space-y-8 py-4 border-y lg:border-y-0 lg:border-x border-gray-100 px-4 sm:px-8 text-center">
            
            {/* Counter 1: Years */}
            <div className="group p-4 rounded-xl hover:bg-[#FDF9F6] transition-colors">
              <div className="text-4xl sm:text-5xl font-['Arapey',serif] font-bold text-[#111111] group-hover:text-[#DD5903] transition-colors flex items-center justify-center gap-1">
                <span>{counts.years}</span>
                <span className="text-[#DD5903] text-3xl font-light">+</span>
              </div>
              <p className="text-sm font-bold uppercase tracking-wider text-[#111111] mt-1">Years Served</p>
              <p className="text-xs text-gray-500 mt-0.5">Dedicated to coffee perfection</p>
            </div>

            {/* Counter 2: Coffee Items */}
            <div className="group p-4 rounded-xl hover:bg-[#FDF9F6] transition-colors">
              <div className="text-4xl sm:text-5xl font-['Arapey',serif] font-bold text-[#111111] group-hover:text-[#DD5903] transition-colors flex items-center justify-center gap-1">
                <span>{counts.items}</span>
                <span className="text-[#DD5903] text-3xl font-light">+</span>
              </div>
              <p className="text-sm font-bold uppercase tracking-wider text-[#111111] mt-1">Coffee Items</p>
              <p className="text-xs text-gray-500 mt-0.5">Handcrafted signature blends</p>
            </div>

            {/* Counter 3: Expert Chefs */}
            <div className="group p-4 rounded-xl hover:bg-[#FDF9F6] transition-colors">
              <div className="text-4xl sm:text-5xl font-['Arapey',serif] font-bold text-[#111111] group-hover:text-[#DD5903] transition-colors flex items-center justify-center gap-1">
                <span>{counts.chefs}</span>
                <span className="text-[#DD5903] text-3xl font-light">+</span>
              </div>
              <p className="text-sm font-bold uppercase tracking-wider text-[#111111] mt-1">Expert Chefs</p>
              <p className="text-xs text-gray-500 mt-0.5">Certified master baristas</p>
            </div>

          </div>

          {/* Right Column: Barista Image with Reveal Frame */}
          <div className="lg:col-span-4 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl group">
              <img
                src="https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/03/barista-preparing-beverage.webp"
                alt="Barista preparing specialty coffee"
                className="w-full h-[420px] sm:h-[480px] object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
              
              {/* Badge overlay */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border-l-4 border-[#DD5903]">
                <p className="text-xs font-bold uppercase tracking-widest text-[#DD5903]">Crafted with Precision</p>
                <h4 className="text-base font-bold text-[#111111] font-['Arapey',serif]">Every Cup Tells a Story</h4>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
