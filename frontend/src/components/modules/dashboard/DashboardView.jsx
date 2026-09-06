import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  ShoppingBag,
  Clock,
  Receipt,
  TrendingUp,
  Coffee,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Plus,
  RefreshCw
} from 'lucide-react';
import { useCafe } from '../../../context/CafeContext';
import { api } from '../../../services/api';
import Card from '../../common/Card';
import Badge from '../../common/Badge';
import Button from '../../common/Button';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const CATEGORY_COLORS = ['#DD5903', '#3B82F6', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];
const RANGE_OPTIONS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' }
];

function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-gray-800 rounded ${className}`} />;
}

function KpiSkeleton() {
  return (
    <Card className="p-4">
      <SkeletonBlock className="h-3 w-2/3" />
      <SkeletonBlock className="h-7 w-1/2 mt-3" />
      <SkeletonBlock className="h-3 w-3/4 mt-2" />
    </Card>
  );
}

function statusVariant(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'completed') return 'success';
  if (s === 'preparing') return 'warning';
  if (s === 'ready') return 'primary';
  return 'default';
}

/**
 * Dashboard — 100% live data.
 * Primary source: GET /api/reports/analytics?range=
 * Secondary:      GET /api/orders?limit=5 (recent orders widget)
 * Fallback:       CafeContext offline cache when the API is unreachable.
 */
export default function DashboardView({ onNavigate }) {
  const { orders: ctxOrders, inventory: ctxInventory, tables: ctxTables, reservations, branches, activeBranchId, switchBranch } = useCafe();
  const [range, setRange] = useState('today');
  const [analytics, setAnalytics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usingCache, setUsingCache] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Client-side fallback derived from the offline context cache.
  const buildFallback = useCallback(() => {
    const now = new Date();
    const cutoff =
      range === 'week'
        ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        : range === 'month'
          ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          : new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const inRange = (t) => {
      if (!t) return true;
      const ms = new Date(t).getTime();
      return Number.isNaN(ms) ? true : ms >= cutoff.getTime();
    };
    const completed = (ctxOrders || []).filter((o) => ['completed', 'delivered'].includes(String(o.status || '').toLowerCase()) &&
inRange(o.orderTime));
    const revenue = completed.reduce((s, o) => s + Number(o.grandTotal || 0), 0);
    const buckets = {};
    completed.forEach((o) => {
      const d = new Date(o.orderTime);
      const key = range === 'today'
        ? `${String(Number.isNaN(d.getTime()) ? 0 : d.getHours()).padStart(2, '0')}:00`
        : (Number.isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      if (!buckets[key]) buckets[key] = { label: key, revenue: 0, orders: 0 };
      buckets[key].revenue += Number(o.grandTotal || 0);
      buckets[key].orders += 1;
    });
    const catMap = {};
    completed.forEach((o) => {
      (o.items || []).forEach((item) => {
        const name = item.category || 'Uncategorized';
        if (!catMap[name]) catMap[name] = { name, value: 0, revenue: 0, quantity: 0 };
        const rev = Number(item.totalPrice ?? (Number(item.sellingPrice ?? item.price ?? 0) * Number(item.quantity ?? 1)));
        catMap[name].revenue += rev;
        catMap[name].value += rev;
        catMap[name].quantity += Number(item.quantity ?? 1);
      });
    });
    const prodMap = {};
    completed.forEach((o) => {
      (o.items || []).forEach((item) => {
        const key = item.name || 'Unknown Item';
        if (!prodMap[key]) prodMap[key] = { name: key, quantity: 0, revenue: 0, category: item.category || 'Uncategorized' };
        prodMap[key].quantity += Number(item.quantity ?? 1);
        prodMap[key].revenue += Number(item.totalPrice ?? (Number(item.sellingPrice ?? item.price ?? 0) * Number(item.quantity ?? 1)));
      });
    });
    const lowStock = (ctxInventory || [])
      .filter((i) => i.status === 'Low Stock' || Number(i.currentStock ?? 0) <= Number(i.minStock ?? 0))
      .slice(0, 10);
    const total = (ctxTables || []).length;
    const occupied = (ctxTables || []).filter((t) => t.status === 'Occupied').length;
    return {
      range,
      totalRevenue: revenue,
      totalOrders: completed.length,
      aov: completed.length ? revenue / completed.length : 0,
      totalExpenses: 0,
      netProfit: revenue,
      pendingCount: (ctxOrders || []).filter((o) => ['new', 'placed', 'accepted', 'preparing', 'brewing', 'ready', 'out_for_delivery'].includes(String(o.status || '').toLowerCase())).length,
      hourlySales: Object.values(buckets).map((b) => ({ ...b, revenue: Number(b.revenue.toFixed(2)) })),
      categorySplit: Object.values(catMap).sort((a, b) => b.value - a.value),
      topProducts: Object.values(prodMap).sort((a, b) => b.revenue - a.revenue),
      lowStock,
      tableOccupancy: {
        total,
        available: (ctxTables || []).filter((t) => t.status === 'Available').length,
        occupied,
        reserved: (ctxTables || []).filter((t) => t.status === 'Reserved').length,
        other: 0,
        occupancyRate: total ? Math.round((occupied / total) * 100) : 0
      }
    };
  }, [ctxOrders, ctxInventory, ctxTables, range]);

  const load = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setRefreshing(true);
    try {
      const [analyticsRes, ordersRes] = await Promise.all([
        api.getAnalytics(range, activeBranchId),
        api.getOrders({ limit: 5, ...(activeBranchId && activeBranchId !== 'all' ? { branchId: activeBranchId } : {}) }).catch(() => null)
      ]);
      // ApiResponse.success returns the raw payload (no {data} envelope)
      const payload = analyticsRes && analyticsRes.data !== undefined ? analyticsRes.data : analyticsRes;
      if (!payload || typeof payload !== 'object') throw new Error('Malformed analytics payload');
      setAnalytics(payload);
      const ordersPayload = ordersRes && ordersRes.data !== undefined ? ordersRes.data : ordersRes;
      const list = Array.isArray(ordersPayload)
        ? ordersPayload
        : Array.isArray(payload.recentOrders) ? payload.recentOrders : [];
      setRecentOrders(list);
      setUsingCache(false);
      setLastUpdated(new Date());
    } catch (err) {
      // Graceful degradation: offline cache instead of a blank screen
      setAnalytics(buildFallback());
      setRecentOrders((ctxOrders || []).slice(0, 5));
      setUsingCache(true);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range, activeBranchId, buildFallback, ctxOrders]);

  useEffect(() => {
    load(true);
  }, [load]);

  const revenue = Number(analytics?.totalRevenue || 0);
  const totalOrders = Number(analytics?.totalOrders || 0);
  const aov = Number(analytics?.aov || 0);
  const totalExpenses = Number(analytics?.totalExpenses || 0);
  const netProfit = Number(analytics?.netProfit ?? revenue - totalExpenses);
  const pendingCount = Number(analytics?.pendingCount || 0);

  const hourlySales = Array.isArray(analytics?.hourlySales) ? analytics.hourlySales : [];
  const categorySplit = (Array.isArray(analytics?.categorySplit) ? analytics.categorySplit : []).map((c, i) => ({
    name: c.name || `Category ${i + 1}`,
    value: Number(c.value ?? c.revenue ?? 0),
    quantity: Number(c.quantity || 0),
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length]
  }));
  const topProducts = Array.isArray(analytics?.topProducts) ? analytics.topProducts.slice(0, 5) : [];
  const maxTopRevenue = topProducts.length ? Math.max(...topProducts.map((p) => Number(p.revenue || 0)), 1) : 1;
  const lowStock = Array.isArray(analytics?.lowStock) ? analytics.lowStock : [];
  const occupancy = analytics?.tableOccupancy || { total: 0, available: 0, occupied: 0, reserved: 0, other: 0, occupancyRate: 0 };

  const kpis = [
    {
      title: range === 'today' ? "Today's Revenue" : range === 'week' ? "Week's Revenue" : "Month's Revenue",
      value: `₹${revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      subtext: `${totalOrders} completed orders`,
      trend: 'up',
      icon: DollarSign,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40'
    },
    {
      title: 'Total Orders',
      value: totalOrders,
      subtext: `${pendingCount} pending in kitchen`,
      trend: 'up',
      icon: ShoppingBag,
      color: 'text-[#DD5903]',
      bg: 'bg-orange-50 dark:bg-orange-950/40'
    },
    {
      title: 'Pending in Kitchen',
      value: pendingCount,
      subtext: 'Needs preparation',
      trend: 'neutral',
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40'
    },
    {
      title: 'Expenses (Range)',
      value: `₹${totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      subtext: 'Rent & ingredients logged',
      trend: 'down',
      icon: Receipt,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/40'
    },
    {
      title: 'Net Estimated Profit',
      value: `₹${netProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      subtext: 'Revenue minus Expenses',
      trend: netProfit >= 0 ? 'up' : 'down',
      icon: TrendingUp,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/40'
    },
    {
      title: 'Average Order Value',
      value: `₹${aov.toFixed(0)}`,
      subtext: 'Per transaction',
      trend: 'up',
      icon: Coffee,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/40'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome Bar & Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
            Dashboard Overview
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {loading ? 'Loading live telemetry…' : `Live data · updated ${lastUpdated ? lastUpdated.toLocaleTimeString() : '—'}`}
            {usingCache && !loading ? ' · offline cache (API unreachable)' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => load(false)}
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            disabled={loading || refreshing}
            className={refreshing ? '[&_svg]:animate-spin' : ''}
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
          <Button onClick={() => onNavigate('pos')} size="sm" icon={Plus} className="shadow-sm">
            Open POS
          </Button>
          {branches.length > 0 && (
            <select
              value={activeBranchId}
              onChange={(e) => switchBranch(e.target.value)}
              title="Dashboard branch scope"
              className="bg-white dark:bg-[#181818] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-900 dark:text-white outline-none"
            >
              <option value="all">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
          <div className="flex items-center bg-white dark:bg-[#181818] border border-gray-200 dark:border-gray-800 rounded-lg p-1 text-xs">
            {RANGE_OPTIONS.map((t) => (
              <button
                key={t.id}
                onClick={() => setRange(t.id)}
                className={`px-3 py-1 rounded-md font-semibold capitalize transition-colors cursor-pointer ${
                  range === t.id
                    ? 'bg-[#DD5903] text-white shadow-2xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {usingCache && !loading && (
        <div className="text-xs bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 rounded-lg px-4 py-2.5">
          Live analytics API is unreachable — showing cached offline data. Check that the backend is running on port 5000.
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <KpiSkeleton key={i} />)
          : kpis.map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <Card key={idx} className="p-4 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      {kpi.title}
                    </span>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.bg} ${kpi.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white font-mono">
                      {kpi.value}
                    </h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-0.5">
                      {kpi.trend === 'up' ? (
                        <ArrowUpRight className="w-3 h-3 text-emerald-500 inline" />
                      ) : kpi.trend === 'down' ? (
                        <ArrowDownRight className="w-3 h-3 text-rose-500 inline" />
                      ) : null}
                      <span>{kpi.subtext}</span>
                    </p>
                  </div>
                </Card>
              );
            })}
      </div>

      {/* Table occupancy summary strip */}
      <Card className="p-4">
        {loading ? (
          <div className="flex gap-4">
            <SkeletonBlock className="h-10 flex-1" />
            <SkeletonBlock className="h-10 flex-1" />
            <SkeletonBlock className="h-10 flex-1" />
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex gap-6 text-xs">
              <span className="text-gray-500">Tables: <strong className="text-gray-900 dark:text-white text-sm">{occupancy.total}</strong></span>
              <span className="text-gray-500">Occupied: <strong className="text-amber-600 text-sm">{occupancy.occupied}</strong></span>
              <span className="text-gray-500">Available: <strong className="text-emerald-600 text-sm">{occupancy.available}</strong></span>
              <span className="text-gray-500">Reserved: <strong className="text-blue-600 text-sm">{occupancy.reserved}</strong></span>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                <span>Floor occupancy</span>
                <span className="font-bold">{occupancy.occupancyRate}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#DD5903] transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, occupancy.occupancyRate))}%` }}
                />
              </div>
            </div>
            <button
              onClick={() => onNavigate('tables')}
              className="text-xs text-[#DD5903] hover:underline font-semibold flex items-center gap-0.5 cursor-pointer whitespace-nowrap"
            >
              Floor plan <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <Card
            title={range === 'today' ? 'Hourly Sales & Order Traffic' : 'Daily Sales & Order Traffic'}
            subtitle={range === 'today' ? 'Live intraday revenue progression' : `Revenue grouped by day · ${range}`}
            className="h-full"
          >
            {loading ? (
              <SkeletonBlock className="h-72 w-full" />
            ) : hourlySales.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-xs text-gray-400">
                No completed orders in this range yet — chart will populate as sales complete.
              </div>
            ) : (
              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlySales}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#DD5903" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#DD5903" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                    <XAxis dataKey="label" stroke="#888888" fontSize={11} />
                    <YAxis stroke="#888888" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#181818', borderColor: '#333', color: '#fff', borderRadius: '8px' }}
                      formatter={(val, name) => [name === 'revenue' ? `₹${val}` : `${val} orders`, name === 'revenue' ? 'Sales Revenue' : 'Order Count']}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#DD5903"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card title="Sales by Category" subtitle="Revenue share by category" className="h-full">
            {loading ? (
              <SkeletonBlock className="h-56 w-full" />
            ) : categorySplit.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-xs text-gray-400">
                No category sales in this range yet.
              </div>
            ) : (
              <>
                <div className="h-56 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categorySplit}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                        nameKey="name"
                      >
                        {categorySplit.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val, name) => [`₹${Number(val).toLocaleString('en-IN')}`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
                  {categorySplit.slice(0, 6).map((cat, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-gray-600 dark:text-gray-300 truncate">
                        {cat.name}: <strong>₹{cat.value.toLocaleString('en-IN')}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Top products strip */}
      <Card title="Top Products" subtitle="Highest-grossing items in this range">
        {loading ? (
          <div className="space-y-2">
            <SkeletonBlock className="h-8 w-full" />
            <SkeletonBlock className="h-8 w-full" />
            <SkeletonBlock className="h-8 w-full" />
          </div>
        ) : topProducts.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400">No product sales in this range yet.</div>
        ) : (
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={`${p.name}-${i}`}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-gray-900 dark:text-white truncate">
                    #{i + 1} {p.name} <span className="font-normal text-gray-400">· {p.quantity} sold</span>
                  </span>
                  <span className="font-mono font-bold text-[#DD5903]">₹{Number(p.revenue || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#DD5903]"
                    style={{ width: `${Math.min(100, (Number(p.revenue || 0) / maxTopRevenue) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 3 Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          title="Recent Orders"
          subtitle="Live kitchen & counter orders"
          action={
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs text-[#DD5903] hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          }
        >
          {loading ? (
            <div className="space-y-3">
              <SkeletonBlock className="h-14 w-full" />
              <SkeletonBlock className="h-14 w-full" />
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">No orders yet.</div>
          ) : (
            <div className="space-y-3">
              {recentOrders.slice(0, 4).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/80"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        {order.orderNumber}
                      </span>
                      <Badge size="sm" variant={statusVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {order.customerName} • {(order.items || []).length} items
                    </p>
                  </div>
                  <span className="text-sm font-bold font-mono text-gray-900 dark:text-white">
                    ₹{Number(order.grandTotal || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          title="Low Stock Watchlist"
          subtitle="Ingredients below reorder threshold"
          action={
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs text-[#DD5903] hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
            >
              Inventory <ArrowRight className="w-3 h-3" />
            </button>
          }
        >
          {loading ? (
            <div className="space-y-3">
              <SkeletonBlock className="h-14 w-full" />
              <SkeletonBlock className="h-14 w-full" />
            </div>
          ) : lowStock.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">
              All inventory levels are healthy!
            </div>
          ) : (
            <div className="space-y-3">
              {lowStock.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40"
                >
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <div>
                      <h5 className="text-xs font-bold text-gray-900 dark:text-white">
                        {item.name}
                      </h5>
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                        Current: {item.currentStock} {item.unit} (Min: {item.minStock} {item.unit})
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => onNavigate('inventory')}
                    size="sm"
                    variant="outline"
                    className="!py-1 !px-2.5 text-[10px]"
                  >
                    Restock
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          title="Today's Table Bookings"
          subtitle="Upcoming confirmed guest arrivals"
          action={
            <button
              onClick={() => onNavigate('reservations')}
              className="text-xs text-[#DD5903] hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
            >
              Bookings <ArrowRight className="w-3 h-3" />
            </button>
          }
        >
          {loading ? (
            <div className="space-y-3">
              <SkeletonBlock className="h-14 w-full" />
              <SkeletonBlock className="h-14 w-full" />
            </div>
          ) : (reservations || []).length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">No reservations yet.</div>
          ) : (
            <div className="space-y-3">
              {reservations.slice(0, 3).map((res) => (
                <div
                  key={res.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/80"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        {res.customerName}
                      </span>
                      <Badge size="sm" variant={res.status === 'Confirmed' ? 'success' : 'warning'}>
                        {res.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Table {res.tableNumber} • {res.guests} Guests • {res.time}
                    </p>
                  </div>
                  <Clock className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
