import React, { useState } from 'react';
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
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useCafe } from '../../context/CafeContext';
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
  const { notifications, settings } = useCafe();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

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
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Public Storefront Switcher Button */}
        {onSwitchToPublic && (
          <button
            onClick={onSwitchToPublic}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-[#DD5903] hover:text-white text-gray-700 dark:text-gray-300 text-xs font-bold transition-all cursor-pointer shadow-2xs"
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
      </div>

      {/* Center Search Input Trigger */}
      <div className="flex-1 max-w-md mx-4 hidden lg:block">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-2 bg-gray-100 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs rounded-xl border border-gray-200/80 dark:border-gray-700/60 transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <span>Search orders, menu items, guests, coupons...</span>
          </div>
          <kbd className="hidden xl:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-600 shadow-2xs">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* Mobile Search Button */}
        <button
          onClick={onOpenSearch}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Search"
        >
          <Search className="w-5 h-5" />
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

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600" />
          )}
        </button>

        {/* Notifications Icon with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
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
