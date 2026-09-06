import React, { useState, useEffect, useCallback } from 'react';
import { useCafe } from '../../../context/CafeContext';
import { api } from '../../../services/api';
import Card from '../../common/Card';
import Badge from '../../common/Badge';
import Button from '../../common/Button';
import {
  TrendingUp,
  Download,
  DollarSign,
  Coffee,
  Printer,
  QrCode,
  Users,
  RefreshCw,
  Bike
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const PIE_COLORS = ['#DD5903', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#6366F1', '#14B8A6'];
const RANGE_OPTIONS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' }
];

function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-gray-800 rounded ${className}`} />;
}

function toCsvCell(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Reports — 100% live data from GET /api/reports/analytics?range=
 * Tabs: sales (trend + category + payment + staff), QR, products, P&L.
 * Export CSV is built client-side from the live payload.
 */
export default function ReportsView() {
  const { orders: ctxOrders, expenses: ctxExpenses, branches, activeBranchId, switchBranch } = useCafe();
  const [reportType, setReportType] = useState('sales');
  const [range, setRange] = useState('month');
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usingCache, setUsingCache] = useState(false);

  const load = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setRefreshing(true);
    try {
      const [analyticsRes, ordersRes] = await Promise.all([
        api.getAnalytics(range, activeBranchId),
        api.getOrders({ limit: 100, ...(activeBranchId && activeBranchId !== 'all' ? { branchId: activeBranchId } : {}) }).catch(() => null)
      ]);
      const a = analyticsRes && analyticsRes.data !== undefined ? analyticsRes.data : analyticsRes;
      if (!a || typeof a !== 'object') throw new Error('Malformed analytics payload');
      setAnalytics(a);
      const o = ordersRes && ordersRes.data !== undefined ? ordersRes.data : ordersRes;
      setOrders(Array.isArray(o) ? o : (ctxOrders || []));
      setUsingCache(false);
    } catch (err) {
      // Fallback: derive report figures from the offline context cache
      const completed = (ctxOrders || []).filter((x) => ['completed', 'delivered'].includes(String(x.status || '').toLowerCase()));
      const revenue = completed.reduce((s, x) => s + Number(x.grandTotal || 0), 0);
      const expenses = (ctxExpenses || []).reduce((s, x) => s + Number(x.amount || 0), 0);
      const cogs = revenue * 0.32;
      const prodMap = {};
      completed.forEach((ord) => {
        (ord.items || []).forEach((item) => {
          const key = item.name || 'Unknown Item';
          if (!prodMap[key]) prodMap[key] = { name: key, quantity: 0, revenue: 0, category: item.category || 'Uncategorized' };
          prodMap[key].quantity += Number(item.quantity ?? 1);
          prodMap[key].revenue += Number(item.totalPrice ?? (Number(item.price ?? 0) * Number(item.quantity ?? 1)));
        });
      });
      const payMap = {};
      completed.forEach((ord) => {
        const name = ord.paymentMethod || 'Cash';
        if (!payMap[name]) payMap[name] = { name, value: 0, revenue: 0 };
        payMap[name].value += 1;
        payMap[name].revenue += Number(ord.grandTotal || 0);
      });
      const staffMap = {};
      completed.forEach((ord) => {
        const name = ord.serverStaff || 'Unassigned';
        if (!staffMap[name]) staffMap[name] = { name, orders: 0, revenue: 0 };
        staffMap[name].orders += 1;
        staffMap[name].revenue += Number(ord.grandTotal || 0);
      });
      setAnalytics({
        range,
        totalRevenue: revenue,
        totalOrders: completed.length,
        aov: completed.length ? revenue / completed.length : 0,
        totalExpenses: expenses,
        estimatedCOGS: cogs,
        grossProfit: revenue - cogs,
        netProfit: revenue - cogs - expenses,
        hourlySales: [],
        categorySplit: [],
        paymentSplit: Object.values(payMap),
        topProducts: Object.values(prodMap).sort((x, y) => y.revenue - x.revenue),
        staffPerformance: Object.values(staffMap).sort((x, y) => y.revenue - x.revenue),
        channelBreakdown: {
          QR_TABLE: { sales: 0, orders: 0 },
          POS: { sales: 0, orders: 0 },
          ONLINE: { sales: 0, orders: 0 }
        },
        qrOrdersByTable: [],
        topQrProducts: []
      });
      setOrders(ctxOrders || []);
      setUsingCache(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range, activeBranchId, ctxOrders, ctxExpenses]);

  useEffect(() => {
    load(true);
  }, [load]);

  const totalRevenue = Number(analytics?.totalRevenue || 0);
  const totalExpenses = Number(analytics?.totalExpenses || 0);
  const estimatedCOGS = Number(analytics?.estimatedCOGS || 0);
  const grossProfit = Number(analytics?.grossProfit ?? totalRevenue - estimatedCOGS);
  const netProfit = Number(analytics?.netProfit ?? grossProfit - totalExpenses);
  const completedCount = Number(analytics?.totalOrders || 0);

  const trendData = Array.isArray(analytics?.hourlySales) ? analytics.hourlySales : [];
  const categorySplit = (Array.isArray(analytics?.categorySplit) ? analytics.categorySplit : []).map((c, i) => ({
    ...c,
    name: c.name || `Category ${i + 1}`,
    value: Number(c.value ?? c.revenue ?? 0),
    color: PIE_COLORS[i % PIE_COLORS.length]
  }));
  const paymentSplit = (Array.isArray(analytics?.paymentSplit) ? analytics.paymentSplit : []).map((p, i) => ({
    ...p,
    name: p.name || 'Cash',
    value: Number(p.value || 0),
    color: PIE_COLORS[i % PIE_COLORS.length]
  }));
  const staffList = Array.isArray(analytics?.staffPerformance) ? analytics.staffPerformance : [];
  const productList = Array.isArray(analytics?.topProducts) ? analytics.topProducts : [];
  const channel = analytics?.channelBreakdown || { QR_TABLE: { sales: 0, orders: 0 }, POS: { sales: 0, orders: 0 }, ONLINE: { sales: 0, orders: 0 } };
  const channelDistribution = [
    { name: 'POS Counter', value: Number(channel.POS?.orders || 0), color: '#3B82F6' },
    { name: 'QR Table Ordering', value: Number(channel.QR_TABLE?.orders || 0), color: '#DD5903' },
    { name: 'Online Storefront', value: Number(channel.ONLINE?.orders || 0), color: '#10B981' }
  ];
  const qrTableList = Array.isArray(analytics?.qrOrdersByTable) ? analytics.qrOrdersByTable : [];
  const topQrProductsList = Array.isArray(analytics?.topQrProducts) ? analytics.topQrProducts : [];
  const qrRevenue = Number(channel.QR_TABLE?.sales || 0);
  const qrCount = Number(channel.QR_TABLE?.orders || 0);
  const qrAov = Number(analytics?.qrAov || (qrCount ? qrRevenue / qrCount : 0));
  const deliveryRevenue = Number(analytics?.deliverySales || 0);
  const deliveryCount = Number(analytics?.deliveryOrdersCount || 0);
  const deliveryAovVal = Number(analytics?.deliveryAov || 0);
  const activeDeliveries = Number(analytics?.activeDeliveries || 0);
  const deliveryByRider = Array.isArray(analytics?.deliveryByRider) ? analytics.deliveryByRider : [];

  const handleExportCSV = () => {
    const date = new Date().toISOString().split('T')[0];
    const rows = [];
    rows.push(['Petuk Adda Cafe — Live Report', `Range: ${range}`, `Generated: ${date}`]);
    rows.push([]);
    rows.push(['SUMMARY', 'Value']);
    rows.push(['Gross Revenue', totalRevenue.toFixed(2)]);
    rows.push(['Estimated COGS (32%)', estimatedCOGS.toFixed(2)]);
    rows.push(['Gross Profit', grossProfit.toFixed(2)]);
    rows.push(['Operating Expenses', totalExpenses.toFixed(2)]);
    rows.push(['Net Profit', netProfit.toFixed(2)]);
    rows.push(['Completed Orders', completedCount]);
    rows.push([]);
    rows.push(['PRODUCT PERFORMANCE', 'Quantity', 'Revenue', 'Category']);
    productList.forEach((p) => rows.push([p.name, p.quantity, Number(p.revenue || 0).toFixed(2), p.category || '']));
    rows.push([]);
    rows.push(['PAYMENT METHOD SPLIT', 'Orders', 'Revenue']);
    paymentSplit.forEach((p) => rows.push([p.name, p.value, Number(p.revenue || 0).toFixed(2)]));
    rows.push([]);
    rows.push(['STAFF PERFORMANCE', 'Orders Handled', 'Revenue']);
    staffList.forEach((s) => rows.push([s.name, s.orders, Number(s.revenue || 0).toFixed(2)]));
    rows.push([]);
    rows.push(['ORDER LEDGER', 'Customer', 'Source', 'Type', 'Payment', 'Total', 'Status', 'Date']);
    orders.forEach((o) => rows.push([
      o.orderNumber, o.customerName, o.orderSource || 'POS', o.orderType,
      o.paymentMethod || 'Cash', Number(o.grandTotal || 0).toFixed(2), o.status, o.orderTime || ''
    ]));
    const csv = 'data:text/csv;charset=utf-8,' + rows.map((r) => r.map(toCsvCell).join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `Petuk_Adda_Cafe_Report_${range}_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
            Reports & Channel Analytics
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Live sales trends, QR table performance, COGS margins, and P&L statements.
            {usingCache && !loading ? ' · offline cache' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {branches.length > 0 && (
            <select
              value={activeBranchId}
              onChange={(e) => switchBranch(e.target.value)}
              title="Reports branch scope"
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
                className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  range === t.id
                    ? 'bg-[#DD5903] text-white shadow-2xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
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
          <Button onClick={handleExportCSV} variant="secondary" size="sm" icon={Download}>
            Export CSV
          </Button>
          <Button onClick={() => window.print()} size="sm" icon={Printer}>
            Print Report
          </Button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-1 overflow-x-auto">
        {[
          { id: 'sales', label: 'Sales & Margins', icon: TrendingUp },
          { id: 'qr', label: 'QR Table Ordering', icon: QrCode },
          { id: 'delivery', label: 'Delivery & Riders', icon: Bike },
          { id: 'products', label: 'Product Velocity', icon: Coffee },
          { id: 'pnl', label: 'Profit & Loss Statement', icon: DollarSign }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                reportType === tab.id
                  ? 'bg-[#DD5903] text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================= QR TABLE ORDERING ANALYTICS ================= */}
      {reportType === 'qr' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {loading ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-5"><SkeletonBlock className="h-12 w-full" /></Card>
            )) : (
              <>
                <Card className="p-5">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Total QR Revenue</span>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">₹{qrRevenue.toFixed(2)}</h3>
                  <p className="text-xs text-emerald-600 font-semibold mt-1">Digital self-service revenue</p>
                </Card>
                <Card className="p-5">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">QR Orders Count</span>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{qrCount}</h3>
                  <p className="text-xs text-gray-500 mt-1">Total completed tickets</p>
                </Card>
                <Card className="p-5">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">QR Average Order Value</span>
                  <h3 className="text-2xl font-black text-[#DD5903] mt-1">₹{qrAov.toFixed(2)}</h3>
                  <p className="text-xs text-gray-500 mt-1">Per table sitting</p>
                </Card>
                <Card className="p-5">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Channel Share</span>
                  <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
                    {completedCount > 0 ? ((qrCount / completedCount) * 100).toFixed(1) : 0}%
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Of all cafe orders</p>
                </Card>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#DD5903]" />
                QR Ordering Performance by Table
              </h3>
              {loading ? <SkeletonBlock className="h-40 w-full" /> : qrTableList.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500">No completed QR table orders in this range.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-bold uppercase text-[10px]">
                        <th className="pb-2">Table</th>
                        <th className="pb-2">Orders Placed</th>
                        <th className="pb-2 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {qrTableList.map((t) => (
                        <tr key={t.tableNumber} className="hover:bg-gray-50 dark:hover:bg-white/5">
                          <td className="py-2.5 font-bold text-gray-900 dark:text-white">Table {t.tableNumber}</td>
                          <td className="py-2.5 text-gray-500">{t.ordersCount} orders</td>
                          <td className="py-2.5 font-bold text-[#DD5903] text-right">₹{Number(t.totalRevenue || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Coffee className="w-4 h-4 text-[#DD5903]" />
                Top Items Ordered via Table QR
              </h3>
              {loading ? <SkeletonBlock className="h-40 w-full" /> : topQrProductsList.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500">No items ordered via QR table in this range.</div>
              ) : (
                <div className="space-y-3">
                  {topQrProductsList.slice(0, 6).map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-[#151515] p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-orange-500/20 text-[#DD5903] font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-gray-900 dark:text-white">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-gray-900 dark:text-white block">{item.quantity} sold</span>
                        <span className="text-[10px] text-[#DD5903] font-mono">₹{Number(item.revenue || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ================= SALES & MARGINS TAB ================= */}
      {/* ================= DELIVERY & RIDER ANALYTICS ================= */}
      {reportType === 'delivery' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {loading ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-5"><SkeletonBlock className="h-12 w-full" /></Card>
            )) : (
              <>
                <Card className="p-5">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Delivery Revenue</span>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">₹{deliveryRevenue.toFixed(2)}</h3>
                  <p className="text-xs text-emerald-600 font-semibold mt-1">Delivered orders in range</p>
                </Card>
                <Card className="p-5">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Deliveries Done</span>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{deliveryCount}</h3>
                  <p className="text-xs text-gray-500 mt-1">Avg ₹{deliveryAovVal.toFixed(0)} per drop</p>
                </Card>
                <Card className="p-5">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Active Right Now</span>
                  <h3 className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">{activeDeliveries}</h3>
                  <p className="text-xs text-gray-500 mt-1">In kitchen or on the way</p>
                </Card>
                <Card className="p-5">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Riders Active</span>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{deliveryByRider.length}</h3>
                  <p className="text-xs text-gray-500 mt-1">With completed drops</p>
                </Card>
              </>
            )}
          </div>

          <Card title="Rider Leaderboard" subtitle="Completed delivery revenue per rider in this range">
            {loading ? (
              <SkeletonBlock className="h-24 w-full" />
            ) : deliveryByRider.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-500">No completed deliveries in this range yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-gray-400 uppercase tracking-wider text-[10px] border-b border-gray-200 dark:border-gray-800">
                      <th className="py-2 pr-4">Rider</th>
                      <th className="py-2 pr-4 text-right">Drops</th>
                      <th className="py-2 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {deliveryByRider.map((r) => (
                      <tr key={r.rider}>
                        <td className="py-2.5 pr-4 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <Bike className="w-4 h-4 text-[#DD5903]" /> {r.rider}
                        </td>
                        <td className="py-2.5 pr-4 text-right font-mono">{r.orders}</td>
                        <td className="py-2.5 text-right font-mono font-bold">₹{Number(r.revenue || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {reportType === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {loading ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-5"><SkeletonBlock className="h-12 w-full" /></Card>
            )) : (
              <>
                <Card className="p-5">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Gross Sales</span>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">₹{totalRevenue.toFixed(2)}</h3>
                  <p className="text-xs text-emerald-600 font-semibold mt-1">{completedCount} completed orders · {range}</p>
                </Card>
                <Card className="p-5">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Estimated COGS</span>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">₹{estimatedCOGS.toFixed(2)}</h3>
                  <p className="text-xs text-gray-500 mt-1">32% recipe food cost</p>
                </Card>
                <Card className="p-5">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Operating Expenses</span>
                  <h3 className="text-2xl font-bold text-rose-600 mt-1">₹{totalExpenses.toFixed(2)}</h3>
                  <p className="text-xs text-gray-500 mt-1">Rent, electricity, supplies</p>
                </Card>
                <Card className="p-5">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Net Profit</span>
                  <h3 className="text-2xl font-bold text-[#DD5903] mt-1">₹{netProfit.toFixed(2)}</h3>
                  <p className="text-xs text-emerald-600 font-semibold mt-1">Gross - COGS - Expenses</p>
                </Card>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-5">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
                {range === 'today' ? 'Hourly Revenue' : 'Daily Revenue'} · live from completed orders
              </h3>
              {loading ? <SkeletonBlock className="h-64 w-full" /> : trendData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-gray-400">
                  No completed orders in this range yet.
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#88888820" />
                      <XAxis dataKey="label" stroke="#888888" fontSize={11} />
                      <YAxis stroke="#888888" fontSize={11} tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`} />
                      <Tooltip formatter={(value, name) => [name === 'revenue' ? `₹${value}` : `${value} orders`, name === 'revenue' ? 'Revenue' : 'Orders']} />
                      <Bar dataKey="revenue" fill="#DD5903" radius={[4, 4, 0, 0]} name="revenue" />
                      <Bar dataKey="orders" fill="#10B981" radius={[4, 4, 0, 0]} name="orders" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card className="p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Order Source Channels</h3>
                <p className="text-xs text-gray-400 mb-4">Live volume across POS, Table QR, and Online storefront.</p>
                {loading ? <SkeletonBlock className="h-44 w-full" /> : (
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={channelDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={4}
                          dataKey="value"
                          nameKey="name"
                        >
                          {channelDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
              <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
                {channelDistribution.map((ch) => (
                  <div key={ch.name} className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ch.color }} />
                      <span className="text-gray-600 dark:text-gray-300">{ch.name}</span>
                    </span>
                    <span className="font-bold">{ch.value} orders</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Category + Payment splits (live) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Sales by Category · live</h3>
              {loading ? <SkeletonBlock className="h-48 w-full" /> : categorySplit.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500">No category sales in this range.</div>
              ) : (
                <div className="space-y-2 text-xs">
                  {categorySplit.map((c, i) => (
                    <div key={c.name} className="flex justify-between items-center bg-gray-50 dark:bg-[#151515] p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                      <span className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                        {c.name} <span className="font-normal text-gray-400">· {c.quantity} items</span>
                      </span>
                      <span className="font-bold text-[#DD5903]">₹{Number(c.revenue || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Payment Method Split · live</h3>
              {loading ? <SkeletonBlock className="h-48 w-full" /> : paymentSplit.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500">No payments recorded in this range.</div>
              ) : (
                <>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={paymentSplit} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value" nameKey="name">
                          {paymentSplit.map((entry, index) => (
                            <Cell key={`pay-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val, name, props) => [`${val} orders · ₹${Number(props?.payload?.revenue || 0).toFixed(2)}`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 pt-3 text-xs">
                    {paymentSplit.map((p) => (
                      <div key={p.name} className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                          <span className="text-gray-600 dark:text-gray-300">{p.name}</span>
                        </span>
                        <span className="font-bold">{p.value} orders · ₹{Number(p.revenue || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </div>

          {/* Staff performance (live) */}
          <Card className="p-5">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Staff Performance · live</h3>
            {loading ? <SkeletonBlock className="h-32 w-full" /> : staffList.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500">No staff-attributed sales in this range.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-bold uppercase text-[10px]">
                      <th className="pb-3">Staff Member</th>
                      <th className="pb-3">Orders Handled</th>
                      <th className="pb-3">Revenue</th>
                      <th className="pb-3 text-right">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {staffList.map((s, idx) => (
                      <tr key={s.name} className="hover:bg-gray-50 dark:hover:bg-white/5">
                        <td className="py-3 font-bold text-gray-900 dark:text-white">{s.name}</td>
                        <td className="py-3 text-gray-600 dark:text-gray-300">{s.orders} orders</td>
                        <td className="py-3 font-bold text-[#DD5903]">₹{Number(s.revenue || 0).toFixed(2)}</td>
                        <td className="py-3 text-right">
                          <Badge variant={idx === 0 ? 'success' : 'primary'} size="sm">
                            {idx === 0 ? 'Top Performer' : 'Active'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ================= PRODUCT VELOCITY TAB ================= */}
      {reportType === 'products' && (
        <Card className="p-5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Product Sales Velocity & Gross Margins · live</h3>
          {loading ? <SkeletonBlock className="h-64 w-full" /> : productList.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-500">No product sales in this range.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">Product Name</th>
                    <th className="pb-3">Quantity Sold</th>
                    <th className="pb-3">Gross Revenue</th>
                    <th className="pb-3 text-right">Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {productList.map((item, idx) => (
                    <tr key={item.name} className="hover:bg-gray-50 dark:hover:bg-white/5">
                      <td className="py-3 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        {item.name}
                      </td>
                      <td className="py-3 font-semibold text-gray-600 dark:text-gray-300">{item.quantity} units</td>
                      <td className="py-3 font-bold text-[#DD5903]">₹{Number(item.revenue || 0).toFixed(2)}</td>
                      <td className="py-3 text-right">
                        <Badge variant={idx < 3 ? 'success' : 'primary'} size="sm">
                          {idx < 3 ? 'Best Seller' : 'Standard'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ================= P&L STATEMENT TAB ================= */}
      {reportType === 'pnl' && (
        <Card className="p-6 max-w-2xl mx-auto space-y-4">
          {loading ? <SkeletonBlock className="h-64 w-full" /> : (
            <>
              <div className="text-center border-b border-gray-200 dark:border-gray-800 pb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Petuk Adda Cafe — P&L Statement</h3>
                <p className="text-xs text-gray-500">Period: {range === 'today' ? 'Today' : range === 'week' ? 'Last 7 days' : 'Last 30 days'} · live</p>
              </div>
              <div className="space-y-3 text-xs divide-y divide-gray-100 dark:divide-gray-800">
                <div className="flex justify-between font-bold text-sm text-gray-900 dark:text-white pt-2">
                  <span>Gross Sales Revenue (A)</span>
                  <span>₹{totalRevenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400 pt-2 pl-4">
                  <span>Cost of Goods Sold (COGS - 32%)</span>
                  <span>-₹{estimatedCOGS.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 dark:text-white pt-2">
                  <span>Gross Profit (B = A - COGS)</span>
                  <span className="text-emerald-600">₹{grossProfit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400 pt-2 pl-4">
                  <span>Total Operating Expenses (Rent, Utilities, Supplies)</span>
                  <span>-₹{totalExpenses.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-base text-gray-900 dark:text-white pt-3 border-t-2 border-gray-900 dark:border-white">
                  <span>Net Profit (EBITDA)</span>
                  <span className="text-[#DD5903]">₹{netProfit.toFixed(2)}</span>
                </div>
                <p className="text-[11px] text-gray-400 pt-2">
                  Based on {completedCount} completed orders. COGS is a 32% recipe-cost estimate; expenses are joined from the expense ledger for the same period.
                </p>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
