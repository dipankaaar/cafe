import React from 'react';
import {
  LayoutDashboard,
  CreditCard,
  ShoppingBag,
  Grid,
  Menu,
  ChefHat
} from 'lucide-react';
import { useCafe } from '../../context/CafeContext';
import { normalizeOrderStatus } from '../../utils/orderStatus';

export default function MobileBottomNav({
  currentModule,
  onSelectModule,
  onOpenMobileSidebar
}) {
  const { orders } = useCafe();

  const pendingOrdersCount = orders.filter((o) =>
    ['placed', 'accepted', 'brewing'].includes(normalizeOrderStatus(o.status))
  ).length;

  const isCurrent = (key) => {
    if (key === 'orders') return currentModule.startsWith('orders');
    return currentModule === key;
  };

  return (
    <nav 
      aria-label="Mobile Bottom Navigation" 
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#141414]/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.15)] transition-colors"
    >
      <div className="flex items-center justify-around px-2 py-1.5 max-w-lg mx-auto">
        
        {/* 1. Dashboard */}
        <button
          type="button"
          onClick={() => onSelectModule('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[56px] ${
            isCurrent('dashboard')
              ? 'text-[#DD5903] font-bold'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 transition-transform ${isCurrent('dashboard') ? 'scale-110' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">Dashboard</span>
        </button>

        {/* 2. Live Orders */}
        <button
          type="button"
          onClick={() => onSelectModule('orders')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[56px] relative ${
            isCurrent('orders')
              ? 'text-[#DD5903] font-bold'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <div className="relative">
            <ShoppingBag className={`w-5 h-5 transition-transform ${isCurrent('orders') ? 'scale-110' : ''}`} />
            {pendingOrdersCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-[#DD5903] text-white text-[9px] font-black rounded-full h-4 min-w-4 px-1 flex items-center justify-center shadow-sm animate-pulse">
                {pendingOrdersCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Orders</span>
        </button>

        {/* 3. POS Billing (Elevated Center Quick Action) */}
        <button
          type="button"
          onClick={() => onSelectModule('pos')}
          className="flex flex-col items-center justify-center -mt-4 cursor-pointer group"
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
            isCurrent('pos')
              ? 'bg-gradient-to-tr from-[#DD5903] to-[#ff8c42] text-white ring-4 ring-orange-500/30 shadow-orange-950/40'
              : 'bg-[#DD5903] text-white shadow-orange-950/30 group-hover:bg-[#c44e02]'
          }`}>
            <CreditCard className="w-5 h-5" />
          </div>
          <span className={`text-[10px] font-bold mt-1 tracking-tight ${isCurrent('pos') ? 'text-[#DD5903]' : 'text-gray-600 dark:text-gray-300'}`}>
            POS Bill
          </span>
        </button>

        {/* 4. Tables / QR */}
        <button
          type="button"
          onClick={() => onSelectModule('tables')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[56px] ${
            isCurrent('tables')
              ? 'text-[#DD5903] font-bold'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Grid className={`w-5 h-5 transition-transform ${isCurrent('tables') ? 'scale-110' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">Tables</span>
        </button>

        {/* 5. More / Drawer Menu */}
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all cursor-pointer min-w-[56px]"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight">More</span>
        </button>

      </div>
    </nav>
  );
}
