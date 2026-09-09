import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  Truck, 
  Store, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Tag, 
  Check, 
  AlertCircle,
  Clock,
  Phone,
  User,
  MapPin,
  Sparkles
} from 'lucide-react';
import { validateCouponLive } from '../../services/couponValidator';
import { api } from '../../services/api';
import { formatINR, handleImageFallback, isValidIndianPhone } from '../../utils/formatters';

export default function CartDrawer({
  isOpen,
  onClose,
  items = [],
  cartItems = [], // fallback alias
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onOpenReservation
}) {
  const effectiveItems = items && items.length > 0 ? items : (cartItems || []);

  // Checkout Form State
  const [orderType, setOrderType] = useState('delivery'); // 'delivery' | 'takeaway' | 'dine-in'
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI' | 'COD' | 'Card'
  const [orderNotes, setOrderNotes] = useState('');
  
  // Auto-prefill customer details from session if available & listen to live updates
  useEffect(() => {
    const syncCustomerData = (s) => {
      if (!s) return;
      if (s.name && !customerName) setCustomerName(s.name);
      if (s.phone && !customerPhone) setCustomerPhone(s.phone);
      const addr = s.address || s.defaultAddress || s.notes || '';
      if (addr && !deliveryAddress) setDeliveryAddress(addr);
    };

    if (isOpen) {
      try {
        const saved = localStorage.getItem('dinenos_customer_session');
        if (saved) syncCustomerData(JSON.parse(saved));
      } catch (e) {}
    }

    const handleSessionUpdate = (e) => {
      const s = e?.detail !== undefined ? e.detail : (() => {
        try { return JSON.parse(localStorage.getItem('dinenos_customer_session')); } catch { return null; }
      })();
      if (s) {
        if (s.name) setCustomerName(s.name);
        if (s.phone) setCustomerPhone(s.phone);
        const addr = s.address || s.defaultAddress || s.notes || '';
        if (addr) setDeliveryAddress(addr);
      }
    };

    window.addEventListener('customer_session_updated', handleSessionUpdate);
    window.addEventListener('storage', handleSessionUpdate);
    return () => {
      window.removeEventListener('customer_session_updated', handleSessionUpdate);
      window.removeEventListener('storage', handleSessionUpdate);
    };
  }, [isOpen]);

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState('cart'); // 'cart' | 'checkout'

  // Subtotal Calculation
  const subtotal = useMemo(() => {
    return effectiveItems.reduce((acc, item) => acc + (Number(item.totalPrice) || (Number(item.price || item.unitPrice || 0) * Number(item.quantity || 1))), 0);
  }, [effectiveItems]);

  // Delivery Fee
  const deliveryFee = orderType === 'delivery' ? (subtotal >= 499 ? 0 : 30) : 0;

  // Coupon Calculation — discount comes from live-validated coupon payload
  const discountAmount = Number(appliedCoupon?.discountAmount || 0);

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const gstTax = Number((taxableAmount * 0.05).toFixed(2)); // 5% GST
  const grandTotal = Number((taxableAmount + gstTax + deliveryFee).toFixed(2));
  const totalItemCount = effectiveItems.reduce((a, b) => a + (b.quantity || 1), 0);

  // Apply Coupon Handler — live via POST /api/coupons/validate
  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    if (!couponCode.trim() || isValidatingCoupon) return;

    const code = couponCode.trim().toUpperCase();
    setIsValidatingCoupon(true);
    const result = await validateCouponLive(api, {
      couponCode: code,
      subtotal,
      orderType,
      cartItems: effectiveItems.map((i) => ({
        productId: i.productId || i.id,
        name: i.name,
        category: i.category,
        quantity: i.quantity || 1,
        price: Number(i.unitPrice ?? i.price ?? 0)
      }))
    });
    setIsValidatingCoupon(false);

    if (result.isValid) {
      setAppliedCoupon({ ...(result.coupon || {}), code, discountAmount: result.discountAmount });
      setCouponError('');
    } else {
      setAppliedCoupon(null);
      setCouponError(result.error || 'Invalid or expired coupon code.');
    }
  };

  const handlePlaceOrderSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (effectiveItems.length === 0) return;

    if (!customerName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    if (!isValidIndianPhone(customerPhone)) {
      setFormError('Please enter a valid 10-digit phone number.');
      return;
    }
    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      setFormError('Please enter your delivery address for this order.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (onCheckout) {
        await onCheckout({
          orderType,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          deliveryAddress: orderType === 'delivery' ? deliveryAddress.trim() : null,
          paymentMethod,
          couponCode: appliedCoupon ? appliedCoupon.code : null,
          discountAmount,
          notes: orderNotes.trim() + (orderType === 'delivery' ? ` [Delivery to: ${deliveryAddress.trim()}]` : ' [Takeaway / Online Order]')
        });
      }
      setStep('cart');
      setCustomerName('');
      setCustomerPhone('');
      setDeliveryAddress('');
      setOrderNotes('');
      setAppliedCoupon(null);
      setCouponCode('');
      setFormError('');
    } catch (err) {
      setFormError(err?.message ? `Could not place order: ${err.message}` : 'Could not place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Dark Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-[#141414] text-white shadow-2xl border-l border-white/10 flex flex-col justify-between overflow-hidden">
          
          {/* Drawer Header */}
          <div className="p-5 sm:p-6 border-b border-white/10 bg-[#181818] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#DD5903]/20 border border-[#DD5903]/40 text-[#DD5903] flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold font-['Arapey',serif] text-white tracking-wide">
                  {step === 'cart' ? 'Online Order Cart' : 'Online Order Checkout'}
                </h3>
                <p className="text-[11px] text-gray-400">
                  Petuk Adda Cafe • {orderType === 'delivery' ? 'Delivery (Bankura Town)' : orderType === 'takeaway' ? 'Takeaway Pickup' : 'Dine-In'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
            
            {/* Empty Cart State */}
            {effectiveItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-16 space-y-4">
                <div className="w-20 h-20 rounded-full bg-[#1c1c1c] border border-white/10 flex items-center justify-center text-[#DD5903] shadow-inner">
                  <ShoppingBag className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white font-['Arapey',serif]">Your cart is empty</h4>
                  <p className="text-xs text-gray-400 max-w-xs mt-1 leading-relaxed">
                    Explore our artisanal coffees, fresh snacks, and meals to start your online order.
                  </p>
                </div>
                <a
                  href="#menu"
                  onClick={onClose}
                  className="dinenos-btn !py-2.5 !px-6 text-xs uppercase tracking-wider font-bold shadow-lg mt-2"
                >
                  Explore Petuk Adda Menu
                </a>
              </div>
            ) : step === 'cart' ? (
              /* Step 1: Cart Items List & Order Type Selector */
              <div className="space-y-5">
                
                {/* Order Type Toggle (Delivery vs Takeaway) */}
                <div className="bg-[#1c1c1c] p-1.5 rounded-xl border border-white/10 grid grid-cols-3 gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setOrderType('delivery')}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                      orderType === 'delivery'
                        ? 'bg-[#DD5903] text-white shadow-md'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Delivery</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('takeaway')}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                      orderType === 'takeaway'
                        ? 'bg-[#DD5903] text-white shadow-md'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Takeaway</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('dine-in')}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                      orderType === 'dine-in'
                        ? 'bg-[#DD5903] text-white shadow-md'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Dine-In</span>
                  </button>
                </div>

                {orderType === 'delivery' && (
                  <div className="p-3 bg-orange-500/10 border border-[#DD5903]/30 rounded-xl flex items-center gap-2.5 text-xs text-orange-300">
                    <Truck className="w-4 h-4 text-[#DD5903] flex-shrink-0" />
                    <span>
                      Delivery available across <strong>Bankura Town</strong>. Free delivery on orders above ₹499!
                    </span>
                  </div>
                )}

                {/* Items List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-400 uppercase tracking-wider font-semibold">
                    <span>Ordered Items ({totalItemCount})</span>
                    <span>Price</span>
                  </div>

                  {effectiveItems.map((item) => {
                    const itemId = item.cartItemId || item.id;
                    const itemQty = item.quantity || 1;
                    const itemPrice = Number(item.totalPrice) || (Number(item.price || item.unitPrice || 0) * itemQty);
                    const unitPrice = Number(item.unitPrice || item.price || 0);

                    return (
                      <div
                        key={itemId}
                        className="bg-[#1c1c1c] border border-white/5 hover:border-white/15 p-3 sm:p-3.5 rounded-xl flex items-center justify-between gap-3.5 transition-all"
                      >
                        {/* Image */}
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-black flex-shrink-0 relative border border-white/5">
                          <img
                            src={item.image || 'https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/03/latte.jpg'}
                            alt={item.name}
                            loading="lazy"
                            onError={handleImageFallback}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-white truncate font-['Plus_Jakarta_Sans',sans-serif]">
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs font-semibold text-[#DD5903]">
                              {formatINR(unitPrice, { whole: true })}
                            </span>
                            {item.variant && item.variant !== 'Standard' && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-gray-300">
                                {typeof item.variant === 'object' ? item.variant.name : item.variant}
                              </span>
                            )}
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center border border-white/20 rounded-lg bg-[#111111] overflow-hidden">
                              <button
                                onClick={() => onUpdateQuantity && onUpdateQuantity(itemId, itemQty - 1)}
                                className="px-2 py-1 text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                                title="Decrease"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2.5 text-xs font-bold text-white min-w-[20px] text-center">
                                {itemQty}
                              </span>
                              <button
                                onClick={() => onUpdateQuantity && onUpdateQuantity(itemId, itemQty + 1)}
                                className="px-2 py-1 text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                                title="Increase"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              onClick={() => onRemoveItem && onRemoveItem(itemId)}
                              className="text-gray-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Total per Item */}
                        <div className="text-right flex-shrink-0">
                          <span className="text-sm font-bold font-mono text-white">
                            {formatINR(itemPrice, { whole: true })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Promo Code Input */}
                <div className="bg-[#1c1c1c] p-3.5 rounded-xl border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
                    <Tag className="w-3.5 h-3.5 text-[#DD5903]" />
                    <span>Have a Promo / Coupon Code?</span>
                  </div>
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. PETUK20"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 bg-[#121212] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white uppercase placeholder-gray-500 outline-none focus:border-[#DD5903] font-mono font-bold"
                    />
                    <button
                      type="submit"
                      disabled={isValidatingCoupon}
                      className="px-4 py-1.5 bg-[#DD5903] hover:bg-[#c44e02] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isValidatingCoupon ? 'Checking…' : 'Apply'}
                    </button>
                  </form>
                  {appliedCoupon && (
                    <div className="flex items-center justify-between text-xs text-emerald-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        "{appliedCoupon.code}" applied (-{formatINR(discountAmount)})
                      </span>
                      <button
                        type="button"
                        onClick={() => { setAppliedCoupon(null); setCouponCode(''); }}
                        className="text-gray-400 hover:text-white underline text-[11px]"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  {couponError && (
                    <p className="text-xs text-rose-400">{couponError}</p>
                  )}
                </div>

              </div>
            ) : (
              /* Step 2: Customer Details & Payment Options */
              <form id="online-checkout-form" onSubmit={handlePlaceOrderSubmit} className="space-y-4 text-xs">
                
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer font-bold pb-2"
                >
                  <span>← Back to Review Items ({totalItemCount})</span>
                </button>

                {/* Customer Contact Details */}
                <div className="bg-[#1c1c1c] p-4 rounded-xl border border-white/10 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#DD5903]">
                    1. Contact Information
                  </h4>

                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Your Full Name *</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sourav Mukherjee"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-[#121212] border border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs text-white placeholder-gray-500 outline-none focus:border-[#DD5903]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Phone Number (For Order Tracking & SMS) *</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9932148058"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full bg-[#121212] border border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs text-white placeholder-gray-500 outline-none focus:border-[#DD5903]"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Address (If delivery selected) */}
                {orderType === 'delivery' && (
                  <div className="bg-[#1c1c1c] p-4 rounded-xl border border-white/10 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#DD5903]">
                      2. Delivery Address (Bankura Town)
                    </h4>
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">Street Address / Landmark *</label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <textarea
                          rows={2}
                          required
                          placeholder="House/Flat No., Street, Landmark in Bankura Town..."
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          className="w-full bg-[#121212] border border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs text-white placeholder-gray-500 outline-none focus:border-[#DD5903] resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Method Selector */}
                <div className="bg-[#1c1c1c] p-4 rounded-xl border border-white/10 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#DD5903]">
                    {orderType === 'delivery' ? '3.' : '2.'} Payment Method
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label
                      className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center transition-all ${
                        paymentMethod === 'UPI'
                          ? 'bg-[#DD5903]/15 border-[#DD5903] text-white'
                          : 'bg-[#121212] border-white/10 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'UPI'}
                        onChange={() => setPaymentMethod('UPI')}
                        className="hidden"
                      />
                      <QrCode className="w-4 h-4 text-[#DD5903]" />
                      <span className="font-bold text-xs">UPI / GPay</span>
                      <span className="text-[10px] text-gray-400">Scan & Pay</span>
                    </label>

                    <label
                      className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center transition-all ${
                        paymentMethod === 'COD'
                          ? 'bg-[#DD5903]/15 border-[#DD5903] text-white'
                          : 'bg-[#121212] border-white/10 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'COD'}
                        onChange={() => setPaymentMethod('COD')}
                        className="hidden"
                      />
                      <Banknote className="w-4 h-4 text-[#DD5903]" />
                      <span className="font-bold text-xs">Cash on Delivery</span>
                      <span className="text-[10px] text-gray-400">Pay at Door</span>
                    </label>

                    <label
                      className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center transition-all ${
                        paymentMethod === 'Card'
                          ? 'bg-[#DD5903]/15 border-[#DD5903] text-white'
                          : 'bg-[#121212] border-white/10 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'Card'}
                        onChange={() => setPaymentMethod('Card')}
                        className="hidden"
                      />
                      <CreditCard className="w-4 h-4 text-[#DD5903]" />
                      <span className="font-bold text-xs">Card / POS</span>
                      <span className="text-[10px] text-gray-400">Credit / Debit</span>
                    </label>
                  </div>
                </div>

                {/* Special Instructions */}
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Cooking / Delivery Instructions (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Less sugar in latte, extra hot, call on arrival..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-[#DD5903]"
                  />
                </div>

              </form>
            )}

          </div>

          {/* Drawer Footer & Action Bar */}
          {effectiveItems.length > 0 && (
            <div className="p-5 sm:p-6 border-t border-white/10 bg-[#121212] space-y-3.5">
              
              {/* Order Price Breakdown */}
              <div className="space-y-1.5 text-xs text-gray-400">
                <div className="flex justify-between">
                  <span>Subtotal ({totalItemCount} items)</span>
                  <span className="font-semibold text-white">{formatINR(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-medium">
                    <span>Coupon Discount</span>
                    <span>-{formatINR(discountAmount)}</span>
                  </div>
                )}
                {orderType === 'delivery' && (
                  <div className="flex justify-between">
                    <span>Delivery Charges (Bankura Town)</span>
                    <span className="font-semibold text-white">
                      {deliveryFee === 0 ? <span className="text-emerald-400 font-bold">FREE</span> : formatINR(deliveryFee)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>GST Tax (5%)</span>
                  <span className="font-semibold text-white">{formatINR(gstTax)}</span>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between items-baseline text-base font-bold text-white">
                  <span className="font-['Arapey',serif] text-lg">Grand Total</span>
                  <span className="text-[#DD5903] font-mono text-xl">{formatINR(grandTotal)}</span>
                </div>
              </div>

              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs" role="alert">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Action Buttons */}
              {step === 'cart' ? (
                <button
                  type="button"
                  onClick={() => setStep('checkout')}
                  className="w-full dinenos-btn flex items-center justify-center gap-2 !py-3.5 !text-sm uppercase tracking-wider font-bold shadow-xl cursor-pointer"
                >
                  <span>Proceed to Online Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  form="online-checkout-form"
                  disabled={isSubmitting}
                  className="w-full dinenos-btn flex items-center justify-center gap-2 !py-3.5 !text-sm uppercase tracking-wider font-bold shadow-xl cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSubmitting ? 'Confirming Order...' : `Confirm & Place Order (${formatINR(grandTotal, { whole: true })})`}</span>
                </button>
              )}

              <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                <span>⚡ Live Kitchen Order Tracking</span>
                <span>🔒 Secure Online Ordering</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
