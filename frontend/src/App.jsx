import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CafeProvider } from './context/CafeContext';

// Public Customer Storefront & Sub-Pages
import PublicStorefront from './components/storefront/PublicStorefront';
import OrderOnlinePage from './pages/OrderOnlinePage';
import ExploreMenuPage from './pages/ExploreMenuPage';
import ScanTablePage from './pages/ScanTablePage';
import FindTablePage from './pages/FindTablePage';
import TableOrder from './components/storefront/TableOrder';

function parseRoute() {
  if (typeof window === 'undefined') return { path: '/', token: '' };

  const hash = window.location.hash || '';
  const rawPath = (window.location.pathname || '/').split('?')[0].split('#')[0];
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

  // Hash + BrowserRouter public routes
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

  // Fallback to public homepage
  return { path: '/', token: '' };
}

function MainApp() {
  const [currentRoute, setCurrentRoute] = useState(() => parseRoute());

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

  // Programmatic Navigate Helper
  const navigate = useCallback((toPath) => {
    if (!toPath) return;
    let target = String(toPath).trim();
    if (!target.startsWith('/')) target = '/' + target;

    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', target);
    }
    setCurrentRoute(parseRoute());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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

  // 5. QR TABLE SELF-ORDERING ROUTE (/order/:token)
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

  // 6. PUBLIC CUSTOMER HOMEPAGE (Default)
  return (
    <PublicStorefront
      onNavigate={navigate}
      onNavigateToQrOrder={(token) => {
        navigate(`/order/${token}`);
      }}
    />
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
