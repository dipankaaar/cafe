import React, { useState } from 'react';
import {
  DollarSign,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Users,
  AlertTriangle,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Coffee,
  Plus,
  ArrowRight
} from 'lucide-react';
import { useCafe } from '../../../context/CafeContext';
import Card from '../../common/Card';
import Badge from '../../common/Badge';
import Button from '../../common/Button';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function DashboardView({ onNavigate }) {
  const { orders, inventory, expenses, customers, reservations, products, categories } = useCafe();
  const [dateFilter, setDateFilter] = useState('today');

  // KPI Calculations
  const completedOrders = orders.filter((o) => o.status === 'Completed');
  const pendingOrders = orders.filter((o) => ['New', 'Accepted', 'Preparing', 'Ready'].includes(o.status));
  const cancelledOrders = orders.filter((o) => o.status === 'Cancelled');

  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const aov = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
  const activeCustomersCount = customers.length;
  const lowStockItems = inventory.filter((i) => i.status === 'Low Stock');

  // Multi-day Revenue Chart Data
  const revenueChartData = [
    { time: '08:00 AM', revenue: 1450, orders: 8 },
    { time: '10:00 AM', revenue: 3200, orders: 16 },
    { time: '12:00 PM', revenue: 5800, orders: 24 },
    { time: '02:00 PM', revenue: 4200, orders: 18 },
    { time: '04:00 PM', revenue: 6400, orders: 28 },
    { time: '06:00 PM', revenue: 8900, orders: 35 },
    { time: '08:00 PM', revenue: 5100, orders: 22 },
    { time: '10:00 PM', revenue: 2300, orders: 10 }
  ];

  // Category sales breakdown
  const categorySalesData = [
    { name: 'Hot Coffee', value: 42, color: '#DD5903' },
    { name: 'Cold Brews', value: 24, color: '#3B82F6' },
    { name: 'Bakery & Toast', value: 18, color: '#F59E0B' },
    { name: 'Pizza & Mains', value: 16, color: '#10B981' }
  ];

  // Payment method data
  const paymentMethodData = [
    { name: 'UPI / QR', count: 48, fill: '#8B5CF6' },
    { name: 'Credit / Debit Card', count: 32, fill: '#3B82F6' },
    { name: 'Cash', count: 18, fill: '#10B981' },
    { name: 'Online Wallet', count: 2, fill: '#F59E0B' }
  ];

  const kpis = [
    {
      title: "Today's Revenue",
      value: `₹${totalRevenue.toLocaleString()}`,
      subtext: "+14.2% vs yesterday",
      trend: "up",
      icon: DollarSign,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40"
    },
    {
      title: "Total Orders",
      value: orders.length,
      subtext: `${completedOrders.length} completed`,
      trend: "up",
      icon: ShoppingBag,
      color: "text-[#DD5903]",
      bg: "bg-orange-50 dark:bg-orange-950/40"
    },
    {
      title: "Pending in Kitchen",
      value: pendingOrders.length,
      subtext: "Needs preparation",
      trend: "neutral",
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40"
    },
    {
      title: "Today's Expenses",
      value: `₹${totalExpenses.toLocaleString()}`,
      subtext: "Rent & ingredients logged",
      trend: "down",
      icon: Receipt,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/40"
    },
    {
      title: "Net Estimated Profit",
      value: `₹${netProfit.toLocaleString()}`,
      subtext: "Revenue minus Expenses",
      trend: netProfit >= 0 ? "up" : "down",
      icon: TrendingUp,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/40"
    },
    {
      title: "Average Order Value",
      value: `₹${aov.toFixed(0)}`,
      subtext: "Per transaction",
      trend: "up",
      icon: Coffee,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40"
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
            Real-time telemetry, revenue analytics, and live cafe operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick POS Trigger */}
          <Button
            onClick={() => onNavigate('pos')}
            size="sm"
            icon={Plus}
            className="shadow-sm"
          >
            Open POS
          </Button>

          {/* Date Filter */}
          <div className="flex items-center bg-white dark:bg-[#181818] border border-gray-200 dark:border-gray-800 rounded-lg p-1 text-xs">
            {['today', 'week', 'month'].map((t) => (
              <button
                key={t}
                onClick={() => setDateFilter(t)}
                className={`px-3 py-1 rounded-md font-semibold capitalize transition-colors cursor-pointer ${
                  dateFilter === t
                    ? 'bg-[#DD5903] text-white shadow-2xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {t === 'today' ? 'Today' : t === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi, idx) => {
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Revenue Timeline Chart */}
        <div className="lg:col-span-8">
          <Card
            title="Hourly Sales & Order Traffic"
            subtitle="Today's live intraday revenue progression"
            className="h-full"
          >
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DD5903" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#DD5903" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                  <XAxis dataKey="time" stroke="#888888" fontSize={11} />
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
          </Card>
        </div>

        {/* Category Share Donut Chart */}
        <div className="lg:col-span-4">
          <Card
            title="Sales by Category"
            subtitle="Volume percentage share"
            className="h-full"
          >
            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySalesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categorySalesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => `${val}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
              {categorySalesData.map((cat, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-gray-600 dark:text-gray-300 truncate">{cat.name}: <strong>{cat.value}%</strong></span>
                </div>
              ))}
            </div>
          </Card>
        </div>

      </div>

      {/* 3 Widgets Grid: Recent Orders, Low Stock Alerts, Today's Reservations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Widget 1: Recent Orders */}
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
          <div className="space-y-3">
            {orders.slice(0, 4).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/80"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      {order.orderNumber}
                    </span>
                    <Badge
                      size="sm"
                      variant={
                        order.status === 'Completed'
                          ? 'success'
                          : order.status === 'Preparing'
                          ? 'warning'
                          : order.status === 'Ready'
                          ? 'primary'
                          : 'default'
                      }
                    >
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {order.customerName} • {order.items.length} items
                  </p>
                </div>
                <span className="text-sm font-bold font-mono text-gray-900 dark:text-white">
                  ₹{order.grandTotal.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Widget 2: Low Stock Warning Alert */}
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
          {lowStockItems.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">
              All inventory levels are healthy!
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockItems.map((item) => (
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
                    onClick={() => onNavigate('purchases')}
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

        {/* Widget 3: Today's Reservations */}
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
        </Card>

      </div>

    </div>
  );
}
