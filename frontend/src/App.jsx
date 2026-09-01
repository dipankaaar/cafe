import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CafeProvider } from './context/CafeContext';

// Public Customer Storefront
import PublicStorefront from './components/storefront/PublicStorefront';

// Admin Suite Layout
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import GlobalSearchModal from './components/common/GlobalSearchModal';
import ToastContainer from './components/common/ToastContainer';

// Module Views
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

import { ShieldAlert } from 'lucide-react';
import Button from './components/common/Button';

function MainApp() {
  const { hasPermission, role } = useAuth();
  
  // App Mode: 'public' (Customer Storefront) vs 'admin' (Enterprise Admin Panel)
  const [appMode, setAppMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const search = window.location.search;
      if (hash.includes('admin') || search.includes('mode=admin')) return 'admin';
    }
    return 'public'; // Start with Public Website
  });

  const [currentModule, setCurrentModule] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Sync hash with appMode
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash.includes('admin')) {
        setAppMode('admin');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleSwitchToAdmin = () => {
    setAppMode('admin');
    window.location.hash = 'admin';
  };

  const handleSwitchToPublic = () => {
    setAppMode('public');
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If in Public Storefront Mode, render the public customer website
  if (appMode === 'public') {
    return (
      <PublicStorefront onNavigateToAdmin={handleSwitchToAdmin} />
    );
  }

  // Admin Suite Permission check helper
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
            Your current role (<strong>{role}</strong>) does not have authorization to view the {permKey} module.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Button onClick={() => setCurrentModule('dashboard')} size="sm">
              Return to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    if (currentModule.startsWith('orders')) {
      return <OrdersView />;
    }
    if (currentModule.startsWith('menu')) {
      return <MenuManagementView />;
    }
    if (currentModule.startsWith('inventory')) {
      return <InventoryView />;
    }

    switch (currentModule) {
      case 'dashboard':
        return <DashboardView onNavigate={setCurrentModule} />;
      case 'pos':
        return <POSView />;
      case 'kitchen':
        return <KitchenDisplayView />;
      case 'tables':
        return <TableManagementView onNavigate={setCurrentModule} />;
      case 'reservations':
        return <ReservationsView onNavigate={setCurrentModule} />;
      case 'customers':
        return <CustomersView />;
      case 'loyalty':
        return <LoyaltyView />;
      case 'coupons':
        return <CouponsView />;
      case 'expenses':
        return <ExpensesView />;
      case 'staff':
        return <StaffManagementView />;
      case 'reports':
        return <ReportsView />;
      case 'notifications':
        return <NotificationsView onNavigate={setCurrentModule} />;
      case 'audit':
        return <AuditLogsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView onNavigate={setCurrentModule} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0f0f0f] text-gray-900 dark:text-gray-100 flex transition-colors">
      
      {/* Sidebar Navigation */}
      <Sidebar
        currentModule={currentModule}
        onSelectModule={setCurrentModule}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        
        {/* Topbar with Public Storefront switcher */}
        <Topbar
          currentModule={currentModule}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onNavigate={setCurrentModule}
          onSwitchToPublic={handleSwitchToPublic}
        />

        {/* Dynamic View Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fadeIn">
          {renderModuleView()}
        </main>

        {/* Global Admin Footer */}
        <footer className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Dinenos Coffee House • Enterprise Fullstack Management Suite</p>
          <button
            onClick={handleSwitchToPublic}
            className="text-[#DD5903] hover:underline font-bold"
          >
            ← Return to Public Website
          </button>
        </footer>
      </div>

      {/* Global Cmd/Ctrl+K Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={setCurrentModule}
      />

      {/* Floating Live Toast Notifications */}
      <ToastContainer />

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CafeProvider>
          <MainApp />
        </CafeProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
