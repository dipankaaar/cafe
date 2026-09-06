import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CafeProvider } from './context/CafeContext';

// Public Customer Storefront & Sub-Pages
import PublicStorefront from './components/storefront/PublicStorefront';
import OrderOnlinePage from './pages/OrderOnlinePage';
import ExploreMenuPage from './pages/ExploreMenuPage';
import ScanTablePage from './pages/ScanTablePage';
import FindTablePage from './pages/FindTablePage';
import TableOrder from './components/storefront/TableOrder';

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

function parseRoute() {
  if (typeof window === 'undefined') return { path: '/', token: '' };

  const hash = window.location.hash || '';
  const rawPath = (window.location.pathname || '/').split('?')[0].split('#')[0];
  // Normalise: collapse trailing slash (except root) so /admin/ and /menu/ match
  const pathname = rawPath.length > 1 ? rawPath.replace(/\/+$/, '') : rawPath;

  // QR order deep links — token is the segment after /order/
  if (hash.startsWith('#order/') || hash.startsWith('#/order/')) {
    const token = decodeURIComponent(hash.replace(/^#\/?order\//, '').split('?')[0].split('#')[0].trim());
    return { path: '/order', token };
  }
  if (pathname === '/order' || pathname.startsWith('/order/')) {
    const token = decodeURIComponent(pathname.replace(/^\/order\/?/, '').split('/')[0].split('?')[0].trim());
    return { path: '/order', token };
  }

  // Hash + BrowserRouter public routes (hash kept for backwards compat)
  if (hash.startsWith('#/order-online') || hash === '#order-online' || pathname === '/order-online') {
    return { path: '/order-online', token: '' };
  }
  if (hash.startsWith('#/menu') || hash === '#menu' || pathname === '/menu') {
    return { path: '/menu', token: '' };
  }
  if (hash.startsWith('#/scan-table') || hash === '#scan-table' || pathname === '/scan-table') {
    return { path: '/scan-table', token: '' };
  }
  if (hash.startsWith('#/find-table') || hash === '#find-table' || pathname === '/find-table') {
    return { path: '/find-table', token: '' };
  }
  if (hash === '#admin' || hash.startsWith('#/admin') || hash.includes('admin') || pathname === '/admin' || (typeof window !== 'undefined' && window.location.search.includes('mode=admin'))) {
    return { path: '/admin', token: '' };
  }

  // Known routes pass through; unknown paths fall back to public homepage
  // (never strand a mistyped URL inside the admin shell)
  if (pathname === '/' || pathname === '') return { path: '/', token: '' };
  return { path: '/*', token: '' };
}

function MainApp() {
  const { hasPermission, role } = useAuth();
  
  const [currentRoute, setCurrentRoute] = useState(() => parseRoute());
  const [currentModule, setCurrentModule] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Sync state on back/forward and hash changes
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentRoute(parseRoute());
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Ctrl/⌘+K opens global admin search from anywhere in the shell
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

  // Programmatic Navigate Helper (BrowserRouter-style paths)
  const navigate = useCallback((toPath) => {
    if (!toPath) return;
    let target = String(toPath).trim();
    if (!target.startsWith('/')) target = '/' + target;

    // Push state and update route
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', target);
    }
    setCurrentRoute(parseRoute());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSwitchToAdmin = () => {
    navigate('/admin');
  };

  const handleSwitchToPublic = () => {
    navigate('/');
  };

  // 1. ORDER ONLINE PAGE (/order-online)
  if (currentRoute.path === '/order-online') {
    return <OrderOnlinePage onNavigate={navigate} />;
  }

  // 2. EXPLORE MENU PAGE (/menu)
  if (currentRoute.path === '/menu') {
    return <ExploreMenuPage onNavigate={navigate} />;
  }

  // 3. SCAN TABLE QR PAGE (/scan-table)
  if (currentRoute.path === '/scan-table') {
    return <ScanTablePage onNavigate={navigate} />;
  }

  // 4. FIND A TABLE PAGE (/find-table)
  if (currentRoute.path === '/find-table') {
    return <FindTablePage onNavigate={navigate} />;
  }

  // 5. QR TABLE SELF-ORDERING ROUTE (/order/:token) — public, no admin shell.
  // Bare /order (no token) redirects guests to the scanner instead of 404.
  if (currentRoute.path === '/order') {
    if (!currentRoute.token) {
      return <ScanTablePage onNavigate={navigate} />;
    }
    return (
      <TableOrder
        qrToken={currentRoute.token}
        onBackToStorefront={handleSwitchToPublic}
      />
    );
  }

  // 6. PUBLIC HOMEPAGE (/ + unknown-path fallback)
  if (currentRoute.path === '/' || currentRoute.path === '' || currentRoute.path === '/*') {
    return (
      <PublicStorefront
        onNavigate={navigate}
        onNavigateToAdmin={handleSwitchToAdmin}
        onNavigateToQrOrder={(token) => {
          navigate(`/order/${token}`);
        }}
      />
    );
  }

  // 7. ADMIN MANAGEMENT SUITE (/admin only — reached via navigate('/admin'),
  // #admin legacy hash, or ?mode=admin). Anything else already returned above.
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

    if (currentModule.startsWith('orders')) return <OrdersView />;
    if (currentModule.startsWith('menu')) return <MenuManagementView />;
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
          <p>© 2025 Petuk Adda Cafe • Enterprise Fullstack Management Suite</p>
          <button
            onClick={handleSwitchToPublic}
            className="text-[#DD5903] hover:underline font-bold cursor-pointer"
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
