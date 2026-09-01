import React, { useState, useEffect } from 'react';
import { testimonials } from '../data/coffeeData';
import { ArrowLeft, ArrowRight, Star } from 'lucide-react';

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const current = testimonials[currentIndex];

  return (
    <section id="testimonials" className="py-24 lg:py-32 bg-white relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
        
        {/* Decorative Quote Icons */}
        <div className="flex justify-center mb-8">
          <div className="diamond-divider">
            <div className="diamond-shape"></div>
          </div>
        </div>

        <div className="relative py-8 px-4 sm:px-12">
          {/* Left Red Quote Icon */}
          <div className="absolute top-0 left-0 w-12 h-12 sm:w-16 sm:h-16 opacity-80 pointer-events-none">
            <img
              src="https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/02/quote-red-left.webp"
              alt="Quote Left"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Review Stars */}
          <div className="flex items-center justify-center gap-1 text-[#DD5903] mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-current" />
            ))}
          </div>

          {/* Quote Text */}
          <blockquote className="text-xl sm:text-2xl md:text-3xl text-[#111111] font-['Arapey',serif] font-normal italic leading-relaxed mb-8 transition-opacity duration-300">
            {current.quote}
          </blockquote>

          {/* Author Details */}
          <div>
            <h5 className="text-lg sm:text-xl font-bold font-['Arapey',serif] text-[#111111]">
              {current.author}
            </h5>
            <p className="text-xs uppercase tracking-widest text-[#DD5903] font-semibold mt-1">
              {current.role}
            </p>
          </div>

          {/* Right Red Quote Icon */}
          <div className="absolute bottom-0 right-0 w-12 h-12 sm:w-16 sm:h-16 opacity-80 pointer-events-none">
            <img
              src="https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/02/quote-red-right.webp"
              alt="Quote Right"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Carousel Controls */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={prevSlide}
            className="w-10 h-10 rounded-full border border-gray-200 hover:border-[#DD5903] hover:bg-[#DD5903] hover:text-white text-gray-600 flex items-center justify-center transition-all cursor-pointer shadow-sm"
            title="Previous Testimonial"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Dots Indicator */}
          <div className="flex items-center gap-2">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex ? 'w-6 bg-[#DD5903]' : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            className="w-10 h-10 rounded-full border border-gray-200 hover:border-[#DD5903] hover:bg-[#DD5903] hover:text-white text-gray-600 flex items-center justify-center transition-all cursor-pointer shadow-sm"
            title="Next Testimonial"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
}
