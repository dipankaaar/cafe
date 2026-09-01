import React, { useState, useEffect } from 'react';
import { Search, X, ShoppingBag, Coffee, Users, Tag, Truck, ArrowRight, Shield } from 'lucide-react';
import { useCafe } from '../../context/CafeContext';

export default function GlobalSearchModal({ isOpen, onClose, onNavigate }) {
  const [query, setQuery] = useState('');
  const { orders, products, customers, coupons, suppliers, staff } = useCafe();

  useEffect(() => {
    if (isOpen) setQuery('');
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle search modal
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  const matchingOrders = cleanQuery
    ? orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(cleanQuery) ||
          (o.customerName && o.customerName.toLowerCase().includes(cleanQuery))
      ).slice(0, 4)
    : [];

  const matchingProducts = cleanQuery
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(cleanQuery) ||
          p.description.toLowerCase().includes(cleanQuery)
      ).slice(0, 4)
    : [];

  const matchingCustomers = cleanQuery
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(cleanQuery) ||
          c.phone.includes(cleanQuery) ||
          c.email.toLowerCase().includes(cleanQuery)
      ).slice(0, 3)
    : [];

  const matchingCoupons = cleanQuery
    ? coupons.filter(
        (cpn) =>
          cpn.code.toLowerCase().includes(cleanQuery) ||
          cpn.name.toLowerCase().includes(cleanQuery)
      ).slice(0, 3)
    : [];

  const matchingStaff = cleanQuery
    ? staff.filter(
        (s) =>
          s.name.toLowerCase().includes(cleanQuery) ||
          s.role.toLowerCase().includes(cleanQuery)
      ).slice(0, 3)
    : [];

  const totalResults =
    matchingOrders.length +
    matchingProducts.length +
    matchingCustomers.length +
    matchingCoupons.length +
    matchingStaff.length;

  const handleSelect = (moduleKey) => {
    onNavigate(moduleKey);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="min-h-screen px-4 flex items-start justify-center pt-20 pb-12 relative z-10">
        <div className="w-full max-w-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
          
          {/* Search Header */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search orders, menu items, guests, coupons, staff..."
              className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none text-base font-medium"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
              >
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Results Stream */}
          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
            {cleanQuery === '' ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                <p className="font-semibold text-gray-700 dark:text-gray-300">Quick Navigation Shortcuts</p>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                  {[
                    { label: 'POS / Billing', key: 'pos' },
                    { label: 'Kitchen KDS', key: 'kitchen' },
                    { label: 'All Orders', key: 'orders' },
                    { label: 'Menu Products', key: 'menu' },
                    { label: 'Table Floor Plan', key: 'tables' },
                    { label: 'Coupons & Promos', key: 'coupons' },
                    { label: 'Sales Reports', key: 'reports' }
                  ].map((btn) => (
                    <button
                      key={btn.key}
                      onClick={() => handleSelect(btn.key)}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-[#DD5903] hover:text-white rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : totalResults === 0 ? (
              <div className="py-10 text-center text-gray-500">
                <p>No results found for "{query}".</p>
              </div>
            ) : (
              <>
                {/* Orders Results */}
                {matchingOrders.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Orders</p>
                    <div className="space-y-1">
                      {matchingOrders.map((o) => (
                        <div
                          key={o.id}
                          onClick={() => handleSelect('orders')}
                          className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/80 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <ShoppingBag className="w-4 h-4 text-[#DD5903]" />
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">
                                {o.orderNumber} — {o.customerName}
                              </p>
                              <p className="text-xs text-gray-500">{o.items.length} items • ₹{o.grandTotal} • {o.status}</p>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Products Results */}
                {matchingProducts.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Menu Products</p>
                    <div className="space-y-1">
                      {matchingProducts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleSelect('menu')}
                          className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/80 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Coffee className="w-4 h-4 text-amber-500" />
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{p.name}</p>
                              <p className="text-xs text-gray-500">₹{p.sellingPrice} • {p.isVeg ? 'Veg' : 'Non-Veg'}</p>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Customers Results */}
                {matchingCustomers.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Customers</p>
                    <div className="space-y-1">
                      {matchingCustomers.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => handleSelect('customers')}
                          className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/80 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Users className="w-4 h-4 text-blue-500" />
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{c.name} ({c.tier})</p>
                              <p className="text-xs text-gray-500">{c.phone} • {c.loyaltyPoints} pts</p>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Coupons Results */}
                {matchingCoupons.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Coupons</p>
                    <div className="space-y-1">
                      {matchingCoupons.map((cpn) => (
                        <div
                          key={cpn.id}
                          onClick={() => handleSelect('coupons')}
                          className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/80 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Tag className="w-4 h-4 text-emerald-500" />
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{cpn.code} — {cpn.name}</p>
                              <p className="text-xs text-gray-500">{cpn.discountType === 'percentage' ? `${cpn.discountValue}% off` : `₹${cpn.discountValue} flat`} • {cpn.status}</p>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Staff Results */}
                {matchingStaff.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Staff Members</p>
                    <div className="space-y-1">
                      {matchingStaff.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => handleSelect('staff')}
                          className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/80 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Shield className="w-4 h-4 text-purple-500" />
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{s.name}</p>
                              <p className="text-xs text-gray-500">{s.role} • {s.email}</p>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer note */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-[#141414] border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 flex items-center justify-between">
            <span>Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200">ESC</kbd> to exit</span>
            <span>Global Cafe Enterprise Search</span>
          </div>

        </div>
      </div>
    </div>
  );
}
