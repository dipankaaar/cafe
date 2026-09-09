import React, { useState } from 'react';
import { X, CheckCircle, Coffee, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { isValidIndianPhone, parseGuestsCount } from '../../utils/formatters';

const GUEST_OPTIONS = [
  { value: 1, label: '1 Person' },
  { value: 2, label: '2 Persons' },
  { value: 4, label: '3 - 4 Persons' },
  { value: 6, label: '5 - 8 Persons (Group)' },
  { value: 10, label: '10+ Event Area' }
];

const TIME_SLOTS = ['09:00', '10:30', '12:00', '14:00', '16:00', '18:00', '20:00'];

export default function ReservationModal({ isOpen, onClose, onSuccess, onShowToast }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: new Date().toISOString().split('T')[0],
    time: '14:00',
    guests: 2,
    tableLocation: 'Window View Corner',
    specialNotes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmed, setConfirmed] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    if (!isValidIndianPhone(formData.phone)) {
      setFormError('Please enter a valid 10-digit phone number.');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    if (!formData.date || formData.date < today) {
      setFormError('Please choose today or a future date for your reservation.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Live API: POST /api/reservations
      const created = await api.createReservation({
        customerName: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        date: formData.date,
        time: formData.time,
        guests: parseGuestsCount(formData.guests, 2),
        specialRequest: [
          formData.tableLocation,
          formData.specialNotes.trim()
        ].filter(Boolean).join(' • ') || undefined
      });

      setConfirmed(created || { ...formData });
      const successMsg = `Table reserved for ${formData.name.trim()} on ${formData.date}!`;
      // PublicStorefront wires onSuccess; keep onShowToast as legacy alias
      onSuccess?.({
        customerName: formData.name.trim(),
        phone: formData.phone.trim(),
        date: formData.date,
        time: formData.time,
        guests: parseGuestsCount(formData.guests, 2),
        reservation: created
      });
      onShowToast?.(successMsg);
    } catch (err) {
      setFormError(err?.message || 'Could not confirm your reservation. Please try again or call the cafe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setConfirmed(null);
    setFormError('');
    onClose();
  };

  const set = (key) => (e) => setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-label="Book your table">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="min-h-screen px-4 text-center flex flex-col items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-xl bg-[#181818] border border-white/15 rounded-2xl shadow-2xl p-6 sm:p-10 text-left relative overflow-hidden">
          {/* Decorative Corner Accent */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-[#DD5903]/20 rounded-full blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close reservation dialog"
            className="absolute top-6 right-6 text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          {!confirmed ? (
            <div>
              {/* Modal Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#DD5903]/10 text-[#DD5903] mb-3">
                  <Coffee className="w-6 h-6" />
                </div>
                <h3 className="text-3xl text-white font-['Arapey',serif] mb-2">Book Your Coffee Table</h3>
                <p className="text-sm text-gray-400">
                  Reserve a cozy spot at Petuk Adda Cafe. We look forward to hosting you!
                </p>
                <div className="diamond-divider">
                  <div className="diamond-shape"></div>
                </div>
              </div>

              {formError && (
                <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm" role="alert">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Booking Form */}
              <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-300 font-semibold mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sourav Mukherjee"
                      value={formData.name}
                      onChange={set('name')}
                      className="w-full bg-[#242424] border border-white/10 rounded-md px-3.5 py-2.5 text-white placeholder-gray-500 focus:border-[#DD5903] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-300 font-semibold mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      inputMode="tel"
                      placeholder="10-digit mobile number"
                      value={formData.phone}
                      onChange={set('phone')}
                      className="w-full bg-[#242424] border border-white/10 rounded-md px-3.5 py-2.5 text-white placeholder-gray-500 focus:border-[#DD5903] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-300 font-semibold mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.date}
                      onChange={set('date')}
                      className="w-full bg-[#242424] border border-white/10 rounded-md px-3 py-2.5 text-white focus:border-[#DD5903] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-300 font-semibold mb-1">Time *</label>
                    <select
                      value={formData.time}
                      onChange={set('time')}
                      className="w-full bg-[#242424] border border-white/10 rounded-md px-3 py-2.5 text-white focus:border-[#DD5903] outline-none"
                    >
                      {TIME_SLOTS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-300 font-semibold mb-1">Guests *</label>
                    <select
                      value={formData.guests}
                      onChange={(e) => setFormData({ ...formData, guests: Number(e.target.value) })}
                      className="w-full bg-[#242424] border border-white/10 rounded-md px-3 py-2.5 text-white focus:border-[#DD5903] outline-none"
                    >
                      {GUEST_OPTIONS.map((g) => (
                        <option key={g.value} value={g.value}>{g.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-300 font-semibold mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={set('email')}
                      className="w-full bg-[#242424] border border-white/10 rounded-md px-3.5 py-2.5 text-white placeholder-gray-500 focus:border-[#DD5903] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-300 font-semibold mb-1">Seating Area</label>
                    <select
                      value={formData.tableLocation}
                      onChange={set('tableLocation')}
                      className="w-full bg-[#242424] border border-white/10 rounded-md px-3 py-2.5 text-white focus:border-[#DD5903] outline-none"
                    >
                      <option value="Window View Corner">Window View Corner</option>
                      <option value="Outdoor Terrace">Outdoor Garden Terrace</option>
                      <option value="Main Barista Lounge">Main Barista Lounge</option>
                      <option value="Quiet Study Booth">Quiet Study Booth</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs uppercase tracking-wider text-gray-300 font-semibold">Special Occasion / Requests</label>
                    <span className="text-[10px] text-[#DD5903] font-medium">Birthday setup: ₹150 charges</span>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="E.g., birthday celebration (₹150 charges), oat milk preferences, high chair..."
                    value={formData.specialNotes}
                    onChange={set('specialNotes')}
                    className="w-full bg-[#242424] border border-white/10 rounded-md px-3.5 py-2 text-white placeholder-gray-500 focus:border-[#DD5903] outline-none resize-none"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    * Birthday & celebration setup includes ₹150 additional charges.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full dinenos-btn !py-3 text-base font-semibold mt-4 shadow-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? 'Confirming…' : 'Confirm Table Reservation'}
                </button>
              </form>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-[#DD5903]/20 text-[#DD5903] mx-auto flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-3xl text-white font-['Arapey',serif] mb-2">Reservation Confirmed!</h3>
              <p className="text-sm text-gray-300 max-w-md mx-auto mb-6">
                Thank you <strong className="text-white">{formData.name}</strong>. Your table for{' '}
                <span className="text-[#DD5903] font-semibold">{parseGuestsCount(formData.guests, 2)} guests</span> has been booked for{' '}
                <span className="text-white font-semibold">{formData.date}</span> at{' '}
                <span className="text-white font-semibold">{formData.time}</span> ({formData.tableLocation}).
              </p>

              <div className="p-4 bg-[#242424] rounded-lg border border-white/10 text-xs text-gray-300 max-w-md mx-auto mb-6 space-y-1 text-left">
                {confirmed?.id && <p><strong>Booking ID:</strong> {confirmed.id}</p>}
                <p><strong>Notification:</strong> SMS confirmation sent to {formData.phone}</p>
                <p><strong>Address:</strong> Salboni, Sakadihi-Ailakundi Road (Near Salboni High School), Salboni, WB 722102</p>
              </div>

              <button
                onClick={handleReset}
                className="dinenos-btn !py-2.5 !px-8 cursor-pointer"
              >
                Close & Return
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
