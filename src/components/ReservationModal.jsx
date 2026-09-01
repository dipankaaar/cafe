import React, { useState } from 'react';
import { X, Calendar, Clock, Users, CheckCircle, Coffee, Sparkles } from 'lucide-react';

export default function ReservationModal({ isOpen, onClose, onShowToast }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: new Date().toISOString().split('T')[0],
    time: '14:00',
    guests: '2 Persons',
    tableLocation: 'Window View Corner',
    specialNotes: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    if (onShowToast) {
      onShowToast(`Table reservation confirmed for ${formData.name}!`);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
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
            className="absolute top-6 right-6 text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          {!isSubmitted ? (
            <div>
              {/* Modal Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#DD5903]/10 text-[#DD5903] mb-3">
                  <Coffee className="w-6 h-6" />
                </div>
                <h3 className="text-3xl text-white font-['Arapey',serif] mb-2">Book Your Coffee Table</h3>
                <p className="text-sm text-gray-400">
                  Reserve a cozy spot at Dinenos Cafe House. We look forward to hosting you!
                </p>
                <div className="diamond-divider">
                  <div className="diamond-shape"></div>
                </div>
              </div>

              {/* Booking Form */}
              <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-300 font-semibold mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Eleanor Vance"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[#242424] border border-white/10 rounded-md px-3.5 py-2.5 text-white placeholder-gray-500 focus:border-[#DD5903] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-300 font-semibold mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="+1 (555) 019-2834"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-[#242424] border border-white/10 rounded-md px-3.5 py-2.5 text-white placeholder-gray-500 focus:border-[#DD5903] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-300 font-semibold mb-1">Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full bg-[#242424] border border-white/10 rounded-md px-3 py-2.5 text-white focus:border-[#DD5903] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-300 font-semibold mb-1">Time</label>
                    <select
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full bg-[#242424] border border-white/10 rounded-md px-3 py-2.5 text-white focus:border-[#DD5903] outline-none"
                    >
                      <option value="09:00">09:00 AM</option>
                      <option value="10:30">10:30 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="14:00">02:00 PM</option>
                      <option value="16:00">04:00 PM</option>
                      <option value="18:00">06:00 PM</option>
                      <option value="20:00">08:00 PM</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-300 font-semibold mb-1">Guests</label>
                    <select
                      value={formData.guests}
                      onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                      className="w-full bg-[#242424] border border-white/10 rounded-md px-3 py-2.5 text-white focus:border-[#DD5903] outline-none"
                    >
                      <option value="1 Person">1 Person</option>
                      <option value="2 Persons">2 Persons</option>
                      <option value="3-4 Persons">3 - 4 Persons</option>
                      <option value="5-8 Persons">5 - 8 Persons (Group)</option>
                      <option value="10+ Event">10+ Event Area</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-300 font-semibold mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="eleanor@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-[#242424] border border-white/10 rounded-md px-3.5 py-2.5 text-white placeholder-gray-500 focus:border-[#DD5903] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-300 font-semibold mb-1">Seating Area</label>
                    <select
                      value={formData.tableLocation}
                      onChange={(e) => setFormData({ ...formData, tableLocation: e.target.value })}
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
                  <label className="block text-xs uppercase tracking-wider text-gray-300 font-semibold mb-1">Special Occasion / Requests</label>
                  <textarea
                    rows={2}
                    placeholder="E.g., birthday celebration, oat milk preferences, high chair..."
                    value={formData.specialNotes}
                    onChange={(e) => setFormData({ ...formData, specialNotes: e.target.value })}
                    className="w-full bg-[#242424] border border-white/10 rounded-md px-3.5 py-2 text-white placeholder-gray-500 focus:border-[#DD5903] outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full dinenos-btn !py-3 text-base font-semibold mt-4 shadow-xl cursor-pointer"
                >
                  Confirm Table Reservation
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
                <span className="text-[#DD5903] font-semibold">{formData.guests}</span> has been booked for{' '}
                <span className="text-white font-semibold">{formData.date}</span> at{' '}
                <span className="text-white font-semibold">{formData.time}</span> ({formData.tableLocation}).
              </p>

              <div className="p-4 bg-[#242424] rounded-lg border border-white/10 text-xs text-gray-300 max-w-md mx-auto mb-6 space-y-1 text-left">
                <p><strong>Confirmation Code:</strong> #DN-{Math.floor(100000 + Math.random() * 900000)}</p>
                <p><strong>Notification:</strong> SMS confirmation sent to {formData.phone}</p>
                <p><strong>Address:</strong> 12 Creek Street, Brisbane CBD</p>
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
