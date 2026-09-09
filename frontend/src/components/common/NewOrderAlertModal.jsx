import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  ShoppingBag, 
  X, 
  Check, 
  ArrowRight, 
  Clock, 
  Volume2, 
  VolumeX, 
  MapPin, 
  Phone, 
  ChefHat, 
  Utensils, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { playNewOrderChime, isSoundEnabled, setSoundEnabled } from '../../services/soundService';
import { formatINR } from '../../utils/formatters';

export default function NewOrderAlertModal({ 
  orderQueue = [], 
  onDismiss, 
  onAcceptOrder, 
  onNavigateToOrders 
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());

  // Keep index within bounds if queue shrinks
  useEffect(() => {
    if (currentIndex >= orderQueue.length && orderQueue.length > 0) {
      setCurrentIndex(orderQueue.length - 1);
    }
  }, [orderQueue.length, currentIndex]);

  if (!orderQueue || orderQueue.length === 0) return null;

  const currentOrder = orderQueue[currentIndex] || orderQueue[0];
  if (!currentOrder) return null;

  // Parse items safely
  let items = [];
  try {
    items = typeof currentOrder.items === 'string' 
      ? JSON.parse(currentOrder.items) 
      : (currentOrder.items || []);
  } catch (e) {
    items = [];
  }

  const isDelivery = String(currentOrder.orderType || '').toLowerCase() === 'delivery';
  const isDineIn = String(currentOrder.orderType || '').toLowerCase() === 'dine-in';

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playNewOrderChime();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
      role="dialog" 
      aria-modal="true"
      aria-labelledby="new-order-alert-title"
    >
      <div className="w-full max-w-lg bg-[#141416] border-2 border-[#DD5903] rounded-2xl shadow-[0_0_60px_rgba(221,89,3,0.35)] overflow-hidden relative text-white animate-scaleIn">
        
        {/* Glowing Top Amber Header */}
        <div className="bg-gradient-to-r from-[#DD5903] via-amber-600 to-[#DD5903] px-6 py-4 flex items-center justify-between text-white shadow-md relative overflow-hidden">
          {/* Subtle animated light sweep */}
          <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white text-[#DD5903] flex items-center justify-center shadow-md animate-bounce">
              <Bell className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="new-order-alert-title" className="text-lg font-black tracking-wider uppercase font-['Playfair_Display',serif]">
                  New Order Alert!
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold tracking-widest uppercase">
                  Live
                </span>
              </div>
              <p className="text-xs text-orange-100 font-medium">
                {orderQueue.length > 1 ? `${orderQueue.length} new orders waiting for response` : 'Incoming customer ticket'}
              </p>
            </div>
          </div>

          {/* Top Controls: Sound toggle & Close */}
          <div className="flex items-center gap-2 relative z-10">
            <button
              onClick={toggleSound}
              className={`p-2 rounded-lg text-white transition-colors cursor-pointer ${
                soundOn ? 'bg-white/20 hover:bg-white/30' : 'bg-black/30 text-white/50 hover:bg-black/50'
              }`}
              title={soundOn ? 'Chime Sound Enabled (Click to Mute)' : 'Sound Muted (Click to Enable)'}
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onDismiss(currentOrder.id)}
              className="p-2 rounded-lg bg-white/15 hover:bg-white/30 text-white transition-colors cursor-pointer"
              title="Dismiss Popup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Multi-Order Carousel Pagination (if > 1 orders) */}
        {orderQueue.length > 1 && (
          <div className="bg-[#1e1e24] px-6 py-2 border-b border-gray-800 flex items-center justify-between text-xs text-gray-400">
            <span>Ticket {currentIndex + 1} of {orderQueue.length}</span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="p-1 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentIndex === orderQueue.length - 1}
                onClick={() => setCurrentIndex((prev) => Math.min(orderQueue.length - 1, prev + 1))}
                className="p-1 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {/* Order Meta Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-gray-900/90 border border-gray-800">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Order ID</p>
              <p className="text-xl font-black text-white font-mono flex items-center gap-2">
                <span>{currentOrder.orderNumber || `#${currentOrder.id}`}</span>
              </p>
            </div>

            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Type & Table</p>
              <div className="flex items-center gap-1.5 justify-end">
                {isDineIn && (
                  <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30 flex items-center gap-1">
                    <Utensils className="w-3 h-3" />
                    Table {currentOrder.tableNumber || currentOrder.tableId || '—'}
                  </span>
                )}
                {isDelivery && (
                  <span className="px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 font-bold text-xs border border-blue-500/30 flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3" />
                    Delivery
                  </span>
                )}
                {!isDineIn && !isDelivery && (
                  <span className="px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-300 font-bold text-xs border border-purple-500/30">
                    Takeaway
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Customer info (if available) */}
          {(currentOrder.customerName || currentOrder.customerPhone || currentOrder.deliveryAddress) && (
            <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800/80 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-gray-300">
                <span className="font-bold text-white">{currentOrder.customerName || 'Walk-in Guest'}</span>
                {currentOrder.customerPhone && (
                  <a 
                    href={`tel:${currentOrder.customerPhone}`}
                    className="text-[#DD5903] hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{currentOrder.customerPhone}</span>
                  </a>
                )}
              </div>
              {isDelivery && currentOrder.deliveryAddress && (
                <div className="text-gray-400 flex items-start gap-1.5 pt-1 border-t border-gray-800/60">
                  <MapPin className="w-3.5 h-3.5 text-[#DD5903] shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{currentOrder.deliveryAddress}</span>
                </div>
              )}
            </div>
          )}

          {/* Items Summary list */}
          <div>
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span className="font-bold uppercase tracking-wider">Ordered Items</span>
              <span>{items.reduce((s, i) => s + (i.quantity || 1), 0)} items</span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {items.map((item, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-900/40 border border-gray-800/60 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-md bg-[#DD5903]/20 text-[#DD5903] font-bold flex items-center justify-center text-xs shrink-0">
                      {item.quantity || 1}x
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-200 truncate">{item.name || item.product?.name || 'Cafe Item'}</p>
                      {item.variant && typeof item.variant === 'string' && item.variant !== 'Standard' && (
                        <p className="text-[10px] text-amber-400/80 truncate">Size: {item.variant}</p>
                      )}
                    </div>
                  </div>
                  <span className="font-mono text-gray-300 font-semibold shrink-0">
                    {formatINR((item.price || item.unitPrice || 0) * (item.quantity || 1))}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Total Amount & Replay Audio pill */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-800">
            <button
              type="button"
              onClick={playNewOrderChime}
              className="text-xs text-gray-400 hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Test or Replay Chime Sound"
            >
              <Volume2 className="w-3.5 h-3.5 text-[#DD5903]" />
              <span>Replay Chime</span>
            </button>

            <div className="text-right">
              <span className="text-[11px] text-gray-400 mr-2">Grand Total:</span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                {formatINR(currentOrder.grandTotal || currentOrder.total || 0)}
              </span>
            </div>
          </div>

        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 bg-[#111113] border-t border-gray-800/80 flex items-center gap-3">
          <button
            type="button"
            onClick={() => onDismiss(currentOrder.id)}
            className="flex-1 py-2.5 px-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs transition-colors cursor-pointer text-center"
          >
            Dismiss
          </button>

          {onAcceptOrder && (
            <button
              type="button"
              onClick={() => {
                onAcceptOrder(currentOrder.id);
                onDismiss(currentOrder.id);
              }}
              className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40"
            >
              <ChefHat className="w-4 h-4" />
              <span>Accept in Kitchen</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onDismiss(currentOrder.id);
              if (onNavigateToOrders) onNavigateToOrders('orders');
            }}
            className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#DD5903] to-amber-600 hover:from-[#c44e02] hover:to-amber-700 text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-orange-950/40"
          >
            <span>View Orders</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
