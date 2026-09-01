import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOpenReservation
}) {
  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#161616] text-white shadow-2xl border-l border-white/10 flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#DD5903]" />
              <h3 className="text-lg font-bold font-['Plus_Jakarta_Sans',sans-serif]">
                Your Order ({cartItems.reduce((a, b) => a + b.quantity, 0)})
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-12">
                <div className="w-16 h-16 rounded-full bg-[#222222] flex items-center justify-center mb-4 text-[#DD5903]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-white mb-1">Your cart is empty</h4>
                <p className="text-sm text-gray-400 max-w-xs mb-6">
                  Browse our handcrafted coffee and artisan drinks to start an order.
                </p>
                <a
                  href="#menu"
                  onClick={onClose}
                  className="dinenos-btn text-sm py-2.5 px-6"
                >
                  Explore Coffee Menu
                </a>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 bg-[#202020] p-3 rounded-lg border border-white/5"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{item.name}</h4>
                    <p className="text-xs text-[#DD5903] font-semibold mt-0.5">${item.price.toFixed(2)} each</p>
                    
                    {/* Quantity controls */}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-white/20 rounded bg-[#161616]">
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-0.5 text-gray-400 hover:text-white transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-white">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-0.5 text-gray-400 hover:text-white transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Total per line and delete */}
                  <div className="text-right flex flex-col justify-between items-end h-16 py-1">
                    <span className="text-sm font-bold text-white">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="text-gray-500 hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout Summary */}
          {cartItems.length > 0 && (
            <div className="p-6 border-t border-white/10 bg-[#121212] space-y-4">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>Subtotal</span>
                <span className="font-semibold text-white">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>Estimated Tax (8%)</span>
                <span className="font-semibold text-white">${(subtotal * 0.08).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-lg font-bold text-white pt-2 border-t border-white/10">
                <span>Total Amount</span>
                <span className="text-[#DD5903] font-mono">${(subtotal * 1.08).toFixed(2)}</span>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-2">
                <button
                  onClick={() => {
                    alert('Order submitted successfully! Your fresh brew will be ready for pickup or table service.');
                    onClearCart();
                    onClose();
                  }}
                  className="w-full dinenos-btn flex items-center justify-center gap-2 py-3 cursor-pointer shadow-lg"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onOpenReservation();
                  }}
                  className="w-full text-center text-xs text-gray-400 hover:text-white py-2 transition-colors"
                >
                  Or Book a Table to Dine In
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
