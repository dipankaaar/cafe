import React, { useState, useEffect, useMemo } from 'react';
import { 
  QrCode, 
  ShoppingBag, 
  Search, 
  Plus, 
  Minus, 
  X, 
  Check, 
  Clock, 
  ChefHat, 
  CheckCircle2, 
  AlertCircle, 
  Flame, 
  Leaf, 
  Tag, 
  Coffee, 
  ChevronRight, 
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Phone,
  User,
  CreditCard,
  Banknote
} from 'lucide-react';
import { useCafe } from '../../context/CafeContext';
import { api } from '../../services/api';
import { useSSE } from '../../hooks/useSSE';

export default function QrTableOrderingView({ qrToken, onBackToStorefront }) {
  const { products, categories, addons, cafeSettings, placeOrder } = useCafe();

  // Table Validation State
  const [tableInfo, setTableInfo] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [isValidating, setIsValidating] = useState(true);

  // Menu Navigation & Search
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);

  // Customization Modal State
  const [selectedProductForCustomization, setSelectedProductForCustomization] = useState(null);
  const [customVariant, setCustomVariant] = useState(null);
  const [customAddons, setCustomAddons] = useState([]);
  const [customSpecialInstructions, setCustomSpecialInstructions] = useState('');
  const [customQuantity, setCustomQuantity] = useState(1);

  // Cart State (Specific to this Table)
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Pay at Counter');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Placed Order / Tracking State
  const [activeTrackingOrder, setActiveTrackingOrder] = useState(null);
  const [sessionOrders, setSessionOrders] = useState([]);
  const [showSessionOrdersModal, setShowSessionOrdersModal] = useState(false);

  // Validate QR Token on Mount
  const validateToken = async () => {
    try {
      setIsValidating(true);
      setValidationError('');
      const res = await api.validateQrToken(qrToken);
      if (res.valid && res.table) {
        setTableInfo(res.table);
        setSessionOrders(res.table.activeOrders || []);
      } else {
        setValidationError('Invalid QR code format.');
      }
    } catch (err) {
      setValidationError(err.message || 'Ordering from this table is currently unavailable.');
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    if (qrToken) {
      validateToken();
    }
  }, [qrToken]);

  // Real-Time SSE Listener for Order Status Changes
  useSSE((event) => {
    if (event.type === 'ORDER_STATUS_CHANGED') {
      if (activeTrackingOrder && activeTrackingOrder.orderNumber === event.data.orderNumber) {
        setActiveTrackingOrder(prev => ({ ...prev, status: event.data.status }));
      }
      // Update session orders
      setSessionOrders(prev => prev.map(o => o.orderNumber === event.data.orderNumber ? { ...o, status: event.data.status } : o));
    }
  });

  // Filter Central Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory || p.categoryId === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesVeg = !vegOnly || p.isVeg;
      return matchesCategory && matchesSearch && matchesVeg && p.isAvailable;
    });
  }, [products, selectedCategory, searchQuery, vegOnly]);

  // Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [cart]);

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const taxRate = cafeSettings?.taxRate || 5.0; // 5% GST
  const taxableAmount = Math.max(0, cartSubtotal - discountAmount);
  const taxAmount = (taxableAmount * taxRate) / 100;
  const cartGrandTotal = Math.max(0, taxableAmount + taxAmount);
  const totalCartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Customization Open
  const handleOpenCustomization = (product) => {
    setSelectedProductForCustomization(product);
    setCustomVariant(product.variants && product.variants.length > 0 ? product.variants[0] : null);
    setCustomAddons([]);
    setCustomSpecialInstructions('');
    setCustomQuantity(1);
  };

  // Add Customized Item to Cart
  const handleAddToCart = () => {
    if (!selectedProductForCustomization) return;

    const basePrice = selectedProductForCustomization.sellingPrice || selectedProductForCustomization.price || 0;
    const variantDelta = customVariant ? customVariant.priceDelta || 0 : 0;
    const addonsTotal = customAddons.reduce((sum, a) => sum + (a.price || 0), 0);
    const unitPrice = basePrice + variantDelta + addonsTotal;
    const totalPrice = unitPrice * customQuantity;

    const cartItem = {
      cartItemId: `${selectedProductForCustomization.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      productId: selectedProductForCustomization.id,
      name: selectedProductForCustomization.name,
      image: selectedProductForCustomization.image || selectedProductForCustomization.imageUrl,
      basePrice,
      variant: customVariant,
      addons: customAddons,
      specialInstructions: customSpecialInstructions,
      unitPrice,
      quantity: customQuantity,
      totalPrice
    };

    setCart(prev => [...prev, cartItem]);
    setSelectedProductForCustomization(null);
  };

  const handleUpdateCartQuantity = (cartItemId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.cartItemId === cartItemId) {
        const nextQty = item.quantity + delta;
        if (nextQty <= 0) return null;
        return {
          ...item,
          quantity: nextQty,
          totalPrice: item.unitPrice * nextQty
        };
      }
      return item;
    }).filter(Boolean));
  };

  // Coupon Validation
  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setIsApplyingCoupon(true);
    setCouponError('');
    try {
      const res = await api.validateCoupon({
        couponCode: couponCode.trim(),
        subtotal: cartSubtotal,
        orderType: 'dine-in'
      });
      if (res.isValid) {
        setAppliedCoupon(res);
      } else {
        setCouponError(res.message || 'Invalid coupon');
        setAppliedCoupon(null);
      }
    } catch (err) {
      setCouponError(err.message || 'Invalid coupon code');
      setAppliedCoupon(null);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // Submit QR Table Order
  const handlePlaceOrder = async () => {
    if (cart.length === 0 || !tableInfo || isSubmittingOrder) return;

    try {
      setIsSubmittingOrder(true);

      const orderPayload = {
        orderType: 'dine-in',
        orderSource: 'QR_TABLE',
        qrToken: qrToken,
        tableId: tableInfo.id,
        tableNumber: tableInfo.tableNumber,
        customerName: customerName.trim() || `Guest (Table ${tableInfo.tableNumber})`,
        customerPhone: customerPhone.trim(),
        items: cart.map(item => ({
          productId: item.productId,
          name: item.name,
          variant: item.variant ? item.variant.name : null,
          addons: item.addons.map(a => a.name),
          specialInstructions: item.specialInstructions,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          totalPrice: item.totalPrice
        })),
        subtotal: cartSubtotal,
        discountAmount: discountAmount,
        couponCode: appliedCoupon ? appliedCoupon.couponCode : null,
        taxAmount: taxAmount,
        grandTotal: cartGrandTotal,
        paymentMethod: paymentMethod,
        paymentStatus: 'Pending',
        serverStaff: `QR Self-Order (${tableInfo.tableNumber})`
      };

      const created = await api.createOrder(orderPayload);

      // Successfully placed!
      setActiveTrackingOrder(created);
      setSessionOrders(prev => [created, ...prev]);
      setCart([]);
      setIsCartOpen(false);
      setAppliedCoupon(null);
      setCouponCode('');
    } catch (err) {
      alert('Failed to place order: ' + err.message);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // ================= LOADING STATE =================
  if (isValidating) {
    return (
      <div className="min-h-screen bg-[#111111] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full border-4 border-orange-500/20 border-t-[#DD5903] animate-spin mb-4" />
        <h2 className="text-xl font-bold font-serif">Connecting to Table...</h2>
        <p className="text-sm text-gray-400 mt-1">Verifying secure QR table authentication</p>
      </div>
    );
  }

  // ================= ERROR STATE =================
  if (validationError || !tableInfo) {
    return (
      <div className="min-h-screen bg-[#111111] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white font-serif mb-2">Ordering Unavailable</h2>
        <p className="text-sm text-gray-400 max-w-md mb-6">{validationError || 'This QR code is invalid, expired, or ordering is currently disabled for this table.'}</p>
        <button
          onClick={onBackToStorefront}
          className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-bold transition-all"
        >
          Return to Cafe Home
        </button>
      </div>
    );
  }

  // ================= ACTIVE ORDER TRACKING TIMELINE SCREEN =================
  if (activeTrackingOrder) {
    const statusSteps = ['Placed', 'Accepted', 'Preparing', 'Ready', 'Completed'];
    const currentStatus = activeTrackingOrder.status || 'Placed';
    let activeIdx = 0;
    if (['New', 'Placed'].includes(currentStatus)) activeIdx = 0;
    else if (currentStatus === 'Accepted') activeIdx = 1;
    else if (['Preparing', 'Brewing'].includes(currentStatus)) activeIdx = 2;
    else if (currentStatus === 'Ready') activeIdx = 3;
    else if (currentStatus === 'Completed') activeIdx = 4;

    return (
      <div className="min-h-screen bg-[#141414] text-white pb-20">
        
        {/* Header */}
        <div className="bg-[#1c1c1c] border-b border-white/10 px-4 py-4 sticky top-0 z-30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#DD5903]/20 text-[#DD5903] flex items-center justify-center font-bold">
              {tableInfo.tableNumber}
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Table {tableInfo.tableNumber}</h1>
              <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Live Kitchen Order Tracker
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTrackingOrder(null)}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#DD5903] text-white rounded-full text-xs font-bold shadow-md cursor-pointer hover:bg-[#c44e02]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Order More</span>
          </button>
        </div>

        {/* Order Card Container */}
        <div className="max-w-md mx-auto p-4 space-y-5">
          
          {/* Order Header Card */}
          <div className="bg-[#1F1F1F] border border-white/10 rounded-2xl p-5 text-center relative overflow-hidden shadow-xl">
            <div className="inline-block px-3 py-1 rounded-full bg-orange-500/10 text-[#DD5903] font-mono font-bold text-xs mb-2">
              #{activeTrackingOrder.orderNumber}
            </div>
            <h2 className="text-2xl font-bold text-white font-serif">Table {tableInfo.tableNumber}</h2>
            <p className="text-xs text-gray-400 mt-1">Placed at {new Date(activeTrackingOrder.orderTime || Date.now()).toLocaleTimeString()}</p>
            
            {/* Status Highlight */}
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-sm">
              <ChefHat className="w-4 h-4 animate-bounce" />
              <span>Status: {currentStatus}</span>
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="bg-[#1F1F1F] border border-white/10 rounded-2xl p-5 shadow-lg">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Preparation Progress</h3>
            <div className="space-y-4">
              {statusSteps.map((step, idx) => {
                const isPassed = idx <= activeIdx;
                const isCurrent = idx === activeIdx;

                return (
                  <div key={step} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCurrent 
                        ? 'bg-[#DD5903] text-white ring-4 ring-orange-500/20 animate-pulse'
                        : isPassed 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-gray-800 text-gray-500'
                    }`}>
                      {isPassed ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <span className={`text-xs font-bold ${isCurrent ? 'text-[#DD5903]' : isPassed ? 'text-white' : 'text-gray-500'}`}>
                        {step === 'Placed' ? 'Order Submitted' : step === 'Accepted' ? 'Kitchen Received' : step === 'Preparing' ? 'Brewing & Baking' : step === 'Ready' ? 'Ready to Serve' : 'Delivered & Completed'}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] bg-orange-500/20 text-[#DD5903] px-2 py-0.5 rounded-full font-bold">In Progress</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ordered Items Summary */}
          <div className="bg-[#1F1F1F] border border-white/10 rounded-2xl p-5 shadow-lg">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Order Summary</h3>
            <div className="divide-y divide-white/5 space-y-2">
              {activeTrackingOrder.items && activeTrackingOrder.items.map((item, idx) => (
                <div key={idx} className="pt-2 flex items-start justify-between text-xs">
                  <div>
                    <span className="font-bold text-white">{item.quantity}x {item.name}</span>
                    {item.variant && <span className="text-gray-400 block text-[11px]">• {item.variant}</span>}
                    {item.addons && item.addons.length > 0 && (
                      <span className="text-gray-400 block text-[10px]">• Addons: {item.addons.join(', ')}</span>
                    )}
                  </div>
                  <span className="font-bold text-gray-200">₹{(item.totalPrice || item.unitPrice * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 mt-3 pt-3 flex justify-between text-sm font-bold">
              <span>Total Bill</span>
              <span className="text-[#DD5903]">₹{activeTrackingOrder.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => setActiveTrackingOrder(null)}
              className="w-full py-3 bg-[#DD5903] hover:bg-[#c44e02] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Order More Drinks or Food for Table {tableInfo.tableNumber}</span>
            </button>

            {sessionOrders.length > 1 && (
              <button
                onClick={() => setShowSessionOrdersModal(true)}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-white/10 transition-all cursor-pointer"
              >
                <span>View All Table {tableInfo.tableNumber} Orders ({sessionOrders.length})</span>
              </button>
            )}
          </div>

        </div>

      </div>
    );
  }

  // ================= MAIN CUSTOMER ORDERING INTERFACE =================
  return (
    <div className="min-h-screen bg-[#111111] text-gray-200 pb-28 selection:bg-[#DD5903] selection:text-white">
      
      {/* Top Banner Header */}
      <header className="bg-[#181818]/90 backdrop-blur-md border-b border-white/10 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 text-[#DD5903] flex items-center justify-center font-bold text-sm shadow-xs">
              {tableInfo.tableNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Table {tableInfo.tableNumber}</span>
                <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded-full font-semibold">
                  {tableInfo.zone}
                </span>
              </div>
              <p className="text-[11px] text-gray-400">Dinenos Coffee House • Digital Self-Order</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {sessionOrders.length > 0 && (
              <button
                onClick={() => setActiveTrackingOrder(sessionOrders[0])}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 border border-orange-500/30 text-[#DD5903] rounded-full text-xs font-bold transition-all cursor-pointer animate-pulse"
                title="Track active orders"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Track ({sessionOrders.length})</span>
              </button>
            )}
            
            <button
              onClick={onBackToStorefront}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
              title="Exit to home"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        </div>
      </header>

      {/* Search & Dietary Filter */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <div className="flex items-center gap-3 bg-[#1A1A1A] border border-white/10 rounded-xl p-2 px-3">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search espresso, cold brew, croissant, pizza..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder-gray-500 outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => setVegOnly(!vegOnly)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
              vegOnly ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-white/5 text-gray-400'
            }`}
          >
            <Leaf className="w-3 h-3" />
            <span>Veg</span>
          </button>
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="max-w-4xl mx-auto px-4 py-3 sticky top-[57px] bg-[#111111]/95 backdrop-blur-md z-20 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#DD5903] text-white shadow-md'
                : 'bg-[#1C1C1C] text-gray-400 hover:text-white border border-white/5'
            }`}
          >
            All Items
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#DD5903] text-white shadow-md'
                  : 'bg-[#1C1C1C] text-gray-400 hover:text-white border border-white/5'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <main className="max-w-4xl mx-auto px-4 pt-2">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <Coffee className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-gray-300">No menu items found</h3>
            <p className="text-xs text-gray-500 mt-1">Try searching for a different item or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredProducts.map(product => {
              const price = product.sellingPrice || product.price || 0;
              const hasVariants = product.variants && product.variants.length > 1;

              return (
                <div
                  key={product.id}
                  onClick={() => handleOpenCustomization(product)}
                  className="bg-[#1A1A1A] border border-white/5 hover:border-[#DD5903]/40 rounded-2xl p-3.5 flex gap-3.5 transition-all shadow-xs hover:shadow-md cursor-pointer group"
                >
                  {/* Product Image */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-black flex-shrink-0 relative">
                    <img
                      src={product.image || product.imageUrl || 'https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/03/latte.jpg'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.isVeg ? (
                      <span className="absolute top-1.5 left-1.5 w-4 h-4 bg-white rounded flex items-center justify-center p-0.5 shadow">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 block"></span>
                      </span>
                    ) : (
                      <span className="absolute top-1.5 left-1.5 w-4 h-4 bg-white rounded flex items-center justify-center p-0.5 shadow">
                        <span className="w-2 h-2 rounded-full bg-rose-600 block"></span>
                      </span>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-[#DD5903] transition-colors leading-snug">
                        {product.name}
                      </h4>
                      <p className="text-[11px] text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                      <div>
                        <span className="text-sm font-extrabold text-[#DD5903]">₹{price.toFixed(2)}</span>
                        {hasVariants && <span className="text-[10px] text-gray-500 block">Customizable</span>}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCustomization(product);
                        }}
                        className="px-3 py-1.5 bg-[#DD5903] hover:bg-[#c44e02] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ================= STICKY BOTTOM CART BAR ================= */}
      {totalCartItemCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto z-40 animate-in slide-in-from-bottom duration-300">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-gradient-to-r from-[#DD5903] to-[#e66c1f] hover:from-[#c44e02] hover:to-[#DD5903] text-white p-3.5 px-5 rounded-2xl shadow-2xl flex items-center justify-between font-bold text-sm transition-transform active:scale-98 cursor-pointer border border-white/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-xs">
                {totalCartItemCount}
              </div>
              <div className="text-left">
                <span className="block text-xs uppercase tracking-wider text-white/80">Table {tableInfo.tableNumber} Cart</span>
                <span className="text-sm font-extrabold">₹{cartGrandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide">
              <span>View Cart & Order</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* ================= CUSTOMIZATION MODAL ================= */}
      {selectedProductForCustomization && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#1C1C1C] border border-white/10 w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
            
            {/* Modal Header */}
            <div className="relative h-44 sm:h-52 bg-black flex-shrink-0">
              <img
                src={selectedProductForCustomization.image || selectedProductForCustomization.imageUrl}
                alt={selectedProductForCustomization.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedProductForCustomization(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#1C1C1C] via-[#1C1C1C]/80 to-transparent p-4 pt-10">
                <h3 className="text-lg font-bold text-white">{selectedProductForCustomization.name}</h3>
                <p className="text-xs text-gray-400 line-clamp-1">{selectedProductForCustomization.description}</p>
              </div>
            </div>

            {/* Customization Options */}
            <div className="p-5 space-y-5 flex-1 overflow-y-auto">
              
              {/* Variants / Sizes */}
              {selectedProductForCustomization.variants && selectedProductForCustomization.variants.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                    Select Size / Variant
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedProductForCustomization.variants.map(v => {
                      const isSelected = customVariant && customVariant.id === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setCustomVariant(v)}
                          className={`p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'border-[#DD5903] bg-orange-500/10 text-white'
                              : 'border-white/10 bg-[#161616] text-gray-400 hover:text-white'
                          }`}
                        >
                          <span>{v.name}</span>
                          {v.priceDelta > 0 && (
                            <span className="text-[#DD5903] font-bold">+₹{v.priceDelta}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Addons / Milk Upgrades / Syrups */}
              {addons && addons.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                    Custom Modifiers & Addons
                  </label>
                  <div className="space-y-1.5">
                    {addons.map(addon => {
                      const isChecked = customAddons.some(a => a.id === addon.id);
                      return (
                        <button
                          key={addon.id}
                          type="button"
                          onClick={() => {
                            if (isChecked) {
                              setCustomAddons(prev => prev.filter(a => a.id !== addon.id));
                            } else {
                              setCustomAddons(prev => [...prev, addon]);
                            }
                          }}
                          className={`w-full p-2.5 px-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                            isChecked
                              ? 'border-[#DD5903] bg-orange-500/10 text-white'
                              : 'border-white/5 bg-[#161616] text-gray-400 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                              isChecked ? 'bg-[#DD5903] border-[#DD5903] text-white' : 'border-gray-600'
                            }`}>
                              {isChecked && <Check className="w-3 h-3" />}
                            </div>
                            <span>{addon.name}</span>
                          </div>
                          <span className="text-[#DD5903]">+₹{addon.price}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Special Cooking Instructions */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  Kitchen Notes / Special Request
                </label>
                <input
                  type="text"
                  placeholder="e.g. Extra hot, less ice, oat milk foam, no sugar"
                  value={customSpecialInstructions}
                  onChange={(e) => setCustomSpecialInstructions(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[#DD5903]"
                />
              </div>

            </div>

            {/* Modal Footer (Qty + Add to Cart) */}
            <div className="p-4 border-t border-white/10 bg-[#161616] flex items-center justify-between gap-4">
              {/* Quantity Counter */}
              <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setCustomQuantity(Math.max(1, customQuantity - 1))}
                  className="w-8 h-8 rounded-lg bg-white/5 text-white flex items-center justify-center hover:bg-white/10"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-bold text-xs px-2 text-white">{customQuantity}</span>
                <button
                  type="button"
                  onClick={() => setCustomQuantity(customQuantity + 1)}
                  className="w-8 h-8 rounded-lg bg-white/5 text-white flex items-center justify-center hover:bg-white/10"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add to Cart Submit */}
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 py-3 bg-[#DD5903] hover:bg-[#c44e02] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  Add to Table {tableInfo.tableNumber} (₹
                  {(((selectedProductForCustomization.sellingPrice || 0) + (customVariant ? customVariant.priceDelta : 0) + customAddons.reduce((sum, a) => sum + (a.price || 0), 0)) * customQuantity).toFixed(2)}
                  )
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= TABLE-SPECIFIC CART DRAWER ================= */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="bg-[#1C1C1C] border-l border-white/10 w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#161616]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#DD5903] text-white font-bold flex items-center justify-center text-xs">
                  {tableInfo.tableNumber}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Table {tableInfo.tableNumber} Order</h3>
                  <p className="text-[11px] text-gray-400">{totalCartItemCount} items selected</p>
                </div>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-gray-400 hover:text-white p-2 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              {cart.map(item => (
                <div key={item.cartItemId} className="bg-[#161616] border border-white/5 rounded-xl p-3 flex gap-3">
                  <img
                    src={item.image || 'https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/03/latte.jpg'}
                    alt={item.name}
                    className="w-14 h-14 rounded-lg object-cover bg-black flex-shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="text-xs font-bold text-white">{item.name}</h5>
                        {item.variant && <span className="text-[10px] text-gray-400 block">• {item.variant.name}</span>}
                        {item.addons && item.addons.length > 0 && (
                          <span className="text-[10px] text-gray-400 block">• {item.addons.map(a => a.name).join(', ')}</span>
                        )}
                        {item.specialInstructions && (
                          <span className="text-[10px] text-amber-400/80 block italic">Note: "{item.specialInstructions}"</span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-[#DD5903]">₹{item.totalPrice.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
                      <div className="flex items-center gap-1.5 bg-black/40 rounded-lg p-0.5">
                        <button
                          onClick={() => handleUpdateCartQuantity(item.cartItemId, -1)}
                          className="w-5 h-5 rounded bg-white/5 text-white flex items-center justify-center hover:bg-white/10"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold px-1.5 text-white">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateCartQuantity(item.cartItemId, 1)}
                          className="w-5 h-5 rounded bg-white/5 text-white flex items-center justify-center hover:bg-white/10"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleUpdateCartQuantity(item.cartItemId, -item.quantity)}
                        className="text-[11px] text-red-400 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Coupon Form */}
              <div className="pt-2">
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Coupon code (e.g. WELCOME50)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 bg-[#161616] border border-white/10 rounded-xl px-3 py-2 text-xs text-white uppercase placeholder-gray-500 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isApplyingCoupon}
                    className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {isApplyingCoupon ? '...' : 'Apply'}
                  </button>
                </form>
                {couponError && <p className="text-[11px] text-red-400 mt-1">{couponError}</p>}
                {appliedCoupon && (
                  <p className="text-[11px] text-emerald-400 mt-1 font-bold">
                    ✓ Code {appliedCoupon.couponCode} applied! (-₹{appliedCoupon.discountAmount.toFixed(2)})
                  </p>
                )}
              </div>

              {/* Customer Details Form (Optional) */}
              <div className="space-y-2 pt-2 border-t border-white/10 text-xs">
                <label className="font-bold text-gray-400 block">Guest Info (Optional for Loyalty):</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-[#161616] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-[#161616] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none"
                  />
                </div>
              </div>

              {/* Payment Method Option */}
              <div className="pt-2 border-t border-white/10">
                <label className="text-xs font-bold text-gray-400 block mb-1.5">Payment Option:</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Pay at Counter', 'UPI / Online'].map(pm => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setPaymentMethod(pm)}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                        paymentMethod === pm
                          ? 'border-[#DD5903] bg-orange-500/10 text-white'
                          : 'border-white/10 bg-[#161616] text-gray-400 hover:text-white'
                      }`}
                    >
                      {pm}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Drawer Checkout Footer */}
            <div className="p-4 border-t border-white/10 bg-[#161616] space-y-3">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span>₹{cartSubtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Discount</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-400">
                  <span>GST ({taxRate}%)</span>
                  <span>₹{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-white pt-1 border-t border-white/10">
                  <span>Grand Total</span>
                  <span className="text-[#DD5903]">₹{cartGrandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/20 p-2 rounded-xl text-[11px] text-orange-200 text-center">
                🍽️ Your order will be sent directly to the kitchen for <strong>Table {tableInfo.tableNumber}</strong>.
              </div>

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isSubmittingOrder || cart.length === 0}
                className="w-full py-3.5 bg-[#DD5903] hover:bg-[#c44e02] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmittingOrder ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting Order...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Place Order for Table {tableInfo.tableNumber} (₹{cartGrandTotal.toFixed(2)})</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= SESSION ORDERS MODAL (Multiple Orders from Table) ================= */}
      {showSessionOrdersModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1C1C1C] border border-white/10 rounded-2xl max-w-md w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-white text-sm">Table {tableInfo.tableNumber} Active Sitting Orders</h3>
              <button onClick={() => setShowSessionOrdersModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 my-4 max-h-64 overflow-y-auto pr-1">
              {sessionOrders.map(order => (
                <div
                  key={order.id}
                  onClick={() => {
                    setActiveTrackingOrder(order);
                    setShowSessionOrdersModal(false);
                  }}
                  className="bg-[#161616] p-3 rounded-xl border border-white/5 hover:border-[#DD5903] transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-white text-xs block">Order #{order.orderNumber}</span>
                    <span className="text-[10px] text-gray-400">{order.items?.length || 0} items • ₹{order.grandTotal?.toFixed(2)}</span>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-orange-500/20 text-[#DD5903]">
                    {order.status}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowSessionOrdersModal(false)}
              className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
