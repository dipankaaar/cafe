import React, { useState } from 'react';
import { useCafe } from '../../../context/CafeContext';
import Card from '../../common/Card';
import Badge from '../../common/Badge';
import Button from '../../common/Button';
import Modal from '../../common/Modal';
import {
  CalendarDays,
  Plus,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  UserCheck,
  Search,
  Calendar
} from 'lucide-react';

export default function ReservationsView({ onNavigate }) {
  const { reservations, tables, addReservation, updateReservationStatus } = useCafe();
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [resDate, setResDate] = useState(new Date().toISOString().split('T')[0]);
  const [resTime, setResTime] = useState('18:00');
  const [resGuests, setResGuests] = useState(2);
  const [selectedTableId, setSelectedTableId] = useState(tables[0]?.id || '');
  const [specialRequest, setSpecialRequest] = useState('');

  const filteredReservations = reservations.filter((r) => {
    const matchStatus = statusFilter === 'all' || r.status.toLowerCase() === statusFilter.toLowerCase();
    const matchDate = !dateFilter || r.date === dateFilter;
    return matchStatus && matchDate;
  });

  const handleSaveReservation = (e) => {
    e.preventDefault();
    if (!guestName || !guestPhone) return;

    const tableObj = tables.find((t) => t.id === selectedTableId);

    addReservation({
      customerName: guestName,
      phone: guestPhone,
      email: guestEmail || `${guestName.toLowerCase().replace(/\s+/g, '')}@guest.com`,
      date: resDate,
      time: resTime,
      guests: Number(resGuests),
      tableId: selectedTableId,
      tableNumber: tableObj?.tableNumber || 'T-01',
      specialRequest
    });

    setIsAddModalOpen(false);
    setGuestName('');
    setGuestPhone('');
    setGuestEmail('');
    setSpecialRequest('');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed':
        return <Badge variant="success" dot>{status}</Badge>;
      case 'Seated':
        return <Badge variant="primary" dot>{status}</Badge>;
      case 'Pending':
        return <Badge variant="warning" dot>{status}</Badge>;
      case 'Cancelled':
      case 'No-show':
        return <Badge variant="error" dot>{status}</Badge>;
      default:
        return <Badge variant="default" dot>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
            Table Reservations
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Manage advance table bookings, seating allocations, and dining requests.
          </p>
        </div>

        <Button onClick={() => setIsAddModalOpen(true)} size="sm" icon={Plus}>
          New Booking
        </Button>
      </div>

      {/* Date & Status Filters */}
      <Card className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 text-xs font-semibold">
          {['all', 'confirmed', 'pending', 'seated', 'completed', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap capitalize transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#DD5903] text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {st === 'all' ? 'All Statuses' : st}
            </button>
          ))}
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 text-xs">
          <label className="font-bold text-gray-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Date:
          </label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1 text-xs text-gray-900 dark:text-white outline-none"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-[11px] text-[#DD5903] hover:underline font-semibold"
            >
              Show All Dates
            </button>
          )}
        </div>

      </Card>

      {/* Reservations Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-50 dark:bg-[#141414] border-b border-gray-200 dark:border-gray-800 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Guest Name</th>
                <th className="px-5 py-3.5">Contact Details</th>
                <th className="px-5 py-3.5">Date & Time</th>
                <th className="px-5 py-3.5">Party Size</th>
                <th className="px-5 py-3.5">Allocated Table</th>
                <th className="px-5 py-3.5">Special Requests</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-400">
                    No reservations found for selected criteria.
                  </td>
                </tr>
              ) : (
                filteredReservations.map((res) => (
                  <tr key={res.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                    <td className="px-5 py-3.5 font-bold text-gray-900 dark:text-white">
                      {res.customerName}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                      <div>{res.phone}</div>
                      <div className="text-[10px] text-gray-400">{res.email}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {res.time}
                      </span>
                      <span className="block text-[10px] text-gray-400 font-mono">
                        {res.date}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-300">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        {res.guests} Guests
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold font-mono text-[#DD5903] bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded">
                        Table {res.tableNumber}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 max-w-xs truncate">
                      {res.specialRequest || 'None'}
                    </td>
                    <td className="px-5 py-3.5">
                      {getStatusBadge(res.status)}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1">
                      {res.status === 'Confirmed' && (
                        <button
                          onClick={() => updateReservationStatus(res.id, 'Seated')}
                          className="px-2.5 py-1 bg-[#DD5903] text-white rounded text-[11px] font-bold hover:bg-[#b84700] transition-colors cursor-pointer"
                          title="Mark Guest as Seated"
                        >
                          Seat Guest
                        </button>
                      )}
                      {res.status === 'Pending' && (
                        <button
                          onClick={() => updateReservationStatus(res.id, 'Confirmed')}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
                        >
                          Confirm
                        </button>
                      )}
                      {res.status === 'Seated' && (
                        <button
                          onClick={() => updateReservationStatus(res.id, 'Completed')}
                          className="px-2.5 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Complete
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

      {/* ================= NEW RESERVATION MODAL ================= */}
      {isAddModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAddModalOpen(false)}
          title="Create New Table Reservation"
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveReservation}>
                Confirm Reservation
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveReservation} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Guest Name *
                </label>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Liam Smith"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+61 400 999 888"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={resDate}
                  onChange={(e) => setResDate(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Time</label>
                <input
                  type="time"
                  required
                  value={resTime}
                  onChange={(e) => setResTime(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Party Size</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={resGuests}
                  onChange={(e) => setResGuests(Number(e.target.value))}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Select Table</label>
              <select
                value={selectedTableId}
                onChange={(e) => setSelectedTableId(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
              >
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tableNumber} ({t.zone}) — Capacity: {t.capacity}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Special Occasion / Dietary Notes</label>
              <textarea
                rows={2}
                value={specialRequest}
                onChange={(e) => setSpecialRequest(e.target.value)}
                placeholder="e.g. Birthday anniversary, high chair needed, window preference..."
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none resize-none"
              />
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}
