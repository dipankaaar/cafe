import React, { useState, useEffect, useMemo } from 'react';
import { useCafe } from '../../../context/CafeContext';
import { printOrderReceipt } from '../../../services/receiptPrinter';
import {
  normalizeOrderStatus,
  getStatusLabel,
  getStatusBadgeVariant,
  getNextStatusAction,
  buildStatusTimeline
} from '../../../utils/orderStatus';
import Card from '../../common/Card';
import Badge from '../../common/Badge';
import Button from '../../common/Button';
import Modal from '../../common/Modal';
import ConfirmDialog from '../../common/ConfirmDialog';
import {
  Search,
  Printer,
  Eye,
  XCircle,
  Download,
  CheckCircle2,
  Bike,
  MapPin,
  KeyRound,
  User,
  Phone,
  Store,
  ChefHat,
  Receipt,
  Clock,
  ArrowRight,
  Filter
} from 'lucide-react';

const STATUS_TABS = [
  { id: 'all', label: 'All Orders' },
  { id: 'new', label: 'New Orders' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'out_for_delivery', label: 'Out for Delivery' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'ready', label: 'Ready' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' }
];

function downloadCsv(filename, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = rows.map((r) => r.map(esc).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function OrdersView({ initialModule = 'orders', initialStatus = 'all', initialBoard = 'all' } = {}) {
  const {
    orders = [],
    cancelOrder,
    updateOrderStatus,
    assignRider,
    verifyDeliveryOtp,
    settings = {},
    branches = [],
    activeBranchId,
    switchBranch
  } = useCafe();

  // Resolve initial status from initialModule if provided
  const resolveInitialStatus = () => {
    if (initialModule === 'orders-new') return 'new';
    if (initialModule === 'orders-preparing') return 'preparing';
    if (initialModule === 'orders-ready') return 'ready';
    if (initialModule === 'orders-completed') return 'completed';
    return initialStatus;
  };

  const [boardTab, setBoardTab] = useState(() => (initialModule === 'orders-delivery' ? 'delivery' : initialBoard)); // all | delivery
  const [statusFilter, setStatusFilter] = useState(resolveInitialStatus);
  const [typeFilter, setTypeFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync state when initialModule prop changes from Sidebar navigation
  useEffect(() => {
    if (initialModule === 'orders-new') {
      setStatusFilter('new');
      setBoardTab('all');
    } else if (initialModule === 'orders-preparing') {
      setStatusFilter('preparing');
      setBoardTab('all');
    } else if (initialModule === 'orders-ready') {
      setStatusFilter('ready');
      setBoardTab('all');
    } else if (initialModule === 'orders-completed') {
      setStatusFilter('completed');
      setBoardTab('all');
    } else if (initialModule === 'orders-delivery') {
      setBoardTab('delivery');
      setStatusFilter('all');
    } else if (initialModule === 'orders-all' || initialModule === 'orders') {
      setStatusFilter('all');
      setBoardTab('all');
    }
  }, [initialModule]);

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [riderModalOrder, setRiderModalOrder] = useState(null);
  const [otpModalOrder, setOtpModalOrder] = useState(null);

  // Rider form
  const [riderName, setRiderName] = useState('');
  const [riderPhone, setRiderPhone] = useState('');
  const [riderBusy, setRiderBusy] = useState(false);
  const [riderError, setRiderError] = useState('');

  // OTP form
  const [otpInput, setOtpInput] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpError, setOtpError] = useState('');

  const branchName = (id) =>
    branches.find((b) => b.id === id)?.name || (id === 'br-main' ? 'Flagship Store' : id || '—');

  // Real-time Counts for Status Tabs
  const statusCounts = useMemo(() => {
    const counts = { all: 0 };
    const relevantOrders = boardTab === 'delivery'
      ? orders.filter((o) => String(o.orderType || '').toLowerCase() === 'delivery')
      : orders;

    counts.all = relevantOrders.length;
    relevantOrders.forEach((o) => {
      const norm = normalizeOrderStatus(o.status);
      if (norm === 'placed' || norm === 'accepted') counts.new = (counts.new || 0) + 1;
      else if (norm === 'brewing') counts.preparing = (counts.preparing || 0) + 1;
      else if (norm === 'out_for_delivery') counts.out_for_delivery = (counts.out_for_delivery || 0) + 1;
      else if (norm === 'delivered') counts.delivered = (counts.delivered || 0) + 1;
      else if (norm === 'ready') counts.ready = (counts.ready || 0) + 1;
      else if (norm === 'completed') counts.completed = (counts.completed || 0) + 1;
      else if (norm === 'cancelled' || norm === 'refunded') counts.cancelled = (counts.cancelled || 0) + 1;
    });
    return counts;
  }, [orders, boardTab]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Board Filter (All vs Delivery only)
      if (boardTab === 'delivery' && String(order.orderType || '').toLowerCase() !== 'delivery') {
        return false;
      }

      // Status Filter
      const norm = normalizeOrderStatus(order.status);
      const matchStatus = statusFilter === 'all' || (() => {
        if (statusFilter === 'new') return norm === 'placed' || norm === 'accepted';
        if (statusFilter === 'preparing') return norm === 'brewing';
        if (statusFilter === 'out_for_delivery') return norm === 'out_for_delivery';
        if (statusFilter === 'delivered') return norm === 'delivered';
        if (statusFilter === 'ready') return norm === 'ready';
        if (statusFilter === 'completed') return norm === 'completed';
        if (statusFilter === 'cancelled') return norm === 'cancelled' || norm === 'refunded';
        return norm === statusFilter;
      })();

      // Type Filter
      const matchType =
        typeFilter === 'all' || String(order.orderType || '').toLowerCase() === typeFilter.toLowerCase();

      // Branch Filter
      const matchBranch = branchFilter === 'all' || (order.branchId || 'br-main') === branchFilter;

      // Search Query
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        q === '' ||
        String(order.orderNumber || '').toLowerCase().includes(q) ||
        String(order.customerName || '').toLowerCase().includes(q) ||
        String(order.customerPhone || '').includes(searchQuery.trim()) ||
        String(order.riderName || '').toLowerCase().includes(q);

      return matchStatus && matchType && matchBranch && matchSearch;
    });
  }, [orders, boardTab, statusFilter, typeFilter, branchFilter, searchQuery]);

  const deliveryOrders = orders.filter((o) => String(o.orderType || '').toLowerCase() === 'delivery');
  const activeDeliveries = deliveryOrders.filter((o) =>
    ['placed', 'accepted', 'brewing', 'ready', 'out_for_delivery'].includes(normalizeOrderStatus(o.status))
  ).length;

  const getStatusBadge = (status) => (
    <Badge variant={getStatusBadgeVariant(status)} dot>{getStatusLabel(status)}</Badge>
  );

  const handlePrint = (order) => {
    printOrderReceipt(order, settings);
  };

  const handleExport = () => {
    const rows = [
      ['Invoice', 'Date', 'Branch', 'Type', 'Table', 'Customer', 'Phone', 'Items', 'Total', 'Payment', 'Status', 'Rider', 'Delivery Address']
    ];
    filteredOrders.forEach((o) => {
      rows.push([
        o.orderNumber || '',
        o.orderTime || '',
        branchName(o.branchId),
        o.orderType || '',
        o.tableNumber || '',
        o.customerName || '',
        o.customerPhone || '',
        (Array.isArray(o.items) ? o.items : []).map((i) => `${i.quantity || 1}x ${i.name || 'Item'}`).join('; '),
        Number(o.grandTotal || 0).toFixed(2),
        `${o.paymentMethod || 'Cash'}/${o.paymentStatus || 'Pending'}`,
        getStatusLabel(o.status),
        o.riderName || '',
        o.deliveryAddress || ''
      ]);
    });
    downloadCsv(`orders_${boardTab}_${new Date().toISOString().split('T')[0]}.csv`, rows);
  };

  const openRiderModal = (order) => {
    setRiderModalOrder(order);
    setRiderName(order.riderName || '');
    setRiderPhone(order.riderPhone || '');
    setRiderError('');
  };

  const handleAssignRider = async (e) => {
    e.preventDefault();
    if (!riderName.trim()) {
      setRiderError('Rider name is required');
      return;
    }
    setRiderBusy(true);
    setRiderError('');
    try {
      if (assignRider) {
        await assignRider(riderModalOrder.id, { riderName: riderName.trim(), riderPhone: riderPhone.trim() });
      } else {
        updateOrderStatus(riderModalOrder.id, 'out_for_delivery');
      }
      setRiderModalOrder(null);
    } catch (err) {
      setRiderError(err.message || 'Could not assign rider');
    } finally {
      setRiderBusy(false);
    }
  };

  const openOtpModal = (order) => {
    setOtpModalOrder(order);
    setOtpInput('');
    setOtpError('');
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpInput.trim()) {
      setOtpError('Enter the 4-digit OTP from the customer');
      return;
    }
    setOtpBusy(true);
    setOtpError('');
    try {
      if (verifyDeliveryOtp) {
        await verifyDeliveryOtp(otpModalOrder.id, otpInput.trim());
      } else {
        updateOrderStatus(otpModalOrder.id, 'delivered');
      }
      setOtpModalOrder(null);
      setSelectedOrder(null);
    } catch (err) {
      setOtpError(err.message || 'OTP verification failed');
    } finally {
      setOtpBusy(false);
    }
  };

  const advanceOrder = (order, action) => {
    if (action === 'delivered') {
      openOtpModal(order);
      return;
    }
    updateOrderStatus(order.id, action);
    setSelectedOrder(null);
  };

  const liveOrder = selectedOrder ? (orders.find((o) => o.id === selectedOrder.id) || selectedOrder) : null;
  const timeline = liveOrder ? buildStatusTimeline(liveOrder) : [];
  const nextAction = liveOrder ? getNextStatusAction(liveOrder.status, liveOrder.orderType) : null;
  const isDeliveryLive = liveOrder && String(liveOrder.orderType || '').toLowerCase() === 'delivery';

  return (
    <div className="space-y-6">

      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
            Order Management
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Dine-in tickets, takeaway, and live delivery dispatch with instant status updates.
            {activeDeliveries > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 font-bold text-sky-600 dark:text-sky-400">
                <Bike className="w-3.5 h-3.5" /> {activeDeliveries} active deliver{activeDeliveries === 1 ? 'y' : 'ies'}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={Download} onClick={handleExport}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Board tabs: All vs Delivery dispatch */}
      <div className="flex items-center gap-2">
        {[
          { id: 'all', label: `All Orders (${orders.length})` },
          { id: 'delivery', label: `Delivery Dispatch${activeDeliveries > 0 ? ` (${activeDeliveries} active)` : ''}` }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => { setBoardTab(t.id); setStatusFilter('all'); }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              boardTab === t.id
                ? 'bg-[#DD5903] text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-[#DD5903]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">

          {/* Status Tabs with Live Count Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
            {STATUS_TABS.map((tab) => {
              const count = statusCounts[tab.id];
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-[#DD5903] text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>{tab.label}</span>
                  {count !== undefined && count > 0 && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        statusFilter === tab.id
                          ? 'bg-white/25 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Branch + Type + Search */}
          <div className="flex flex-wrap items-center gap-2">
            {branches.length > 0 && (
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                title="Filter by branch"
                className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-900 dark:text-white outline-none"
              >
                <option value="all">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-900 dark:text-white outline-none"
            >
              <option value="all">All Types</option>
              <option value="dine-in">Dine In</option>
              <option value="takeaway">Takeaway</option>
              <option value="delivery">Delivery</option>
            </select>

            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search order #, guest, rider..."
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-1.5 pl-9 pr-3 text-xs text-gray-900 dark:text-white outline-none"
              />
            </div>
          </div>

        </div>
      </Card>

      {/* Orders Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-50 dark:bg-[#141414] border-b border-gray-200 dark:border-gray-800 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Invoice #</th>
                <th className="px-5 py-3.5">Time / Date</th>
                <th className="px-5 py-3.5">Type & Table</th>
                <th className="px-5 py-3.5">Customer / Rider</th>
                <th className="px-5 py-3.5">Items</th>
                <th className="px-5 py-3.5">Total Amount</th>
                <th className="px-5 py-3.5">Payment</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-gray-400">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const norm = normalizeOrderStatus(order.status);
                  const isDel = String(order.orderType || '').toLowerCase() === 'delivery';
                  const terminal = ['completed', 'delivered', 'cancelled', 'refunded'].includes(norm);
                  const orderDate = new Date(order.orderTime || order.createdAt || Date.now());

                  return (
                    <tr key={order.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-gray-900 dark:text-white">
                        {order.orderNumber || `ORD-${order.id}`}
                        {branches.length > 1 && (
                          <span className="block text-[10px] font-sans font-semibold text-gray-400">
                            {branchName(order.branchId)}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">
                        {orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        <span className="block text-[10px] text-gray-400">
                          {orderDate.toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-gray-900 dark:text-white capitalize">
                          {order.orderType || 'Dine-in'}
                        </span>
                        {order.tableNumber && (
                          <span className="block text-[11px] text-[#DD5903] font-semibold">
                            {order.tableNumber}
                          </span>
                        )}
                        {isDel && order.deliveryAddress && (
                          <span className="block text-[10px] text-gray-400 max-w-[160px] truncate" title={order.deliveryAddress}>
                            {order.deliveryAddress}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {order.customerName || 'Walk-in Guest'}
                        </span>
                        {order.customerPhone && (
                          <span className="block text-[10px] text-gray-400">
                            {order.customerPhone}
                          </span>
                        )}
                        {isDel && (
                          <span className="block text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                            {order.riderName ? `Rider: ${order.riderName}` : 'No rider assigned'}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                        {(Array.isArray(order.items) ? order.items : []).length} items
                      </td>
                      <td className="px-5 py-3.5 font-bold font-mono text-gray-900 dark:text-white">
                        ₹{Number(order.grandTotal || 0).toFixed(2)}
                        {order.discountAmount > 0 && (
                          <span className="block text-[10px] text-emerald-600 dark:text-emerald-400">
                            -₹{Number(order.discountAmount).toFixed(2)} promo
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {order.paymentMethod || 'Cash'}
                        </span>
                        <span className="block text-[10px] text-emerald-600 font-bold uppercase">
                          {order.paymentStatus || 'Pending'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <select
                          value={norm}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="bg-gray-50 dark:bg-[#1a1a1a] text-xs font-semibold border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-gray-900 dark:text-white outline-none cursor-pointer hover:border-[#DD5903] transition-colors"
                          title="Click to update order status"
                        >
                          <option value="placed">🔵 New Order</option>
                          <option value="accepted">🔵 Accepted</option>
                          <option value="brewing">🟡 Preparing</option>
                          <option value="ready">🔵 Ready</option>
                          <option value="out_for_delivery">🟣 Out for Delivery</option>
                          <option value="delivered">🟢 Delivered</option>
                          <option value="completed">⚪ Completed</option>
                          <option value="cancelled">🔴 Cancelled</option>
                        </select>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                          title="View Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrint(order)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-[#DD5903] hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                          title="Print Invoice / Thermal Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {isDel && !terminal && (
                          <button
                            onClick={() => openRiderModal(order)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-sky-600 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                            title={order.riderName ? 'Change rider' : 'Assign rider'}
                          >
                            <Bike className="w-4 h-4" />
                          </button>
                        )}
                        {isDel && norm === 'out_for_delivery' && (
                          <button
                            onClick={() => openOtpModal(order)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                            title="Verify handover OTP"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                        )}
                        {!terminal && (
                          <button
                            onClick={() => setOrderToCancel(order)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                            title="Cancel Order"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ================= ORDER DETAILS MODAL ================= */}
      {liveOrder && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedOrder(null)}
          title={`Order #${liveOrder.orderNumber || `ORD-${liveOrder.id}`}`}
          subtitle={`Placed at ${new Date(liveOrder.orderTime || liveOrder.createdAt || Date.now()).toLocaleString()}`}
          size="lg"
          footer={
            <div className="flex flex-wrap items-center justify-between w-full gap-2">
              <Button
                variant="secondary"
                icon={Printer}
                onClick={() => handlePrint(liveOrder)}
              >
                Print Receipt
              </Button>
              <div className="flex items-center gap-2">
                {isDeliveryLive && ['placed', 'accepted', 'brewing', 'ready'].includes(normalizeOrderStatus(liveOrder.status)) && (
                  <Button
                    variant="outline"
                    icon={Bike}
                    onClick={() => openRiderModal(liveOrder)}
                  >
                    {liveOrder.riderName ? `Rider: ${liveOrder.riderName}` : 'Assign Rider'}
                  </Button>
                )}
                {nextAction && (
                  <Button
                    variant={nextAction.action === 'delivered' || nextAction.action === 'completed' ? 'success' : 'primary'}
                    icon={nextAction.action === 'out_for_delivery' ? Bike : CheckCircle2}
                    onClick={() => advanceOrder(liveOrder, nextAction.action)}
                  >
                    {nextAction.label}
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-6 text-xs">

            {/* Status Timeline */}
            {timeline.length > 0 && (
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">Order Lifecycle Timeline</p>
                <div className="flex items-center justify-between relative">
                  <div className="absolute left-0 right-0 top-3 h-0.5 bg-gray-200 dark:bg-gray-700 z-0" />
                  {timeline.map((step, idx) => (
                    <div key={idx} className="relative z-10 flex flex-col items-center text-center">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                          step.done
                            ? 'bg-[#DD5903] text-white shadow-sm'
                            : step.active
                            ? 'bg-amber-500 text-white ring-4 ring-amber-500/20'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                        }`}
                      >
                        {step.done ? '✓' : idx + 1}
                      </div>
                      <span className={`text-[10px] font-semibold mt-1 max-w-[80px] leading-tight ${step.active ? 'text-[#DD5903] font-bold' : 'text-gray-500'}`}>
                        {step.label}
                      </span>
                      {step.time && (
                        <span className="text-[9px] text-gray-400 mt-0.5">
                          {new Date(step.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary Top Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <span className="text-gray-400 block mb-1">Status (Update)</span>
                <select
                  value={normalizeOrderStatus(liveOrder.status)}
                  onChange={(e) => {
                    updateOrderStatus(liveOrder.id, e.target.value);
                  }}
                  className="w-full bg-white dark:bg-[#141414] font-bold text-xs border border-gray-200 dark:border-gray-700 rounded-md py-1 px-2 text-[#DD5903] outline-none"
                >
                  <option value="placed">New Order</option>
                  <option value="accepted">Accepted</option>
                  <option value="brewing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <span className="text-gray-400">Order Type</span>
                <p className="font-bold text-sm text-gray-900 dark:text-white capitalize mt-0.5">
                  {liveOrder.orderType || 'Dine-in'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <span className="text-gray-400">Table / Seat</span>
                <p className="font-bold text-sm text-gray-900 dark:text-white mt-0.5">
                  {liveOrder.tableNumber || 'N/A'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <span className="text-gray-400">Customer</span>
                <p className="font-bold text-sm text-gray-900 dark:text-white mt-0.5 truncate">
                  {liveOrder.customerName || 'Walk-in Guest'}
                </p>
              </div>
            </div>

            {/* Delivery Details Callout */}
            {isDeliveryLive && (
              <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                    <Bike className="w-4 h-4" /> Delivery Information
                  </span>
                  {liveOrder.deliveryOtp && (
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-gray-900 font-mono font-bold text-[#DD5903] text-xs border border-orange-200 dark:border-orange-900">
                      Handover OTP: {liveOrder.deliveryOtp}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-gray-600 dark:text-gray-300">
                  <div>
                    <span className="text-gray-400 block">Address:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{liveOrder.deliveryAddress || 'Address not provided'}</p>
                    {liveOrder.deliveryLandmark && <p className="text-gray-400">Landmark: {liveOrder.deliveryLandmark}</p>}
                  </div>
                  <div>
                    <span className="text-gray-400 block">Assigned Rider:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {liveOrder.riderName ? `${liveOrder.riderName} (${liveOrder.riderPhone || 'No phone'})` : 'None assigned yet'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Line Items Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Order Items ({(Array.isArray(liveOrder.items) ? liveOrder.items : []).length})
              </h4>
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
                {(Array.isArray(liveOrder.items) ? liveOrder.items : []).map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">
                        {item.quantity || 1}x {item.name}
                        {item.variant && item.variant !== 'Standard' && (
                          <span className="text-xs font-normal text-gray-500 ml-1.5">
                            ({typeof item.variant === 'object' ? item.variant.name : item.variant})
                          </span>
                        )}
                      </p>
                      {item.addons && item.addons.length > 0 && (
                        <p className="text-[11px] text-[#DD5903]">
                          Add-ons: {item.addons.map((a) => a.name || a).join(', ')}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-[11px] text-gray-400 italic">
                          * Note: {item.notes}
                        </p>
                      )}
                    </div>
                    <span className="font-mono font-bold text-gray-900 dark:text-white text-sm">
                      ₹{Number(item.totalPrice ?? ((item.unitPrice || item.price || 0) * (item.quantity || 1))).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Billing Summary */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-gray-800 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-mono text-gray-900 dark:text-white">₹{Number(liveOrder.subtotal || 0).toFixed(2)}</span>
              </div>
              {liveOrder.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount {liveOrder.couponCode ? `(${liveOrder.couponCode})` : ''}</span>
                  <span className="font-mono">-₹{Number(liveOrder.discountAmount || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Tax & GST</span>
                <span className="font-mono text-gray-900 dark:text-white">₹{Number(liveOrder.taxAmount || 0).toFixed(2)}</span>
              </div>
              {liveOrder.serviceCharge > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Service Charge</span>
                  <span className="font-mono text-gray-900 dark:text-white">₹{Number(liveOrder.serviceCharge || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                <span>Grand Total</span>
                <span className="font-mono text-[#DD5903]">₹{Number(liveOrder.grandTotal || 0).toFixed(2)}</span>
              </div>
            </div>

          </div>
        </Modal>
      )}

      {/* ================= ASSIGN RIDER MODAL ================= */}
      {riderModalOrder && (
        <Modal
          isOpen={true}
          onClose={() => setRiderModalOrder(null)}
          title={`Assign Rider — Order #${riderModalOrder.orderNumber}`}
          subtitle="Assign a delivery partner to dispatch this order"
          size="sm"
        >
          <form onSubmit={handleAssignRider} className="space-y-4 text-xs">
            {riderError && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-medium">
                {riderError}
              </div>
            )}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">Rider Full Name *</label>
              <input
                type="text"
                value={riderName}
                onChange={(e) => setRiderName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                required
                className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:border-[#DD5903]"
              />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">Rider Phone (10 digits)</label>
              <input
                type="tel"
                value={riderPhone}
                onChange={(e) => setRiderPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:border-[#DD5903]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setRiderModalOrder(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" icon={Bike} disabled={riderBusy}>
                {riderBusy ? 'Assigning...' : 'Dispatch with Rider'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ================= VERIFY DELIVERY OTP MODAL ================= */}
      {otpModalOrder && (
        <Modal
          isOpen={true}
          onClose={() => setOtpModalOrder(null)}
          title={`Handover OTP — Order #${otpModalOrder.orderNumber}`}
          subtitle="Enter customer's 4-digit handover OTP to confirm successful delivery"
          size="sm"
        >
          <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
            {otpError && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-medium">
                {otpError}
              </div>
            )}
            <div className="text-center py-2">
              <input
                type="text"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                autoFocus
                className="w-40 text-center font-mono text-2xl font-bold tracking-widest px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:border-[#DD5903]"
              />
              <p className="text-[11px] text-gray-400 mt-2">Customer receives OTP via SMS/WhatsApp when order is out for delivery.</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setOtpModalOrder(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="success" size="sm" icon={CheckCircle2} disabled={otpBusy}>
                {otpBusy ? 'Verifying...' : 'Confirm Delivery'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ================= CANCEL CONFIRMATION ================= */}
      {orderToCancel && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setOrderToCancel(null)}
          title={`Cancel Order #${orderToCancel.orderNumber || `ORD-${orderToCancel.id}`}`}
          message="Are you sure you want to cancel this order? Table reservations and associated items will be released."
          confirmText="Yes, Cancel Order"
          onConfirm={() => {
            cancelOrder(orderToCancel.id, 'Cancelled via Order Dashboard');
            setOrderToCancel(null);
          }}
        />
      )}

    </div>
  );
}
