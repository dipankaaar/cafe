import React, { useState, useEffect } from 'react';
import { useCafe } from '../../../context/CafeContext';
import Card from '../../common/Card';
import Badge from '../../common/Badge';
import Button from '../../common/Button';
import {
  ChefHat,
  Clock,
  Check,
  Flame,
  CheckCircle2,
  AlertCircle,
  Bell,
  UtensilsCrossed,
  Volume2
} from 'lucide-react';

export default function KitchenDisplayView() {
  const { orders, updateOrderStatus, addToastNotification } = useCafe();
  const [filter, setFilter] = useState('active'); // active, preparing, ready, completed
  const [checkedItems, setCheckedItems] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live timer tick every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 5000);
    return () => clearInterval(timer);
  }, []);

  const activeOrders = orders.filter((o) =>
    filter === 'active'
      ? ['New', 'Accepted', 'Preparing', 'Ready'].includes(o.status)
      : o.status.toLowerCase() === filter.toLowerCase()
  );

  const toggleItemCheck = (orderId, itemIndex) => {
    const key = `${orderId}-${itemIndex}`;
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const calculateElapsedMinutes = (orderTime) => {
    const diffMs = currentTime - new Date(orderTime);
    return Math.max(0, Math.floor(diffMs / (1000 * 60)));
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-['Plus_Jakarta_Sans',sans-serif] flex items-center gap-2">
              Kitchen Display System (KDS)
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Live real-time feed" />
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Live preparation tickets, cooking timers, and chef workflow coordination.
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center bg-white dark:bg-[#181818] border border-gray-200 dark:border-gray-800 rounded-xl p-1 text-xs">
          {[
            { id: 'active', label: 'All Active' },
            { id: 'preparing', label: 'In Prep' },
            { id: 'ready', label: 'Ready to Serve' },
            { id: 'completed', label: 'Completed' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                filter === tab.id
                  ? 'bg-[#DD5903] text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket Grid */}
      {activeOrders.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-[#181818] rounded-2xl border border-gray-200 dark:border-gray-800">
          <UtensilsCrossed className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h4 className="text-base font-bold text-gray-900 dark:text-white">
            No active kitchen tickets
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            New orders placed from POS or tables will appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {activeOrders.map((order) => {
            const elapsedMins = calculateElapsedMinutes(order.orderTime);
            const isUrgent = elapsedMins >= 10 && order.status !== 'Completed';

            return (
              <div
                key={order.id}
                className={`bg-white dark:bg-[#181818] rounded-2xl border transition-all shadow-xs flex flex-col justify-between overflow-hidden ${
                  order.status === 'Ready'
                    ? 'border-emerald-500 dark:border-emerald-600 ring-2 ring-emerald-500/20'
                    : isUrgent
                    ? 'border-rose-500 dark:border-rose-600 ring-2 ring-rose-500/20'
                    : 'border-gray-200 dark:border-gray-800'
                }`}
              >
                {/* Ticket Top Header */}
                <div
                  className={`p-4 border-b flex items-center justify-between ${
                    order.status === 'Ready'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40'
                      : isUrgent
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40'
                      : 'bg-gray-50 dark:bg-[#151515] border-gray-100 dark:border-gray-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold font-mono text-gray-900 dark:text-white">
                        {order.orderNumber}
                      </span>
                      <Badge
                        size="sm"
                        variant={
                          order.status === 'Ready'
                            ? 'success'
                            : order.status === 'Preparing'
                            ? 'warning'
                            : 'primary'
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-semibold">
                      {order.orderType === 'dine-in' ? `Table ${order.tableNumber || 'Indoor'}` : order.orderType.toUpperCase()}
                      {' • '}{order.customerName}
                    </p>
                  </div>

                  {/* Preparation Timer */}
                  <div
                    className={`flex items-center gap-1 text-xs font-mono font-bold px-2 py-1 rounded-md ${
                      isUrgent
                        ? 'bg-rose-500 text-white animate-pulse'
                        : elapsedMins >= 5
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{elapsedMins}m</span>
                  </div>
                </div>

                {/* Items Checklist */}
                <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-72 divide-y divide-gray-100 dark:divide-gray-800/60">
                  {order.items.map((item, idx) => {
                    const isChecked = checkedItems[`${order.id}-${idx}`];
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleItemCheck(order.id, idx)}
                        className={`pt-2 flex items-start gap-3 cursor-pointer select-none transition-opacity ${
                          isChecked ? 'opacity-40 line-through' : 'opacity-100'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isChecked
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                              {item.quantity}x {item.name}
                            </span>
                          </div>

                          {item.variant !== 'Standard' && (
                            <span className="text-[11px] text-gray-500 block">
                              Size: {item.variant}
                            </span>
                          )}

                          {item.addons && item.addons.length > 0 && (
                            <span className="text-[11px] text-[#DD5903] font-semibold block">
                              + {item.addons.map((a) => a.name).join(', ')}
                            </span>
                          )}

                          {item.notes && (
                            <span className="text-[11px] text-rose-500 font-medium italic block bg-rose-50 dark:bg-rose-950/30 px-1.5 py-0.5 rounded mt-0.5">
                              Note: {item.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* General order notes */}
                  {order.notes && (
                    <div className="pt-2 text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/20 p-2 rounded-lg mt-2">
                      Kitchen Remarks: {order.notes}
                    </div>
                  )}
                </div>

                {/* Bottom Action Workflow Buttons */}
                <div className="p-3 bg-gray-50 dark:bg-[#141414] border-t border-gray-100 dark:border-gray-800">
                  {order.status === 'New' || order.status === 'Accepted' ? (
                    <Button
                      onClick={() => updateOrderStatus(order.id, 'Preparing')}
                      fullWidth
                      size="sm"
                      icon={Flame}
                    >
                      Start Cooking
                    </Button>
                  ) : order.status === 'Preparing' ? (
                    <Button
                      onClick={() => updateOrderStatus(order.id, 'Ready')}
                      fullWidth
                      size="sm"
                      variant="success"
                      icon={CheckCircle2}
                    >
                      Mark Ready to Serve
                    </Button>
                  ) : order.status === 'Ready' ? (
                    <Button
                      onClick={() => updateOrderStatus(order.id, 'Completed')}
                      fullWidth
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      icon={Check}
                    >
                      Complete & Clear
                    </Button>
                  ) : (
                    <div className="text-center text-xs font-bold text-gray-500 py-1">
                      Order Completed
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
