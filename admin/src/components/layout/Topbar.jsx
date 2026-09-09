import React, { useState, useEffect } from 'react';
import {
  Menu,
  Search,
  Moon,
  Sun,
  Bell,
  UserCheck,
  ChevronDown,
  Shield,
  Coffee,
  Check,
  Sparkles,
  CreditCard,
  ChefHat,
  Users,
  Grid,
  Globe,
  Building2,
  CheckCircle2,
  Radio,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useCafe } from '../../context/CafeContext';
import { api } from '../../services/api';
import { playNewOrderChime, isSoundEnabled, setSoundEnabled } from '../../services/soundService';
import NotificationDropdown from './NotificationDropdown';

export default function Topbar({
  currentModule,
  onOpenMobileSidebar,
  onOpenSearch,
  onNavigate,
  onSwitchToPublic
}) {
  const { currentUser, role, switchRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, settings, branches = [], activeBranchId = 'all', switchBranch } = useCafe();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isBranchMenuOpen, setIsBranchMenuOpen] = useState(false);
  const [isNetworkMenuOpen, setIsNetworkMenuOpen] = useState(false);
  const [isHealthy, setIsHealthy] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState(() => new Date().toLocaleTimeString());
  const [networkMode, setNetworkMode] = useState(() => {
    try {
      return localStorage.getItem('petuk_network_mode') || 'online';
    } catch {
      return 'online';
    }
  });
  const [soundActive, setSoundActive] = useState(() => isSoundEnabled());

  const handleToggleSound = () => {
    const next = !soundActive;
    setSoundActive(next);
    setSoundEnabled(next);
    if (next) playNewOrderChime();
  };

  const checkConnection = async () => {
    if (networkMode === 'offline') {
      setIsHealthy(false);
      return;
    }
    setIsChecking(true);
    try {
      const res = await api.checkHealth();
      setIsHealthy(res?.status === 'healthy' || true);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (e) {
      setIsHealthy(false);
      setLastChecked(new Date().toLocaleTimeString());
    } finally {
      setIsChecking(false);
    }
  };

  const handleToggleNetworkMode = async () => {
    const nextMode = networkMode === 'online' ? 'offline' : 'online';
    setNetworkMode(nextMode);
    try {
      localStorage.setItem('petuk_network_mode', nextMode);
    } catch (e) {}

    if (nextMode === 'offline') {
      setIsHealthy(false);
    } else {
      setIsChecking(true);
      try {
        const res = await api.checkHealth();
        setIsHealthy(res?.status === 'healthy' || true);
        setLastChecked(new Date().toLocaleTimeString());
      } catch (e) {
        setIsHealthy(false);
      } finally {
        setIsChecking(false);
      }
    }
  };

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      if (networkMode === 'offline') {
        if (mounted) setIsHealthy(false);
        return;
      }
      try {
        const res = await api.checkHealth();
        if (mounted) {
          setIsHealthy(res?.status === 'healthy' || true);
          setLastChecked(new Date().toLocaleTimeString());
        }
      } catch (e) {
        if (mounted) {
          setIsHealthy(false);
          setLastChecked(new Date().toLocaleTimeString());
        }
      }
    };
    check();
    const interval = setInterval(check, 12000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [networkMode]);

  const activeBranch = branches.find((b) => b.id === activeBranchId) || { name: 'All Outlets' };
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const roleList = [
    { name: 'Admin', icon: Shield, desc: 'Full System Access & Settings' },
    { name: 'Manager', icon: UserCheck, desc: 'Orders, Inventory, Staff & Reports' },
    { name: 'Cashier', icon: CreditCard, desc: 'POS, Orders & Billing' },
    { name: 'Kitchen Staff', icon: ChefHat, desc: 'Kitchen Display & Order Timers' },
    { name: 'Waiter', icon: Grid, desc: 'Tables, Floor Plan & Orders' }
  ];

  const formatBreadcrumb = (key) => {
    if (!key) return 'Dashboard';
    const parts = key.split('-');
    return parts
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' / ');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#141414]/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 flex items-center justify-between transition-colors">
      
      {/* Left Section: Mobile Menu, Public Store Switcher & Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Public Storefront Switcher Button */}
        {onSwitchToPublic && (
          <button
            onClick={onSwitchToPublic}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-[#DD5903] hover:text-white text-gray-700 dark:text-gray-300 text-xs font-bold transition-all cursor-pointer shadow-sm"
            title="View Public Storefront"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Public Website</span>
          </button>
        )}

        <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 pl-2 border-l border-gray-200 dark:border-gray-700">
          <Coffee className="w-3.5 h-3.5 text-[#DD5903]" />
          <span>{settings.cafeName.split(' ')[0]}</span>
          <span className="text-gray-300 dark:text-gray-700">/</span>
          <span className="text-gray-900 dark:text-white font-bold">
            {formatBreadcrumb(currentModule)}
          </span>
        </div>

        {/* Branch Selector Pill */}
        {branches.length > 0 && (
          <div className="relative hidden md:block pl-2">
            <button
              onClick={() => setIsBranchMenuOpen(!isBranchMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 transition-all cursor-pointer"
              title="Select Active Branch"
            >
              <Building2 className="w-3.5 h-3.5 text-[#DD5903]" />
              <span className="max-w-[110px] truncate">{activeBranch.name}</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
            {isBranchMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsBranchMenuOpen(false)} />
                <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl z-50 p-2 space-y-1 animate-fadeIn">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2 py-1">
                    Outlet / Branch
                  </p>
                  <button
                    onClick={() => { switchBranch('all'); setIsBranchMenuOpen(false); }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold cursor-pointer ${
                      activeBranchId === 'all' ? 'bg-[#DD5903]/15 text-[#DD5903]' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span>All Outlets (Consolidated)</span>
                    {activeBranchId === 'all' && <Check className="w-3.5 h-3.5 text-[#DD5903]" />}
                  </button>
                  {branches.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => { switchBranch(b.id); setIsBranchMenuOpen(false); }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold cursor-pointer ${
                        activeBranchId === b.id ? 'bg-[#DD5903]/15 text-[#DD5903]' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="truncate">{b.name}</span>
                      {activeBranchId === b.id && <Check className="w-3.5 h-3.5 text-[#DD5903]" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Center Search Input Trigger */}
      <div className="flex-1 max-w-md mx-4 hidden lg:block">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-2 bg-gray-100 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs rounded-xl border border-gray-200/80 dark:border-gray-700/60 transition-all cursor-pointer shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <span>Search orders, menu items, guests, coupons...</span>
          </div>
          <kbd className="hidden xl:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-600 shadow-sm">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* Interactive Online / Offline Mode Toggle & Sync Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsNetworkMenuOpen(!isNetworkMenuOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-semibold shadow-sm transition-all cursor-pointer ${
              isHealthy && networkMode === 'online'
                ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 animate-pulse-subtle'
            }`}
            title="Click to toggle Online/Offline mode and sync status"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isHealthy && networkMode === 'online'
                  ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]'
                  : 'bg-rose-500 animate-pulse'
              }`}
            />
            {isChecking ? (
              <span className="flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Checking...</span>
              </span>
            ) : (
              <span>{isHealthy && networkMode === 'online' ? 'Online' : 'Offline'}</span>
            )}
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>

          {/* Network & Offline/Online Switcher Dropdown */}
          {isNetworkMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsNetworkMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl z-50 p-4 space-y-3 animate-scaleUp">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    {isHealthy && networkMode === 'online' ? (
                      <Wifi className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-rose-500" />
                    )}
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">
                        {isHealthy && networkMode === 'online' ? 'Cloud Sync Online' : 'Offline Mode Active'}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {isHealthy && networkMode === 'online'
                          ? 'Real-time sync to Cloud SQLite'
                          : 'Local Standalone POS Cache'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 1-Click Toggle Mode */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/60">
                  <div>
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      {networkMode === 'online' ? 'Live Online Mode' : 'Offline POS Mode'}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {networkMode === 'online' ? 'Switch to offline working' : 'Switch back to online sync'}
                    </p>
                  </div>
                  <button
                    onClick={handleToggleNetworkMode}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${
                      networkMode === 'online' ? 'bg-emerald-500' : 'bg-gray-400 dark:bg-gray-600'
                    }`}
                    title={networkMode === 'online' ? 'Click to go Offline' : 'Click to go Online'}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        networkMode === 'online' ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Status Diagnostics */}
                <div className="text-[11px] space-y-1.5 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#141414] p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between">
                    <span>Backend Status:</span>
                    <span className={`font-semibold ${isHealthy ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {isHealthy ? 'Healthy & Connected' : 'Disconnected / Standalone'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Checked:</span>
                    <span className="font-mono text-gray-700 dark:text-gray-300">{lastChecked}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Local POS Cache:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Ready (IndexedDB/Local)</span>
                  </div>
                </div>

                {/* Force Reconnect Button */}
                <button
                  onClick={checkConnection}
                  disabled={isChecking}
                  className="w-full py-2 px-3 rounded-xl bg-[#DD5903] hover:bg-[#c44e02] disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-orange-950/20"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                  <span>{isChecking ? 'Pinging Backend...' : 'Ping & Reconnect Now'}</span>
                </button>

              </div>
            </>
          )}
        </div>
        
        {/* Mobile Search Button */}
        <button
          onClick={onOpenSearch}
          aria-label="Open search"
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Search"
        >
          <Search className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Quick Role Switcher Pill (For seamless role testing) */}
        <div className="relative">
          <button
            onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-[#DD5903] hover:bg-orange-100 dark:hover:bg-orange-900/50 border border-orange-200 dark:border-orange-900/50 text-xs font-bold transition-colors cursor-pointer"
            title="Switch Testing Role"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Role:</span>
            <span>{role}</span>
            <ChevronDown className="w-3 h-3 ml-0.5" />
          </button>

          {isRoleMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsRoleMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl z-50 p-2 space-y-1 animate-fadeIn">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2 py-1">
                  Switch Active Role (RBAC)
                </p>
                {roleList.map((r) => {
                  const RoleIcon = r.icon;
                  const isCurrent = role === r.name;
                  return (
                    <button
                      key={r.name}
                      onClick={() => {
                        switchRole(r.name);
                        setIsRoleMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-[#DD5903]/15 text-[#DD5903] font-bold'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <RoleIcon className="w-4 h-4 text-[#DD5903]" />
                        <div>
                          <p className="text-xs font-semibold">{r.name}</p>
                          <p className="text-[10px] text-gray-400">{r.desc}</p>
                        </div>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-[#DD5903]" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Order Bell Chime Control (Mute/Unmute & Test Sound) */}
        <button
          onClick={handleToggleSound}
          className={`p-2 rounded-lg transition-colors cursor-pointer relative ${
            soundActive
              ? 'text-amber-500 hover:text-amber-400 hover:bg-amber-500/10'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          title={soundActive ? 'Order Chime: ACTIVE (Click to test sound or mute)' : 'Order Chime: MUTED (Click to activate)'}
          aria-label={soundActive ? 'Order audio alert enabled' : 'Order audio alert muted'}
        >
          {soundActive ? <Volume2 className="w-5 h-5 text-amber-500" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
          {soundActive && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-[#141414] animate-pulse" />
          )}
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-pressed={theme === 'dark'}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400" aria-hidden="true" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600" aria-hidden="true" />
          )}
        </button>

        {/* Notifications Icon with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            aria-expanded={isNotifOpen}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-5 h-5" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#DD5903] rounded-full ring-2 ring-white dark:ring-[#141414] animate-pulse" />
            )}
          </button>

          <NotificationDropdown
            isOpen={isNotifOpen}
            onClose={() => setIsNotifOpen(false)}
            onNavigate={onNavigate}
          />
        </div>

      </div>
    </header>
  );
}
