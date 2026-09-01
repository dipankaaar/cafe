import React, { useState } from 'react';
import { Search, Clock, CheckCircle2, Flame, ShoppingBag, X, AlertCircle, Coffee } from 'lucide-react';
import { api } from '../../services/api';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import Button from '../common/Button';

export default function TrackOrderModal({ isOpen, onClose }) {
  const [orderQuery, setOrderQuery] = useState('');
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!orderQuery.trim()) return;

    setLoading(true);
    setError('');
    setTrackedOrder(null);

    try {
      const data = await api.trackOrder(orderQuery.trim());
      setTrackedOrder(data);
    } catch (err) {
      setError('Order not found. Please verify your invoice number (e.g. DIN-1001).');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { label: 'Order Placed', desc: 'Received at Counter', statusKey: 'New' },
    { label: 'Kitchen Accepted', desc: 'Order sent to chef', statusKey: 'Accepted' },
    { label: 'Brewing / Cooking', desc: 'In active prep', statusKey: 'Preparing' },
    { label: 'Ready to Serve', desc: 'Ready for table/pickup', statusKey: 'Ready' },
    { label: 'Completed', desc: 'Order fulfilled', statusKey: 'Completed' }
  ];

  const getStepIndex = (status) => {
    switch (status) {
      case 'New': return 0;
      case 'Accepted': return 1;
      case 'Preparing': return 2;
      case 'Ready': return 3;
      case 'Completed': return 4;
      default: return 0;
    }
  };

  const currentStep = trackedOrder ? getStepIndex(trackedOrder.status) : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Live Order Status Tracker"
      subtitle="Track your coffee brewing and meal preparation progress"
      size="md"
      footer={
        <Button variant="secondary" onClick={onClose}>
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
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-2 pl-9 pr-3 text-xs uppercase font-mono font-bold text-gray-900 dark:text-white outline-none"
            />
          </div>
          <Button type="submit" disabled={loading} size="sm">
            {loading ? 'Tracking...' : 'Track'}
          </Button>
        </form>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Order tracking display */}
        {trackedOrder && (
          <div className="space-y-5 animate-fadeIn">
            
            {/* Header info */}
            <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 flex items-center justify-between">
              <div>
                <span className="text-gray-500 font-mono text-[11px]">Invoice Number</span>
                <h4 className="text-lg font-bold font-mono text-gray-900 dark:text-white">
                  {trackedOrder.orderNumber}
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Guest: {trackedOrder.customerName} • {trackedOrder.orderType.toUpperCase()}
                </p>
              </div>
              <Badge
                size="lg"
                variant={
                  trackedOrder.status === 'Completed'
                    ? 'success'
                    : trackedOrder.status === 'Ready'
                    ? 'primary'
                    : trackedOrder.status === 'Preparing'
                    ? 'warning'
                    : 'info'
                }
              >
                {trackedOrder.status}
              </Badge>
            </div>

            {/* Stepper Progress Timeline */}
            <div className="py-2">
              <h5 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-[11px] mb-4">
                Preparation Progress
              </h5>
              <div className="relative pl-6 space-y-5 border-l-2 border-gray-200 dark:border-gray-800">
                {steps.map((step, idx) => {
                  const isDone = idx <= currentStep;
                  const isCurrent = idx === currentStep;

                  return (
                    <div key={idx} className="relative">
                      {/* Step node */}
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

            {/* Ordered Items Summary */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2">
              <h6 className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[10px]">
                Items in this ticket ({trackedOrder.items.length})
              </h6>
              {trackedOrder.items.map((item, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-gray-900 dark:text-white font-medium">
                    {item.quantity}x {item.name} {item.variant !== 'Standard' ? `(${item.variant})` : ''}
                  </span>
                  <span className="font-mono text-gray-500">₹{item.totalPrice}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between font-bold text-xs text-gray-900 dark:text-white">
                <span>Total Amount:</span>
                <span className="font-mono text-[#DD5903]">₹{trackedOrder.grandTotal.toFixed(2)}</span>
              </div>
            </div>

          </div>
        )}

      </div>
    </Modal>
  );
}
