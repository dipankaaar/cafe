import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, CheckCircle2, X, AlertCircle, Loader2, Bike, MapPin, KeyRound, Phone } from 'lucide-react';
import { api } from '../../services/api';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { formatINR } from '../../utils/formatters';
import { normalizeOrderStatus, getStatusBadgeVariant } from '../../utils/orderStatus';

const POLL_INTERVAL_MS = 5000;

export default function TrackOrderModal({ isOpen, onClose }) {
  const [orderQuery, setOrderQuery] = useState('');
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [liveState, setLiveState] = useState('idle'); // idle | polling | live
  const pollTimer = useRef(null);
  const sseRef = useRef(null);
  const trackedNumberRef = useRef('');

  const fetchOrder = useCallback(async (orderNumber, { silent = false } = {}) => {
    const clean = String(orderNumber || '').trim();
    if (!clean) return null;
    if (!silent) {
      setLoading(true);
      setError('');
    }
    try {
      const data = await api.trackOrder(clean);
      setTrackedOrder(data);
      setError('');
      return data;
    } catch (err) {
      if (!silent) {
        setTrackedOrder(null);
        setError(err?.message || 'Order not found. Please verify your order number (e.g. DIN-1001).');
      }
      return null;
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const stopLive = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
    if (sseRef.current) {
      try { sseRef.current.close(); } catch { /* noop */ }
      sseRef.current = null;
    }
    setLiveState('idle');
  }, []);

  const startLive = useCallback((orderNumber) => {
    stopLive();
    trackedNumberRef.current = orderNumber;

    // SSE first (live kitchen updates), polling as fallback
    try {
      const es = api.subscribeToEvents((event) => {
        const payloadOrderNumber =
          event?.data?.orderNumber || event?.orderNumber || '';
        if (
          (event.type === 'ORDER_STATUS_CHANGED' || event.type === 'NEW_ORDER') &&
          payloadOrderNumber &&
          payloadOrderNumber.toLowerCase() === String(orderNumber).toLowerCase()
        ) {
          setTrackedOrder((prev) => ({ ...(prev || {}), ...(event.data || {}) }));
        }
      });
      if (es) {
        sseRef.current = es;
        setLiveState('live');
      }
    } catch {
      /* SSE unavailable — polling covers it */
    }

    // Polling fallback every 5s; skipped once order is terminal
    pollTimer.current = setInterval(async () => {
      const current = trackedNumberRef.current;
      if (!current) return;
      const data = await fetchOrder(current, { silent: true });
      if (data && ['completed', 'delivered', 'cancelled', 'refunded'].includes(normalizeOrderStatus(data.status))) {
        stopLive();
        setLiveState('idle');
      }
    }, POLL_INTERVAL_MS);
    if (!sseRef.current) setLiveState('polling');
  }, [fetchOrder, stopLive]);

  useEffect(() => {
    if (!isOpen) {
      stopLive();
      return undefined;
    }
    return () => stopLive();
  }, [isOpen, stopLive]);

  useEffect(() => {
    if (trackedOrder && ['completed', 'delivered', 'cancelled', 'refunded'].includes(normalizeOrderStatus(trackedOrder.status))) {
      stopLive();
    }
  }, [trackedOrder, stopLive]);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!orderQuery.trim()) return;
    const data = await fetchOrder(orderQuery.trim());
    if (data) startLive(data.orderNumber || orderQuery.trim());
  };

  const handleClose = () => {
    stopLive();
    onClose?.();
  };

  const normStatus = trackedOrder ? normalizeOrderStatus(trackedOrder.status) : 'placed';
  const isDelivery = trackedOrder && String(trackedOrder.orderType || '').toLowerCase() === 'delivery';

  // Canonical steps (fixes legacy-key mismatch) + delivery leg for delivery orders
  const steps = isDelivery
    ? [
        { label: 'Order Placed', desc: 'Received at counter', statusKey: 'placed' },
        { label: 'Kitchen Accepted', desc: 'Order sent to chef', statusKey: 'accepted' },
        { label: 'Brewing / Cooking', desc: 'In active prep', statusKey: 'brewing' },
        { label: 'Ready to Dispatch', desc: 'Packed for delivery', statusKey: 'ready' },
        { label: 'Out for Delivery', desc: `${trackedOrder.riderName ? `Rider ${trackedOrder.riderName} is on the way` : 'Rider is on the way'}`, statusKey: 'out_for_delivery' },
        { label: 'Delivered', desc: 'Enjoy your meal!', statusKey: 'delivered' }
      ]
    : [
        { label: 'Order Placed', desc: 'Received at counter', statusKey: 'placed' },
        { label: 'Kitchen Accepted', desc: 'Order sent to chef', statusKey: 'accepted' },
        { label: 'Brewing / Cooking', desc: 'In active prep', statusKey: 'brewing' },
        { label: 'Ready to Serve', desc: 'Ready for table/pickup', statusKey: 'ready' },
        { label: 'Completed', desc: 'Order fulfilled', statusKey: 'completed' }
      ];

  const flowKeys = steps.map((s) => s.statusKey);
  const getStepIndex = (status) => flowKeys.indexOf(normalizeOrderStatus(status));

  const currentStep = trackedOrder ? getStepIndex(trackedOrder.status) : 0;
  const isTerminal = trackedOrder && ['completed', 'delivered', 'cancelled', 'refunded'].includes(normStatus);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Live Order Status Tracker"
      subtitle="Track your coffee brewing and meal preparation progress"
      size="md"
      footer={
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-5 text-xs">
        {/* Search input */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              autoFocus
              value={orderQuery}
              onChange={(e) => setOrderQuery(e.target.value.toUpperCase())}
              placeholder="Enter Order # (e.g. DIN-1001)"
              aria-label="Order number"
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-2 pl-9 pr-3 text-xs uppercase font-mono font-bold text-gray-900 dark:text-white outline-none"
            />
          </div>
          <Button type="submit" disabled={loading} size="sm">
            {loading ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Tracking…
              </span>
            ) : 'Track'}
          </Button>
        </form>

        {loading && !trackedOrder && (
          <div className="space-y-3 animate-pulse" aria-label="Loading order status">
            <div className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800" />
            <div className="space-y-2 pl-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-4 rounded bg-gray-100 dark:bg-gray-800 w-3/4" />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-600 text-xs flex items-center gap-2" role="alert">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Order tracking display */}
        {trackedOrder && (
          <div className="space-y-5 animate-fadeIn">
            {/* Header info */}
            <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-gray-500 font-mono text-[11px]">Order Number</span>
                <h4 className="text-lg font-bold font-mono text-gray-900 dark:text-white truncate">
                  {trackedOrder.orderNumber}
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Guest: {trackedOrder.customerName || 'Guest'} • {(trackedOrder.orderType || '').toUpperCase()}
                </p>
                {!isTerminal && (
                  <p className="text-[11px] mt-1 font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {liveState === 'live' ? 'Live updates connected' : 'Auto-refreshing every 5s'}
                  </p>
                )}
              </div>
              <Badge
                size="lg"
                variant={getStatusBadgeVariant(trackedOrder.status)}
              >
                {normStatus === 'out_for_delivery' ? 'Out for Delivery' : normStatus.charAt(0).toUpperCase() + normStatus.slice(1)}
              </Badge>
            </div>

            {/* Delivery leg card: address + rider + handover OTP */}
            {isDelivery && normStatus !== 'cancelled' && normStatus !== 'refunded' && (
              <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/50 space-y-2.5 text-xs">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">Delivering to</p>
                    <p className="text-gray-600 dark:text-gray-300">{trackedOrder.deliveryAddress || '—'}{trackedOrder.deliveryLandmark ? ` • ${trackedOrder.deliveryLandmark}` : ''}</p>
                  </div>
                </div>
                {(trackedOrder.riderName || normStatus === 'out_for_delivery' || normStatus === 'delivered') && (
                  <div className="flex items-start gap-2">
                    <Bike className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">Your rider</p>
                      <p className="text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                        {trackedOrder.riderName || 'Assigning…'}
                        {trackedOrder.riderPhone && (
                          <span className="inline-flex items-center gap-1 text-sky-700 dark:text-sky-300 font-semibold">
                            <Phone className="w-3 h-3" /> {trackedOrder.riderPhone}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
                {trackedOrder.deliveryOtp && (normStatus === 'out_for_delivery' || normStatus === 'delivered') && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white dark:bg-gray-900 border border-dashed border-sky-300 dark:border-sky-700">
                    <KeyRound className="w-4 h-4 text-[#DD5903] flex-shrink-0" />
                    <p className="text-gray-700 dark:text-gray-200">
                      Handover OTP: <span className="font-mono font-bold text-base tracking-[0.3em] text-[#DD5903]">{trackedOrder.deliveryOtp}</span>
                    </p>
                  </div>
                )}
                {normStatus === 'out_for_delivery' && (
                  <p className="text-[11px] text-gray-500">Share this OTP with the rider at your doorstep — the order completes only after OTP verification.</p>
                )}
              </div>
            )}

            {['cancelled', 'refunded'].includes(normStatus) ? (
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300 flex items-start gap-2">
                <X className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>This order was {normStatus}. Please contact the cafe counter for assistance or place a fresh order.</span>
              </div>
            ) : (
              <div className="py-2">
                <h5 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-[11px] mb-4">
                  Preparation Progress
                </h5>
                <div className="relative pl-6 space-y-5 border-l-2 border-gray-200 dark:border-gray-800">
                  {steps.map((step, idx) => {
                    const isDone = currentStep >= 0 && idx <= currentStep;
                    const isCurrent = idx === currentStep;

                    return (
                      <div key={idx} className="relative">
                        <div
                          className={`absolute -left-[31px] top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            isCurrent
                              ? 'bg-[#DD5903] border-[#DD5903] text-white ring-4 ring-orange-500/20'
                              : isDone
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-400'
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <span className="text-[10px] font-bold">{idx + 1}</span>
                          )}
                        </div>

                        <div>
                          <h6 className={`font-bold ${isCurrent ? 'text-[#DD5903]' : isDone ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                            {step.label}
                          </h6>
                          <p className="text-[11px] text-gray-500">{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ordered Items Summary */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2">
              <h6 className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[10px]">
                Items in this order ({(trackedOrder.items || []).length})
              </h6>
              {(trackedOrder.items || []).map((item, i) => (
                <div key={i} className="flex justify-between gap-2 text-xs">
                  <span className="text-gray-900 dark:text-white font-medium truncate">
                    {item.quantity}x {item.name} {item.variant && item.variant !== 'Standard' ? `(${typeof item.variant === 'object' ? item.variant.name : item.variant})` : ''}
                  </span>
                  <span className="font-mono text-gray-500 whitespace-nowrap">{formatINR(item.totalPrice ?? (item.price || 0) * (item.quantity || 1), { whole: true })}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between font-bold text-xs text-gray-900 dark:text-white">
                <span>Total Amount:</span>
                <span className="font-mono text-[#DD5903]">{formatINR(trackedOrder.grandTotal)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
