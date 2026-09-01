import React, { useState } from 'react';
import { useCafe } from '../../../context/CafeContext';
import Card from '../../common/Card';
import Badge from '../../common/Badge';
import Button from '../../common/Button';
import Modal from '../../common/Modal';
import QrTableManagementTab from './QrTableManagementTab';
import {
  Grid,
  Plus,
  Users,
  Utensils,
  CheckCircle,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  RefreshCw,
  QrCode,
  LayoutGrid
} from 'lucide-react';

export default function TableManagementView({ onNavigate }) {
  const { tables, orders, updateTableStatus, addTable, cafeSettings, refreshData } = useCafe();
  
  const [activeTab, setActiveTab] = useState('floor-plan'); // 'floor-plan' | 'qr-ordering'
  const [selectedZone, setSelectedZone] = useState('all');
  const [selectedTableForAction, setSelectedTableForAction] = useState(null);
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);

  // New Table Form
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newZone, setNewZone] = useState('Indoor Cafe');
  const [newCapacity, setNewCapacity] = useState(4);

  const zones = ['Indoor Cafe', 'Garden Terrace'];

  const filteredTables = tables.filter((t) =>
    selectedZone === 'all' ? true : t.zone === selectedZone
  );

  const handleSaveTable = (e) => {
    e.preventDefault();
    if (!newTableNumber.trim()) return;

    addTable({
      tableNumber: newTableNumber.trim().toUpperCase(),
      zone: newZone,
      capacity: Number(newCapacity)
    });

    setIsAddTableModalOpen(false);
    setNewTableNumber('');
    setNewCapacity(4);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Occupied':
        return 'border-[#DD5903] bg-orange-50/50 dark:bg-orange-950/20 text-[#DD5903]';
      case 'Reserved':
        return 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600';
      case 'Cleaning':
        return 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-600';
      default:
        return 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-600';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
            Table & QR Operations
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Visual floor plan seating, table turnaround states, and automated QR table ordering.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setIsAddTableModalOpen(true)} size="sm" icon={Plus}>
            Add Table
          </Button>
        </div>
      </div>

      {/* Main Section Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-1">
        <button
          onClick={() => setActiveTab('floor-plan')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'floor-plan'
              ? 'bg-[#DD5903] text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Floor Plan View</span>
        </button>

        <button
          onClick={() => setActiveTab('qr-ordering')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'qr-ordering'
              ? 'bg-[#DD5903] text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>QR Table Ordering</span>
        </button>
      </div>

      {/* RENDER QR ORDERING SUB-SECTION */}
      {activeTab === 'qr-ordering' ? (
        <QrTableManagementTab
          tables={tables}
          onTableUpdated={() => refreshData && refreshData()}
          cafeSettings={cafeSettings}
        />
      ) : (
        /* RENDER FLOOR PLAN SUB-SECTION */
        <>
          {/* Zone Switcher and Legend */}
          <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Zone Tabs */}
            <div className="flex items-center gap-2 text-xs font-semibold">
              <button
                onClick={() => setSelectedZone('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  selectedZone === 'all'
                    ? 'bg-[#DD5903] text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                All Zones ({tables.length})
              </button>
              {zones.map((z) => (
                <button
                  key={z}
                  onClick={() => setSelectedZone(z)}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    selectedZone === z
                      ? 'bg-[#DD5903] text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {z} ({tables.filter((t) => t.zone === z).length})
                </button>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 text-[11px] font-semibold">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-gray-600 dark:text-gray-400">Available</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#DD5903]" />
                <span className="text-gray-600 dark:text-gray-400">Occupied</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-gray-600 dark:text-gray-400">Reserved</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-gray-600 dark:text-gray-400">Cleaning</span>
              </div>
            </div>

          </Card>

          {/* Visual Floor Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredTables.map((table) => {
              const associatedOrder = orders.find((o) => o.id === table.currentOrderId);

              return (
                <div
                  key={table.id}
                  onClick={() => setSelectedTableForAction(table)}
                  className={`p-5 rounded-2xl border-2 transition-all shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between h-44 bg-white dark:bg-[#181818] ${getStatusColor(
                    table.status
                  )}`}
                >
                  {/* Top Row: Table ID & Capacity */}
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold font-mono text-gray-900 dark:text-white">
                      {table.tableNumber}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500 font-semibold bg-white/80 dark:bg-black/40 px-2 py-0.5 rounded-full">
                      <Users className="w-3.5 h-3.5" />
                      {table.capacity}
                    </span>
                  </div>

                  {/* Center: Guest Name or Status details */}
                  <div className="my-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider block">
                      {table.zone}
                    </span>
                    {table.status === 'Occupied' && (
                      <div className="mt-1">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {table.customerName || 'Dining Guests'}
                        </p>
                        {associatedOrder && (
                          <p className="text-[10px] text-[#DD5903] font-mono font-semibold">
                            Order {associatedOrder.orderNumber} • ₹{associatedOrder.grandTotal}
                          </p>
                        )}
                      </div>
                    )}
                    {table.status === 'Reserved' && (
                      <p className="text-xs font-bold text-blue-600 truncate mt-1">
                        Booked: {table.customerName || 'Guest'}
                      </p>
                    )}
                    {table.status === 'Available' && (
                      <p className="text-xs text-emerald-600 font-medium mt-1">
                        Ready for seating
                      </p>
                    )}
                    {table.status === 'Cleaning' && (
                      <p className="text-xs text-amber-600 font-medium mt-1">
                        Sanitization in progress
                      </p>
                    )}
                  </div>

                  {/* Bottom Status Badge */}
                  <div className="flex items-center justify-between pt-2 border-t border-current/10 text-xs">
                    <Badge
                      size="sm"
                      variant={
                        table.status === 'Available'
                          ? 'success'
                          : table.status === 'Occupied'
                          ? 'primary'
                          : table.status === 'Reserved'
                          ? 'info'
                          : 'warning'
                      }
                      dot
                    >
                      {table.status}
                    </Badge>
                    <span className="text-[11px] font-semibold hover:underline">
                      Manage →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ================= TABLE ACTION MODAL ================= */}
      {selectedTableForAction && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTableForAction(null)}
          title={`Manage Table ${selectedTableForAction.tableNumber}`}
          subtitle={`${selectedTableForAction.zone} • Capacity: ${selectedTableForAction.capacity} Persons`}
          size="sm"
          footer={
            <Button variant="secondary" onClick={() => setSelectedTableForAction(null)}>
              Close
            </Button>
          }
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-2">
                Update Table Status:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Available', 'Occupied', 'Reserved', 'Cleaning'].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      updateTableStatus(selectedTableForAction.id, st);
                      setSelectedTableForAction(null);
                    }}
                    className={`p-2.5 rounded-lg border font-semibold text-left transition-colors cursor-pointer ${
                      selectedTableForAction.status === st
                        ? 'border-[#DD5903] bg-orange-50 dark:bg-orange-950/40 text-[#DD5903]'
                        : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {selectedTableForAction.status === 'Available' && (
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <Button
                  onClick={() => {
                    setSelectedTableForAction(null);
                    onNavigate('pos');
                  }}
                  fullWidth
                  size="sm"
                  icon={Utensils}
                >
                  Start New Order for Table {selectedTableForAction.tableNumber}
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ================= ADD NEW TABLE MODAL ================= */}
      {isAddTableModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAddTableModalOpen(false)}
          title="Add New Cafe Table"
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsAddTableModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTable}>
                Save Table
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveTable} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Table Identifier *
              </label>
              <input
                type="text"
                required
                value={newTableNumber}
                onChange={(e) => setNewTableNumber(e.target.value)}
                placeholder="e.g. T-09"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Floor Zone
              </label>
              <select
                value={newZone}
                onChange={(e) => setNewZone(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
              >
                <option value="Indoor Cafe">Indoor Cafe</option>
                <option value="Garden Terrace">Garden Terrace</option>
                <option value="Mezzanine Lounge">Mezzanine Lounge</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Seating Capacity
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={newCapacity}
                onChange={(e) => setNewCapacity(Number(e.target.value))}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
              />
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}
