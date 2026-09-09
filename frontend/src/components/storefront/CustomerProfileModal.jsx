import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Award,
  Clock,
  ShoppingBag,
  ChevronRight,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Ticket,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  LogOut,
  Save,
  ArrowRight,
  Receipt,
  Star
} from 'lucide-react';
import { api } from '../../services/api';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const STORAGE_KEY = 'dinenos_customer_session';

// Demo quick-login presets for fast testing
const QUICK_DEMO_USERS = [
  { name: 'Rahul Sharma', phone: '9845011223', tier: 'Platinum' },
  { name: 'Ananya Iyer', phone: '9741233445', tier: 'Gold' },
  { name: 'Vikram Malhotra', phone: '9916055667', tier: 'Silver' },
  { name: 'Priya Nair', phone: '9886077889', tier: 'Bronze' }
];

export default function CustomerProfileModal({
  isOpen,
  onClose,
  onOpenTrackOrder,
  onReorder,
  onOpenReservation,
  onNavigateToMenu
}) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'orders' | 'rewards' | 'reservations'
  const [customer, setCustomer] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Login form state
  const [phoneInput, setPhoneInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [landmarkInput, setLandmarkInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [authMode, setAuthMode] = useState('lookup'); // 'lookup' | 'register' | 'otp_verify'
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState('');

  // WhatsApp OTP state
  const [otpInput, setOtpInput] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [debugOtpNotice, setDebugOtpNotice] = useState('');

  // OTP Countdown timer
  useEffect(() => {
    let interval = null;
    if (otpTimer > 0) {
      interval = setInterval(() => setOtpTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Orders state
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderFilter, setOrderFilter] = useState('all'); // 'all' | 'active' | 'completed'
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);

  // Rewards & Coupons state
  const [coupons, setCoupons] = useState([]);
  const [copiedCoupon, setCopiedCoupon] = useState('');

  // Reservations state
  const [reservations, setReservations] = useState([]);
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);

  // Fetch full live customer profile & order history when modal opens or customer changes
  const refreshCustomerData = useCallback(async (custPhone) => {
    if (!custPhone) return;
    try {
      const cleanPhone = custPhone.replace(/\D/g, '').slice(-10);
      const res = await api.lookupCustomer(cleanPhone).catch(() => null);
      if (res && (res.data || res.id)) {
        const full = res.data || res;
        // Keep saved address if present in session
        const prevSession = (() => {
          try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return {}; }
        })();
        const merged = { ...full, defaultAddress: prevSession?.defaultAddress || full.notes || '' };
        setCustomer(merged);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      }
    } catch {
      // quiet fallback when customer not yet registered
    }
  }, []);

  // Fetch customer orders
  const loadOrders = useCallback(async (custId, custPhone) => {
    setIsLoadingOrders(true);
    try {
      let orderList = [];
      if (custId) {
        try {
          const res = await api.getCustomerOrders(custId);
          orderList = Array.isArray(res) ? res : (res?.data || []);
        } catch {
          // fallback to search by phone
        }
      }
      if (orderList.length === 0 && custPhone) {
        const clean = custPhone.replace(/\D/g, '').slice(-10);
        const searchRes = await api.getOrders({ search: clean, limit: 50 });
        orderList = Array.isArray(searchRes) ? searchRes : (searchRes?.data || []);
      }
      setOrders(orderList);
    } catch (err) {
      console.error('Failed to load customer orders:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  // Fetch active coupons
  const loadCoupons = useCallback(async () => {
    try {
      const res = await api.getCoupons();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setCoupons(list.filter((c) => c.status === 'active'));
    } catch (err) {
      console.warn('Could not load coupons:', err);
    }
  }, []);

  // Fetch reservations
  const loadReservations = useCallback(async (custPhone) => {
    if (!custPhone) return;
    setIsLoadingReservations(true);
    try {
      const clean = custPhone.replace(/\D/g, '').slice(-10);
      const res = await api.getReservations({ search: clean });
      const list = Array.isArray(res) ? res : (res?.data || []);
      setReservations(list);
    } catch (err) {
      console.warn('Could not load reservations:', err);
    } finally {
      setIsLoadingReservations(false);
    }
  }, []);

  // Sync on open
  useEffect(() => {
    if (isOpen) {
      loadCoupons();
      if (customer?.phone) {
        refreshCustomerData(customer.phone);
        loadOrders(customer.id, customer.phone);
        loadReservations(customer.phone);
        setEditName(customer.name || '');
        setEditEmail(customer.email || '');
        setEditAddress(customer.defaultAddress || '');
      }
    }
  }, [isOpen, customer?.phone, customer?.id, refreshCustomerData, loadOrders, loadReservations, loadCoupons]);

  // Handle Send OTP via WhatsApp Baileys
  const handleSendOtp = async (phoneToUse) => {
    const raw = phoneToUse || phoneInput;
    const clean = raw.replace(/\D/g, '').slice(-10);
    if (clean.length < 10) {
      setAuthError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSendingOtp(true);
    setAuthError('');
    setDebugOtpNotice('');
    try {
      // Lookup if customer profile already exists to prefill details
      api.lookupCustomer(clean).then((res) => {
        const custData = res?.data || res;
        if (custData && custData.name) {
          setNameInput(custData.name || '');
          setEmailInput(custData.email || '');
          const rawNotes = custData.defaultAddress || custData.notes || '';
          if (rawNotes.includes('(Landmark:')) {
            const parts = rawNotes.split('(Landmark:');
            setAddressInput(parts[0].trim());
            setLandmarkInput(parts[1].replace(')', '').trim());
          } else {
            setAddressInput(rawNotes);
          }
        }
      }).catch(() => {});

      const res = await api.sendOtp(clean, 'Customer Profile Login');
      const data = res.data || res;
      setIsOtpSent(true);
      setAuthMode('otp_verify');
      setPhoneInput(clean);
      setOtpTimer(60); // 60s cooldown for resend
      if (data?.debugOtp) {
        setDebugOtpNotice(`(Demo/Test OTP: ${data.debugOtp})`);
      }
    } catch (err) {
      setAuthError(err?.message || 'Could not send WhatsApp OTP. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle Verify OTP & Login
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const clean = phoneInput.replace(/\D/g, '').slice(-10);
    if (!otpInput || otpInput.trim().length < 4) {
      setAuthError('Please enter the 6-digit OTP code received on WhatsApp.');
      return;
    }

    if (!nameInput.trim()) {
      setAuthError('Full Name is mandatory. Please enter your name.');
      return;
    }

    if (!emailInput.trim()) {
      setAuthError('Gmail / Email address is mandatory. Please enter your email.');
      return;
    }

    if (!emailInput.includes('@') || !emailInput.includes('.')) {
      setAuthError('Please enter a valid Gmail / Email address (e.g. yourname@gmail.com).');
      return;
    }

    if (!addressInput.trim()) {
      setAuthError('Delivery / Full Address is mandatory. Please enter your address.');
      return;
    }

    if (!landmarkInput.trim()) {
      setAuthError('Nearby Location / Landmark is mandatory. Please enter a landmark.');
      return;
    }

    setIsLoggingIn(true);
    setAuthError('');
    try {
      const res = await api.verifyOtp({
        phone: clean,
        otp: otpInput.trim(),
        name: nameInput.trim(),
        email: emailInput.trim(),
        address: addressInput.trim(),
        landmark: landmarkInput.trim()
      });
      const data = res.data || res;
      const cust = data.customer || data;
      if (cust) {
        const fullAddressStr = [
          addressInput.trim(),
          landmarkInput.trim() ? `(Landmark: ${landmarkInput.trim()})` : ''
        ].filter(Boolean).join(' ');

        const enrichedCust = {
          ...cust,
          name: nameInput.trim() || cust.name,
          email: emailInput.trim() || cust.email,
          defaultAddress: fullAddressStr || cust.notes || ''
        };

        setCustomer(enrichedCust);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(enrichedCust));
        setEditName(enrichedCust.name || '');
        setEditEmail(enrichedCust.email || '');
        setEditAddress(enrichedCust.defaultAddress || '');
        loadOrders(enrichedCust.id, enrichedCust.phone);
        loadReservations(enrichedCust.phone);
        setIsOtpSent(false);
        setOtpInput('');
        setAuthMode('lookup');
      }
    } catch (err) {
      setAuthError(err?.message || 'Invalid OTP code. Please check and try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Login / Phone Lookup (Quick mode)
  const handleLoginByPhone = async (phoneToUse) => {
    const raw = phoneToUse || phoneInput;
    const clean = raw.replace(/\D/g, '').slice(-10);
    if (clean.length < 10) {
      setAuthError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoggingIn(true);
    setAuthError('');
    try {
      const res = await api.lookupCustomer(clean);
      const custData = res.data || res;
      if (custData && custData.name) {
        setCustomer(custData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(custData));
        setEditName(custData.name || '');
        setEditEmail(custData.email || '');
        setEditAddress(custData.defaultAddress || custData.notes || '');
        loadOrders(custData.id, custData.phone);
        loadReservations(custData.phone);
      } else {
        // Customer not found, switch to register mode
        setAuthMode('register');
        setPhoneInput(clean);
      }
    } catch (err) {
      // If 404, prompt to create profile
      setAuthMode('register');
      setPhoneInput(clean);
      setAuthError('No profile found for this number. Please enter your details below.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Register New Customer
  const handleRegisterCustomer = async (e) => {
    e.preventDefault();
    const clean = phoneInput.replace(/\D/g, '').slice(-10);
    if (clean.length < 10) {
      setAuthError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!nameInput.trim()) {
      setAuthError('Full Name is mandatory. Please enter your name.');
      return;
    }
    if (!emailInput.trim() || !emailInput.includes('@') || !emailInput.includes('.')) {
      setAuthError('Valid Gmail / Email address is mandatory.');
      return;
    }
    if (!addressInput.trim()) {
      setAuthError('Delivery Address is mandatory.');
      return;
    }
    if (!landmarkInput.trim()) {
      setAuthError('Nearby Location / Landmark is mandatory.');
      return;
    }

    setIsLoggingIn(true);
    setAuthError('');
    try {
      const fullAddressStr = [
        addressInput.trim(),
        landmarkInput.trim() ? `(Landmark: ${landmarkInput.trim()})` : ''
      ].filter(Boolean).join(' ');

      const payload = {
        name: nameInput.trim(),
        phone: clean,
        email: emailInput.trim(),
        notes: fullAddressStr
      };
      const res = await api.createCustomer(payload);
      const created = res.data || res;
      const full = { ...created, defaultAddress: fullAddressStr };
      setCustomer(full);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
      setEditName(full.name);
      setEditEmail(full.email || '');
      setEditAddress(fullAddressStr);
      loadOrders(full.id, full.phone);
      loadReservations(full.phone);
    } catch (err) {
      setAuthError(err?.message || 'Could not create profile. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Save Profile Changes
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!customer) return;
    setIsSavingProfile(true);
    setProfileSuccessMsg('');
    try {
      const updateData = {
        name: editName.trim(),
        email: editEmail.trim(),
        notes: editAddress.trim()
      };
      await api.updateCustomer(customer.id, updateData);
      const updated = {
        ...customer,
        name: editName.trim(),
        email: editEmail.trim(),
        defaultAddress: editAddress.trim()
      };
      setCustomer(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setIsEditingProfile(false);
      setProfileSuccessMsg('Profile details updated successfully!');
      setTimeout(() => setProfileSuccessMsg(''), 3000);
    } catch (err) {
      setAuthError('Could not save changes.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCustomer(null);
    setOrders([]);
    setReservations([]);
    setAuthMode('lookup');
    setPhoneInput('');
    setNameInput('');
    setEmailInput('');
    setAddressInput('');
    setLandmarkInput('');
    setAuthError('');
  };

  // Copy coupon code
  const handleCopyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(''), 2500);
  };

  // Tier info & progress
  const tierConfig = useMemo(() => {
    const pts = customer?.loyaltyPoints || 0;
    const spent = customer?.totalSpent || 0;
    if (spent >= 10000 || pts >= 500) {
      return {
        name: 'Platinum Tier',
        color: 'from-indigo-600 to-purple-600 text-white',
        border: 'border-indigo-500/40',
        badgeBg: 'bg-indigo-500/20 text-indigo-300',
        icon: Sparkles,
        perks: '15% Birthday Discount • Priority Brewing • Free Handover Delivery',
        nextTier: 'Max Tier Achieved! You are a VIP Patron 🎉',
        progress: 100
      };
    }
    if (spent >= 5000 || pts >= 200) {
      const needed = 10000 - spent;
      return {
        name: 'Gold Tier',
        color: 'from-amber-600 to-yellow-500 text-white',
        border: 'border-yellow-500/40',
        badgeBg: 'bg-yellow-500/20 text-yellow-300',
        icon: Star,
        perks: '10% Off on Special Brews • 1.5x Loyalty Multiplier',
        nextTier: `Spend ₹${Math.max(0, needed)} more for Platinum Tier`,
        progress: Math.min(100, Math.round((spent / 10000) * 100))
      };
    }
    if (spent >= 2000 || pts >= 50) {
      const needed = 5000 - spent;
      return {
        name: 'Silver Tier',
        color: 'from-slate-600 to-zinc-500 text-white',
        border: 'border-slate-400/40',
        badgeBg: 'bg-slate-500/20 text-slate-300',
        icon: Award,
        perks: '5% Extra Off on Weekdays • Exclusive Tasting Invites',
        nextTier: `Spend ₹${Math.max(0, needed)} more for Gold Tier`,
        progress: Math.min(100, Math.round((spent / 5000) * 100))
      };
    }
    const needed = 2000 - spent;
    return {
      name: 'Bronze Member',
      color: 'from-amber-800 to-stone-700 text-white',
      border: 'border-amber-700/40',
      badgeBg: 'bg-amber-700/20 text-amber-300',
      icon: User,
      perks: 'Earn 1 point per ₹100 spent • Redeem points on all orders',
      nextTier: `Spend ₹${Math.max(0, needed)} more for Silver Tier`,
      progress: Math.min(100, Math.round((spent / 2000) * 100))
    };
  }, [customer]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    if (orderFilter === 'active') {
      return orders.filter((o) =>
        ['placed', 'accepted', 'brewing', 'ready', 'out_for_delivery'].includes(String(o.status || '').toLowerCase())
      );
    }
    if (orderFilter === 'completed') {
      return orders.filter((o) =>
        ['completed', 'delivered'].includes(String(o.status || '').toLowerCase())
      );
    }
    return orders;
  }, [orders, orderFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div
        className="relative w-full max-w-3xl bg-[#181818] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#141414]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#DD5903] to-[#ff8c42] flex items-center justify-center text-white shadow-lg shadow-orange-950/40">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                <span>Customer Profile & History</span>
                {customer && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${tierConfig.badgeBg}`}>
                    {tierConfig.name.split(' ')[0]}
                  </span>
                )}
              </h2>
              <p className="text-xs text-gray-400">Manage your profile, track past orders & loyalty rewards</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* ================= CASE 1: NOT LOGGED IN ================= */}
          {!customer ? (
            <div className="max-w-md mx-auto py-4 space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/10 text-[#DD5903] border border-orange-500/20 mb-1">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">Access Your Petuk Adda Profile</h3>
                <p className="text-xs text-gray-400">
                  Enter your mobile number to view past orders, live tracking status, and earned loyalty rewards.
                </p>
              </div>

              {authError && (
                <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Case A: OTP Verify Mode */}
              {authMode === 'otp_verify' ? (
                <div className="space-y-4">
                  <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-center space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>WhatsApp OTP Sent</span>
                    </div>
                    <p className="text-xs text-gray-300">
                      We sent a 6-digit verification code to <strong className="text-white">+91 {phoneInput}</strong>
                    </p>
                    {debugOtpNotice && (
                      <p className="text-[11px] text-amber-300 font-mono font-bold pt-0.5">{debugOtpNotice}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider text-center">
                      Enter 6-Digit OTP Code <span className="text-emerald-400">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength="6"
                      autoFocus
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      className="w-full bg-black/60 border border-emerald-500/50 rounded-xl px-4 py-2.5 text-center text-2xl font-mono tracking-widest text-emerald-400 placeholder-gray-600 focus:outline-none focus:border-emerald-400 shadow-inner"
                      onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
                    />
                  </div>

                  {/* Mandatory Customer Profile Details */}
                  <div className="pt-2 border-t border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#DD5903]" />
                        <span>Profile Information</span>
                      </span>
                      <span className="text-[10px] text-[#DD5903] font-semibold uppercase tracking-wider bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                        * All Fields Required
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                        Full Name <span className="text-red-400 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#DD5903]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                        Gmail / Email Address <span className="text-red-400 font-bold">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="e.g. rahul@gmail.com"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#DD5903]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                        Delivery / Full Address <span className="text-red-400 font-bold">*</span>
                      </label>
                      <textarea
                        rows="2"
                        required
                        value={addressInput}
                        onChange={(e) => setAddressInput(e.target.value)}
                        placeholder="Flat/House No, Building, Street, Area..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#DD5903] resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                        Nearby Location / Landmark <span className="text-red-400 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={landmarkInput}
                        onChange={(e) => setLandmarkInput(e.target.value)}
                        placeholder="e.g. Near City Mall / Opp. Metro Gate 2"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#DD5903]"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleVerifyOtp}
                    disabled={isLoggingIn || otpInput.length < 4}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer disabled:opacity-50"
                  >
                    {isLoggingIn ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify OTP & Create Profile</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('lookup');
                        setOtpInput('');
                      }}
                      className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      ← Change Number
                    </button>

                    {otpTimer > 0 ? (
                      <span className="text-gray-500 text-[11px]">Resend in {otpTimer}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendOtp()}
                        disabled={isSendingOtp}
                        className="text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>
              ) : authMode === 'lookup' ? (
                /* Case B: Enter Mobile Number Mode */
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength="10"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="98765 43210"
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#DD5903] transition-colors"
                        onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                      />
                    </div>
                  </div>

                  {/* Primary: Send OTP via WhatsApp */}
                  <button
                    onClick={() => handleSendOtp()}
                    disabled={isSendingOtp || phoneInput.length < 10}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer disabled:opacity-50"
                  >
                    {isSendingOtp ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span className="text-base">💬</span>
                        <span>Send OTP via WhatsApp</span>
                      </>
                    )}
                  </button>

                  {/* Secondary: Quick Phone Lookup */}
                  <button
                    onClick={() => handleLoginByPhone()}
                    disabled={isLoggingIn || phoneInput.length < 10}
                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isLoggingIn ? 'Checking...' : 'Direct Login without OTP'}
                  </button>
                </div>
              ) : (
                /* Register Form for New User */
                <form onSubmit={handleRegisterCustomer} className="space-y-3.5">
                  <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-xl text-xs text-orange-200">
                    Please provide your complete details below to create your customer profile.
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Your Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="e.g. Sourav Mukherjee"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#DD5903]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Mobile Number <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength="10"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#DD5903]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Gmail / Email Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="sourav@gmail.com"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#DD5903]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Delivery / Full Address <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      rows="2"
                      required
                      value={addressInput}
                      onChange={(e) => setAddressInput(e.target.value)}
                      placeholder="House/Flat No, Building, Street, City..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#DD5903] resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Nearby Location / Landmark <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={landmarkInput}
                      onChange={(e) => setLandmarkInput(e.target.value)}
                      placeholder="e.g. Near City Mall / Opp. Metro Gate 2"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#DD5903]"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setAuthMode('lookup')}
                      className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="flex-2 dinenos-btn !py-2.5 !text-xs font-bold cursor-pointer"
                    >
                      {isLoggingIn ? 'Creating...' : 'Create & View Profile'}
                    </button>
                  </div>
                </form>
              )}

              {/* 1-Click Demo Profiles for instant testing */}
              <div className="pt-4 border-t border-white/10">
                <p className="text-[11px] text-gray-400 font-semibold mb-2 uppercase tracking-wider text-center">
                  Quick 1-Click Demo Profiles (For Testing):
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_DEMO_USERS.map((u) => (
                    <button
                      key={u.phone}
                      onClick={() => handleLoginByPhone(u.phone)}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-orange-500/30 text-left transition-all cursor-pointer group"
                    >
                      <div className="text-xs font-bold text-white group-hover:text-[#DD5903] transition-colors truncate">
                        {u.name}
                      </div>
                      <div className="text-[10px] text-gray-400 flex items-center justify-between mt-0.5">
                        <span>{u.phone}</span>
                        <span className="text-[#DD5903] font-semibold">{u.tier}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ================= CASE 2: LOGGED IN CUSTOMER VIEW ================= */
            <div className="space-y-6">

              {/* Top Profile Summary Card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#201c19] via-[#1c1815] to-[#161412] border border-white/10 p-4 sm:p-5 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#DD5903] to-[#ff8c42] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-950/40">
                      {customer.name?.slice(0, 2)?.toUpperCase() || 'CA'}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{customer.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-300 mt-0.5">
                        <span className="flex items-center gap-1 font-mono text-gray-300">
                          <Phone className="w-3.5 h-3.5 text-[#DD5903]" />
                          {customer.phone}
                        </span>
                        {customer.email && (
                          <>
                            <span className="text-gray-600">•</span>
                            <span className="flex items-center gap-1 text-gray-400 truncate max-w-[180px]">
                              <Mail className="w-3.5 h-3.5" />
                              {customer.email}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1.5 rounded-xl border ${tierConfig.border} bg-white/5 flex items-center gap-2`}>
                      <tierConfig.icon className="w-4 h-4 text-[#DD5903]" />
                      <div className="text-left">
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Tier Level</div>
                        <div className="text-xs font-bold text-white">{tierConfig.name}</div>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-gray-400 border border-white/5 transition-colors cursor-pointer"
                      title="Log out / Switch account"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mt-4 pt-4 border-t border-white/10">
                  <div className="bg-black/40 rounded-xl p-2.5 sm:p-3 text-center border border-white/5">
                    <div className="text-xs text-gray-400 font-medium">Available Points</div>
                    <div className="text-base sm:text-xl font-bold text-[#DD5903] mt-0.5 flex items-center justify-center gap-1">
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                      <span>{customer.loyaltyPoints || 0}</span>
                    </div>
                    <div className="text-[10px] text-gray-400">Worth ₹{customer.loyaltyPoints || 0} discount</div>
                  </div>

                  <div className="bg-black/40 rounded-xl p-2.5 sm:p-3 text-center border border-white/5">
                    <div className="text-xs text-gray-400 font-medium">Total Orders</div>
                    <div className="text-base sm:text-xl font-bold text-white mt-0.5">
                      {customer.totalOrders || orders.length || 0}
                    </div>
                    <div className="text-[10px] text-gray-400">Past orders placed</div>
                  </div>

                  <div className="bg-black/40 rounded-xl p-2.5 sm:p-3 text-center border border-white/5">
                    <div className="text-xs text-gray-400 font-medium">Total Spent</div>
                    <div className="text-base sm:text-xl font-bold text-white mt-0.5">
                      {formatCurrency(customer.totalSpent || 0)}
                    </div>
                    <div className="text-[10px] text-gray-400">Lifetime Cafe Spend</div>
                  </div>
                </div>

                {/* Tier Progress Bar */}
                <div className="mt-4 pt-3 border-t border-white/5">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-gray-400 font-medium flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-[#DD5903]" />
                      <span>{tierConfig.nextTier}</span>
                    </span>
                    <span className="text-xs font-bold text-white">{tierConfig.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#DD5903] to-yellow-500 rounded-full transition-all duration-500"
                      style={{ width: `${tierConfig.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-white/10 gap-1 sm:gap-2">
                {[
                  { id: 'profile', label: 'My Details', icon: User },
                  { id: 'orders', label: `Order History (${orders.length})`, icon: ShoppingBag },
                  { id: 'rewards', label: `Rewards & Coupons (${coupons.length})`, icon: Ticket },
                  { id: 'reservations', label: `Bookings (${reservations.length})`, icon: Calendar }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-[#DD5903] text-[#DD5903] bg-orange-500/5'
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Success Message Banner */}
              {profileSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              {/* ================= TAB 1: PROFILE DETAILS ================= */}
              {activeTab === 'profile' && (
                <div className="space-y-4">
                  <div className="bg-[#141414] border border-white/10 rounded-xl p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <User className="w-4 h-4 text-[#DD5903]" />
                        <span>Personal Information</span>
                      </h4>
                      <button
                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                        className="text-xs text-[#DD5903] hover:underline font-semibold cursor-pointer"
                      >
                        {isEditingProfile ? 'Cancel' : 'Edit Profile'}
                      </button>
                    </div>

                    {!isEditingProfile ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1">
                          <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Full Name</span>
                          <p className="text-sm font-medium text-white">{customer.name}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Phone Number</span>
                          <p className="text-sm font-mono text-white">{customer.phone}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Email</span>
                          <p className="text-sm text-white">{customer.email || 'Not provided'}</p>
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Default Delivery Address</span>
                          <p className="text-sm text-gray-200">
                            {customer.defaultAddress || customer.notes || 'No default address saved yet. Add one for faster checkout.'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleSaveProfile} className="space-y-3 pt-2">
                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1">Full Name</label>
                          <input
                            type="text"
                            required
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#DD5903]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1">Email</label>
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#DD5903]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1">Default Delivery Address</label>
                          <textarea
                            rows="2"
                            value={editAddress}
                            onChange={(e) => setEditAddress(e.target.value)}
                            placeholder="Flat/House No, Building, Landmark..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#DD5903] resize-none"
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setIsEditingProfile(false)}
                            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSavingProfile}
                            className="dinenos-btn !py-2 !px-4 !text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>{isSavingProfile ? 'Saving...' : 'Save Changes'}</span>
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Tier Perks & Benefits */}
                  <div className="bg-[#141414] border border-white/10 rounded-xl p-4 sm:p-5 space-y-2">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                      <span>{tierConfig.name} Exclusive Perks</span>
                    </h4>
                    <p className="text-xs text-gray-300 leading-relaxed">{tierConfig.perks}</p>
                  </div>
                </div>
              )}

              {/* ================= TAB 2: ORDER HISTORY ================= */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  {/* Filter Pills */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      {['all', 'active', 'completed'].map((f) => (
                        <button
                          key={f}
                          onClick={() => setOrderFilter(f)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all cursor-pointer ${
                            orderFilter === f
                              ? 'bg-[#DD5903] text-white'
                              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        if (onNavigateToMenu) onNavigateToMenu();
                      }}
                      className="text-xs text-[#DD5903] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Order Food Online</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {isLoadingOrders ? (
                    <div className="py-12 text-center text-gray-400 space-y-2">
                      <div className="w-6 h-6 border-2 border-[#DD5903] border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-xs">Fetching your order history...</p>
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="py-12 text-center bg-[#141414] border border-white/5 rounded-2xl space-y-3">
                      <div className="w-12 h-12 rounded-full bg-white/5 text-gray-400 flex items-center justify-center mx-auto">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">No Orders Found</h4>
                        <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
                          You haven't placed any orders matching this filter yet. Ready for some freshly roasted coffee?
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          onClose();
                          if (onNavigateToMenu) onNavigateToMenu();
                        }}
                        className="dinenos-btn !py-2 !px-4 !text-xs font-bold cursor-pointer"
                      >
                        Explore Menu & Order
                      </button>
                    </div>
                  ) : (
                    /* Orders List */
                    <div className="space-y-3">
                      {filteredOrders.map((ord) => {
                        const statusLower = String(ord.status || '').toLowerCase();
                        const isActive = ['placed', 'accepted', 'brewing', 'ready', 'out_for_delivery'].includes(statusLower);

                        return (
                          <div
                            key={ord.id}
                            className="bg-[#141414] border border-white/10 hover:border-white/20 rounded-xl p-4 transition-all space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-mono font-bold text-white">
                                    #{ord.orderNumber || ord.id}
                                  </span>
                                  <span className="text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider bg-white/10 text-gray-300">
                                    {ord.orderType || 'Dine-in'}
                                  </span>
                                  {ord.tableNumber && (
                                    <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-orange-500/10 text-[#DD5903]">
                                      Table {ord.tableNumber}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1.5">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatDateTime(ord.orderTime || ord.createdAt)}</span>
                                </div>
                              </div>

                              <div className="text-right">
                                <span
                                  className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                                    isActive
                                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                      : statusLower === 'completed' || statusLower === 'delivered'
                                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-red-500/15 text-red-400 border border-red-500/30'
                                  }`}
                                >
                                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />}
                                  <span>{ord.status}</span>
                                </span>
                                <div className="text-sm font-bold text-white mt-1">
                                  {formatCurrency(ord.grandTotal || ord.total || 0)}
                                </div>
                              </div>
                            </div>

                            {/* Order Items Snippet */}
                            <div className="bg-black/30 rounded-lg p-2.5 text-xs text-gray-300 space-y-1">
                              {Array.isArray(ord.items) && ord.items.map((it, idx) => (
                                <div key={idx} className="flex justify-between items-center">
                                  <span>
                                    {it.quantity}x {it.name || 'Coffee Item'}
                                    {it.variant ? ` (${it.variant})` : ''}
                                  </span>
                                  <span className="text-gray-400 font-mono">
                                    {formatCurrency(it.totalPrice || it.price * it.quantity || 0)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Order Action Buttons */}
                            <div className="flex items-center justify-between pt-1 gap-2">
                              <button
                                onClick={() => setSelectedReceiptOrder(ord)}
                                className="text-xs text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                <span>View Bill</span>
                              </button>

                              <div className="flex items-center gap-2">
                                {/* Track Live */}
                                <button
                                  onClick={() => {
                                    onClose();
                                    if (onOpenTrackOrder) onOpenTrackOrder(ord.orderNumber);
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-[#DD5903] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-orange-500/20"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Track Live</span>
                                </button>

                                {/* Re-Order button */}
                                <button
                                  onClick={() => {
                                    if (onReorder) onReorder(ord.items);
                                    onClose();
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Add these items to your cart"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Reorder</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ================= TAB 3: REWARDS & COUPONS ================= */}
              {activeTab === 'rewards' && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-orange-950/40 to-amber-950/30 border border-orange-500/20 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-xs text-orange-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="w-4 h-4" />
                        <span>Loyalty Points Balance</span>
                      </div>
                      <div className="text-2xl font-black text-white">{customer.loyaltyPoints || 0} Points</div>
                      <p className="text-xs text-gray-400">
                        1 Point = ₹1.00 automatic discount at checkout!
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        if (onNavigateToMenu) onNavigateToMenu();
                      }}
                      className="dinenos-btn !py-2 !px-4 !text-xs font-bold cursor-pointer whitespace-nowrap"
                    >
                      Redeem on Order
                    </button>
                  </div>

                  <div className="space-y-3 pt-2">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-[#DD5903]" />
                      <span>Available Cafe Promo Coupons</span>
                    </h4>

                    {coupons.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No coupons active at this moment.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {coupons.map((cp) => (
                          <div
                            key={cp.id}
                            className="bg-[#141414] border border-white/10 hover:border-orange-500/40 rounded-xl p-3.5 space-y-2.5 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div className="px-2.5 py-1 rounded bg-orange-500/10 border border-orange-500/30 font-mono font-bold text-xs text-[#DD5903]">
                                {cp.code}
                              </div>
                              <span className="text-xs font-bold text-emerald-400">
                                {cp.discountType === 'percentage'
                                  ? `${cp.discountValue}% OFF`
                                  : `₹${cp.discountValue} FLAT OFF`}
                              </span>
                            </div>

                            <p className="text-[11px] text-gray-300 line-clamp-2">
                              {cp.description || `Get ${cp.discountValue}${cp.discountType === 'percentage' ? '%' : '₹'} discount on your order`}
                            </p>

                            <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-white/5">
                              <span>Min spend: ₹{cp.minOrderValue || 0}</span>
                              <button
                                onClick={() => handleCopyCoupon(cp.code)}
                                className="text-xs font-semibold text-white hover:text-[#DD5903] flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                {copiedCoupon === cp.code ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy Code</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ================= TAB 4: RESERVATIONS ================= */}
              {activeTab === 'reservations' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#DD5903]" />
                      <span>Table Booking History</span>
                    </h4>
                    <button
                      onClick={() => {
                        onClose();
                        if (onOpenReservation) onOpenReservation();
                      }}
                      className="dinenos-btn !py-1.5 !px-3 !text-xs font-bold cursor-pointer"
                    >
                      Book Table
                    </button>
                  </div>

                  {isLoadingReservations ? (
                    <div className="py-8 text-center text-gray-400 text-xs">Loading reservations...</div>
                  ) : reservations.length === 0 ? (
                    <div className="py-10 text-center bg-[#141414] border border-white/5 rounded-xl space-y-2">
                      <Calendar className="w-8 h-8 text-gray-500 mx-auto" />
                      <p className="text-xs text-gray-400">No reservations found under this phone number.</p>
                      <button
                        onClick={() => {
                          onClose();
                          if (onOpenReservation) onOpenReservation();
                        }}
                        className="text-xs text-[#DD5903] font-semibold hover:underline cursor-pointer"
                      >
                        Reserve a table for your next visit ➔
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {reservations.map((r) => (
                        <div
                          key={r.id}
                          className="bg-[#141414] border border-white/10 rounded-xl p-3.5 flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="text-xs font-bold text-white">
                              {r.date} at {r.time}
                            </div>
                            <div className="text-[11px] text-gray-400 mt-0.5">
                              {r.guests} Guests • {r.branchName || 'Flagship Roastery'}
                            </div>
                          </div>
                          <span
                            className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                              r.status === 'Confirmed' || r.status === 'Seated'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-white/10 text-gray-300'
                            }`}
                          >
                            {r.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>

        {/* Receipt Quick Preview Sub-Modal */}
        {selectedReceiptOrder && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-[#1c1c1c] border border-white/15 rounded-2xl max-w-md w-full p-5 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#DD5903]" />
                  <h4 className="text-sm font-bold text-white">
                    Order Bill #{selectedReceiptOrder.orderNumber}
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedReceiptOrder(null)}
                  className="text-gray-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>Date:</span>
                  <span className="text-white">{formatDateTime(selectedReceiptOrder.orderTime)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Type:</span>
                  <span className="text-white font-semibold uppercase">{selectedReceiptOrder.orderType}</span>
                </div>
                {selectedReceiptOrder.tableNumber && (
                  <div className="flex justify-between text-gray-400">
                    <span>Table:</span>
                    <span className="text-white">Table {selectedReceiptOrder.tableNumber}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-400">
                  <span>Payment:</span>
                  <span className="text-white">{selectedReceiptOrder.paymentMethod} ({selectedReceiptOrder.paymentStatus})</span>
                </div>
              </div>

              <div className="border-t border-b border-white/10 py-3 space-y-2 text-xs">
                {Array.isArray(selectedReceiptOrder.items) && selectedReceiptOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-gray-300">
                    <span>{item.quantity}x {item.name}</span>
                    <span className="font-mono text-white">
                      {formatCurrency(item.totalPrice || item.price * item.quantity || 0)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(selectedReceiptOrder.subtotal || 0)}</span>
                </div>
                {Number(selectedReceiptOrder.discountAmount) > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount ({selectedReceiptOrder.couponCode || 'Promo'}):</span>
                    <span>-{formatCurrency(selectedReceiptOrder.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-400">
                  <span>GST (5%):</span>
                  <span>{formatCurrency(selectedReceiptOrder.taxAmount || 0)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-white/10">
                  <span>Grand Total:</span>
                  <span className="text-[#DD5903]">{formatCurrency(selectedReceiptOrder.grandTotal || 0)}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedReceiptOrder(null)}
                className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Close Bill
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
