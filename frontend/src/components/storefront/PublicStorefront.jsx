import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './Navbar';
import HeroBanner from './HeroBanner';
import InfoBar from './InfoBar';
import AboutSection from './AboutSection';
import CoffeeMenuSection from './CoffeeMenuSection';
import TestimonialsSection from './TestimonialsSection';
import GallerySection from './GallerySection';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import ReservationModal from './ReservationModal';
import SearchModal from './SearchModal';
import TrackOrderModal from './TrackOrderModal';
import OffcanvasDrawer from './OffcanvasDrawer';
import CustomerProfileModal from './CustomerProfileModal';
import ScrollToTop from './ScrollToTop';
import Toast from './Toast';
import WebsiteQrScannerModal from './WebsiteQrScannerModal';
import { api } from '../../services/api';
import confetti from 'canvas-confetti';

const CART_STORAGE_KEY = 'petuk_storefront_cart_v1';

function loadPersistedCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function PublicStorefront({ onNavigate, onNavigateToAdmin, onNavigateToQrOrder }) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [isCustomerProfileOpen, setIsCustomerProfileOpen] = useState(false);
  const [isOffcanvasOpen, setIsOffcanvasOpen] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);

  // Customer Cart state — persisted to localStorage
  const [cartItems, setCartItems] = useState(loadPersistedCart);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      /* storage unavailable — cart still works in-memory */
    }
  }, [cartItems]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const handleAddToCart = (product, quantity = 1, variant = 'Standard', addons = [], unitPriceOverride) => {
    const variantKey = typeof variant === 'object' ? JSON.stringify(variant) : String(variant || 'Standard');
    const addonsKey = (addons || []).map((a) => a.id || a.name).join('|');
    const unitPrice = Number(
      unitPriceOverride ?? product.sellingPrice ?? product.price ?? product.unitPrice ?? 150
    );

    const existingIndex = cartItems.findIndex(
      (item) =>
        item.productId === product.id &&
        item.variantKey === variantKey &&
        item.addonsKey === addonsKey
    );

    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += quantity;
      updated[existingIndex].totalPrice = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      setCartItems(updated);
    } else {
      const newItem = {
        cartItemId: `item-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        productId: product.id,
        name: product.name || product.title,
        price: unitPrice,
        unitPrice,
        quantity,
        totalPrice: unitPrice * quantity,
        image: product.image || product.imageUrl || product.img,
        category: typeof product.category === 'string' ? product.category : product.categoryId,
        variant,
        variantKey,
        addons: addons || [],
        addonsKey
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

  // Online Checkout submission — live via POST /api/orders
  const handleOnlineCheckout = async (checkoutData) => {
    const subtotal = cartItems.reduce((sum, i) => sum + (Number(i.totalPrice) || 0), 0);
    const discountAmount = Number(checkoutData.discountAmount || 0);
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = Number((taxableAmount * 0.05).toFixed(2));
    const deliveryFee = checkoutData.orderType === 'delivery' ? (taxableAmount >= 499 ? 0 : 30) : 0;
    const grandTotal = Number((taxableAmount + taxAmount + deliveryFee).toFixed(2));

    const orderPayload = {
      orderType: checkoutData.orderType || 'takeaway',
      orderSource: 'ONLINE',
      customerName: checkoutData.customerName || 'Online Guest',
      customerPhone: checkoutData.customerPhone || '',
      items: cartItems.map((i) => ({
        productId: i.productId,
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        price: i.unitPrice,
        totalPrice: i.totalPrice,
        variant: typeof i.variant === 'object' ? i.variant.name || 'Standard' : (i.variant || 'Standard'),
        addons: i.addons || []
      })),
      subtotal: Number(subtotal.toFixed(2)),
      discountAmount,
      couponCode: checkoutData.couponCode || null,
      couponId: checkoutData.couponId || null,
      taxAmount,
      serviceCharge: 0,
      grandTotal,
      paymentMethod: checkoutData.paymentMethod || 'UPI',
      paymentStatus: ['UPI', 'Card'].includes(checkoutData.paymentMethod) ? 'Paid' : 'Pending',
      notes: checkoutData.notes || 'Placed via Public Website',
      serverStaff: 'Online Storefront'
    };

    const newOrder = await api.createOrder(orderPayload);

    // Trigger celebration confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    setCartItems([]);
    try { localStorage.removeItem(CART_STORAGE_KEY); } catch { /* noop */ }
    setIsCartOpen(false);
    showToast(`Order #${newOrder.orderNumber} placed! You can track it live.`);
    return newOrder;
  };

  return (
    <div className="bg-[#0b0c0e] text-white min-h-screen font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Banner Navigation */}
      <Navbar
        onNavigate={onNavigate}
        cartCount={cartItems.reduce((sum, i) => sum + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenReservation={() => (onNavigate ? onNavigate('/find-table') : setIsReservationOpen(true))}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenOffcanvas={() => setIsOffcanvasOpen(true)}
        onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
        onOpenCustomerProfile={() => setIsCustomerProfileOpen(true)}
        onOpenQrScanner={() => (onNavigate ? onNavigate('/scan-table') : setIsQrScannerOpen(true))}
        onNavigateToAdmin={onNavigateToAdmin}
      />

      {/* Main Public Hero & Content */}
      <main id="main-content">
        <HeroBanner
          onNavigate={onNavigate}
          onOpenReservation={() => (onNavigate ? onNavigate('/find-table') : setIsReservationOpen(true))}
          onOpenCart={() => (onNavigate ? onNavigate('/order-online') : setIsCartOpen(true))}
          onOpenMenu={() => (onNavigate ? onNavigate('/menu') : null)}
          onOpenQrScanner={() => (onNavigate ? onNavigate('/scan-table') : setIsQrScannerOpen(true))}
        />
        <InfoBar />
        <AboutSection
          onOpenReservation={() => (onNavigate ? onNavigate('/find-table') : setIsReservationOpen(true))}
        />
        <TestimonialsSection />
        <GallerySection />
      </main>

      {/* Footer */}
      <Footer
        onNavigate={onNavigate}
        onOpenReservation={() => (onNavigate ? onNavigate('/find-table') : setIsReservationOpen(true))}
        onOpenCart={() => (onNavigate ? onNavigate('/order-online') : setIsCartOpen(true))}
        onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
        onNavigateToAdmin={onNavigateToAdmin}
      />

      {/* Drawers & Modals for in-page quick utilities */}
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
          setIsReservationOpen(false);
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

      <WebsiteQrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onScanSuccess={(token) => {
          if (onNavigateToQrOrder) {
            onNavigateToQrOrder(token);
          }
        }}
      />

      <OffcanvasDrawer
        isOpen={isOffcanvasOpen}
        onClose={() => setIsOffcanvasOpen(false)}
        onNavigate={onNavigate}
        onOpenTrackOrder={() => {
          setIsOffcanvasOpen(false);
          setIsTrackOrderOpen(true);
        }}
        onOpenCustomerProfile={() => {
          setIsOffcanvasOpen(false);
          setIsCustomerProfileOpen(true);
        }}
        onNavigateToAdmin={onNavigateToAdmin}
      />

      <CustomerProfileModal
        isOpen={isCustomerProfileOpen}
        onClose={() => setIsCustomerProfileOpen(false)}
        onOpenTrackOrder={(orderNum) => {
          setIsCustomerProfileOpen(false);
          setIsTrackOrderOpen(true);
        }}
        onReorder={(items) => {
          setIsCustomerProfileOpen(false);
          if (Array.isArray(items)) {
            items.forEach((it) => {
              handleAddToCart({
                id: it.productId || it.id,
                name: it.name,
                price: it.unitPrice || it.price,
                sellingPrice: it.unitPrice || it.price,
                isVeg: it.isVeg ?? true
              }, it.quantity || 1);
            });
          }
          if (onNavigate) onNavigate('/order-online');
          else setIsCartOpen(true);
        }}
        onOpenReservation={() => {
          setIsCustomerProfileOpen(false);
          if (onNavigate) onNavigate('/find-table');
          else setIsReservationOpen(true);
        }}
        onNavigateToMenu={() => {
          setIsCustomerProfileOpen(false);
          if (onNavigate) onNavigate('/order-online');
        }}
      />

      <ScrollToTop />

      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />
      )}
    </div>
  );
}
