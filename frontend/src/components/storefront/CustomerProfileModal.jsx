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

  // Auth flow step: 'phone' -> 'otp' -> (if new) 'profile_setup'
  const [authStep, setAuthStep] = useState('phone');
  const [phoneInput, setPhoneInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [landmarkInput, setLandmarkInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [authError, setAuthError] = useState('');
  const [inlineErrors, setInlineErrors] = useState({});
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [customerPreview, setCustomerPreview] = useState(null);

  // WhatsApp OTP Countdown timer
  const [otpTimer, setOtpTimer] = useState(0);

  // OTP Countdown timer effect
  useEffect(() => {
    let interval = null;
    if (otpTimer > 0) {
      interval = setInterval(() => setOtpTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Profile edit state (when logged in)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editLandmark, setEditLandmark] = useState('');
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
        const prevSession = (() => {
          try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return {}; }
        })();
        const merged = {
          ...prevSession,
          ...full,
          address: full.address || prevSession?.address || '',
          landmark: full.landmark || prevSession?.landmark || '',
          defaultAddress: full.defaultAddress || prevSession?.defaultAddress || full.notes || ''
        };
        setCustomer(merged);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        setEditName(merged.name || '');
        setEditEmail(merged.email || '');
        setEditAddress(merged.address || merged.defaultAddress || '');
        setEditLandmark(merged.landmark || '');
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
        setEditAddress(customer.address || customer.defaultAddress || '');
        setEditLandmark(customer.landmark || '');
      }
    }
  }, [isOpen, customer?.phone, customer?.id, refreshCustomerData, loadOrders, loadReservations, loadCoupons]);

  // Handle Send OTP via WhatsApp Baileys
  const handleSendOtp = async (overridePhone) => {
    const raw = overridePhone || phoneInput;
    const clean = raw.replace(/\D/g, '').slice(-10);
    if (clean.length < 10) {
      setAuthError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSendingOtp(true);
    setAuthError('');
    setInlineErrors({});
    try {
      const res = await api.sendOtp(clean, 'Customer Profile Login');
      const data = res.data || res;
      setPhoneInput(clean);
      setIsExistingCustomer(Boolean(data?.isExistingCustomer));
      setCustomerPreview(data?.customerPreview || null);
      setAuthStep('otp');
      setOtpInput('');
      setOtpTimer(60); // 60s cooldown for resend
    } catch (err) {
      setAuthError(err?.message || 'Could not send WhatsApp OTP. Please check the number and try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle Verify OTP & Login
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const clean = phoneInput.replace(/\D/g, '').slice(-10);
    if (!otpInput || otpInput.trim().length < 4) {
      setAuthError('Please enter the 6-digit verification code received on WhatsApp.');
      return;
    }

    setIsVerifyingOtp(true);
    setAuthError('');
    try {
      const res = await api.verifyOtp({
        phone: clean,
        otp: otpInput.trim()
      });
      const data = res.data || res;

      // Existing Customer Direct Login
      if (data?.isExistingCustomer || (data?.customer && !data?.isNewCustomer)) {
        const cust = data.customer;
        setCustomer(cust);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cust));
        window.dispatchEvent(new CustomEvent('customer_session_updated', { detail: cust }));

        setEditName(cust.name || '');
        setEditEmail(cust.email || '');
        setEditAddress(cust.address || cust.defaultAddress || '');
        setEditLandmark(cust.landmark || '');

        loadOrders(cust.id, cust.phone);
        loadReservations(cust.phone);

        setAuthStep('phone');
        setOtpInput('');
        setAuthError('');
      } else if (data?.isNewCustomer) {
        // New customer -> Mandatory Profile Setup Step
        setAuthStep('profile_setup');
        setNameInput('');
        setAddressInput('');
        setLandmarkInput('');
        setEmailInput('');
        setInlineErrors({});
        setAuthError('');
      } else if (data?.customer) {
        const cust = data.customer;
        setCustomer(cust);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cust));
        window.dispatchEvent(new CustomEvent('customer_session_updated', { detail: cust }));
        setAuthStep('phone');
        setOtpInput('');
      }
    } catch (err) {
      setAuthError(err?.message || 'Invalid or expired OTP code. Please check and try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Handle Complete Mandatory Customer Profile (For New Customers)
  const handleCompleteProfile = async (e) => {
    if (e) e.preventDefault();
    const clean = phoneInput.replace(/\D/g, '').slice(-10);
    const errors = {};

    const trimmedName = nameInput.trim();
    const trimmedAddress = addressInput.trim();
    const trimmedLandmark = landmarkInput.trim();
    const trimmedEmail = emailInput.trim();

    if (!trimmedName || trimmedName.length < 2) {
      errors.name = 'Full Name is mandatory (minimum 2 characters).';
    }
    if (!trimmedAddress || trimmedAddress.length < 3) {
      errors.address = 'Full Address is mandatory (House/Flat No, Street, Area).';
    }
    if (!trimmedLandmark || trimmedLandmark.length < 2) {
      errors.landmark = 'Landmark is mandatory (e.g. Near City Mall / Opp. Metro).';
    }
    if (trimmedEmail && (!trimmedEmail.includes('@') || !trimmedEmail.includes('.'))) {
      errors.email = 'Please enter a valid email address.';
    }

    if (Object.keys(errors).length > 0) {
      setInlineErrors(errors);
      setAuthError('Please complete all mandatory fields marked with * to continue.');
      return;
    }

    setIsSubmittingProfile(true);
    setInlineErrors({});
    setAuthError('');

    try {
      const res = await api.completeProfile({
        phone: clean,
        name: trimmedName,
        address: trimmedAddress,
        landmark: trimmedLandmark,
        email: trimmedEmail
      });
      const data = res.data || res;
      const cust = data.customer || data;
      if (cust) {
        setCustomer(cust);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cust));
        window.dispatchEvent(new CustomEvent('customer_session_updated', { detail: cust }));

        setEditName(cust.name || trimmedName);
        setEditEmail(cust.email || trimmedEmail);
        setEditAddress(cust.address || trimmedAddress);
        setEditLandmark(cust.landmark || trimmedLandmark);

        loadOrders(cust.id, cust.phone);
        loadReservations(cust.phone);

        setAuthStep('phone');
        setOtpInput('');
        setNameInput('');
        setAddressInput('');
        setLandmarkInput('');
        setEmailInput('');
        setAuthError('');
      }
    } catch (err) {
      setAuthError(err?.message || 'Could not complete profile. Please try again.');
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  // Save Profile Changes
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (!customer) return;
    setIsSavingProfile(true);
    setProfileSuccessMsg('');
    try {
      const updateData = {
        name: editName.trim(),
        email: editEmail.trim(),
        address: editAddress.trim(),
        landmark: editLandmark.trim(),
        notes: [editAddress.trim(), editLandmark.trim() ? `(Landmark: ${editLandmark.trim()})` : ''].filter(Boolean).join(' ')
      };
      const res = await api.updateCustomer(customer.id, updateData);
      const updatedCustomer = res.data || res;
      const merged = {
        ...customer,
        ...updatedCustomer,
        name: editName.trim(),
        email: editEmail.trim(),
        address: editAddress.trim(),
        landmark: editLandmark.trim(),
        defaultAddress: [editAddress.trim(), editLandmark.trim() ? `(Landmark: ${editLandmark.trim()})` : ''].filter(Boolean).join(' ')
      };
      setCustomer(merged);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent('customer_session_updated', { detail: merged }));
      setIsEditingProfile(false);
      setProfileSuccessMsg('Profile details updated successfully!');
      setTimeout(() => setProfileSuccessMsg(''), 3000);
    } catch (err) {
      setAuthError('Could not save changes. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('customer_session_updated', { detail: null }));
    setCustomer(null);
    setOrders([]);
    setReservations([]);
    setAuthStep('phone');
    setPhoneInput('');
    setOtpInput('');
    setNameInput('');
    setEmailInput('');
    setAddressInput('');
    setLandmarkInput('');
    setInlineErrors({});
    setAuthError('');
    setIsExistingCustomer(false);
    setCustomerPreview(null);
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

              {/* Step 1: Enter Mobile Number */}
              {authStep === 'phone' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
                      WhatsApp Mobile Number <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength="10"
                        autoFocus
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="98765 43210"
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#DD5903] transition-colors font-mono"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && phoneInput.length === 10) {
                            handleSendOtp();
                          }
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1.5">
                      Enter your 10-digit mobile number. We will send an OTP via WhatsApp to authenticate.
                    </p>
                  </div>

                  {/* Primary Action: Send WhatsApp OTP */}
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={isSendingOtp || phoneInput.length < 10}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSendingOtp ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Sending WhatsApp OTP...</span>
                      </div>
                    ) : (
                      <>
                        <span className="text-base">💬</span>
                        <span>Send WhatsApp OTP</span>
                      </>
                    )}
                  </button>

                  <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-center">
                    <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Existing customers are directly logged in upon OTP verification</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: WhatsApp OTP Verification */}
              {authStep === 'otp' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-center space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>WhatsApp OTP Sent</span>
                    </div>
                    {isExistingCustomer ? (
                      <p className="text-xs text-gray-200">
                        Welcome back{customerPreview?.name ? <strong className="text-emerald-300">, {customerPreview.name}</strong> : ''}! Enter the 6-digit verification code sent to <strong className="text-white font-mono">+91 {phoneInput}</strong>.
                      </p>
                    ) : (
                      <p className="text-xs text-gray-200">
                        New Account Setup: We sent a 6-digit verification code to <strong className="text-white font-mono">+91 {phoneInput}</strong> via WhatsApp.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider text-center">
                      Enter 6-Digit OTP Code <span className="text-emerald-400 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength="6"
                      autoFocus
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      className="w-full bg-black/60 border border-emerald-500/50 rounded-xl px-4 py-2.5 text-center text-2xl font-mono tracking-widest text-emerald-400 placeholder-gray-600 focus:outline-none focus:border-emerald-400 shadow-inner"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && otpInput.length >= 4) {
                          handleVerifyOtp();
                        }
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={isVerifyingOtp || otpInput.length < 4}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isVerifyingOtp ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Verifying OTP...</span>
                      </div>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isExistingCustomer ? 'Verify OTP & Log In' : 'Verify OTP & Continue'}</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthStep('phone');
                        setOtpInput('');
                        setAuthError('');
                      }}
                      className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      ← Change Mobile Number
                    </button>

                    {otpTimer > 0 ? (
                      <span className="text-gray-500 text-[11px] font-mono">Resend in {otpTimer}s</span>
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
              )}

              {/* Step 3: Mandatory Customer Profile Setup (New Customers Only) */}
              {authStep === 'profile_setup' && (
                <form onSubmit={handleCompleteProfile} className="space-y-4">
                  <div className="p-3.5 bg-orange-500/10 border border-orange-500/20 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#DD5903] flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Mobile Number Verified (+91 {phoneInput})</span>
                      </span>
                      <span className="text-[10px] text-red-400 font-semibold uppercase tracking-wider bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                        * Required Fields
                      </span>
                    </div>
                    <p className="text-xs text-gray-300">
                      Welcome to Petuk Adda! Please complete your mandatory profile details below to finalize your account registration.
                    </p>
                  </div>

                  {/* Mandatory Field 1: Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Full Name <span className="text-red-500 font-bold text-sm">*</span>
                    </label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => {
                        setNameInput(e.target.value);
                        if (inlineErrors.name) setInlineErrors((prev) => ({ ...prev, name: '' }));
                      }}
                      placeholder="e.g. Subhashree Ghosh"
                      className={`w-full bg-black/40 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors ${
                        inlineErrors.name ? 'border-red-500 focus:border-red-400' : 'border-white/10 focus:border-[#DD5903]'
                      }`}
                    />
                    {inlineErrors.name && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{inlineErrors.name}</span>
                      </p>
                    )}
                  </div>

                  {/* Mandatory Field 2: Full Address */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Full Delivery Address <span className="text-red-500 font-bold text-sm">*</span>
                    </label>
                    <textarea
                      rows="2"
                      value={addressInput}
                      onChange={(e) => {
                        setAddressInput(e.target.value);
                        if (inlineErrors.address) setInlineErrors((prev) => ({ ...prev, address: '' }));
                      }}
                      placeholder="House/Flat No., Building Name, Street / Road, Area..."
                      className={`w-full bg-black/40 border rounded-xl px-4 py-2 text-sm text-white focus:outline-none transition-colors resize-none ${
                        inlineErrors.address ? 'border-red-500 focus:border-red-400' : 'border-white/10 focus:border-[#DD5903]'
                      }`}
                    />
                    {inlineErrors.address && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{inlineErrors.address}</span>
                      </p>
                    )}
                  </div>

                  {/* Mandatory Field 3: Landmark */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Nearby Landmark <span className="text-red-500 font-bold text-sm">*</span>
                    </label>
                    <input
                      type="text"
                      value={landmarkInput}
                      onChange={(e) => {
                        setLandmarkInput(e.target.value);
                        if (inlineErrors.landmark) setInlineErrors((prev) => ({ ...prev, landmark: '' }));
                      }}
                      placeholder="e.g. Near City Mall / Opp. Metro Gate 2"
                      className={`w-full bg-black/40 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors ${
                        inlineErrors.landmark ? 'border-red-500 focus:border-red-400' : 'border-white/10 focus:border-[#DD5903]'
                      }`}
                    />
                    {inlineErrors.landmark && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{inlineErrors.landmark}</span>
                      </p>
                    )}
                  </div>

                  {/* Optional Field: Email Address */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Email Address <span className="text-gray-500 text-[11px] font-normal">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => {
                        setEmailInput(e.target.value);
                        if (inlineErrors.email) setInlineErrors((prev) => ({ ...prev, email: '' }));
                      }}
                      placeholder="e.g. customer@gmail.com"
                      className={`w-full bg-black/40 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors ${
                        inlineErrors.email ? 'border-red-500 focus:border-red-400' : 'border-white/10 focus:border-[#DD5903]'
                      }`}
                    />
                    {inlineErrors.email && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{inlineErrors.email}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthStep('phone');
                        setAuthError('');
                      }}
                      className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingProfile || !nameInput.trim() || !addressInput.trim() || !landmarkInput.trim()}
                      className="flex-2 dinenos-btn !py-2.5 !text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      {isSubmittingProfile ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Creating Profile...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Complete Profile & Register</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
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
                        <div className="space-y-1">
                          <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Nearby Landmark</span>
                          <p className="text-sm text-white">
                            {customer.landmark || (customer.defaultAddress && customer.defaultAddress.includes('(Landmark:') ? customer.defaultAddress.split('(Landmark:')[1].replace(')', '').trim() : 'Not provided')}
                          </p>
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Delivery Address</span>
                          <p className="text-sm text-gray-200">
                            {customer.address || customer.defaultAddress || customer.notes || 'No address saved yet.'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleSaveProfile} className="space-y-3 pt-2">
                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1">
                            Full Name <span className="text-red-500 font-bold">*</span>
                          </label>
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
                          <label className="block text-xs font-semibold text-gray-300 mb-1">
                            Delivery Address <span className="text-red-500 font-bold">*</span>
                          </label>
                          <textarea
                            rows="2"
                            required
                            value={editAddress}
                            onChange={(e) => setEditAddress(e.target.value)}
                            placeholder="Flat/House No, Building, Street..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#DD5903] resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1">
                            Nearby Landmark <span className="text-red-500 font-bold">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={editLandmark}
                            onChange={(e) => setEditLandmark(e.target.value)}
                            placeholder="e.g. Near City Mall"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#DD5903]"
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
                            disabled={isSavingProfile || !editName.trim() || !editAddress.trim() || !editLandmark.trim()}
                            className="dinenos-btn !py-2 !px-4 !text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
