import React, { useState } from 'react';
import { galleryImages } from '../../data/coffeeData';
import { Maximize2, X } from 'lucide-react';

export default function GallerySection() {
  const [activeImage, setActiveImage] = useState(null);

  return (
    <section id="gallery" className="bg-[#111111] relative">
      
      {/* 4-Image Grid with Hover Overlays */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0">
        {galleryImages.map((item) => (
          <div
            key={item.id}
            onClick={() => setActiveImage(item)}
            className="group relative h-80 sm:h-96 overflow-hidden cursor-pointer bg-black"
          >
            <img
              src={item.url}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 opacity-90 group-hover:opacity-100"
            />
            
            {/* Dark Hover Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
              <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <span className="text-xs uppercase tracking-widest text-[#DD5903] font-bold">Dinenos Moments</span>
                <h4 className="text-xl text-white font-['Arapey',serif] font-normal mt-1">{item.title}</h4>
              </div>
              <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                <Maximize2 className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {activeImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md"
          onClick={() => setActiveImage(null)}
        >
          <button
            onClick={() => setActiveImage(null)}
            className="absolute top-6 right-6 text-white p-2 rounded-full bg-white/10 hover:bg-[#DD5903] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-4xl max-h-[85vh] rounded-xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <img
              src={activeImage.url}
              alt={activeImage.title}
              className="max-h-[80vh] w-auto object-contain mx-auto rounded-lg"
            />
            <p className="text-center text-gray-300 text-sm mt-3 font-['Arapey',serif] text-lg">
              {activeImage.title}
            </p>
          </div>
        </div>
      )}

    </section>
  );
}
