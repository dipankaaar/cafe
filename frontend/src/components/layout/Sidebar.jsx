import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  ChefHat,
  UtensilsCrossed,
  Grid,
  CalendarDays,
  Users,
  Award,
  Tag,
  Boxes,
  Receipt,
  UserCog,
  BarChart3,
  Bell,
  ScrollText,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  Sparkles,
  Coffee,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCafe } from '../../context/CafeContext';

export default function Sidebar({
  currentModule,
  onSelectModule,
  isMobileOpen,
  onCloseMobile
}) {
  const { role, hasPermission, currentUser, logout } = useAuth();
  const { orders, inventory, notifications, reservations } = useCafe();

  const [expandedMenus, setExpandedMenus] = useState({
    orders: true,
    menu: false,
    inventory: false
  });

  const toggleExpand = (key) => {
    setExpandedMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Badge calculations
  const pendingOrdersCount = orders.filter((o) => ['New', 'Accepted', 'Preparing'].includes(o.status)).length;
  const kitchenOrdersCount = orders.filter((o) => ['Accepted', 'Preparing'].includes(o.status)).length;
  const lowStockCount = inventory.filter((i) => i.status === 'Low Stock').length;
  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;
  const todayPendingReservations = reservations.filter((r) => r.status === 'Pending').length;

  const navItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      permission: 'dashboard'
    },
    {
      key: 'orders',
      label: 'Orders',
      icon: ShoppingBag,
      permission: 'orders',
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : null,
      badgeColor: 'bg-[#DD5903]',
      subItems: [
        { key: 'orders-all', label: 'All Orders', filter: 'all' },
        { key: 'orders-new', label: 'New Orders', filter: 'New' },
        { key: 'orders-preparing', label: 'Preparing', filter: 'Preparing' },
        { key: 'orders-ready', label: 'Ready', filter: 'Ready' },
        { key: 'orders-completed', label: 'Completed', filter: 'Completed' }
      ]
    },
    {
      key: 'pos',
      label: 'POS / Billing',
      icon: CreditCard,
      permission: 'pos',
      highlight: true
    },
    {
      key: 'kitchen',
      label: 'Kitchen KDS',
      icon: ChefHat,
      permission: 'kitchen',
      badge: kitchenOrdersCount > 0 ? kitchenOrdersCount : null,
      badgeColor: 'bg-rose-500'
    },
    {
      key: 'menu',
      label: 'Menu',
      icon: UtensilsCrossed,
      permission: 'menu',
      subItems: [
        { key: 'menu-products', label: 'Products' },
        { key: 'menu-categories', label: 'Categories' },
        { key: 'menu-addons', label: 'Variants & Add-ons' }
      ]
    },
    {
      key: 'tables',
      label: 'Tables',
      icon: Grid,
      permission: 'tables'
    },
    {
      key: 'reservations',
      label: 'Reservations',
      icon: CalendarDays,
      permission: 'reservations',
      badge: todayPendingReservations > 0 ? todayPendingReservations : null,
      badgeColor: 'bg-blue-500'
    },
    {
      key: 'customers',
      label: 'Customers',
      icon: Users,
      permission: 'customers'
    },
    {
      key: 'loyalty',
      label: 'Loyalty Program',
      icon: Award,
      permission: 'loyalty'
    },
    {
      key: 'coupons',
      label: 'Coupons & Promos',
      icon: Tag,
      permission: 'coupons'
    },
    {
      key: 'inventory',
      label: 'Inventory',
      icon: Boxes,
      permission: 'inventory',
      badge: lowStockCount > 0 ? `${lowStockCount} Low` : null,
      badgeColor: 'bg-amber-500',
      subItems: [
        { key: 'inventory-stock', label: 'Stock Levels' },
        { key: 'inventory-suppliers', label: 'Suppliers' },
        { key: 'inventory-purchases', label: 'Purchases' }
      ]
    },
    {
      key: 'expenses',
      label: 'Expenses',
      icon: Receipt,
      permission: 'expenses'
    },
    {
      key: 'staff',
      label: 'Staff Management',
      icon: UserCog,
      permission: 'staff'
    },
    {
      key: 'reports',
      label: 'Reports & Analytics',
      icon: BarChart3,
      permission: 'reports'
    },
    {
      key: 'notifications',
      label: 'Notifications',
      icon: Bell,
      permission: 'notifications',
      badge: unreadNotifsCount > 0 ? unreadNotifsCount : null,
      badgeColor: 'bg-[#DD5903]'
    },
    {
      key: 'audit',
      label: 'Audit Logs',
      icon: ScrollText,
      permission: 'audit'
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: Settings,
      permission: 'settings'
    }
  ];

  const handleNavClick = (item) => {
    if (item.subItems) {
      toggleExpand(item.key);
    }
    onSelectModule(item.key);
    if (onCloseMobile) onCloseMobile();
  };

  const handleSubClick = (parentKey, subKey) => {
    onSelectModule(subKey || parentKey);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#141414] text-gray-300 border-r border-gray-800 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-16 px-5 border-b border-gray-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#DD5903] text-white flex items-center justify-center font-bold text-lg shadow-md shadow-orange-950/40">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5 font-['Plus_Jakarta_Sans',sans-serif]">
                  DINENOS <span className="text-[10px] bg-[#DD5903]/20 text-[#DD5903] font-mono px-1.5 py-0.2 rounded border border-[#DD5903]/30">ADMIN</span>
                </h1>
                <p className="text-[10px] text-gray-400 font-medium">Cafe Management Suite</p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-gray-400 hover:text-white rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items List */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)] custom-scrollbar">
            {navItems.map((item) => {
              // Permission check
              if (!hasPermission(item.permission)) return null;

              const isSelected =
                currentModule === item.key ||
                (item.subItems && item.subItems.some((s) => currentModule === s.key));
              const Icon = item.icon;
              const isExpanded = expandedMenus[item.key];

              return (
                <div key={item.key} className="space-y-0.5">
                  <button
                    onClick={() => handleNavClick(item)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      item.highlight
                        ? isSelected
                          ? 'bg-[#DD5903] text-white shadow-md'
                          : 'bg-[#DD5903]/15 text-[#DD5903] hover:bg-[#DD5903]/25 border border-[#DD5903]/30'
                        : isSelected
                        ? 'bg-[#DD5903] text-white shadow-xs'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 ${
                          item.highlight && !isSelected ? 'text-[#DD5903]' : ''
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full text-white font-bold ${
                            item.badgeColor || 'bg-gray-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {item.subItems && (
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      )}
                    </div>
                  </button>

                  {/* Sub-menu items */}
                  {item.subItems && isExpanded && (
                    <div className="pl-9 pr-2 py-1 space-y-1">
                      {item.subItems.map((sub) => {
                        const isSubSelected = currentModule === sub.key;
                        return (
                          <button
                            key={sub.key}
                            onClick={() => handleSubClick(item.key, sub.key)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                              isSubSelected
                                ? 'bg-white/10 text-[#DD5903] font-bold'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                            }`}
                          >
                            {sub.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-gray-800/80 bg-[#101010]">
          <div className="flex items-center justify-between p-2 rounded-lg bg-gray-900/60 border border-gray-800/60">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={
                  currentUser?.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                }
                alt={currentUser?.name || 'User'}
                className="w-8 h-8 rounded-full object-cover border border-gray-700 flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {currentUser?.name || 'Alex Walker'}
                </p>
                <span className="text-[10px] text-[#DD5903] font-semibold block uppercase tracking-wider">
                  {role}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-gray-800 rounded-md transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
