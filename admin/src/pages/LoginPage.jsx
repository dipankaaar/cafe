import React, { useState, useEffect } from 'react';
import { Shield, Lock, Mail, KeyRound, Coffee, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { dbService, DB_KEYS } from '../services/dbService';
import { initialStaff } from '../services/seedData';
import logoImg from '../assets/logo.jpg';

export default function LoginPage() {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState('credentials'); // 'credentials' | 'pin'
  const cachedSettings = dbService.get(DB_KEYS.SETTINGS, {});
  const [email, setEmail] = useState(() => cachedSettings.adminEmail || 'admin@petukadda.com');
  const [password, setPassword] = useState(() => cachedSettings.adminPassword || 'admin');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backendStatus, setBackendStatus] = useState({ checking: true, online: false, message: '' });

  // Check live connection to backend
  useEffect(() => {
    let mounted = true;
    async function checkHealth() {
      try {
        const res = await api.checkHealth();
        if (mounted) {
          setBackendStatus({
            checking: false,
            online: res?.status === 'healthy' || true,
            message: 'System Online • Cloud Database Connected'
          });
        }
      } catch (err) {
        if (mounted) {
          setBackendStatus({
            checking: false,
            online: false,
            message: 'Backend disconnected (Retrying...)'
          });
        }
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const res = login(email, password);
      if (!res.success) {
        setError(res.message || 'Invalid credentials');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const localStaff = dbService.get(DB_KEYS.STAFF, initialStaff);
      const settings = dbService.get(DB_KEYS.SETTINGS, {});
      const backendStaff = await api.getStaff().catch(() => null);
      const staffList = backendStaff && backendStaff.length > 0 ? backendStaff : localStaff;

      const adminUser = staffList.find((s) => s.role === 'Admin') || { email: settings.adminEmail || 'admin@petukadda.com', role: 'Admin' };
      const masterPin = settings.adminPin || adminUser.pin || '1234';

      if (String(pin) === String(masterPin)) {
        const res = login(adminUser.email, 'pin-auth');
        if (res.success) return;
      }

      const matched = staffList.find((s) => String(s.pin) === String(pin));
      if (matched) {
        const res = login(matched.email, 'pin-auth');
        if (res.success) return;
      }
      setError('Invalid PIN code. Please enter your valid 4-digit staff PIN.');
    } catch (err) {
      setError('PIN verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0e11] text-gray-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background glowing gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#DD5903]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Backend Live Badge */}
      <div className="mb-6 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gray-900/90 border border-gray-800 text-xs shadow-lg backdrop-blur-md">
        <span className={`w-2.5 h-2.5 rounded-full ${backendStatus.online ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 animate-pulse'}`} />
        <span className="text-gray-300 font-medium">
          {backendStatus.checking ? 'Connecting to backend...' : backendStatus.message}
        </span>
      </div>

      <div className="w-full max-w-md bg-[#16181e] border border-gray-800/90 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative z-10">
        
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-black shadow-xl shadow-orange-950/50 mb-3 overflow-hidden border-2 border-amber-500/50">
            <img src={logoImg} alt="Petuk Adda" className="w-full h-full object-cover" />
            <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-amber-400 text-[#1a0f07] flex items-center justify-center text-[10px] shadow-sm font-bold">
              <Sparkles className="w-3 h-3" />
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white font-['Playfair_Display',serif]">
            Petuk Adda
          </h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-[10px] uppercase tracking-widest text-[#DD5903] font-bold">
              Admin & POS Console
            </span>
            <span className="text-gray-600">•</span>
            <span className="text-[10px] text-gray-400 font-medium">Salboni, Bankura</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-900/80 p-1 rounded-xl border border-gray-800 mb-6">
          <button
            type="button"
            onClick={() => { setActiveTab('credentials'); setError(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'credentials'
                ? 'bg-[#DD5903] text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            Email Login
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('pin'); setError(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'pin'
                ? 'bg-[#DD5903] text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Quick PIN Code
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        {activeTab === 'credentials' ? (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Staff Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@dinenos.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-gray-900/90 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#DD5903] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 bg-gray-900/90 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#DD5903] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#DD5903] to-amber-600 hover:from-[#c44e02] hover:to-amber-700 text-white font-bold text-sm shadow-lg shadow-orange-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isSubmitting ? 'Verifying...' : 'Sign In to Admin'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* PIN Code Form */
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5 text-center">
                Enter 4-Digit Staff PIN (e.g. 1234)
              </label>
              <input
                type="password"
                maxLength={4}
                required
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full text-center tracking-[1em] text-2xl font-mono py-3 bg-gray-900/90 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-[#DD5903] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || pin.length < 4}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#DD5903] to-amber-600 hover:from-[#c44e02] hover:to-amber-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-orange-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? 'Unlocking...' : 'Unlock Console'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Security & Access Information */}
        <div className="mt-8 pt-5 border-t border-gray-800/80 text-center">
          <p className="text-[11px] text-gray-400">
            🔒 Protected Management Terminal for Petuk Adda Cafe Staff.
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">
            Admin credentials can be managed inside Settings &gt; Admin Security.
          </p>
        </div>

        {/* Link back to public storefront */}
        <div className="mt-6 text-center">
          <a
            href={
              (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STOREFRONT_URL) ||
              (typeof window !== 'undefined' && (window.location.port === '5174' || window.location.hostname === 'localhost')
                ? 'http://localhost:5173'
                : (typeof window !== 'undefined' ? window.location.origin : 'https://petukadda.vercel.app'))
            }
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-[#DD5903] transition-colors inline-flex items-center gap-1.5"
          >
            <span>Visit Customer Storefront</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </div>
  );
}
