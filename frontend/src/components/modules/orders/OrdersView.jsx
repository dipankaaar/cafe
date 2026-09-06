import React, { useState } from 'react';
import { useCafe } from '../../../context/CafeContext';
import { printOrderReceipt } from '../../../services/receiptPrinter';
import { normalizeOrderStatus, getStatusLabel, getStatusBadgeVariant, getNextStatusAction, buildStatusTimeline } from '../../../utils/orderStatus';
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
  Store
} from 'lucide-react';

const STATUS_TABS = [
  { id: 'all', label: 'All Orders' },
  { id: 'placed', label: 'New' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'brewing', label: 'Brewing' },
  { id: 'ready', label: 'Ready' },
  { id: 'out_for_delivery', label: 'On the Way' },
  { id: 'delivered', label: 'Delivered' },
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

export default function OrdersView({ initialStatus = 'all', initialBoard = 'all' } = {}) {
  const {
    orders, cancelOrder, updateOrderStatus, assignRider, verifyDeliveryOtp,
    settings, branches, activeBranchId, switchBranch
  } = useCafe();

  const [boardTab, setBoardTab] = useState(initialBoard); // all | delivery
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [typeFilter, setTypeFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  const branchName = (id) => branches.find((b) => b.id === id)?.name || (id === 'br-main' ? 'Flagship Store' : id || '—');

  // Filtered Orders (status compare is normalization-safe: legacy + canonical both match)
  const filteredOrders = orders.filter((order) => {
    const norm = normalizeOrderStatus(order.status);
    if (boardTab === 'delivery' && String(order.orderType || '').toLowerCase() !== 'delivery') return false;
    const matchStatus = statusFilter === 'all' || norm === statusFilter;
    const matchType =
      typeFilter === 'all' || String(order.orderType || '').toLowerCase() === typeFilter.toLowerCase();
    const matchBranch = branchFilter === 'all' || (order.branchId || 'br-main') === branchFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      q === '' ||
      String(order.orderNumber || '').toLowerCase().includes(q) ||
      String(order.customerName || '').toLowerCase().includes(q) ||
      String(order.customerPhone || '').includes(searchQuery.trim()) ||
      String(order.riderName || '').toLowerCase().includes(q);
    return matchStatus && matchType && matchBranch && matchSearch;
  });

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
        o.orderNumber, o.orderTime, branchName(o.branchId), o.orderType, o.tableNumber || '',
        o.customerName, o.customerPhone, (o.items || []).map((i) => `${i.quantity}x ${i.name}`).join('; '),
        o.grandTotal, `${o.paymentMethod}/${o.paymentStatus}`, getStatusLabel(o.status),
        o.riderName || '', o.deliveryAddress || ''
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
    if (!riderName.trim()) { setRiderError('Rider name is required'); return; }
    setRiderBusy(true);
    setRiderError('');
    try {
      await assignRider(riderModalOrder.id, { riderName: riderName.trim(), riderPhone: riderPhone.trim() });
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
    if (!otpInput.trim()) { setOtpError('Enter the 4-digit OTP from the customer'); return; }
    setOtpBusy(true);
    setOtpError('');
    try {
      await verifyDeliveryOtp(otpModalOrder.id, otpInput.trim());
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
            Dine-in tickets, takeaway, and live delivery dispatch with rider OTP handover.
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
          { id: 'all', label: 'All Orders' },
          { id: 'delivery', label: `Delivery Dispatch${activeDeliveries > 0 ? ` (${activeDeliveries})` : ''}` }
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

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-[#DD5903] text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
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
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-gray-900 dark:text-white">
                        {order.orderNumber}
                        {branches.length > 1 && (
                          <span className="block text-[10px] font-sans font-semibold text-gray-400">
                            {branchName(order.branchId)}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">
                        {new Date(order.orderTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        <span className="block text-[10px] text-gray-400">
                          {new Date(order.orderTime).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-gray-900 dark:text-white capitalize">
                          {order.orderType}
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
                          {order.customerName}
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
                        {(order.items || []).length} items
                      </td>
                      <td className="px-5 py-3.5 font-bold font-mono text-gray-900 dark:text-white">
                        ₹{Number(order.grandTotal || 0).toFixed(2)}
                        {order.discountAmount > 0 && (
                          <span className="block text-[10px] text-emerald-600 dark:text-emerald-400">
                            -₹{order.discountAmount} promo
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {order.paymentMethod}
                        </span>
                        <span className="block text-[10px] text-emerald-600 font-bold uppercase">
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                          title="View Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrint(order)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-[#DD5903] hover:bg-gray-100 dark:hover:bg-gray-800"
                          title="Print Invoice / Thermal Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {isDel && !terminal && (
                          <button
                            onClick={() => openRiderModal(order)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-sky-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                            title={order.riderName ? 'Change rider' : 'Assign rider'}
                          >
                            <Bike className="w-4 h-4" />
                          </button>
                        )}
                        {isDel && norm === 'out_for_delivery' && (
                          <button
                            onClick={() => openOtpModal(order)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                            title="Verify handover OTP"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                        )}
                        {!terminal && (
                          <button
                            onClick={() => setOrderToCancel(order)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-gray-100 dark:hover:bg-gray-800"
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
      {liveOrder && selectedOrder && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedOrder(null)}
          title={`Order #${liveOrder.orderNumber}`}
          subtitle={`Placed at ${new Date(liveOrder.orderTime).toLocaleString()} • ${branchName(liveOrder.branchId)}`}
          size="lg"
          footer={
            <>
              <Button variant="secondary" icon={Printer} onClick={() => handlePrint(liveOrder)}>
                Print Receipt
              </Button>
              {nextAction && (
                <Button
                  variant={nextAction.action === 'delivered' ? 'success' : undefined}
                  icon={nextAction.action === 'out_for_delivery' ? Bike : nextAction.action === 'delivered' ? KeyRound : CheckCircle2}
                  onClick={() => advanceOrder(liveOrder, nextAction.action)}
                >
                  {nextAction.label}
                </Button>
              )}
            </>
          }
        >
          <div className="space-y-6 text-xs">

            {/* Summary Top Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <span className="text-gray-400">Order Status</span>
                <p className="font-bold text-sm text-gray-900 dark:text-white mt-0.5">
                  {getStatusLabel(liveOrder.status)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <span className="text-gray-400">Order Type</span>
                <p className="font-bold text-sm text-gray-900 dark:text-white capitalize mt-0.5">
                  {liveOrder.orderType}
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
                  {liveOrder.customerName}
                </p>
              </div>
            </div>

            {/* Workflow timeline */}
            {timeline.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Progress</h4>
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {timeline.map((step, idx) => (
                    <div key={step.key} className="flex items-center gap-1 flex-shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${
                        step.current
                          ? 'bg-[#DD5903] text-white'
                          : step.done
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                      }`}>
                        {step.label}
                      </span>
                      {idx < timeline.length - 1 && <span className="text-gray-300 dark:text-gray-600">→</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delivery panel */}
            {isDeliveryLive && (
              <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/50 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
                  <Bike className="w-4 h-4" /> Delivery Details
                </h4>
                <p className="flex items-start gap-1.5 text-gray-700 dark:text-gray-200">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>{liveOrder.deliveryAddress || '—'}{liveOrder.deliveryLandmark ? ` (${liveOrder.deliveryLandmark})` : ''}</span>
                </p>
                {liveOrder.deliveryInstructions && (
                  <p className="text-gray-500 italic">“{liveOrder.deliveryInstructions}”</p>
                )}
                <p className="flex items-center gap-1.5 text-gray-700 dark:text-gray-200">
                  <User className="w-3.5 h-3.5" />
                  <span>Rider: <strong>{liveOrder.riderName || 'Not assigned yet'}</strong></span>
                  {liveOrder.riderPhone && (
                    <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />{liveOrder.riderPhone}</span>
                  )}
                  <button onClick={() => openRiderModal(liveOrder)} className="ml-auto text-sky-600 hover:underline font-bold">
                    {liveOrder.riderName ? 'Change' : 'Assign'}
                  </button>
                </p>
                {liveOrder.deliveryOtp && ['out_for_delivery', 'delivered'].includes(normalizeOrderStatus(liveOrder.status)) && (
                  <p className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#DD5903]" />
                    <span>Handover OTP: <strong className="font-mono tracking-[0.25em] text-[#DD5903]">{liveOrder.deliveryOtp}</strong></span>
                    {normalizeOrderStatus(liveOrder.status) === 'out_for_delivery' && (
                      <button onClick={() => openOtpModal(liveOrder)} className="ml-auto text-emerald-600 hover:underline font-bold">
                        Verify OTP
                      </button>
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Line Items Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Order Items ({(liveOrder.items || []).length})
              </h4>
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
                {(liveOrder.items || []).map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">
                        {item.quantity}x {item.name}
                        {item.variant && item.variant !== 'Standard' && (
                          <span className="text-xs font-normal text-gray-500 ml-1.5">
                            ({typeof item.variant === 'object' ? item.variant.name : item.variant})
                          </span>
                        )}
                      </p>
                      {item.addons && item.addons.length > 0 && (
                        <p className="text-[11px] text-[#DD5903]">
                          Add-ons: {item.addons.map((a) => a.name).join(', ')}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-[11px] text-gray-400 italic">
                          * Note: {item.notes}
                        </p>
                      )}
                    </div>
                    <span className="font-mono font-bold text-gray-900 dark:text-white text-sm">
                      ₹{Number(item.totalPrice ?? (Number(item.price || 0) * Number(item.quantity || 1))).toFixed(2)}
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
                  <span className="font-mono">-₹{Number(liveOrder.discountAmount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Tax & GST</span>
                <span className="font-mono text-gray-900 dark:text-white">₹{Number(liveOrder.taxAmount || 0).toFixed(2)}</span>
              </div>
              {liveOrder.serviceCharge > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Service Charge</span>
                  <span className="font-mono text-gray-900 dark:text-white">₹{Number(liveOrder.serviceCharge).toFixed(2)}</span>
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

      {/* ================= RIDER ASSIGNMENT MODAL ================= */}
      {riderModalOrder && (
        <Modal
          isOpen={true}
          onClose={() => setRiderModalOrder(null)}
          title={`Assign Rider — #${riderModalOrder.orderNumber}`}
          subtitle={riderModalOrder.deliveryAddress || 'Delivery order'}
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setRiderModalOrder(null)}>Cancel</Button>
              <Button icon={Bike} disabled={riderBusy} onClick={handleAssignRider}>
                {riderBusy ? 'Assigning…' : 'Assign Rider'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleAssignRider} className="space-y-3 text-xs">
            {riderError && (
              <p className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600">{riderError}</p>
            )}
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Rider Name *</label>
              <input
                autoFocus
                value={riderName}
                onChange={(e) => setRiderName(e.target.value)}
                placeholder="e.g. Arjun Rider"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Rider Phone</label>
              <input
                value={riderPhone}
                onChange={(e) => setRiderPhone(e.target.value)}
                placeholder="+91 …"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* ================= OTP VERIFICATION MODAL ================= */}
      {otpModalOrder && (
        <Modal
          isOpen={true}
          onClose={() => setOtpModalOrder(null)}
          title={`Handover OTP — #${otpModalOrder.orderNumber}`}
          subtitle="Ask the customer for the 4-digit code in their tracker"
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setOtpModalOrder(null)}>Cancel</Button>
              <Button variant="success" icon={KeyRound} disabled={otpBusy} onClick={handleVerifyOtp}>
                {otpBusy ? 'Verifying…' : 'Verify & Deliver'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleVerifyOtp} className="space-y-3 text-xs">
            {otpError && (
              <p className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600">{otpError}</p>
            )}
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">4-digit OTP</label>
              <input
                autoFocus
                inputMode="numeric"
                maxLength={4}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono text-center text-2xl tracking-[0.5em]"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* ================= CANCEL CONFIRMATION ================= */}
      {orderToCancel && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setOrderToCancel(null)}
          title={`Cancel Order #${orderToCancel.orderNumber}`}
          message="Are you sure you want to cancel this order? Table reservations and associated items will be released."
          confirmText="Yes, Cancel Order"
          onConfirm={() => { cancelOrder(orderToCancel.id, 'Cancelled via Order Dashboard'); setOrderToCancel(null); }}
        />
      )}

    </div>
  );
}
