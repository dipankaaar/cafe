import React from 'react';
import { MapPin, Clock, ArrowRight, Sparkles } from 'lucide-react';

export default function InfoBar({ onOpenReservation }) {
  return (
    <section className="bg-[#1A1A1A] border-y border-white/10 text-white py-6 sm:py-8 relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          
          {/* Location & Operating Hours */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#DD5903]/10 text-[#DD5903] flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl text-white font-['Arapey',serif] font-normal leading-tight">
                  12 Creek Street, Brisbane CBD
                </h2>
                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-400 mt-0.5 justify-center sm:justify-start">
                  <Clock className="w-3.5 h-3.5 text-[#DD5903]" />
                  <span>We are open 7 days a week — <strong>7:00am – 4:00pm</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Book Seat CTA */}
          <div className="flex-shrink-0">
            <button
              onClick={onOpenReservation}
              className="dinenos-btn !py-3 !px-7 text-sm uppercase tracking-wider font-semibold shadow-lg hover:shadow-orange-900/40 flex items-center gap-2 cursor-pointer"
            >
              <span>Book Your Seat</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
