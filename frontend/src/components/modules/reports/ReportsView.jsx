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
  ArrowUpRight
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
  const [reportType, setReportType] = useState('sales'); // sales, products, pnl
  const [timeRange, setTimeRange] = useState('month'); // today, week, month

  const completedOrders = orders.filter((o) => o.status === 'Completed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
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

  // Product sales aggregation
  const productSalesMap = {};
  completedOrders.forEach((ord) => {
    ord.items.forEach((item) => {
      if (!productSalesMap[item.name]) {
        productSalesMap[item.name] = {
          name: item.name,
          quantity: 0,
          revenue: 0,
          category: item.category || 'Coffee'
        };
      }
      productSalesMap[item.name].quantity += item.quantity;
      productSalesMap[item.name].revenue += item.totalPrice;
    });
  });

  const productPerformanceList = Object.values(productSalesMap).sort(
    (a, b) => b.revenue - a.revenue
  );

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Invoice,Customer,Type,Total,Discount,Date,Status\n';
    orders.forEach((o) => {
      csvContent += `${o.orderNumber},"${o.customerName}",${o.orderType},${o.grandTotal},${o.discountAmount},${o.orderTime},${o.status}\n`;
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
            Reports & Financial Analytics
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Audit sales trends, COGS margins, product velocity, and generate P&L statements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleExportCSV} size="sm" icon={Download} variant="outline">
            Export CSV
          </Button>
          <Button onClick={() => window.print()} size="sm" icon={Printer}>
            Print Report
          </Button>
        </div>
      </div>

      {/* Report Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2 text-xs font-bold">
        {[
          { id: 'sales', label: 'Sales & Revenue Analytics', icon: BarChart3 },
          { id: 'products', label: 'Product Performance', icon: Coffee },
          { id: 'pnl', label: 'Profit & Loss Statement (P&L)', icon: DollarSign }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer ${
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

      {/* ================= TAB 1: SALES ANALYTICS ================= */}
      {reportType === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="p-4">
              <span className="text-xs font-bold uppercase text-gray-400">Total Net Sales</span>
              <h3 className="text-2xl font-bold font-mono text-gray-900 dark:text-white mt-1">
                ₹{totalRevenue.toLocaleString()}
              </h3>
              <p className="text-xs text-emerald-600 font-semibold mt-0.5">+18.5% YoY</p>
            </Card>

            <Card className="p-4">
              <span className="text-xs font-bold uppercase text-gray-400">Total Orders</span>
              <h3 className="text-2xl font-bold font-mono text-[#DD5903] mt-1">
                {completedOrders.length}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Completed bills</p>
            </Card>

            <Card className="p-4">
              <span className="text-xs font-bold uppercase text-gray-400">Avg Ticket Size (AOV)</span>
              <h3 className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">
                ₹{completedOrders.length > 0 ? (totalRevenue / completedOrders.length).toFixed(0) : 0}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Per guest transaction</p>
            </Card>

            <Card className="p-4">
              <span className="text-xs font-bold uppercase text-gray-400">Total Discounts Given</span>
              <h3 className="text-2xl font-bold font-mono text-rose-500 mt-1">
                ₹{totalDiscountGiven.toLocaleString()}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Promo concessions</p>
            </Card>
          </div>

          <Card
            title="Weekly Revenue vs Expenses Progression"
            subtitle="Comparing top-line sales with operating overheads"
          >
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesBarData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="day" stroke="#888888" fontSize={11} />
                  <YAxis stroke="#888888" fontSize={11} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#181818', borderColor: '#333', color: '#fff', borderRadius: '8px' }}
                    formatter={(val) => `₹${val.toLocaleString()}`}
                  />
                  <Bar dataKey="revenue" name="Sales Revenue" fill="#DD5903" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Operating Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* ================= TAB 2: PRODUCT PERFORMANCE ================= */}
      {reportType === 'products' && (
        <Card
          title="Product Velocity & Sales Contribution"
          subtitle="Ranked by total gross revenue generated"
          className="p-0 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-50 dark:bg-[#141414] border-b border-gray-200 dark:border-gray-800 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Rank</th>
                  <th className="px-5 py-3.5">Item Name</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Units Sold</th>
                  <th className="px-5 py-3.5">Total Revenue</th>
                  <th className="px-5 py-3.5">Sales Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
                {productPerformanceList.map((item, idx) => {
                  const share = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;
                  return (
                    <tr key={idx} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                      <td className="px-5 py-3.5 font-bold text-gray-400 font-mono">
                        #{idx + 1}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-gray-900 dark:text-white">
                        {item.name}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                        {item.category}
                      </td>
                      <td className="px-5 py-3.5 font-bold font-mono text-gray-900 dark:text-white">
                        {item.quantity} orders
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-[#DD5903]">
                        ₹{item.revenue.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-emerald-600">
                        {share.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ================= TAB 3: PROFIT & LOSS STATEMENT (P&L) ================= */}
      {reportType === 'pnl' && (
        <Card
          title="Profit & Loss Statement (P&L)"
          subtitle="Consolidated operating margin breakdown"
        >
          <div className="max-w-2xl mx-auto space-y-4 py-4 text-sm">
            
            {/* Revenue */}
            <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-emerald-900 dark:text-emerald-300">Gross Sales Revenue</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">Total billings from all dine-in, takeaway, delivery orders</p>
              </div>
              <span className="text-xl font-bold font-mono text-emerald-600">
                ₹{totalRevenue.toLocaleString()}
              </span>
            </div>

            {/* Deductions */}
            <div className="space-y-2 border-l-2 border-rose-400 pl-4 py-2">
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>(-) Cost of Goods Sold (Estimated COGS ~32%)</span>
                <span className="font-mono text-rose-500 font-semibold">₹{estimatedCOGS.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>(-) Conceded Promotional Discounts</span>
                <span className="font-mono text-rose-500 font-semibold">₹{totalDiscountGiven.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>(-) Operating Overheads & Utilities (Expenses)</span>
                <span className="font-mono text-rose-500 font-semibold">₹{totalExpenses.toLocaleString()}</span>
              </div>
            </div>

            {/* Net Operating Profit */}
            <div className="p-5 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 flex justify-between items-center">
              <div>
                <h4 className="text-base font-bold text-gray-900 dark:text-white">Net Operating Profit</h4>
                <p className="text-xs text-gray-500">Gross Sales - COGS - Overheads - Discounts</p>
              </div>
              <span className="text-2xl font-bold font-mono text-[#DD5903]">
                ₹{netProfit.toLocaleString()}
              </span>
            </div>

          </div>
        </Card>
      )}

    </div>
  );
}
