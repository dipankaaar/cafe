import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  CheckCircle2, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  AlertCircle,
  Coffee,
  Info,
  CalendarCheck,
  Armchair
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCafe } from '../context/CafeContext';
import BrandLogo from '../components/common/BrandLogo';

export default function FindTablePage({ onNavigate }) {
  const { tables, addReservation } = useCafe();

  // Zone & Capacity Filters
  const [selectedZone, setSelectedZone] = useState('all');
  const [selectedCapacity, setSelectedCapacity] = useState('all');

  // Selected Table for Booking
  const [selectedTable, setSelectedTable] = useState(null);

  // Reservation Details
  const [guestCount, setGuestCount] = useState(2);
  const [reservationDate, setReservationDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reservationTime, setReservationTime] = useState('07:00 PM');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // Confirmation state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [formError, setFormError] = useState('');

  // Filter Tables
  const filteredTables = useMemo(() => {
    return tables.filter(t => {
      const matchesZone = selectedZone === 'all' || t.zone === selectedZone;
      const matchesCap = selectedCapacity === 'all' || 
                         (selectedCapacity === '2' && t.capacity <= 2) ||
                         (selectedCapacity === '4' && t.capacity === 4) ||
                         (selectedCapacity === '6+' && t.capacity >= 6);
      return matchesZone && matchesCap;
    });
  }, [tables, selectedZone, selectedCapacity]);

  // Handle Table Selection
  const handleSelectTable = (table) => {
    if (table.status === 'Occupied') {
      setFormError(`Table ${table.tableNumber} is currently occupied. Please select an Available table.`);
      return;
    }
    setFormError('');
    setSelectedTable(table);
    setGuestCount(Math.min(table.capacity, Math.max(1, guestCount)));
  };

  // Submit Reservation
  const handleReservationSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!selectedTable) {
      setFormError('Please select an available dining table from the floor layout.');
      return;
    }
    if (!customerName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 10) {
      setFormError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingData = {
        tableId: selectedTable.id,
        tableNumber: selectedTable.tableNumber,
        zone: selectedTable.zone,
        customerName: customerName.trim(),
        phone: customerPhone.trim(),
        customerPhone: customerPhone.trim(),
        guestCount: Number(guestCount),
        guests: Number(guestCount),
        date: reservationDate,
        time: reservationTime,
        specialRequests: specialRequests.trim() || 'Standard Table Dining Reservation',
        status: 'Confirmed'
      };

      const newRes = addReservation(bookingData);
      setConfirmedBooking(newRes || bookingData);

      confetti({
        particleCount: 130,
        spread: 85,
        origin: { y: 0.6 }
      });

    } catch (err) {
      setFormError('Reservation could not be processed: ' + (err.message || 'please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white font-['Plus_Jakarta_Sans',sans-serif] pb-24">
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#141414]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-gray-300 hover:text-[#DD5903] transition-colors py-1 px-2 rounded-lg hover:bg-white/5 cursor-pointer"
            title="Return to Home"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
          <div className="h-4 w-px bg-white/10 hidden sm:block" />
          <BrandLogo size="small" light={true} />
        </div>

        <button
          onClick={() => onNavigate('/order-online')}
          className="dinenos-btn !py-2 !px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer"
        >
          <span>Order Online</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Confirmed Booking Modal */}
      {confirmedBooking && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-6 shadow-2xl animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs uppercase tracking-widest text-[#DD5903] font-bold">Table Reserved</span>
              <h2 className="text-2xl sm:text-3xl font-bold font-['Arapey',serif] text-white mt-1">
                Table {confirmedBooking.tableNumber} is Booked!
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                We look forward to hosting you at Petuk Adda Cafe, Salboni.
              </p>
            </div>

            {/* Pass Card */}
            <div className="bg-[#111111] border border-white/10 rounded-2xl p-5 text-left space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Guest Name</p>
                  <p className="text-sm font-bold text-white">{confirmedBooking.customerName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Reserved Table</p>
                  <p className="text-sm font-bold font-mono text-[#DD5903]">Table {confirmedBooking.tableNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-gray-300 py-1">
                <div>
                  <p className="text-gray-400 text-[11px]">Date & Time:</p>
                  <p className="font-bold text-white">{confirmedBooking.date} • {confirmedBooking.time}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[11px]">Party Size:</p>
                  <p className="font-bold text-white">{confirmedBooking.guests || confirmedBooking.guestCount} Guests</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[11px]">Zone:</p>
                  <p className="font-bold text-white">{confirmedBooking.zone || 'Indoor Cafe'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[11px]">Status:</p>
                  <p className="font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Confirmed
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 text-[11px] text-gray-400">
                <p>📍 Salboni, Sakadihi-Ailakundi Road (Near Salboni High School)</p>
                <p>📞 Helpline: +91 9932148058 / +91 6292314286</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmedBooking(null)}
                className="dinenos-btn flex-1 !py-3 text-xs uppercase font-bold tracking-wider cursor-pointer"
              >
                Reserve Another Table
              </button>
              <button
                onClick={() => onNavigate('/')}
                className="dinenos-btn-outline flex-1 !py-3 text-xs uppercase font-bold tracking-wider cursor-pointer"
              >
                Return Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-10">
        
        {/* Title & Subtitle */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#DD5903]/20 border border-[#DD5903]/40 text-[#DD5903] text-xs font-bold uppercase tracking-wider">
            <Armchair className="w-3.5 h-3.5" />
            <span>Interactive Floor Plan & Booking</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-normal font-['Arapey',serif] text-white">
            Find & Reserve <span className="italic text-[#DD5903]">A Table</span>
          </h1>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Choose your preferred dining spot from our live floor layout below, select your dining time, and reserve your table instantly.
          </p>
        </div>

        {/* Layout Workspace: Visual Table Map (Left) + Booking Form (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ================= LEFT COLUMN: RESTAURANT TABLE LAYOUT (7-8 Cols) ================= */}
          <div className="lg:col-span-7 xl:col-span-8 bg-[#161616] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            
            {/* Legend & Filter Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              
              {/* Status Legend */}
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-gray-300">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
                  <span>Available ({tables.filter(t => t.status === 'Available').length})</span>
                </span>
                <span className="flex items-center gap-1.5 text-gray-300">
                  <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_#EF4444]" />
                  <span>Occupied ({tables.filter(t => t.status === 'Occupied').length})</span>
                </span>
                <span className="flex items-center gap-1.5 text-gray-300">
                  <span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_#F59E0B]" />
                  <span>Reserved</span>
                </span>
              </div>

              {/* Zone Filter */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-400 font-semibold">Zone:</span>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="bg-[#101010] border border-white/15 rounded-lg px-2.5 py-1 text-white outline-none focus:border-[#DD5903]"
                >
                  <option value="all">All Dining Zones</option>
                  <option value="Indoor Cafe">Indoor Cafe</option>
                  <option value="Garden Terrace">Garden Terrace</option>
                </select>
              </div>
            </div>

            {/* Interactive Floor Layout Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-gray-400 font-semibold uppercase tracking-wider">
                <span>Restaurant Floor Layout ({filteredTables.length} Tables)</span>
                <span>Click an Available Table to Select</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredTables.map((tbl) => {
                  const isSelected = selectedTable && selectedTable.id === tbl.id;
                  const isAvailable = tbl.status === 'Available';
                  const isOccupied = tbl.status === 'Occupied';
                  const isReserved = tbl.status === 'Reserved';

                  return (
                    <div
                      key={tbl.id}
                      onClick={() => handleSelectTable(tbl)}
                      className={`relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-36 ${
                        isSelected
                          ? 'bg-[#DD5903]/15 border-[#DD5903] shadow-[0_0_20px_rgba(221,89,3,0.3)] scale-[1.03]'
                          : isAvailable
                          ? 'bg-[#1a1a1a] hover:bg-[#222222] border-emerald-500/40 hover:border-emerald-400'
                          : isOccupied
                          ? 'bg-[#181414] border-rose-500/30 opacity-70 cursor-not-allowed'
                          : 'bg-[#181614] border-amber-500/30'
                      }`}
                    >
                      {/* Top Row: Table Number & Status Indicator */}
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold font-mono text-white">
                          {tbl.tableNumber}
                        </span>
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          isAvailable ? 'bg-emerald-400' : isOccupied ? 'bg-rose-500' : 'bg-amber-400'
                        }`} />
                      </div>

                      {/* Middle: Capacity & Visual Seats */}
                      <div className="space-y-1 my-auto">
                        <div className="flex items-center gap-1.5 text-xs text-gray-300 font-medium">
                          <Users className="w-3.5 h-3.5 text-[#DD5903]" />
                          <span>Seats {tbl.capacity} Guests</span>
                        </div>
                        <p className="text-[10px] text-gray-400 truncate">
                          {tbl.zone}
                        </p>
                      </div>

                      {/* Bottom Status Badge */}
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                        <span className={`font-bold ${
                          isAvailable ? 'text-emerald-400' : isOccupied ? 'text-rose-400' : 'text-amber-400'
                        }`}>
                          {tbl.status}
                        </span>
                        {isSelected && (
                          <span className="text-[#DD5903] font-bold text-xs flex items-center gap-0.5">
                            <Check className="w-3.5 h-3.5" />
                            <span>Selected</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ambience & Seating Note */}
            <div className="bg-[#121212] p-4 rounded-2xl border border-white/5 text-xs text-gray-400 flex items-start gap-3">
              <Info className="w-4 h-4 text-[#DD5903] flex-shrink-0 mt-0.5" />
              <span>
                <strong>Indoor Cafe</strong> features cozy ambient acoustic warmth and Wi-Fi power access. <strong>Garden Terrace</strong> offers open-air breeze and lush green garden views.
              </span>
            </div>

          </div>

          {/* ================= RIGHT COLUMN: RESERVATION BOOKING FORM (4-5 Cols) ================= */}
          <div className="lg:col-span-5 xl:col-span-4 bg-[#161616] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl sticky top-20">
            
            <div className="pb-4 border-b border-white/10 space-y-1">
              <h3 className="text-xl font-bold font-['Arapey',serif] text-white">
                Reserve Table
              </h3>
              <p className="text-xs text-gray-400">
                {selectedTable
                  ? `Selected: Table ${selectedTable.tableNumber} (${selectedTable.zone} • ${selectedTable.capacity} Seats)`
                  : 'Select a table from the floor map to proceed'}
              </p>
            </div>

            <form onSubmit={handleReservationSubmit} className="space-y-4 text-xs">

              {formError && (
                <div role="alert" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}
              
              {/* Selected Table Summary Badge */}
              {selectedTable && (
                <div className="p-3 bg-[#DD5903]/15 border border-[#DD5903]/40 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Your Selection</span>
                    <p className="text-sm font-bold text-white">Table {selectedTable.tableNumber}</p>
                    <p className="text-[11px] text-[#DD5903]">{selectedTable.zone} • Max {selectedTable.capacity} Seats</p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-[#DD5903]" />
                </div>
              )}

              {/* Number of Guests */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1.5">Number of Guests</label>
                <div className="flex items-center gap-3 bg-[#111111] border border-white/10 rounded-xl p-2 justify-between">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Users className="w-4 h-4 text-[#DD5903]" />
                    <span>Party Size:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                      className="w-7 h-7 bg-[#222222] hover:bg-[#333333] text-white rounded-lg flex items-center justify-center font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-bold text-sm text-white px-2 font-mono">{guestCount}</span>
                    <button
                      type="button"
                      onClick={() => setGuestCount(guestCount + 1)}
                      className="w-7 h-7 bg-[#222222] hover:bg-[#333333] text-white rounded-lg flex items-center justify-center font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Date Picker */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Reservation Date</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={reservationDate}
                    onChange={(e) => setReservationDate(e.target.value)}
                    className="w-full bg-[#111111] border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-white text-xs outline-none focus:border-[#DD5903]"
                  />
                </div>
              </div>

              {/* Time Slot Picker */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1.5">Dining Time Slot</label>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  {['10:00 AM', '12:00 PM', '05:00 PM', '06:30 PM', '07:30 PM', '08:30 PM'].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setReservationTime(slot)}
                      className={`py-2 px-1.5 rounded-lg border font-bold text-[11px] transition-all cursor-pointer ${
                        reservationTime === slot
                          ? 'bg-[#DD5903] border-[#DD5903] text-white shadow-md'
                          : 'bg-[#111111] border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Contact */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Your Full Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sourav Mukherjee"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-[#111111] border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-[#DD5903]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Mobile Phone (For Booking SMS) *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9932148058"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-[#111111] border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-[#DD5903]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-gray-300 font-semibold">Special Requests (Optional)</label>
                    <span className="text-[10px] text-[#DD5903] font-medium">Birthday setup: ₹150 charges</span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Birthday celebration (₹150 charges), window seat preference..."
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="w-full bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#DD5903]"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    * Special occasion/birthday decoration setups incur an additional ₹150 charge at the cafe.
                  </p>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting || !selectedTable}
                className="w-full dinenos-btn flex items-center justify-center gap-2 !py-3.5 text-xs uppercase font-bold tracking-wider shadow-xl cursor-pointer disabled:opacity-50 mt-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Confirming Booking...'
                    : selectedTable
                    ? `Confirm Table ${selectedTable.tableNumber}`
                    : 'Select a Table Above'}
                </span>
              </button>

            </form>

          </div>

        </div>

      </main>

    </div>
  );
}
