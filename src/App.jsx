import React, { useState } from 'react';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import InfoBar from './components/InfoBar';
import AboutSection from './components/AboutSection';
import CoffeeMenuSection from './components/CoffeeMenuSection';
import VideoBanner from './components/VideoBanner';
import TestimonialsSection from './components/TestimonialsSection';
import GallerySection from './components/GallerySection';
import Footer from './components/Footer';
import OffcanvasDrawer from './components/OffcanvasDrawer';
import CartDrawer from './components/CartDrawer';
import SearchModal from './components/SearchModal';
import ReservationModal from './components/ReservationModal';
import ScrollToTop from './components/ScrollToTop';
import Toast from './components/Toast';

export default function App() {
  const [isOffcanvasOpen, setIsOffcanvasOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  
  const [cartItems, setCartItems] = useState([
    {
      id: 'latte',
      name: 'Latte',
      price: 8,
      quantity: 1,
      image: 'https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/03/latte.jpg'
    },
    {
      id: 'americano',
      name: 'Americano',
      price: 11,
      quantity: 2,
      image: 'https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/03/Americano.jpg'
    }
  ]);

  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
  };

  const handleAddToCart = (product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prev, { ...product, quantity: 1 }];
      }
    });
    showToast(`Added 1x ${product.name} to your order!`);
  };

  const handleUpdateQuantity = (id, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(id);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: newQty } : item))
    );
  };

  const handleRemoveItem = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    showToast('Item removed from cart');
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-white flex flex-col selection:bg-[#DD5903] selection:text-white">
      
      {/* Navigation Bar */}
      <Navbar
        onOpenOffcanvas={() => setIsOffcanvasOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenReservation={() => setIsReservationOpen(true)}
        cartCount={totalCartCount}
      />

      {/* Main Content Sections */}
      <main className="flex-grow">
        {/* 1. Hero Banner */}
        <HeroBanner onOpenReservation={() => setIsReservationOpen(true)} />

        {/* 2. Info Bar (Address, Hours, Quick Action) */}
        <InfoBar onOpenReservation={() => setIsReservationOpen(true)} />

        {/* 3. About Cafe Section with Stats */}
        <AboutSection onOpenReservation={() => setIsReservationOpen(true)} />

        {/* 4. Handcrafted Coffee & Tea Menu */}
        <CoffeeMenuSection onAddToCart={handleAddToCart} />

        {/* 5. Video / Parallax Story Section */}
        <VideoBanner />

        {/* 6. Customer Testimonials Carousel */}
        <TestimonialsSection />

        {/* 7. Instagram Coffee Gallery */}
        <GallerySection />
      </main>

      {/* Footer */}
      <Footer onOpenReservation={() => setIsReservationOpen(true)} />

      {/* Modals & Overlays */}
      <OffcanvasDrawer
        isOpen={isOffcanvasOpen}
        onClose={() => setIsOffcanvasOpen(false)}
        onOpenReservation={() => setIsReservationOpen(true)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onOpenReservation={() => setIsReservationOpen(true)}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onAddToCart={handleAddToCart}
      />

      <ReservationModal
        isOpen={isReservationOpen}
        onClose={() => setIsReservationOpen(false)}
        onShowToast={showToast}
      />

      {/* Floating Scroll to Top */}
      <ScrollToTop />

      {/* Notification Toast */}
      <Toast message={toastMessage} onClose={() => setToastMessage('')} />

    </div>
  );
}
