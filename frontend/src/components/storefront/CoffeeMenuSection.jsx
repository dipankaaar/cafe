import React from 'react';
import { coffeeMenuCol1, coffeeMenuCol2 } from '../../data/coffeeData';
import { Plus, ShoppingBag, Sparkles } from 'lucide-react';

export default function CoffeeMenuSection({ onAddToCart }) {
  return (
    <section id="menu" className="py-20 lg:py-28 bg-[#FAFAFA] relative overflow-hidden">
      
      {/* Background Decorative Pattern */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
        
        {/* ================= Part 1: Images Left, Menu Right ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left: Dual Image Collage */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-4 sm:gap-6 relative">
            <div className="rounded-2xl overflow-hidden shadow-xl transform -rotate-1 hover:rotate-0 transition-transform duration-500">
              <img
                src="https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/03/g-1.webp"
                alt="Artisan Coffee Preparation"
                className="w-full h-[360px] sm:h-[460px] object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl transform rotate-1 hover:rotate-0 transition-transform duration-500 mt-8 sm:mt-12">
              <img
                src="https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/03/top-2.jpg"
                alt="Steamed Milk Coffee Crafting"
                className="w-full h-[360px] sm:h-[460px] object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>

          {/* Right: Menu List 1 */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <img
                  src="https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/02/title-shape.png"
                  alt="Shape"
                  className="h-6 w-auto"
                />
              </div>
              <h2 className="text-4xl sm:text-5xl text-[#111111] font-['Arapey',serif] font-normal">
                Coffee & Tea
              </h2>
              <div className="diamond-divider !my-3 !justify-start">
                <div className="diamond-shape"></div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-4">
              {coffeeMenuCol1.map((item) => (
                <div
                  key={item.id}
                  className="group bg-white p-4 sm:p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#DD5903]/30 transition-all duration-300 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl object-cover flex-shrink-0 group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xl sm:text-2xl text-[#111111] font-['Arapey',serif] font-bold group-hover:text-[#DD5903] transition-colors truncate">
                          {item.name}
                        </h4>
                        {item.badge && (
                          <span className="bg-[#DD5903] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-[#777777] mt-1 line-clamp-1">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                    <span className="text-xl sm:text-2xl font-bold font-['Arapey',serif] text-[#DD5903]">
                      ${item.price}
                    </span>
                    <button
                      onClick={() => onAddToCart(item)}
                      className="p-2.5 rounded-full bg-[#FAFAFA] group-hover:bg-[#DD5903] text-gray-500 group-hover:text-white transition-all cursor-pointer shadow-sm hover:scale-110"
                      title="Add to order"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>


        {/* ================= Part 2: Menu Left, Image Right ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center pt-8">
          
          {/* Left: Menu List 2 */}
          <div className="lg:col-span-6 space-y-6 order-2 lg:order-1">
            
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <img
                  src="https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/02/title-shape.png"
                  alt="Shape"
                  className="h-6 w-auto"
                />
              </div>
              <h2 className="text-4xl sm:text-5xl text-[#111111] font-['Arapey',serif] font-normal">
                Coffee & Tea
              </h2>
              <div className="diamond-divider !my-3 !justify-start">
                <div className="diamond-shape"></div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-4">
              {coffeeMenuCol2.map((item) => (
                <div
                  key={item.id}
                  className="group bg-white p-4 sm:p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#DD5903]/30 transition-all duration-300 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl object-cover flex-shrink-0 group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xl sm:text-2xl text-[#111111] font-['Arapey',serif] font-bold group-hover:text-[#DD5903] transition-colors truncate">
                          {item.name}
                        </h4>
                        {item.badge && (
                          <span className="bg-[#DD5903] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-[#777777] mt-1 line-clamp-1">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                    <span className="text-xl sm:text-2xl font-bold font-['Arapey',serif] text-[#DD5903]">
                      ${item.price}
                    </span>
                    <button
                      onClick={() => onAddToCart(item)}
                      className="p-2.5 rounded-full bg-[#FAFAFA] group-hover:bg-[#DD5903] text-gray-500 group-hover:text-white transition-all cursor-pointer shadow-sm hover:scale-110"
                      title="Add to order"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Right: Large Featured Coffee Interior Photo */}
          <div className="lg:col-span-6 order-1 lg:order-2">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl group">
              <img
                src="https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/03/restaurant-interior.webp"
                alt="Dinenos Coffee House Interior"
                className="w-full h-[400px] sm:h-[500px] object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
              
              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm p-5 rounded-xl shadow-lg border-l-4 border-[#DD5903]">
                <p className="text-xs font-bold uppercase tracking-widest text-[#DD5903]">Signature Espresso Roasts</p>
                <h4 className="text-xl font-bold text-[#111111] font-['Arapey',serif]">Made Fresh For Every Guest</h4>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
