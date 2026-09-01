import React, { useState } from 'react';
import Navbar from './Navbar';
import HeroBanner from './HeroBanner';
import InfoBar from './InfoBar';
import AboutSection from './AboutSection';
import CoffeeMenuSection from './CoffeeMenuSection';
import VideoBanner from './VideoBanner';
import TestimonialsSection from './TestimonialsSection';
import GallerySection from './GallerySection';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import ReservationModal from './ReservationModal';
import SearchModal from './SearchModal';
import TrackOrderModal from './TrackOrderModal';
import OffcanvasDrawer from './OffcanvasDrawer';
import ScrollToTop from './ScrollToTop';
import Toast from './Toast';
import { useCafe } from '../../context/CafeContext';
import { api } from '../../services/api';
import confetti from 'canvas-confetti';

export default function PublicStorefront({ onNavigateToAdmin }) {
  const { products, categories, createOrder, addReservation } = useCafe();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [isOffcanvasOpen, setIsOffcanvasOpen] = useState(false);

  // Customer Cart state
  const [cartItems, setCartItems] = useState([]);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
  };

  const handleAddToCart = (product, quantity = 1, variant = 'Standard', addons = []) => {
    const existingIndex = cartItems.findIndex(
      (item) => item.productId === product.id && item.variant === variant
    );

    const unitPrice = product.sellingPrice || product.price || 150;

    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += quantity;
      updated[existingIndex].totalPrice = updated[existingIndex].quantity * unitPrice;
      setCartItems(updated);
    } else {
      const newItem = {
        cartItemId: `item-${Date.now()}-${Math.random()}`,
        productId: product.id,
        name: product.name || product.title,
        price: unitPrice,
        unitPrice,
        quantity,
        totalPrice: unitPrice * quantity,
        image: product.image || product.img,
        variant,
        addons
      };
      setCartItems((prev) => [...prev, newItem]);
    }

    showToast(`Added ${quantity}x "${product.name || product.title}" to cart!`);
  };

  const handleUpdateCartQuantity = (cartItemId, newQty) => {
    if (newQty <= 0) {
      setCartItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
      return;
    }
    setCartItems((prev) =>
      prev.map((i) =>
        i.cartItemId === cartItemId
          ? { ...i, quantity: newQty, totalPrice: i.unitPrice * newQty }
          : i
      )
    );
  };

  const handleRemoveCartItem = (cartItemId) => {
    setCartItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  // Online Checkout submission
  const handleOnlineCheckout = async (checkoutData) => {
    const subtotal = cartItems.reduce((sum, i) => sum + i.totalPrice, 0);
    const taxAmount = (subtotal * 0.05);
    const grandTotal = subtotal + taxAmount;

    const orderPayload = {
      orderType: checkoutData.orderType || 'takeaway',
      customerName: checkoutData.customerName || 'Online Guest',
      customerPhone: checkoutData.customerPhone || '',
      items: cartItems,
      subtotal,
      discountAmount: 0,
      taxAmount,
      grandTotal,
      paymentMethod: checkoutData.paymentMethod || 'UPI',
      paymentStatus: 'Paid',
      notes: checkoutData.notes || 'Placed via Public Website',
      serverStaff: 'Online Storefront'
    };

    const newOrder = createOrder(orderPayload);

    // Trigger celebration confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    setCartItems([]);
    setIsCartOpen(false);
    showToast(`Order #${newOrder.orderNumber} placed! You can track it live.`);
  };

  return (
    <div className="bg-[#0b0c0e] text-white min-h-screen font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Top Banner Navigation */}
      <Navbar
        cartCount={cartItems.reduce((sum, i) => sum + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenReservation={() => setIsReservationOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenOffcanvas={() => setIsOffcanvasOpen(true)}
        onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
        onNavigateToAdmin={onNavigateToAdmin}
      />

      {/* Main Public Hero & Content */}
      <main>
        <HeroBanner
          onOpenReservation={() => setIsReservationOpen(true)}
          onOpenMenu={() => {
            const el = document.getElementById('menu');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
        <InfoBar />
        <AboutSection onOpenReservation={() => setIsReservationOpen(true)} />
        <CoffeeMenuSection
          onAddToCart={handleAddToCart}
          onOpenReservation={() => setIsReservationOpen(true)}
        />
        <VideoBanner onOpenReservation={() => setIsReservationOpen(true)} />
        <TestimonialsSection />
        <GallerySection />
      </main>

      {/* Footer */}
      <Footer
        onOpenReservation={() => setIsReservationOpen(true)}
        onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
        onNavigateToAdmin={onNavigateToAdmin}
      />

      {/* Drawers & Modals */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={handleOnlineCheckout}
      />

      <ReservationModal
        isOpen={isReservationOpen}
        onClose={() => setIsReservationOpen(false)}
        onSuccess={(bookingData) => {
          addReservation(bookingData);
          showToast(`Table reserved for ${bookingData.customerName} on ${bookingData.date}!`);
        }}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onAddToCart={handleAddToCart}
      />

      <TrackOrderModal
        isOpen={isTrackOrderOpen}
        onClose={() => setIsTrackOrderOpen(false)}
      />

      <OffcanvasDrawer
        isOpen={isOffcanvasOpen}
        onClose={() => setIsOffcanvasOpen(false)}
        onOpenReservation={() => {
          setIsOffcanvasOpen(false);
          setIsReservationOpen(true);
        }}
        onOpenTrackOrder={() => {
          setIsOffcanvasOpen(false);
          setIsTrackOrderOpen(true);
        }}
        onNavigateToAdmin={onNavigateToAdmin}
      />

      <ScrollToTop />

      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage('')}
        />
      )}

    </div>
  );
}
