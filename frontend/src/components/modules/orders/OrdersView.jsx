import React, { useState } from 'react';
import { useCafe } from '../../../context/CafeContext';
import { printOrderReceipt } from '../../../services/receiptPrinter';
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
  Clock,
  Filter,
  Download,
  Calendar,
  CheckCircle2,
  Receipt,
  FileText
} from 'lucide-react';

export default function OrdersView() {
  const { orders, cancelOrder, updateOrderStatus, settings } = useCafe();
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderToCancel, setOrderToCancel] = useState(null);

  // Filtered Orders
  const filteredOrders = orders.filter((order) => {
    const matchStatus =
      statusFilter === 'all' || order.status.toLowerCase() === statusFilter.toLowerCase();
    const matchType =
      typeFilter === 'all' || order.orderType.toLowerCase() === typeFilter.toLowerCase();
    const matchSearch =
      searchQuery.trim() === '' ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery);
    return matchStatus && matchType && matchSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return <Badge variant="success" dot>{status}</Badge>;
      case 'Ready':
        return <Badge variant="primary" dot>{status}</Badge>;
      case 'Preparing':
        return <Badge variant="warning" dot>{status}</Badge>;
      case 'Cancelled':
        return <Badge variant="error" dot>{status}</Badge>;
      default:
        return <Badge variant="info" dot>{status}</Badge>;
    }
  };

  const handlePrint = (order) => {
    printOrderReceipt(order, settings);
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
            Order Management
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Track dining tickets, takeaway deliveries, invoices, and preparation timelines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={() => alert('Exporting all order logs to CSV...')}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 text-xs font-semibold">
            {[
              { id: 'all', label: 'All Orders' },
              { id: 'new', label: 'New' },
              { id: 'preparing', label: 'Preparing' },
              { id: 'ready', label: 'Ready' },
              { id: 'completed', label: 'Completed' },
              { id: 'cancelled', label: 'Cancelled' }
            ].map((tab) => (
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

          {/* Search & Order Type Filter */}
          <div className="flex items-center gap-3 w-full md:w-auto">
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

            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search order #, guest..."
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
                <th className="px-5 py-3.5">Customer</th>
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
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-mono font-bold text-gray-900 dark:text-white">
                      {order.orderNumber}
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
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                      {order.items.length} items
                    </td>
                    <td className="px-5 py-3.5 font-bold font-mono text-gray-900 dark:text-white">
                      ₹{order.grandTotal.toFixed(2)}
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
                    <td className="px-5 py-3.5 text-right space-x-1">
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
                      {order.status !== 'Cancelled' && order.status !== 'Completed' && (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ================= ORDER DETAILS MODAL ================= */}
      {selectedOrder && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedOrder(null)}
          title={`Order #${selectedOrder.orderNumber}`}
          subtitle={`Placed at ${new Date(selectedOrder.orderTime).toLocaleString()}`}
          size="lg"
          footer={
            <>
              <Button
                variant="secondary"
                icon={Printer}
                onClick={() => handlePrint(selectedOrder)}
              >
                Print Receipt
              </Button>
              {selectedOrder.status === 'Preparing' && (
                <Button
                  variant="success"
                  onClick={() => {
                    updateOrderStatus(selectedOrder.id, 'Ready');
                    setSelectedOrder(null);
                  }}
                >
                  Mark as Ready
                </Button>
              )}
              {selectedOrder.status === 'Ready' && (
                <Button
                  onClick={() => {
                    updateOrderStatus(selectedOrder.id, 'Completed');
                    setSelectedOrder(null);
                  }}
                >
                  Mark Completed
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
                  {selectedOrder.status}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <span className="text-gray-400">Order Type</span>
                <p className="font-bold text-sm text-gray-900 dark:text-white capitalize mt-0.5">
                  {selectedOrder.orderType}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <span className="text-gray-400">Table / Seat</span>
                <p className="font-bold text-sm text-gray-900 dark:text-white mt-0.5">
                  {selectedOrder.tableNumber || 'N/A'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <span className="text-gray-400">Customer</span>
                <p className="font-bold text-sm text-gray-900 dark:text-white mt-0.5 truncate">
                  {selectedOrder.customerName}
                </p>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Order Items ({selectedOrder.items.length})
              </h4>
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">
                        {item.quantity}x {item.name}
                        {item.variant !== 'Standard' && (
                          <span className="text-xs font-normal text-gray-500 ml-1.5">
                            ({item.variant})
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
                      ₹{item.totalPrice.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Billing Summary */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-gray-800 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-mono text-gray-900 dark:text-white">₹{selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              {selectedOrder.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount {selectedOrder.couponCode ? `(${selectedOrder.couponCode})` : ''}</span>
                  <span className="font-mono">-₹{selectedOrder.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Tax & GST</span>
                <span className="font-mono text-gray-900 dark:text-white">₹{selectedOrder.taxAmount.toFixed(2)}</span>
              </div>
              {selectedOrder.serviceCharge > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Service Charge</span>
                  <span className="font-mono text-gray-900 dark:text-white">₹{selectedOrder.serviceCharge.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                <span>Grand Total</span>
                <span className="font-mono text-[#DD5903]">₹{selectedOrder.grandTotal.toFixed(2)}</span>
              </div>
            </div>

          </div>
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
          onConfirm={() => cancelOrder(orderToCancel.id, 'Cancelled via Order Dashboard')}
        />
      )}

    </div>
  );
}
