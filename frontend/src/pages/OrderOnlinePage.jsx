import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Truck, 
  Store, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Tag, 
  Check, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  Star, 
  CheckCircle2, 
  ChevronRight,
  Info,
  SlidersHorizontal,
  Flame,
  Leaf
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCafe } from '../context/CafeContext';
import BrandLogo from '../components/common/BrandLogo';
import { api } from '../services/api';
import { validateCouponLive } from '../services/couponValidator';
import { formatINR, getProductImage, handleImageFallback, isValidIndianPhone } from '../utils/formatters';

export default function OrderOnlinePage({ onNavigate }) {
  const { products, categories } = useCafe();

  // Navigation / Tab states
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState('all'); // 'all' | 'veg' | 'non-veg'
  const [orderType, setOrderType] = useState('delivery'); // 'delivery' | 'takeaway'

  // Cart State: { [productId]: { product, quantity, variant, notes } }
  const [cart, setCart] = useState([]);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Checkout Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLandmark, setDeliveryLandmark] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [specialNotes, setSpecialNotes] = useState('');

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Order Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [orderError, setOrderError] = useState('');

  // Filter Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (!p.isAvailable) return false;
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory || p.categoryId === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesDietary = dietaryFilter === 'all' || 
                             (dietaryFilter === 'veg' && p.isVeg) || 
                             (dietaryFilter === 'non-veg' && !p.isVeg);
      return matchesCategory && matchesSearch && matchesDietary;
    });
  }, [products, selectedCategory, searchQuery, dietaryFilter]);

  // Cart Management
  const handleAddToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.sellingPrice || product.price,
        unitPrice: product.sellingPrice || product.price,
        image: product.image,
        isVeg: product.isVeg,
        category: product.category,
        quantity: 1,
        totalPrice: product.sellingPrice || product.price
      }];
    });
  };

  const handleUpdateQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        return {
          ...item,
          quantity: newQty,
          totalPrice: item.unitPrice * newQty
        };
      }
      return item;
    }));
  };

  const handleRemoveItem = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  // Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  }, [cart]);

  const deliveryFee = orderType === 'delivery' ? (cartSubtotal >= 499 ? 0 : 30) : 0;

  const discountAmount = Number(appliedCoupon?.discountAmount || 0);

  const taxableAmount = Math.max(0, cartSubtotal - discountAmount);
  const gstTax = Number((taxableAmount * 0.05).toFixed(2));
  const grandTotal = Number((taxableAmount + gstTax + deliveryFee).toFixed(2));
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Apply Coupon Handler — live via POST /api/coupons/validate
  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    if (!couponCode.trim() || isValidatingCoupon) return;

    const code = couponCode.trim().toUpperCase();
    setIsValidatingCoupon(true);
    const result = await validateCouponLive(api, {
      couponCode: code,
      subtotal: cartSubtotal,
      orderType,
      cartItems: cart.map((i) => ({
        productId: i.id,
        name: i.name,
        category: i.category,
        quantity: i.quantity,
        price: Number(i.unitPrice || 0)
      }))
    });
    setIsValidatingCoupon(false);

    if (result.isValid) {
      setAppliedCoupon({ ...(result.coupon || {}), code, discountAmount: result.discountAmount });
      setCouponError('');
    } else {
      setAppliedCoupon(null);
      setCouponError(result.error || 'Invalid or expired promo code.');
    }
  };

  // Place Order Submit — live via POST /api/orders
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setOrderError('');
    if (cart.length === 0) return;

    if (!customerName.trim()) {
      setOrderError('Please enter your full name.');
      return;
    }
    if (!isValidIndianPhone(customerPhone)) {
      setOrderError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      setOrderError('Please enter your delivery address for this order.');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderPayload = {
        orderType,
        orderSource: 'ONLINE',
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        items: cart.map((i) => ({
          productId: i.id,
          name: i.name,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice || 0),
          price: Number(i.unitPrice || 0),
          totalPrice: Number((Number(i.unitPrice || 0) * Number(i.quantity || 1)).toFixed(2))
        })),
        subtotal: Number(cartSubtotal.toFixed(2)),
        discountAmount,
        couponCode: appliedCoupon?.code || null,
        couponId: appliedCoupon?.id || null,
        taxAmount: gstTax,
        serviceCharge: 0,
        grandTotal,
        paymentMethod,
        paymentStatus: 'Pending',
        // Structured delivery leg (backend validates address for delivery orders)
        deliveryAddress: orderType === 'delivery' ? deliveryAddress.trim() : '',
        deliveryLandmark: orderType === 'delivery' ? deliveryLandmark.trim() : '',
        deliveryInstructions: orderType === 'delivery' ? specialNotes.trim() : '',
        notes: specialNotes.trim() + (orderType === 'delivery' ? ` [Delivery: ${deliveryAddress.trim()}]` : ' [Takeaway Pickup]'),
        serverStaff: 'Online Storefront'
      };

      const newOrder = await api.createOrder(orderPayload);
      setPlacedOrder(newOrder);

      // Trigger Confetti
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      setCart([]);
      setAppliedCoupon(null);
      setCouponCode('');
      setIsMobileCartOpen(false);
    } catch (err) {
      setOrderError(err?.message ? `Could not place order: ${err.message}` : 'Could not place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white font-['Plus_Jakarta_Sans',sans-serif] pb-24 lg:pb-12">
      
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-40 bg-[#141414]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-gray-300 hover:text-[#DD5903] transition-colors py-1 px-2 rounded-lg hover:bg-white/5 cursor-pointer"
            title="Return to Home"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Home</span>
          </button>
          <div className="h-4 w-px bg-white/10 hidden sm:block" />
          <BrandLogo size="small" light={true} />
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          {/* Order Type Pill */}
          <div className="bg-[#1f1f1f] p-1 rounded-full border border-white/10 flex items-center text-xs">
            <button
              onClick={() => setOrderType('delivery')}
              className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1 ${
                orderType === 'delivery' ? 'bg-[#DD5903] text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Delivery</span>
            </button>
            <button
              onClick={() => setOrderType('takeaway')}
              className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1 ${
                orderType === 'takeaway' ? 'bg-[#DD5903] text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Takeaway</span>
            </button>
          </div>

          {/* Cart Icon trigger on mobile */}
          <button
            onClick={() => setIsMobileCartOpen(true)}
            className="lg:hidden relative p-2 rounded-full bg-white/5 border border-white/10 text-white hover:text-[#DD5903] cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalCartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#DD5903] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center animate-bounce">
                {totalCartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Placed Order Success Modal */}
      {placedOrder && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-6 shadow-2xl animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs uppercase tracking-widest text-[#DD5903] font-bold">Order Confirmed</span>
              <h2 className="text-2xl sm:text-3xl font-bold font-['Arapey',serif] text-white mt-1">
                Thank You, {placedOrder.customerName}!
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Your order has been submitted to Petuk Adda Cafe kitchen.
              </p>
            </div>

            {/* Order Card */}
            <div className="bg-[#121212] border border-white/10 rounded-2xl p-4 text-left space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Order Reference</p>
                  <p className="text-base font-bold font-mono text-[#DD5903]">#{placedOrder.orderNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Grand Total</p>
                  <p className="text-base font-bold text-white">{formatINR(placedOrder.grandTotal)}</p>
                </div>
              </div>

              {/* Status Stepper */}
              <div className="py-2 space-y-2">
                <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Kitchen Status: {placedOrder.status || 'Placed'}
                  </span>
                  <span>Est. 25-35 mins</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-[#DD5903] h-full rounded-full w-1/4 animate-pulse" />
                </div>
              </div>

              <div className="text-xs text-gray-300 space-y-1 pt-1">
                <p><strong>Mode:</strong> {placedOrder.orderType === 'delivery' ? 'Home Delivery (Bankura Town)' : 'Takeaway Pickup'}</p>
                {placedOrder.deliveryAddress && (
                  <p><strong>Address:</strong> {placedOrder.deliveryAddress}</p>
                )}
                <p><strong>Payment:</strong> {placedOrder.paymentMethod} (Confirmed)</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => setPlacedOrder(null)}
                className="dinenos-btn flex-1 !py-3 text-xs uppercase font-bold tracking-wider cursor-pointer"
              >
                Order More Items
              </button>
              <button
                onClick={() => onNavigate('/')}
                className="dinenos-btn-outline flex-1 !py-3 text-xs uppercase font-bold tracking-wider cursor-pointer"
              >
                Back to Homepage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Restaurant Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-gradient-to-r from-[#1a1a1a] via-[#161616] to-[#1a1a1a] border border-white/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#DD5903]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DD5903]/20 border border-[#DD5903]/40 text-[#DD5903] text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Petuk Adda Direct Online Ordering</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold font-['Arapey',serif] text-white">
                Petuk Adda Cafe
              </h1>
              <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                Salboni, Sakadihi-Ailakundi Road (Near High School) • Artisanal Coffee & Gourmet Bistro
              </p>

              {/* Badges */}
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap pt-2 text-xs">
                <span className="flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>4.9 (500+ Ratings)</span>
                </span>
                <span className="flex items-center gap-1 text-gray-300 bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
                  <Clock className="w-3.5 h-3.5 text-[#DD5903]" />
                  <span>25-35 Mins</span>
                </span>
                <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Delivery to Bankura Town</span>
                </span>
              </div>
            </div>

            {/* Promo Card Callout */}
            <div className="bg-[#121212]/90 border border-white/15 rounded-xl p-4 text-xs space-y-1.5 w-full md:w-64 flex-shrink-0 shadow-lg">
              <div className="flex items-center gap-1.5 text-[#DD5903] font-bold uppercase tracking-wider">
                <Tag className="w-3.5 h-3.5" />
                <span>Special Promo</span>
              </div>
              <p className="font-bold text-white text-sm">20% OFF on Orders</p>
              <p className="text-gray-400 text-[11px]">Use code <strong className="text-amber-400 font-mono">PETUK20</strong> on checkout for instant discount.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Order Workspace: Food Catalog (Left) + Cart Sidebar (Right) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ================= LEFT COLUMN: MENU CATALOG & FILTERS (8 Cols) ================= */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            
            {/* Search Bar & Dietary Filter Row */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search coffee, burgers, sandwiches, breakfast, desserts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#181818] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm text-white placeholder-gray-500 outline-none focus:border-[#DD5903] transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Veg / Non-Veg Switcher */}
              <div className="flex items-center gap-1 bg-[#181818] p-1 rounded-xl border border-white/10 text-xs w-full sm:w-auto justify-center">
                <button
                  onClick={() => setDietaryFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    dietaryFilter === 'all' ? 'bg-[#DD5903] text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setDietaryFilter('veg')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    dietaryFilter === 'veg' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Veg Only</span>
                </button>
                <button
                  onClick={() => setDietaryFilter('non-veg')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    dietaryFilter === 'non-veg' ? 'bg-rose-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span>Non-Veg</span>
                </button>
              </div>
            </div>

            {/* Category Filter Pills (Horizontal Scroll) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                  selectedCategory === 'all'
                    ? 'bg-[#DD5903] text-white border-[#DD5903] shadow-md shadow-orange-950/40'
                    : 'bg-[#181818] text-gray-400 hover:text-white border-white/10 hover:border-white/20'
                }`}
              >
                All Items ({products.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
                    selectedCategory === cat.id
                      ? 'bg-[#DD5903] text-white border-[#DD5903] shadow-md shadow-orange-950/40'
                      : 'bg-[#181818] text-gray-400 hover:text-white border-white/10 hover:border-white/20'
                  }`}
                >
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            {/* Food Item Cards Grid (Modern Food Platform Cards) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-gray-400 font-semibold uppercase tracking-wider">
                <span>Dishes Available ({filteredProducts.length})</span>
                <span>Fast Kitchen Dispatch</span>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="bg-[#181818] border border-white/10 rounded-2xl p-12 text-center text-gray-400 space-y-3">
                  <Info className="w-8 h-8 text-[#DD5903] mx-auto" />
                  <p className="text-base font-bold text-white">No menu items match your search.</p>
                  <p className="text-xs">Try clearing filters or searching for something else.</p>
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setDietaryFilter('all'); }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProducts.map((prod) => {
                    const inCartItem = cart.find(i => i.id === prod.id);
                    const inCartQty = inCartItem ? inCartItem.quantity : 0;
                    const price = prod.sellingPrice || prod.price;

                    return (
                      <div
                        key={prod.id}
                        className="bg-[#181818] hover:bg-[#1e1e1e] border border-white/10 hover:border-white/20 rounded-2xl p-4 flex gap-4 transition-all duration-200 group shadow-md relative overflow-hidden"
                      >
                        {/* Food Details (Left) */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div className="space-y-1">
                            {/* Veg / Non-Veg Indicator Icon */}
                            <div className="flex items-center gap-2">
                              <span className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center p-0.5 ${
                                prod.isVeg ? 'border-emerald-500' : 'border-rose-500'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  prod.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                                }`} />
                              </span>
                              {prod.badge && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                                  {prod.badge}
                                </span>
                              )}
                            </div>

                            {/* Title */}
                            <h3 className="text-sm font-bold text-white group-hover:text-[#DD5903] transition-colors font-['Plus_Jakarta_Sans',sans-serif]">
                              {prod.name}
                            </h3>

                            {/* Price */}
                            <p className="text-sm font-bold text-white font-mono">
                              {formatINR(price, { whole: true })}
                            </p>

                            {/* Short Description */}
                            {prod.description && (
                              <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed pt-0.5">
                                {prod.description}
                              </p>
                            )}
                          </div>

                          <div className="pt-3">
                            <span className="text-[10px] text-gray-500">
                              ★ 4.8 (Popular)
                            </span>
                          </div>
                        </div>

                        {/* Image & Dynamic Add/Qty Button (Right) */}
                        <div className="w-28 sm:w-32 flex flex-col items-center flex-shrink-0">
                          <div className="w-28 h-24 sm:w-32 sm:h-28 rounded-xl overflow-hidden bg-black border border-white/10 relative">
                            <img
                              src={getProductImage(prod)}
                              alt={prod.name}
                              loading="lazy"
                              onError={handleImageFallback}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>

                          {/* Dynamic Add Button or Qty Stepper */}
                          <div className="-mt-4 relative z-10 w-24">
                            {inCartQty === 0 ? (
                              <button
                                onClick={() => handleAddToCart(prod)}
                                className="w-full py-1.5 bg-[#141414] hover:bg-[#DD5903] text-[#DD5903] hover:text-white border border-[#DD5903] rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-lg hover:shadow-orange-950/60 flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add</span>
                              </button>
                            ) : (
                              <div className="flex items-center justify-between bg-[#DD5903] text-white rounded-lg p-0.5 shadow-lg border border-[#DD5903]">
                                <button
                                  onClick={() => handleUpdateQuantity(prod.id, inCartQty - 1)}
                                  className="w-7 h-6 flex items-center justify-center hover:bg-black/20 rounded text-white transition-colors cursor-pointer"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="font-bold text-xs px-1 font-mono">
                                  {inCartQty}
                                </span>
                                <button
                                  onClick={() => handleUpdateQuantity(prod.id, inCartQty + 1)}
                                  className="w-7 h-6 flex items-center justify-center hover:bg-black/20 rounded text-white transition-colors cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* ================= RIGHT COLUMN: DESKTOP CART & CHECKOUT SIDEBAR (4-5 Cols) ================= */}
          <div className="hidden lg:block lg:col-span-5 xl:col-span-4 sticky top-20">
            <div className="bg-[#181818] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xl">
              
              {/* Cart Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#DD5903]" />
                  <h3 className="text-base font-bold text-white font-['Arapey',serif] tracking-wide">
                    Order Summary ({totalCartCount} items)
                  </h3>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-[11px] text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="py-12 text-center text-gray-400 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto text-[#DD5903]">
                    <ShoppingBag className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Your cart is empty</h4>
                  <p className="text-xs max-w-xs mx-auto">
                    Add dishes from the menu to start your online order.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {/* Cart Items List */}
                  <div className="max-h-60 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 bg-[#121212] p-2.5 rounded-xl border border-white/5"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-sm border flex items-center justify-center ${
                              item.isVeg ? 'border-emerald-500' : 'border-rose-500'
                            }`}>
                              <span className={`w-1 h-1 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            </span>
                            <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">{formatINR(item.unitPrice, { whole: true })} each</p>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-[#1c1c1c] border border-white/20 rounded-lg overflow-hidden">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              className="px-2 py-0.5 text-gray-400 hover:text-white cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-xs font-bold text-white font-mono">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              className="px-2 py-0.5 text-gray-400 hover:text-white cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-xs font-bold font-mono text-white min-w-[45px] text-right">
                            {formatINR(Number(item.unitPrice || 0) * Number(item.quantity || 1), { whole: true })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Promo Input */}
                  <form onSubmit={handleApplyCoupon} className="space-y-1.5 pt-2 border-t border-white/10">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Coupon code (e.g. PETUK20)"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1 bg-[#121212] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white uppercase placeholder-gray-500 outline-none focus:border-[#DD5903] font-mono font-bold"
                      />
                      <button
                        type="submit"
                        disabled={isValidatingCoupon}
                        className="px-3 py-1.5 bg-[#DD5903] hover:bg-[#c44e02] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isValidatingCoupon ? 'Checking…' : 'Apply'}
                      </button>
                    </div>
                    {appliedCoupon && (
                      <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> "{appliedCoupon.code}" applied (-{formatINR(discountAmount)})
                      </p>
                    )}
                    {couponError && <p className="text-[11px] text-rose-400">{couponError}</p>}
                  </form>

                  {/* Customer Information Form */}
                  <form id="desktop-checkout-form" onSubmit={handlePlaceOrder} className="space-y-3 pt-2 border-t border-white/10 text-xs">
                    <p className="text-xs uppercase font-bold text-[#DD5903] tracking-wider">
                      Customer & Delivery Details
                    </p>

                    <div>
                      <label className="block text-gray-400 font-semibold mb-1">Your Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sourav Mukherjee"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[#DD5903]"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 font-semibold mb-1">Phone Number (10 Digits) *</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9932148058"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[#DD5903]"
                      />
                    </div>

                    {orderType === 'delivery' && (
                      <div>
                        <label className="block text-gray-400 font-semibold mb-1">Delivery Address (Bankura Town) *</label>
                        <textarea
                          rows={2}
                          required
                          placeholder="House/Flat No., Landmark, Bankura Town..."
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[#DD5903] resize-none"
                        />
                      </div>
                    )}

                    {orderType === 'delivery' && (
                      <div>
                        <label className="block text-gray-400 font-semibold mb-1">Landmark (helps the rider)</label>
                        <input
                          type="text"
                          placeholder="e.g. Near Kangsabati Bridge"
                          value={deliveryLandmark}
                          onChange={(e) => setDeliveryLandmark(e.target.value)}
                          className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[#DD5903]"
                        />
                      </div>
                    )}

                    {/* Payment Method */}
                    <div>
                      <label className="block text-gray-400 font-semibold mb-1.5">Payment Method</label>
                      <div className="w-full py-2 px-3 rounded-lg border border-[#DD5903] bg-[#DD5903]/10 text-white font-bold text-xs flex items-center justify-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>💵 Cash on Delivery (COD)</span>
                      </div>
                    </div>
                  </form>

                  {/* Bill Details Breakdown */}
                  <div className="space-y-1.5 text-xs text-gray-400 pt-2 border-t border-white/10">
                    <div className="flex justify-between">
                      <span>Item Subtotal</span>
                      <span className="font-semibold text-white">{formatINR(cartSubtotal)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Promo Discount</span>
                        <span>-{formatINR(discountAmount)}</span>
                      </div>
                    )}
                    {orderType === 'delivery' && (
                      <div className="flex justify-between">
                        <span>Delivery Fee</span>
                        <span className="font-semibold text-white">{deliveryFee === 0 ? <span className="text-emerald-400 font-bold">FREE</span> : formatINR(deliveryFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>GST (5%)</span>
                      <span className="font-semibold text-white">{formatINR(gstTax)}</span>
                    </div>
                    <div className="pt-2 border-t border-white/10 flex justify-between items-baseline text-sm font-bold text-white">
                      <span>To Pay</span>
                      <span className="text-[#DD5903] font-mono text-lg">{formatINR(grandTotal)}</span>
                    </div>
                  </div>

                  {orderError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs" role="alert">
                      <Info className="w-4 h-4 flex-shrink-0" />
                      <span>{orderError}</span>
                    </div>
                  )}

                  {/* Place Order CTA Button */}
                  <button
                    type="submit"
                    form="desktop-checkout-form"
                    disabled={isSubmitting}
                    className="w-full dinenos-btn flex items-center justify-center gap-2 !py-3 text-xs uppercase font-bold tracking-wider shadow-xl cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isSubmitting ? 'Submitting Order...' : `Proceed to Order (${formatINR(grandTotal, { whole: true })})`}</span>
                  </button>

                </div>
              )}

            </div>
          </div>

        </div>
      </div>

      {/* ================= MOBILE STICKY BOTTOM CART BAR & SLIDE-UP DRAWER ================= */}
      {totalCartCount > 0 && !isMobileCartOpen && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#181818] border-t border-white/15 p-3.5 flex items-center justify-between shadow-2xl animate-slideUp">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#DD5903] text-white text-xs font-bold rounded-full">
                {totalCartCount} {totalCartCount === 1 ? 'item' : 'items'}
              </span>
              <span className="text-base font-bold font-mono text-white">{formatINR(grandTotal, { whole: true })}</span>
            </div>
            <p className="text-[11px] text-gray-400">{orderType === 'delivery' ? 'Delivery to Bankura Town' : 'Takeaway Pickup'}</p>
          </div>

          <button
            onClick={() => setIsMobileCartOpen(true)}
            className="dinenos-btn !py-2.5 !px-5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg cursor-pointer"
          >
            <span>View Cart</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Mobile Cart Drawer */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-[#181818] border-t border-white/15 rounded-t-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-slideUp">
            
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#1f1f1f]">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#DD5903]" />
                <h3 className="font-bold text-white text-sm">Review Online Order ({totalCartCount})</h3>
              </div>
              <button
                onClick={() => setIsMobileCartOpen(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <Trash2 className="w-4 h-4 hidden" />
                <span className="text-xs underline">Close</span>
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {/* Items List */}
              <div className="space-y-2.5">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-[#121212] p-2.5 rounded-xl border border-white/5">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                      <p className="text-[11px] text-gray-400">{formatINR(item.unitPrice, { whole: true })}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-[#1c1c1c] border border-white/20 rounded-lg">
                        <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} className="px-2 py-0.5 text-gray-400"><Minus className="w-3 h-3" /></button>
                        <span className="px-2 text-xs font-bold text-white font-mono">{item.quantity}</span>
                        <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} className="px-2 py-0.5 text-gray-400"><Plus className="w-3 h-3" /></button>
                      </div>
                      <span className="text-xs font-bold font-mono text-white">{formatINR(Number(item.unitPrice || 0) * Number(item.quantity || 1), { whole: true })}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile Checkout Form */}
              <form id="mobile-checkout-form" onSubmit={handlePlaceOrder} className="space-y-3 text-xs pt-2 border-t border-white/10">
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sourav Mukherjee"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#DD5903]"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Mobile Phone (10 Digits) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9932148058"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#DD5903]"
                  />
                </div>
                {orderType === 'delivery' && (
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">Delivery Address (Bankura Town) *</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Street, Landmark in Bankura Town..."
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[#DD5903] resize-none"
                    />
                  </div>
                )}
                {orderType === 'delivery' && (
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">Landmark (helps the rider)</label>
                    <input
                      type="text"
                      placeholder="e.g. Near Kangsabati Bridge"
                      value={deliveryLandmark}
                      onChange={(e) => setDeliveryLandmark(e.target.value)}
                      className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[#DD5903]"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Payment Method</label>
                  <div className="w-full py-2 px-3 rounded-lg border border-[#DD5903] bg-[#DD5903]/10 text-white font-bold text-xs flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>💵 Cash on Delivery (COD)</span>
                  </div>
                </div>
              </form>

              {/* Bill Details */}
              <div className="space-y-1 text-xs text-gray-400 pt-2 border-t border-white/10">
                <div className="flex justify-between"><span>Subtotal</span><span className="text-white font-semibold">{formatINR(cartSubtotal)}</span></div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400"><span>Promo Discount</span><span>-{formatINR(discountAmount)}</span></div>
                )}
                <div className="flex justify-between"><span>Tax (5% GST)</span><span className="text-white font-semibold">{formatINR(gstTax)}</span></div>
                <div className="flex justify-between font-bold text-sm text-white pt-1"><span>Total</span><span className="text-[#DD5903] font-mono">{formatINR(grandTotal)}</span></div>
              </div>
              {orderError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs" role="alert">
                  <Info className="w-4 h-4 flex-shrink-0" />
                  <span>{orderError}</span>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/10 bg-[#141414]">
              <button
                type="submit"
                form="mobile-checkout-form"
                disabled={isSubmitting}
                className="w-full dinenos-btn !py-3 text-xs font-bold uppercase tracking-wider shadow-xl cursor-pointer"
              >
                {isSubmitting ? 'Confirming...' : `Confirm & Place Order (${formatINR(grandTotal, { whole: true })})`}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
