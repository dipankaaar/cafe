import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CafeProvider } from './context/CafeContext';

// Layout & UI Shell
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import GlobalSearchModal from './components/common/GlobalSearchModal';
import Button from './components/common/Button';
import NewOrderAlertModal from './components/common/NewOrderAlertModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useCafe } from './context/CafeContext';

// Admin Modules
import DashboardView from './components/modules/dashboard/DashboardView';
import POSView from './components/modules/pos/POSView';
import KitchenDisplayView from './components/modules/kitchen/KitchenDisplayView';
import OrdersView from './components/modules/orders/OrdersView';
import MenuManagementView from './components/modules/menu/MenuManagementView';
import TableManagementView from './components/modules/tables/TableManagementView';
import ReservationsView from './components/modules/reservations/ReservationsView';
import CustomersView from './components/modules/customers/CustomersView';
import LoyaltyView from './components/modules/loyalty/LoyaltyView';
import CouponsView from './components/modules/coupons/CouponsView';
import InventoryView from './components/modules/inventory/InventoryView';
import ExpensesView from './components/modules/expenses/ExpensesView';
import StaffManagementView from './components/modules/staff/StaffManagementView';
import ReportsView from './components/modules/reports/ReportsView';
import NotificationsView from './components/modules/notifications/NotificationsView';
import AuditLogsView from './components/modules/audit/AuditLogsView';
import SettingsView from './components/modules/settings/SettingsView';

// Auth Login View
import LoginPage from './pages/LoginPage';
import { ShieldAlert, ExternalLink, Activity } from 'lucide-react';
import { api } from './services/api';

function AdminContent() {
  const { currentUser, isAuthenticated, hasPermission, role } = useAuth();
  const { newOrderAlertQueue = [], dismissNewOrderAlert, updateOrderStatus } = useCafe();
  const [currentModule, setCurrentModule] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [backendHealthy, setBackendHealthy] = useState(true);

  // Monitor backend health
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        await api.checkHealth();
        if (mounted) setBackendHealthy(true);
      } catch (e) {
        if (mounted) setBackendHealthy(false);
      }
    };
    check();
    const timer = setInterval(check, 12000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  // Keyboard shortcut Ctrl/Cmd+K for search
  useEffect(() => {
    const handleShortcut = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  // If user is not authenticated, show standalone login page
  if (!isAuthenticated || !currentUser) {
    return <LoginPage />;
  }

  const handleOpenStorefront = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url =
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STOREFRONT_URL) ||
      (typeof window !== 'undefined' && (window.location.port === '5174' || window.location.hostname === 'localhost')
        ? 'http://localhost:5173'
        : (origin || 'https://petukadda.vercel.app'));
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getPermissionKey = (key) => {
    if (key.startsWith('orders')) return 'orders';
    if (key.startsWith('menu')) return 'menu';
    if (key.startsWith('inventory')) return 'inventory';
    return key;
  };

  const permKey = getPermissionKey(currentModule);
  const isAuthorized = hasPermission(permKey);

  const renderModuleView = () => {
    if (!isAuthorized) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white dark:bg-[#181818] rounded-2xl border border-gray-200 dark:border-gray-800">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Access Restricted
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
            Your current role (<strong>{role}</strong>) does not have authorization to view the <strong>{permKey}</strong> module.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Button onClick={() => setCurrentModule('dashboard')} size="sm">
              Return to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    if (currentModule.startsWith('orders')) return <OrdersView initialModule={currentModule} />;
    if (currentModule.startsWith('menu')) return <MenuManagementView initialModule={currentModule} />;
    if (currentModule.startsWith('inventory')) return <InventoryView />;

    switch (currentModule) {
      case 'dashboard': return <DashboardView onNavigate={setCurrentModule} />;
      case 'pos': return <POSView />;
      case 'kitchen': return <KitchenDisplayView />;
      case 'tables': return <TableManagementView onNavigate={setCurrentModule} />;
      case 'reservations': return <ReservationsView onNavigate={setCurrentModule} />;
      case 'customers': return <CustomersView />;
      case 'loyalty': return <LoyaltyView />;
      case 'coupons': return <CouponsView />;
      case 'expenses': return <ExpensesView />;
      case 'staff': return <StaffManagementView />;
      case 'reports': return <ReportsView />;
      case 'notifications': return <NotificationsView onNavigate={setCurrentModule} />;
      case 'audit': return <AuditLogsView />;
      case 'settings': return <SettingsView />;
      default: return <DashboardView onNavigate={setCurrentModule} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0f0f0f] text-gray-900 dark:text-gray-100 flex transition-colors font-[Inter,'Plus_Jakarta_Sans',sans-serif]">
      {/* Sidebar Navigation */}
      <Sidebar
        currentModule={currentModule}
        onSelectModule={setCurrentModule}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Admin Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Topbar */}
        <Topbar
          currentModule={currentModule}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onNavigate={setCurrentModule}
          onSwitchToPublic={handleOpenStorefront}
        />

        {/* Dynamic View Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fadeIn">
          {renderModuleView()}
        </main>

        {/* Admin Footer with Backend Connection Pulse */}
        <footer className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#121212]">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${backendHealthy ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' : 'bg-rose-500 animate-pulse'}`} />
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              Backend API: {backendHealthy ? 'Connected (http://localhost:5000)' : 'Disconnected (Offline Mode)'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <p className="text-[11px]">© 2025 Petuk Adda Cafe • Dedicated Admin Management Console</p>
            <button
              onClick={handleOpenStorefront}
              className="text-[#DD5903] hover:underline font-bold cursor-pointer inline-flex items-center gap-1"
            >
              <span>Customer Storefront</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </footer>
      </div>

      {/* Global Cmd/Ctrl+K Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={setCurrentModule}
      />

      {/* Real-Time New Order Chime Popup Modal */}
      <NewOrderAlertModal
        orderQueue={newOrderAlertQueue}
        onDismiss={dismissNewOrderAlert}
        onAcceptOrder={(orderId) => updateOrderStatus(orderId, 'accepted')}
        onNavigateToOrders={(module) => setCurrentModule(module || 'orders')}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <CafeProvider>
            <AdminContent />
          </CafeProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
