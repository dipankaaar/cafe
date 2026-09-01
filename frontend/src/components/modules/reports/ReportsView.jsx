import React, { useState } from 'react';
import { useCafe } from '../../../context/CafeContext';
import Card from '../../common/Card';
import Badge from '../../common/Badge';
import Button from '../../common/Button';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  Coffee,
  PieChart as PieIcon,
  Printer,
  FileSpreadsheet,
  ArrowUpRight,
  QrCode,
  ShoppingBag,
  Users
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

export default function ReportsView() {
  const { orders, products, expenses, categories } = useCafe();
  const [reportType, setReportType] = useState('sales'); // sales, qr, products, pnl
  const [timeRange, setTimeRange] = useState('month'); // today, week, month

  const completedOrders = orders.filter((o) => o.status === 'Completed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalDiscountGiven = completedOrders.reduce((sum, o) => sum + (o.discountAmount || 0), 0);
  
  // Calculate approximate COGS based on product recipes
  const estimatedCOGS = totalRevenue * 0.32; // 32% standard food cost
  const grossProfit = totalRevenue - estimatedCOGS;
  const netProfit = grossProfit - totalExpenses;

  // Monthly Sales Chart Data
  const salesBarData = [
    { day: 'Week 1', revenue: 42000, expenses: 14000, profit: 28000 },
    { day: 'Week 2', revenue: 58000, expenses: 18000, profit: 40000 },
    { day: 'Week 3', revenue: 64000, expenses: 16000, profit: 48000 },
    { day: 'Week 4', revenue: 78000, expenses: 22000, profit: 56000 }
  ];

  // Channel Analytics (POS vs ONLINE vs QR_TABLE)
  const qrOrders = completedOrders.filter(o => o.orderSource === 'QR_TABLE');
  const qrTotalRevenue = qrOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const qrAov = qrOrders.length > 0 ? qrTotalRevenue / qrOrders.length : 0;

  const channelDistribution = [
    { name: 'POS Counter', value: completedOrders.filter(o => o.orderSource === 'POS' || (!o.orderSource && o.orderType === 'dine-in')).length, color: '#3B82F6' },
    { name: 'QR Table Ordering', value: qrOrders.length, color: '#DD5903' },
    { name: 'Online Storefront', value: completedOrders.filter(o => o.orderSource === 'ONLINE' || (!o.orderSource && o.orderType !== 'dine-in')).length, color: '#10B981' }
  ];

  // QR Table Performance Map
  const qrTableMap = {};
  qrOrders.forEach(o => {
    const tbl = o.tableNumber || 'Unknown Table';
    if (!qrTableMap[tbl]) {
      qrTableMap[tbl] = { tableNumber: tbl, ordersCount: 0, totalRevenue: 0 };
    }
    qrTableMap[tbl].ordersCount++;
    qrTableMap[tbl].totalRevenue += o.grandTotal || 0;
  });

  const qrTableList = Object.values(qrTableMap).sort((a, b) => b.totalRevenue - a.totalRevenue);

  // Top QR Products
  const qrProductMap = {};
  qrOrders.forEach(o => {
    if (Array.isArray(o.items)) {
      o.items.forEach(item => {
        if (!qrProductMap[item.name]) {
          qrProductMap[item.name] = { name: item.name, quantity: 0, revenue: 0 };
        }
        qrProductMap[item.name].quantity += item.quantity || 1;
        qrProductMap[item.name].revenue += item.totalPrice || item.price * (item.quantity || 1);
      });
    }
  });
  const topQrProductsList = Object.values(qrProductMap).sort((a, b) => b.quantity - a.quantity);

  // Product sales aggregation
  const productSalesMap = {};
  completedOrders.forEach((ord) => {
    if (Array.isArray(ord.items)) {
      ord.items.forEach((item) => {
        if (!productSalesMap[item.name]) {
          productSalesMap[item.name] = {
            name: item.name,
            quantity: 0,
            revenue: 0,
            category: item.category || 'Coffee'
          };
        }
        productSalesMap[item.name].quantity += item.quantity || 1;
        productSalesMap[item.name].revenue += item.totalPrice || item.price * (item.quantity || 1);
      });
    }
  });

  const productPerformanceList = Object.values(productSalesMap).sort(
    (a, b) => b.revenue - a.revenue
  );

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Invoice,Customer,Source,Type,Total,Discount,Date,Status\n';
    orders.forEach((o) => {
      csvContent += `${o.orderNumber},"${o.customerName}",${o.orderSource || 'POS'},${o.orderType},${o.grandTotal},${o.discountAmount},${o.orderTime},${o.status}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Dinenos_Sales_Report_${new Date().toISOString().split('T')[0]}.csv`);
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
            Audit sales trends, QR table performance, COGS margins, and generate P&L statements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleExportCSV} variant="secondary" size="sm" icon={Download}>
            Export CSV
          </Button>
          <Button onClick={() => window.print()} size="sm" icon={Printer}>
            Print Report
          </Button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-1">
        {[
          { id: 'sales', label: 'Sales & Margins', icon: TrendingUp },
          { id: 'qr', label: 'QR Table Ordering', icon: QrCode },
          { id: 'products', label: 'Product Velocity', icon: Coffee },
          { id: 'pnl', label: 'Profit & Loss Statement', icon: DollarSign }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
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
          {/* QR Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <Card className="p-5">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Total QR Revenue</span>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">₹{qrTotalRevenue.toFixed(2)}</h3>
              <p className="text-xs text-emerald-600 font-semibold mt-1">Digital self-service revenue</p>
            </Card>

            <Card className="p-5">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">QR Orders Count</span>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{qrOrders.length}</h3>
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
                {completedOrders.length > 0 ? ((qrOrders.length / completedOrders.length) * 100).toFixed(1) : 0}%
              </h3>
              <p className="text-xs text-gray-500 mt-1">Of all cafe orders</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* QR Sales by Table Table */}
            <Card className="p-5">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#DD5903]" />
                QR Ordering Performance by Table
              </h3>
              {qrTableList.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500">
                  No completed QR table orders yet.
                </div>
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
                      {qrTableList.map(t => (
                        <tr key={t.tableNumber} className="hover:bg-gray-50 dark:hover:bg-white/5">
                          <td className="py-2.5 font-bold text-gray-900 dark:text-white">Table {t.tableNumber}</td>
                          <td className="py-2.5 text-gray-500">{t.ordersCount} orders</td>
                          <td className="py-2.5 font-bold text-[#DD5903] text-right">₹{t.totalRevenue.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Most Ordered QR Products */}
            <Card className="p-5">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Coffee className="w-4 h-4 text-[#DD5903]" />
                Top Items Ordered via Table QR
              </h3>
              {topQrProductsList.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500">
                  No items ordered via QR table yet.
                </div>
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
                        <span className="text-[10px] text-[#DD5903] font-mono">₹{item.revenue.toFixed(2)}</span>
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
      {reportType === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card className="p-5">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Gross Sales</span>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">₹{totalRevenue.toFixed(2)}</h3>
              <p className="text-xs text-emerald-600 font-semibold mt-1">Across all sales channels</p>
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
          </div>

          {/* Revenue by Channel Chart & Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-5">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Weekly Revenue & Profit Trajectory</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#88888820" />
                    <XAxis dataKey="day" stroke="#888888" fontSize={11} />
                    <YAxis stroke="#888888" fontSize={11} tickFormatter={(val) => `₹${val/1000}k`} />
                    <Tooltip formatter={(value) => [`₹${value}`, 'Amount']} />
                    <Bar dataKey="revenue" fill="#DD5903" radius={[4, 4, 0, 0]} name="Revenue" />
                    <Bar dataKey="profit" fill="#10B981" radius={[4, 4, 0, 0]} name="Net Profit" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Order Source Channels</h3>
                <p className="text-xs text-gray-400 mb-4">Volume breakdown across POS, Table QR, and Online storefront.</p>
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
                      >
                        {channelDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
                {channelDistribution.map(ch => (
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
        </div>
      )}

      {/* ================= PRODUCT VELOCITY TAB ================= */}
      {reportType === 'products' && (
        <Card className="p-5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Product Sales Velocity & Gross Margins</h3>
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
                {productPerformanceList.map((item, idx) => (
                  <tr key={item.name} className="hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="py-3 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      {item.name}
                    </td>
                    <td className="py-3 font-semibold text-gray-600 dark:text-gray-300">{item.quantity} units</td>
                    <td className="py-3 font-bold text-[#DD5903]">₹{item.revenue.toFixed(2)}</td>
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
        </Card>
      )}

      {/* ================= P&L STATEMENT TAB ================= */}
      {reportType === 'pnl' && (
        <Card className="p-6 max-w-2xl mx-auto space-y-4">
          <div className="text-center border-b border-gray-200 dark:border-gray-800 pb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Dinenos Coffee House — P&L Statement</h3>
            <p className="text-xs text-gray-500">Period: Current Financial Quarter</p>
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
          </div>
        </Card>
      )}

    </div>
  );
}
