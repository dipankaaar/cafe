import React, { useState } from 'react';
import { QrCode, Printer, Download, Copy, Check, RefreshCw, Power, Search, Filter, AlertCircle, ShoppingBag, Eye, ExternalLink } from 'lucide-react';
import { qrPrintService } from '../../../services/qrPrintService';
import { api } from '../../../services/api';
import QrCodeModal from './QrCodeModal';

export default function QrTableManagementTab({ tables, onTableUpdated, cafeSettings }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState('all');
  const [selectedQrStatus, setSelectedQrStatus] = useState('all');
  const [selectedTableForModal, setSelectedTableForModal] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [isBulkPrinting, setIsBulkPrinting] = useState(false);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);

  // Filter Tables
  const filteredTables = tables.filter(t => {
    const matchesSearch = t.tableNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.zone && t.zone.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesZone = selectedZone === 'all' || t.zone === selectedZone;
    const matchesStatus = selectedQrStatus === 'all' || t.qrStatus === selectedQrStatus;
    return matchesSearch && matchesZone && matchesStatus;
  });

  const zones = Array.from(new Set(tables.map(t => t.zone).filter(Boolean)));

  // Metric summaries
  const totalTables = tables.length;
  const activeQrCount = tables.filter(t => t.qrStatus === 'active').length;
  const disabledQrCount = tables.filter(t => t.qrStatus === 'disabled').length;
  const totalActiveOrders = tables.reduce((sum, t) => sum + (t.activeOrdersCount || 0), 0);

  const handleCopyLink = (table) => {
    const url = qrPrintService.getOrderingUrl(table.qrToken);
    navigator.clipboard.writeText(url);
    setCopiedId(table.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePrintSingle = (table) => {
    qrPrintService.printSingleTable(table, cafeSettings || {});
  };

  const handleDownloadSingle = (table) => {
    qrPrintService.downloadQrPng(table);
  };

  const handleToggleStatus = async (table) => {
    const nextStatus = table.qrStatus === 'active' ? 'disabled' : 'active';
    try {
      const updated = await api.setTableQrStatus(table.id, nextStatus);
      if (onTableUpdated) onTableUpdated(updated);
    } catch (err) {
      alert('Failed to toggle QR status: ' + err.message);
    }
  };

  const handleRegenerate = async (table) => {
    if (!window.confirm(`Regenerate QR token for Table ${table.tableNumber}? Old printed QRs will stop working immediately.`)) {
      return;
    }
    try {
      const updated = await api.regenerateTableQr(table.id);
      if (onTableUpdated) onTableUpdated(updated);
    } catch (err) {
      alert('Failed to regenerate QR code: ' + err.message);
    }
  };

  const handleBulkPrint = async () => {
    setIsBulkPrinting(true);
    try {
      await qrPrintService.printAllTables(filteredTables, cafeSettings || {});
    } catch (err) {
      alert('Failed to launch bulk print: ' + err.message);
    } finally {
      setIsBulkPrinting(false);
    }
  };

  const handleBulkDownload = async () => {
    setIsBulkDownloading(true);
    try {
      for (const table of filteredTables) {
        await qrPrintService.downloadQrPng(table);
        // Small delay to prevent browser download throttling
        await new Promise(res => setTimeout(res, 200));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsBulkDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Table QRs</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{totalTables}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Unique tokens assigned</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-[#DD5903] flex items-center justify-center">
            <QrCode className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Ordering</p>
            <h3 className="text-2xl font-black text-green-600 dark:text-green-400 mt-1">{activeQrCount}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Ready for scanning</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 flex items-center justify-center">
            <Power className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Disabled QRs</p>
            <h3 className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{disabledQrCount}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Self-order blocked</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active QR Orders</p>
            <h3 className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-1">{totalActiveOrders}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">In kitchen / preparing</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-[#DD5903] flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Action Bar & Controls */}
      <div className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search table or zone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-[#DD5903] transition-colors"
            />
          </div>

          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-700 dark:text-gray-300 outline-none focus:border-[#DD5903] cursor-pointer"
          >
            <option value="all">All Zones</option>
            {zones.map(z => <option key={z} value={z}>{z}</option>)}
          </select>

          <select
            value={selectedQrStatus}
            onChange={(e) => setSelectedQrStatus(e.target.value)}
            className="bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-700 dark:text-gray-300 outline-none focus:border-[#DD5903] cursor-pointer"
          >
            <option value="all">All QR Statuses</option>
            <option value="active">Active Only</option>
            <option value="disabled">Disabled Only</option>
          </select>
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={handleBulkDownload}
            disabled={isBulkDownloading || filteredTables.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isBulkDownloading ? 'Downloading...' : 'Download All QRs'}</span>
          </button>

          <button
            onClick={handleBulkPrint}
            disabled={isBulkPrinting || filteredTables.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#DD5903] hover:bg-[#c44e02] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>{isBulkPrinting ? 'Preparing Print...' : 'Bulk Print All Cards'}</span>
          </button>
        </div>

      </div>

      {/* Main Tables QR Table */}
      <div className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-[#181818] text-[11px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">
                <th className="py-3.5 px-5">Table</th>
                <th className="py-3.5 px-4">Zone & Capacity</th>
                <th className="py-3.5 px-4">Floor Status</th>
                <th className="py-3.5 px-4">QR Status</th>
                <th className="py-3.5 px-4">Active Orders</th>
                <th className="py-3.5 px-4 text-center">Direct Link</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
              {filteredTables.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No tables match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTables.map((table) => {
                  const isCopied = copiedId === table.id;
                  const hasActiveOrders = (table.activeOrdersCount || 0) > 0;

                  return (
                    <tr 
                      key={table.id}
                      className="hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors group"
                    >
                      {/* Table Number */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-[#DD5903] flex items-center justify-center font-bold text-sm">
                            {table.tableNumber}
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 dark:text-white block">Table {table.tableNumber}</span>
                            <span className="text-[10px] text-gray-400 font-mono">Token: {table.qrToken.substring(0, 10)}...</span>
                          </div>
                        </div>
                      </td>

                      {/* Zone & Capacity */}
                      <td className="py-4 px-4">
                        <span className="font-medium text-gray-800 dark:text-gray-200 block">{table.zone}</span>
                        <span className="text-[11px] text-gray-400">Capacity: {table.capacity} Seats</span>
                      </td>

                      {/* Floor Status */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
                          table.status === 'Available'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : table.status === 'Occupied'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : table.status === 'Reserved'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        }`}>
                          {table.status}
                        </span>
                      </td>

                      {/* QR Status with Quick Switch */}
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleToggleStatus(table)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase transition-all cursor-pointer ${
                            table.qrStatus === 'active'
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400'
                          }`}
                          title={`Click to ${table.qrStatus === 'active' ? 'disable' : 'enable'} QR table ordering`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${table.qrStatus === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                          <span>{table.qrStatus === 'active' ? 'Active' : 'Disabled'}</span>
                        </button>
                      </td>

                      {/* Active Orders Count */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                            hasActiveOrders
                              ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 animate-pulse'
                              : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                            {table.activeOrdersCount || 0} active
                          </span>
                        </div>
                      </td>

                      {/* Direct Link Copy Button */}
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopyLink(table)}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                            title="Copy Ordering URL"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <a
                            href={qrPrintService.getOrderingUrl(table.qrToken)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                            title="Test Order Page in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Modal */}
                          <button
                            onClick={() => setSelectedTableForModal(table)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold rounded-lg transition-colors cursor-pointer"
                            title="View Full QR Code & Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>

                          {/* Print Card */}
                          <button
                            onClick={() => handlePrintSingle(table)}
                            className="p-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-[#DD5903] rounded-lg transition-colors cursor-pointer"
                            title="Print Table Tent Card"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Download PNG */}
                          <button
                            onClick={() => handleDownloadSingle(table)}
                            className="p-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors cursor-pointer"
                            title="Download PNG QR Code"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* Regenerate Token */}
                          <button
                            onClick={() => handleRegenerate(table)}
                            className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg transition-colors cursor-pointer"
                            title="Regenerate QR Token"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Details Modal */}
      {selectedTableForModal && (
        <QrCodeModal
          table={selectedTableForModal}
          isOpen={!!selectedTableForModal}
          onClose={() => setSelectedTableForModal(null)}
          onTableUpdated={(updated) => {
            if (onTableUpdated) onTableUpdated(updated);
            setSelectedTableForModal(updated);
          }}
          cafeSettings={cafeSettings}
        />
      )}

    </div>
  );
}
