import { OrderModel } from '../models/Order.model.js';
import { ExpenseModel } from '../models/System.model.js';
import { InventoryModel } from '../models/Inventory.model.js';
import { TableModel } from '../models/Table.model.js';
import { roundCurrency } from '../utils/helpers.js';

const VALID_RANGES = ['today', 'week', 'month'];

/**
 * Resolve the inclusive lower-bound Date for a range string.
 *  today -> start of current local day
 *  week  -> now minus 7 days
 *  month -> now minus 30 days
 */
function resolveCutoff(range) {
  const now = new Date();
  if (range === 'week') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (range === 'month') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatHourLabel(hour24) {
  const suffix = hour24 >= 12 ? 'PM' : 'AM';
  const h = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${String(h).padStart(2, '0')} ${suffix}`;
}

function formatDayLabel(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export class ReportService {
  /**
   * Zero-shape returned when the DB is empty or aggregation fails.
   * Guarantees 200 with zeros instead of 500. Never throws.
   */
  static emptyAnalytics(range = 'today') {
    const safeRange = VALID_RANGES.includes(range) ? range : 'today';
    return {
      range: safeRange,
      totalRevenue: 0,
      totalOrders: 0,
      aov: 0,
      totalDiscountGiven: 0,
      totalExpenses: 0,
      estimatedCOGS: 0,
      grossProfit: 0,
      netProfit: 0,
      pendingCount: 0,
      completedCount: 0,
      cancelledCount: 0,
      // Chart-safe arrays (always arrays, numeric values)
      hourlySales: [],
      categorySplit: [],
      paymentSplit: [],
      topProducts: [],
      staffPerformance: [],
      // Channel analytics
      qrSales: 0,
      qrOrdersCount: 0,
      qrAov: 0,
      posSales: 0,
      posOrdersCount: 0,
      onlineSales: 0,
      onlineOrdersCount: 0,
      channelBreakdown: {
        QR_TABLE: { sales: 0, orders: 0 },
        POS: { sales: 0, orders: 0 },
        ONLINE: { sales: 0, orders: 0 }
      },
      qrOrdersByTable: [],
      topQrProducts: [],
      // Dashboard snapshots (range-independent)
      lowStock: [],
      tableOccupancy: {
        total: 0,
        available: 0,
        occupied: 0,
        reserved: 0,
        other: 0,
        occupancyRate: 0
      },
      recentOrders: []
    };
  }

  /**
   * Range-aware financial + operational analytics.
   * All aggregation is defensive: empty DB returns zeros, never throws.
   *
   * @param {{ range?: 'today'|'week'|'month' }} opts
   */
  static getFinancialAnalytics({ range = 'today' } = {}) {
    const safeRange = VALID_RANGES.includes(range) ? range : 'today';
    try {
      const cutoff = resolveCutoff(safeRange);
      const cutoffMs = cutoff.getTime();
      const cutoffDateStr = toDateStr(cutoff);

      // ---- Orders (completed, in range) ----
      let allCompleted = [];
      let allOrders = [];
      try {
        allCompleted = OrderModel.findAll({ status: 'Completed', limit: 10000 }) || [];
      } catch (e) { allCompleted = []; }
      try {
        allOrders = OrderModel.findAll({ limit: 10000 }) || [];
      } catch (e) { allOrders = allCompleted; }

      const inRange = (orderTime) => {
        if (!orderTime) return true; // legacy rows without timestamp still count
        const t = new Date(orderTime).getTime();
        if (Number.isNaN(t)) return true;
        return t >= cutoffMs;
      };

      const completedOrders = allCompleted.filter((o) => inRange(o.orderTime));

      // ---- Status snapshot (current state, all time; case-insensitive — DB stores lowercase) ----
      const statusOf = (o) => String(o.status || '').toLowerCase();
      const ACTIVE_STATUSES = ['new', 'accepted', 'preparing', 'ready'];
      const pendingCount = allOrders.filter((o) => ACTIVE_STATUSES.includes(statusOf(o))).length;
      const cancelledCount = allOrders.filter((o) => statusOf(o) === 'cancelled').length;

      // ---- Revenue / P&L (SUM over range, COUNT) ----
      const totalRevenue = completedOrders.reduce((s, o) => s + Number(o.grandTotal || 0), 0);
      const totalDiscountGiven = completedOrders.reduce((s, o) => s + Number(o.discountAmount || 0), 0);

      // ---- Expenses (JOIN equivalent: expenses filtered to same range) ----
      let allExpenses = [];
      try {
        allExpenses = ExpenseModel.findAll() || [];
      } catch (e) { allExpenses = []; }
      const rangeExpenses = allExpenses.filter((e) => {
        if (!e.date) return true;
        // Expense dates are YYYY-MM-DD; ISO string compare is chronological
        return String(e.date) >= cutoffDateStr;
      });
      const totalExpenses = rangeExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);

      const estimatedCOGS = totalRevenue * 0.32; // standard recipe food-cost estimate
      const grossProfit = totalRevenue - estimatedCOGS;
      const netProfit = grossProfit - totalExpenses;
      const aov = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

      // ---- Trend buckets (GROUP BY hour for today, by day for week/month) ----
      const bucketMap = new Map(); // key -> { key, sort, label, revenue, orders }
      completedOrders.forEach((o) => {
        const t = new Date(o.orderTime).getTime();
        const d = Number.isNaN(t) ? new Date() : new Date(t);
        let key; let label; let sort;
        if (safeRange === 'today') {
          const h = d.getHours();
          key = `h-${h}`;
          label = formatHourLabel(h);
          sort = h;
        } else {
          key = toDateStr(d);
          label = formatDayLabel(d);
          sort = d.getTime();
        }
        if (!bucketMap.has(key)) bucketMap.set(key, { key, sort, label, revenue: 0, orders: 0 });
        const b = bucketMap.get(key);
        b.revenue += Number(o.grandTotal || 0);
        b.orders += 1;
      });
      const hourlySales = [...bucketMap.values()]
        .sort((a, b) => a.sort - b.sort)
        .map((b) => ({ label: b.label, revenue: roundCurrency(b.revenue), orders: b.orders }));

      // ---- Category split (GROUP BY item category, SUM revenue) ----
      const catMap = {};
      completedOrders.forEach((o) => {
        if (Array.isArray(o.items)) {
          o.items.forEach((item) => {
            const name = item.category || 'Uncategorized';
            if (!catMap[name]) catMap[name] = { name, value: 0, revenue: 0, quantity: 0 };
            const rev = Number(item.totalPrice ?? (Number(item.sellingPrice ?? item.price ?? 0) * Number(item.quantity ?? 1)));
            catMap[name].revenue += rev;
            catMap[name].quantity += Number(item.quantity ?? 1);
          });
        }
      });
      const categorySplit = Object.values(catMap)
        .map((c) => ({ name: c.name, value: roundCurrency(c.revenue), revenue: roundCurrency(c.revenue), quantity: c.quantity }))
        .sort((a, b) => b.value - a.value);

      // ---- Payment method split (GROUP BY payment_method) ----
      const payMap = {};
      completedOrders.forEach((o) => {
        const name = o.paymentMethod || 'Cash';
        if (!payMap[name]) payMap[name] = { name, value: 0, revenue: 0 };
        payMap[name].value += 1;
        payMap[name].revenue += Number(o.grandTotal || 0);
      });
      const paymentSplit = Object.values(payMap)
        .map((p) => ({ name: p.name, value: p.value, revenue: roundCurrency(p.revenue) }))
        .sort((a, b) => b.value - a.value);

      // ---- Staff performance (GROUP BY server_staff) ----
      const staffMap = {};
      completedOrders.forEach((o) => {
        const name = o.serverStaff || 'Unassigned';
        if (!staffMap[name]) staffMap[name] = { name, orders: 0, revenue: 0 };
        staffMap[name].orders += 1;
        staffMap[name].revenue += Number(o.grandTotal || 0);
      });
      const staffPerformance = Object.values(staffMap)
        .map((s) => ({ name: s.name, orders: s.orders, revenue: roundCurrency(s.revenue) }))
        .sort((a, b) => b.revenue - a.revenue);

      // ---- Channel analytics (POS vs ONLINE vs QR_TABLE) ----
      let qrSales = 0; let qrOrdersCount = 0;
      let posSales = 0; let posOrdersCount = 0;
      let onlineSales = 0; let onlineOrdersCount = 0;
      const qrTableMap = {};
      const qrProductMap = {};

      completedOrders.forEach((o) => {
        const src = o.orderSource || (o.orderType === 'dine-in' ? 'POS' : 'ONLINE');
        const val = Number(o.grandTotal || 0);
        if (src === 'QR_TABLE') {
          qrSales += val; qrOrdersCount++;
          const tblNum = o.tableNumber || 'Unknown Table';
          if (!qrTableMap[tblNum]) qrTableMap[tblNum] = { tableNumber: tblNum, ordersCount: 0, totalRevenue: 0 };
          qrTableMap[tblNum].ordersCount++;
          qrTableMap[tblNum].totalRevenue = roundCurrency(qrTableMap[tblNum].totalRevenue + val);
          if (Array.isArray(o.items)) {
            o.items.forEach((item) => {
              if (!qrProductMap[item.name]) qrProductMap[item.name] = { name: item.name, quantity: 0, revenue: 0 };
              qrProductMap[item.name].quantity += Number(item.quantity ?? 1);
              qrProductMap[item.name].revenue += Number(item.totalPrice ?? (Number(item.sellingPrice ?? item.price ?? 0) * Number(item.quantity ?? 1)));
            });
          }
        } else if (src === 'POS') {
          posSales += val; posOrdersCount++;
        } else {
          onlineSales += val; onlineOrdersCount++;
        }
      });

      const qrAov = qrOrdersCount > 0 ? qrSales / qrOrdersCount : 0;
      const qrOrdersByTable = Object.values(qrTableMap).sort((a, b) => b.totalRevenue - a.totalRevenue);
      const topQrProducts = Object.values(qrProductMap)
        .map((p) => ({ name: p.name, quantity: p.quantity, revenue: roundCurrency(p.revenue) }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);

      // ---- Global product velocity ----
      const productMap = {};
      completedOrders.forEach((o) => {
        if (Array.isArray(o.items)) {
          o.items.forEach((item) => {
            const key = item.name || 'Unknown Item';
            if (!productMap[key]) {
              productMap[key] = { name: key, quantity: 0, revenue: 0, category: item.category || 'Uncategorized' };
            }
            productMap[key].quantity += Number(item.quantity ?? 1);
            productMap[key].revenue += Number(item.totalPrice ?? (Number(item.sellingPrice ?? item.price ?? 0) * Number(item.quantity ?? 1)));
          });
        }
      });
      const topProducts = Object.values(productMap)
        .map((p) => ({ name: p.name, quantity: p.quantity, revenue: roundCurrency(p.revenue), category: p.category }))
        .sort((a, b) => b.revenue - a.revenue);

      // ---- Low-stock snapshot (range-independent) ----
      let lowStock = [];
      try {
        const inv = InventoryModel.findAll() || [];
        lowStock = inv
          .filter((i) => i.status === 'Low Stock' || Number(i.currentStock ?? 0) <= Number(i.minStock ?? 0))
          .slice(0, 10)
          .map((i) => ({
            id: i.id,
            name: i.name,
            currentStock: Number(i.currentStock ?? 0),
            minStock: Number(i.minStock ?? 0),
            unit: i.unit || '',
            status: i.status || 'Low Stock'
          }));
      } catch (e) { lowStock = []; }

      // ---- Table occupancy snapshot (range-independent) ----
      let tableOccupancy = { total: 0, available: 0, occupied: 0, reserved: 0, other: 0, occupancyRate: 0 };
      try {
        const tables = TableModel.findAll() || [];
        const total = tables.length;
        const occupied = tables.filter((t) => t.status === 'Occupied').length;
        const available = tables.filter((t) => t.status === 'Available').length;
        const reserved = tables.filter((t) => t.status === 'Reserved').length;
        const other = Math.max(0, total - occupied - available - reserved);
        tableOccupancy = {
          total,
          available,
          occupied,
          reserved,
          other,
          occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0
        };
      } catch (e) { /* keep zeros */ }

      // ---- Recent orders (latest 5, any status) ----
      let recentOrders = [];
      try {
        recentOrders = OrderModel.findAll({ limit: 5 }) || [];
      } catch (e) { recentOrders = []; }

      return {
        range: safeRange,
        totalRevenue: roundCurrency(totalRevenue),
        totalOrders: completedOrders.length,
        aov: roundCurrency(aov),
        totalDiscountGiven: roundCurrency(totalDiscountGiven),
        totalExpenses: roundCurrency(totalExpenses),
        estimatedCOGS: roundCurrency(estimatedCOGS),
        grossProfit: roundCurrency(grossProfit),
        netProfit: roundCurrency(netProfit),
        pendingCount,
        completedCount: completedOrders.length,
        cancelledCount,
        hourlySales,
        categorySplit,
        paymentSplit,
        topProducts,
        staffPerformance,
        qrSales: roundCurrency(qrSales),
        qrOrdersCount,
        qrAov: roundCurrency(qrAov),
        posSales: roundCurrency(posSales),
        posOrdersCount,
        onlineSales: roundCurrency(onlineSales),
        onlineOrdersCount,
        channelBreakdown: {
          QR_TABLE: { sales: roundCurrency(qrSales), orders: qrOrdersCount },
          POS: { sales: roundCurrency(posSales), orders: posOrdersCount },
          ONLINE: { sales: roundCurrency(onlineSales), orders: onlineOrdersCount }
        },
        qrOrdersByTable,
        topQrProducts,
        lowStock,
        tableOccupancy,
        recentOrders
      };
    } catch (err) {
      // Empty DB / corrupt rows must never become a 500
      return ReportService.emptyAnalytics(safeRange);
    }
  }
}
