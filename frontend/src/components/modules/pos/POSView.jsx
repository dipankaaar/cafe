import React, { useState } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Tag,
  CreditCard,
  QrCode,
  DollarSign,
  Printer,
  User,
  Coffee,
  CheckCircle,
  X,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Receipt
} from 'lucide-react';
import { useCafe } from '../../../context/CafeContext';
import { validateAndCalculateCoupon } from '../../../services/couponValidator';
import { printOrderReceipt } from '../../../services/receiptPrinter';
import Card from '../../common/Card';
import Badge from '../../common/Badge';
import Button from '../../common/Button';
import Modal from '../../common/Modal';
import confetti from 'canvas-confetti';

export default function POSView() {
  const {
    categories,
    products,
    addons,
    tables,
    customers,
    coupons,
    settings,
    createOrder,
    updateOrderStatus,
    addCustomer
  } = useCafe();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cart state
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('dine-in');
  const [selectedTable, setSelectedTable] = useState(tables[0]?.id || '');
  const [selectedCustomer, setSelectedCustomer] = useState(customers[0]?.id || '');
  
  // Promo / Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');

  // Item customization modal
  const [customizingProduct, setCustomizingProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [itemNote, setItemNote] = useState('');

  // Payment checkout modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [amountTendered, setAmountTendered] = useState('');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [lastPlacedOrder, setLastPlacedOrder] = useState(null);

  // Quick Customer Creation modal
  const [isNewCustModalOpen, setIsNewCustModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchQuery =
      searchQuery.trim() === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery && p.isAvailable;
  });

  // Open item customization
  const handleProductClick = (product) => {
    setCustomizingProduct(product);
    setSelectedVariant(product.variants ? product.variants[0] : null);
    setSelectedAddons([]);
    setItemNote('');
  };

  // Add customized item to cart
  const handleConfirmAddToCart = () => {
    if (!customizingProduct) return;

    const variantPriceDelta = selectedVariant ? selectedVariant.priceDelta : 0;
    const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
    const unitPrice = customizingProduct.sellingPrice + variantPriceDelta + addonsTotal;

    const cartItem = {
      cartItemId: `c-item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: customizingProduct.id,
      name: customizingProduct.name,
      image: customizingProduct.image,
      category: customizingProduct.category,
      variant: selectedVariant ? selectedVariant.name : 'Standard',
      variantPriceDelta,
      addons: selectedAddons,
      unitPrice,
      quantity: 1,
      notes: itemNote,
      totalPrice: unitPrice
    };

    setCart((prev) => [...prev, cartItem]);
    setCustomizingProduct(null);
  };

  // Cart quantity controls
  const updateQuantity = (cartItemId, newQty) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId
          ? { ...item, quantity: newQty, totalPrice: item.unitPrice * newQty }
          : item
      )
    );
  };

  // Remove cart item
  const removeCartItem = (cartItemId) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  // Totals Calculation
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  // Active Customer Object
  const currentCustomerObj = customers.find((c) => c.id === selectedCustomer);

  // Validate and apply coupon
  const handleApplyCoupon = () => {
    setCouponError('');
    if (!couponCodeInput.trim()) return;

    const res = validateAndCalculateCoupon({
      couponCode: couponCodeInput,
      cartItems: cart,
      subtotal,
      orderType,
      customer: currentCustomerObj,
      allCoupons: coupons,
      existingCoupon: appliedCoupon,
      enableCouponStacking: settings.enableCouponStacking
    });

    if (res.isValid) {
      setAppliedCoupon({
        code: res.coupon.code,
        id: res.coupon.id,
        discountAmount: res.discountAmount,
        couponObj: res.coupon
      });
      setCouponCodeInput('');
      setCouponError('');
    } else {
      setCouponError(res.error);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
  };

  // Loyalty Points Discount
  const loyaltyPointsDiscount = useLoyaltyPoints && currentCustomerObj && currentCustomerObj.loyaltyPoints >= (settings.minPointsToRedeem || 50)
    ? Math.min(currentCustomerObj.loyaltyPoints * (settings.loyaltyPointRedemptionValue || 1), subtotal * 0.5)
    : 0;

  const totalDiscount = (appliedCoupon ? appliedCoupon.discountAmount : 0) + loyaltyPointsDiscount;
  const discountedSubtotal = Math.max(0, subtotal - totalDiscount);
  const taxAmount = (discountedSubtotal * (settings.taxRate || 5)) / 100;
  const serviceCharge = orderType === 'dine-in' ? (discountedSubtotal * (settings.serviceChargeRate || 2.5)) / 100 : 0;
  const grandTotal = discountedSubtotal + taxAmount + serviceCharge;

  // Selected Table Object
  const selectedTableObj = tables.find((t) => t.id === selectedTable);

  // Quick Customer Creation
  const handleCreateCustomer = (e) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;

    const created = addCustomer({
      name: newCustName,
      phone: newCustPhone,
      email: newCustEmail || `${newCustName.toLowerCase().replace(/\s+/g, '')}@guest.com`
    });

    setSelectedCustomer(created.id);
    setIsNewCustModalOpen(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustEmail('');
  };

  // Complete Order
  const handleFinalizePayment = (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const orderPayload = {
      orderType,
      tableNumber: orderType === 'dine-in' ? selectedTableObj?.tableNumber : null,
      tableId: orderType === 'dine-in' ? selectedTable : null,
      customerId: currentCustomerObj?.id || null,
      customerName: currentCustomerObj?.name || 'Walk-in Guest',
      customerPhone: currentCustomerObj?.phone || '',
      items: cart,
      subtotal,
      discountAmount: totalDiscount,
      couponCode: appliedCoupon?.code || null,
      couponId: appliedCoupon?.id || null,
      taxAmount,
      serviceCharge,
      grandTotal,
      paymentMethod,
      paymentStatus: 'Paid',
      notes: orderNotes
    };

    const newOrder = createOrder(orderPayload);
    // Mark as accepted immediately in POS
    updateOrderStatus(newOrder.id, 'Accepted');

    setLastPlacedOrder(newOrder);
    setIsPaymentModalOpen(false);
    setIsSuccessModalOpen(true);

    // Trigger celebration confetti
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 }
    });

    // Reset POS cart
    setCart([]);
    setAppliedCoupon(null);
    setUseLoyaltyPoints(false);
    setOrderNotes('');
  };

  // Print Receipt directly
  const handlePrintReceipt = () => {
    if (lastPlacedOrder) {
      printOrderReceipt(lastPlacedOrder, settings);
    }
  };

  const changeDue = Number(amountTendered) > grandTotal ? Number(amountTendered) - grandTotal : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start">
      
      {/* ================= LEFT SIDE: MENU BROWSING & PRODUCT GRID ================= */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-4">
        
        {/* Search & Category Filter Header */}
        <div className="bg-white dark:bg-[#181818] border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-xs space-y-3">
          
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search coffee, drinks, pizzas, breakfast..."
              className="w-full bg-gray-100 dark:bg-gray-800/80 border border-transparent focus:border-[#DD5903] rounded-lg py-2 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none transition-all"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#DD5903] text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              All Items ({products.filter((p) => p.isAvailable).length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#DD5903] text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => handleProductClick(product)}
              className="group bg-white dark:bg-[#181818] border border-gray-200 dark:border-gray-800 hover:border-[#DD5903] rounded-xl p-3 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-square rounded-lg overflow-hidden mb-2.5 bg-gray-100 dark:bg-gray-800">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2">
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-black ${
                        product.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                      title={product.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                    />
                  </div>
                  {product.isFeatured && (
                    <span className="absolute top-2 right-2 bg-[#DD5903] text-white text-[9px] font-bold px-1.5 py-0.2 rounded shadow-xs">
                      Popular
                    </span>
                  )}
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-[#DD5903] transition-colors">
                  {product.name}
                </h4>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                  {product.description}
                </p>
              </div>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-800/80">
                <span className="text-sm font-bold text-[#DD5903] font-mono">
                  ₹{product.sellingPrice}
                </span>
                <span className="w-6 h-6 rounded-full bg-orange-50 dark:bg-orange-950/40 text-[#DD5903] group-hover:bg-[#DD5903] group-hover:text-white flex items-center justify-center text-xs transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* ================= RIGHT SIDE: ORDER CART, COUPON & BILLING ================= */}
      <div className="lg:col-span-5 xl:col-span-4 bg-white dark:bg-[#181818] border border-gray-200 dark:border-gray-800 rounded-xl shadow-xs flex flex-col justify-between">
        
        {/* Top Controls: Order Type & Customer */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 space-y-3">
          
          {/* Order Type Toggle */}
          <div className="grid grid-cols-3 gap-1 bg-gray-100 dark:bg-gray-800/80 p-1 rounded-lg text-xs font-semibold">
            {['dine-in', 'takeaway', 'delivery'].map((type) => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={`py-1.5 rounded-md capitalize transition-colors cursor-pointer ${
                  orderType === type
                    ? 'bg-[#DD5903] text-white shadow-2xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {type === 'dine-in' ? 'Dine In' : type === 'takeaway' ? 'Takeaway' : 'Delivery'}
              </button>
            ))}
          </div>

          {/* Table Selector (Only for Dine In) */}
          {orderType === 'dine-in' && (
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex-shrink-0">
                Table:
              </label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white outline-none"
              >
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tableNumber} ({t.zone}) — {t.status}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Customer Selection & Quick Add */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white outline-none"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.tier}) • {c.loyaltyPoints} pts
                </option>
              ))}
            </select>
            <Button
              onClick={() => setIsNewCustModalOpen(true)}
              size="sm"
              variant="outline"
              className="!py-1.5 !px-2 text-xs"
              title="Add New Guest"
            >
              <User className="w-3.5 h-3.5" />
            </Button>
          </div>

        </div>

        {/* Cart Item Stream */}
        <div className="p-4 overflow-y-auto max-h-64 divide-y divide-gray-100 dark:divide-gray-800/60 space-y-2">
          {cart.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-xs font-semibold">Cart is currently empty</p>
              <p className="text-[10px] text-gray-500">Tap items on the left to start billing.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.cartItemId} className="pt-2 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                    {item.name}
                  </h5>
                  {item.variant !== 'Standard' && (
                    <span className="text-[10px] text-gray-500 block">
                      Size: {item.variant}
                    </span>
                  )}
                  {item.addons && item.addons.length > 0 && (
                    <span className="text-[10px] text-[#DD5903] block">
                      + {item.addons.map((a) => a.name).join(', ')}
                    </span>
                  )}
                  {item.notes && (
                    <span className="text-[10px] text-gray-400 italic block">
                      * {item.notes}
                    </span>
                  )}
                  <span className="text-xs font-mono font-bold text-gray-800 dark:text-gray-200 mt-1 block">
                    ₹{item.unitPrice} each
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
                    <button
                      onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2 text-xs font-bold text-gray-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-xs font-bold font-mono text-gray-900 dark:text-white w-14 text-right">
                    ₹{item.totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Coupons, Loyalty & Financial Totals */}
        <div className="p-4 bg-gray-50 dark:bg-[#141414] border-t border-gray-200 dark:border-gray-800 space-y-3">
          
          {/* Coupon input */}
          {!appliedCoupon ? (
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                  placeholder="Promo Coupon Code..."
                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs uppercase font-mono text-gray-900 dark:text-white outline-none"
                />
                <Button onClick={handleApplyCoupon} size="sm" variant="outline" className="!py-1.5 text-xs">
                  Apply
                </Button>
              </div>
              {couponError && (
                <p className="text-[10px] text-rose-500 font-semibold mt-1">{couponError}</p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50">
              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  {appliedCoupon.code} (-₹{appliedCoupon.discountAmount.toFixed(2)})
                </span>
              </div>
              <button
                onClick={removeCoupon}
                className="text-xs text-rose-500 hover:underline font-semibold"
              >
                Remove
              </button>
            </div>
          )}

          {/* Loyalty points toggle */}
          {currentCustomerObj && currentCustomerObj.loyaltyPoints >= (settings.minPointsToRedeem || 50) && (
            <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={useLoyaltyPoints}
                onChange={(e) => setUseLoyaltyPoints(e.target.checked)}
                className="rounded text-[#DD5903] focus:ring-[#DD5903]"
              />
              <span>
                Redeem <strong>{currentCustomerObj.loyaltyPoints}</strong> Loyalty Points (Save ₹{loyaltyPointsDiscount.toFixed(2)})
              </span>
            </label>
          )}

          {/* Breakdown calculation table */}
          <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-200 dark:border-gray-800">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono text-gray-900 dark:text-white">₹{subtotal.toFixed(2)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Total Discount</span>
                <span className="font-mono">-₹{totalDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>GST ({settings.taxRate}%)</span>
              <span className="font-mono text-gray-900 dark:text-white">₹{taxAmount.toFixed(2)}</span>
            </div>
            {serviceCharge > 0 && (
              <div className="flex justify-between">
                <span>Service Charge ({settings.serviceChargeRate}%)</span>
                <span className="font-mono text-gray-900 dark:text-white">₹{serviceCharge.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
              <span>Grand Total</span>
              <span className="font-mono text-[#DD5903]">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Checkout Trigger */}
          <Button
            onClick={() => setIsPaymentModalOpen(true)}
            disabled={cart.length === 0}
            fullWidth
            className="!py-3 shadow-md"
            icon={CreditCard}
          >
            Collect ₹{grandTotal.toFixed(2)}
          </Button>

        </div>

      </div>

      {/* ================= PRODUCT CUSTOMIZATION MODAL ================= */}
      {customizingProduct && (
        <Modal
          isOpen={true}
          onClose={() => setCustomizingProduct(null)}
          title={`Customize ${customizingProduct.name}`}
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setCustomizingProduct(null)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmAddToCart}>
                Add to Cart
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            
            {/* Variants selection */}
            {customizingProduct.variants && customizingProduct.variants.length > 1 && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">
                  Select Size / Variant
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {customizingProduct.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
                        selectedVariant?.id === v.id
                          ? 'border-[#DD5903] bg-orange-50 dark:bg-orange-950/40 text-[#DD5903]'
                          : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{v.name}</span>
                        {v.priceDelta > 0 && <span>+₹{v.priceDelta}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add-ons selection */}
            {addons.length > 0 && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">
                  Custom Add-ons & Milks
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {addons.map((a) => {
                    const isSelected = selectedAddons.some((sel) => sel.id === a.id);
                    return (
                      <button
                        key={a.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedAddons((prev) => prev.filter((s) => s.id !== a.id));
                          } else {
                            setSelectedAddons((prev) => [...prev, a]);
                          }
                        }}
                        className={`p-2 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#DD5903] bg-orange-50 dark:bg-orange-950/40 text-[#DD5903]'
                            : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span>{a.name}</span>
                          <span>+₹{a.price}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Item notes */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">
                Special Kitchen Preparation Notes
              </label>
              <input
                type="text"
                value={itemNote}
                onChange={(e) => setItemNote(e.target.value)}
                placeholder="e.g. Extra hot, oat milk only, no ice, extra spicy..."
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white outline-none"
              />
            </div>

          </div>
        </Modal>
      )}

      {/* ================= PAYMENT CHECKOUT MODAL ================= */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Complete Payment & Billing"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsPaymentModalOpen(false)}>
              Back
            </Button>
            <Button onClick={handleFinalizePayment} icon={CheckCircle}>
              Confirm & Generate Invoice
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Payable</p>
              <h3 className="text-2xl font-bold font-mono text-[#DD5903]">₹{grandTotal.toFixed(2)}</h3>
            </div>
            <Badge variant="primary">{orderType.toUpperCase()}</Badge>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">
              Select Payment Gateway
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { name: 'UPI', icon: QrCode },
                { name: 'Card', icon: CreditCard },
                { name: 'Cash', icon: DollarSign }
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.name;
                return (
                  <button
                    key={m.name}
                    onClick={() => setPaymentMethod(m.name)}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#DD5903] bg-[#DD5903] text-white shadow-xs font-bold'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs">{m.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Amount Tendered Calculator */}
          {paymentMethod === 'Cash' && (
            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                Cash Received from Customer:
              </label>
              <input
                type="number"
                value={amountTendered}
                onChange={(e) => setAmountTendered(e.target.value)}
                placeholder="e.g. 1000"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3.5 py-2.5 text-base font-mono font-bold text-gray-900 dark:text-white outline-none"
              />
              {changeDue > 0 && (
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 flex justify-between font-semibold text-xs">
                  <span>Change to Return:</span>
                  <span className="font-mono text-sm">₹{changeDue.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Order Level Kitchen Notes */}
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              Order Notes / Delivery Remarks
            </label>
            <textarea
              rows={2}
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="Add any table requests or packaging notes..."
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white outline-none resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* ================= ORDER SUCCESS MODAL ================= */}
      {lastPlacedOrder && (
        <Modal
          isOpen={isSuccessModalOpen}
          onClose={() => setIsSuccessModalOpen(false)}
          title="Order Successfully Placed!"
          size="sm"
          footer={
            <>
              <Button
                variant="secondary"
                icon={Printer}
                onClick={handlePrintReceipt}
              >
                Print Receipt
              </Button>
              <Button onClick={() => setIsSuccessModalOpen(false)}>
                New Sale
              </Button>
            </>
          }
        >
          <div className="text-center py-4 space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold font-mono text-gray-900 dark:text-white">
              {lastPlacedOrder.orderNumber}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Dispatched to Kitchen Display System. Inventory deducted & revenue recorded.
            </p>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-lg text-xs text-left space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Customer:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{lastPlacedOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount Paid:</span>
                <span className="font-semibold text-[#DD5903]">₹{lastPlacedOrder.grandTotal.toFixed(2)} ({lastPlacedOrder.paymentMethod})</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= QUICK NEW CUSTOMER MODAL ================= */}
      <Modal
        isOpen={isNewCustModalOpen}
        onClose={() => setIsNewCustModalOpen(false)}
        title="Quick Register Guest"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsNewCustModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCustomer}>
              Save & Select
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Full Name</label>
            <input
              type="text"
              required
              value={newCustName}
              onChange={(e) => setNewCustName(e.target.value)}
              placeholder="e.g. Maya Iyer"
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
            />
          </div>
          <div>
            <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Phone Number</label>
            <input
              type="tel"
              required
              value={newCustPhone}
              onChange={(e) => setNewCustPhone(e.target.value)}
              placeholder="+91 98000 12345"
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
            />
          </div>
          <div>
            <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Email (Optional)</label>
            <input
              type="email"
              value={newCustEmail}
              onChange={(e) => setNewCustEmail(e.target.value)}
              placeholder="maya@example.com"
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
            />
          </div>
        </form>
      </Modal>

    </div>
  );
}
