import React, { useState, useEffect } from 'react';
import { X, QrCode, Download, Printer, Copy, Check, RefreshCw, Power, AlertCircle, ShoppingBag, Clock } from 'lucide-react';
import { qrPrintService } from '../../../services/qrPrintService';
import { api } from '../../../services/api';

export default function QrCodeModal({ table, isOpen, onClose, onTableUpdated, cafeSettings }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const orderingUrl = table ? qrPrintService.getOrderingUrl(table.qrToken) : '';

  useEffect(() => {
    if (table && isOpen) {
      qrPrintService.generateDataUrl(orderingUrl, { width: 500 })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error(err));

      // Fetch latest active orders
      setLoadingOrders(true);
      api.getTableActiveOrders(table.id)
        .then(orders => setActiveOrders(orders || []))
        .catch(err => console.error('Failed to load active orders:', err))
        .finally(() => setLoadingOrders(false));
    }
  }, [table, isOpen, orderingUrl]);

  if (!isOpen || !table) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(orderingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    await qrPrintService.downloadQrPng(table);
  };

  const handlePrint = async () => {
    await qrPrintService.printSingleTable(table, cafeSettings || {});
  };

  const handleRegenerate = async () => {
    if (!window.confirm(`Are you sure you want to regenerate the QR code for Table ${table.tableNumber}? Any existing printed QR card will immediately stop working.`)) {
      return;
    }

    try {
      setIsRegenerating(true);
      const updated = await api.regenerateTableQr(table.id);
      if (onTableUpdated) onTableUpdated(updated);
    } catch (err) {
      alert('Failed to regenerate QR code: ' + err.message);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleToggleStatus = async () => {
    const nextStatus = table.qrStatus === 'active' ? 'disabled' : 'active';
    try {
      setIsTogglingStatus(true);
      const updated = await api.setTableQrStatus(table.id, nextStatus);
      if (onTableUpdated) onTableUpdated(updated);
    } catch (err) {
      alert('Failed to toggle QR status: ' + err.message);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl max-w-2xl w-full border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#181818]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-[#DD5903] flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Table {table.tableNumber} QR Ordering
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                  table.qrStatus === 'active' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {table.qrStatus === 'active' ? 'Active' : 'Disabled'}
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {table.zone} • Capacity: {table.capacity} Guests • Floor Status: <span className="font-semibold">{table.status}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left: High-Res QR Canvas Card */}
          <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-[#141414] p-6 rounded-xl border border-gray-200 dark:border-gray-800 text-center">
            {qrDataUrl ? (
              <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200 relative group">
                <img src={qrDataUrl} alt={`QR Code for Table ${table.tableNumber}`} className="w-48 h-48 block" />
                {table.qrStatus === 'disabled' && (
                  <div className="absolute inset-0 bg-red-900/70 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center p-2 text-white">
                    <AlertCircle className="w-8 h-8 text-red-300 mb-1" />
                    <span className="text-xs font-bold uppercase tracking-wider">Ordering Disabled</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-48 h-48 bg-gray-200 dark:bg-gray-800 rounded-xl flex items-center justify-center animate-pulse">
                <QrCode className="w-12 h-12 text-gray-400" />
              </div>
            )}

            <div className="mt-4">
              <span className="text-sm font-bold text-gray-900 dark:text-white">TABLE {table.tableNumber}</span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Scan with any phone camera or Google Lens</p>
            </div>

            {/* Direct Ordering Link Copy Box */}
            <div className="w-full mt-4 flex items-center gap-2 bg-white dark:bg-[#1c1c1c] border border-gray-300 dark:border-gray-700 rounded-lg p-1.5 pl-3">
              <input
                type="text"
                readOnly
                value={orderingUrl}
                className="text-xs text-gray-600 dark:text-gray-300 bg-transparent flex-1 outline-none truncate font-mono"
              />
              <button
                onClick={handleCopyLink}
                className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded flex items-center gap-1 transition-colors cursor-pointer"
                title="Copy Direct URL"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Right: Actions, Token Details, and Active Orders */}
          <div className="flex flex-col justify-between space-y-4">
            
            {/* Quick Actions Grid */}
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
                QR Operations
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                
                {/* Print Button */}
                <button
                  onClick={handlePrint}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#DD5903] hover:bg-[#c44e02] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Table Card</span>
                </button>

                {/* Download Button */}
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-800 hover:bg-gray-900 text-white dark:bg-gray-700 dark:hover:bg-gray-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PNG</span>
                </button>

                {/* Regenerate Token Button */}
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  title="Revokes the previous QR and generates a fresh token"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                  <span>Regenerate QR</span>
                </button>

                {/* Enable/Disable Button */}
                <button
                  onClick={handleToggleStatus}
                  disabled={isTogglingStatus}
                  className={`flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
                    table.qrStatus === 'active'
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 border-red-500/30'
                      : 'bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 border-green-500/30'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{table.qrStatus === 'active' ? 'Disable Ordering' : 'Enable Ordering'}</span>
                </button>
              </div>
            </div>

            {/* Token Security Metadata */}
            <div className="bg-gray-50 dark:bg-[#161616] p-3 rounded-xl border border-gray-200 dark:border-gray-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Secure Token:</span>
                <span className="font-mono text-gray-800 dark:text-gray-200 font-bold">{table.qrToken.substring(0, 16)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Created:</span>
                <span className="text-gray-800 dark:text-gray-200">{new Date(table.qrCreatedAt || Date.now()).toLocaleDateString()}</span>
              </div>
              {table.qrRegeneratedAt && (
                <div className="flex justify-between text-amber-600 dark:text-amber-400">
                  <span>Last Regenerated:</span>
                  <span>{new Date(table.qrRegeneratedAt).toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Active Sitting Orders Summary */}
            <div className="bg-orange-50/60 dark:bg-[#1a1510] border border-orange-200 dark:border-orange-900/30 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#DD5903] flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Active Sitting Orders ({activeOrders.length})
                </span>
                {activeOrders.length > 0 && (
                  <span className="text-xs font-extrabold text-gray-900 dark:text-white">
                    Total: ₹{activeOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0).toFixed(2)}
                  </span>
                )}
              </div>

              {loadingOrders ? (
                <div className="text-xs text-gray-500 py-2 text-center">Loading orders...</div>
              ) : activeOrders.length === 0 ? (
                <div className="text-xs text-gray-500 dark:text-gray-400 py-1">
                  No active orders currently placed at Table {table.tableNumber}.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {activeOrders.map(order => (
                    <div key={order.id} className="flex items-center justify-between text-xs bg-white dark:bg-[#202020] p-2 rounded-lg border border-gray-200 dark:border-gray-800">
                      <div>
                        <span className="font-bold text-gray-900 dark:text-white">#{order.orderNumber}</span>
                        <span className="text-gray-500 dark:text-gray-400 text-[10px] ml-2">({order.items.length} items)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          order.status === 'Ready' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {order.status}
                        </span>
                        <span className="font-bold text-gray-900 dark:text-white">₹{order.grandTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-[#181818] border-t border-gray-200 dark:border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
