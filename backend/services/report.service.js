import { OrderModel } from '../models/Order.model.js';
import { ExpenseModel } from '../models/System.model.js';
import { roundCurrency } from '../utils/helpers.js';

export class ReportService {
  static getFinancialAnalytics() {
    const completedOrders = OrderModel.findAll({ status: 'Completed', limit: 10000 });
    const allExpenses = ExpenseModel.findAll();

    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
    const totalDiscountGiven = completedOrders.reduce((sum, o) => sum + (o.discountAmount || 0), 0);
    const totalExpenses = allExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    const estimatedCOGS = totalRevenue * 0.32;
    const grossProfit = totalRevenue - estimatedCOGS;
    const netProfit = grossProfit - totalExpenses;
    const aov = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

    // Order Source Analytics (POS vs ONLINE vs QR_TABLE)
    let qrSales = 0;
    let qrOrdersCount = 0;
    let posSales = 0;
    let posOrdersCount = 0;
    let onlineSales = 0;
    let onlineOrdersCount = 0;

    const qrTableMap = {};
    const qrProductMap = {};

    completedOrders.forEach(o => {
      const src = o.orderSource || (o.orderType === 'dine-in' ? 'POS' : 'ONLINE');
      const val = o.grandTotal || 0;

      if (src === 'QR_TABLE') {
        qrSales += val;
        qrOrdersCount++;

        const tblNum = o.tableNumber || 'Unknown Table';
        if (!qrTableMap[tblNum]) {
          qrTableMap[tblNum] = { tableNumber: tblNum, ordersCount: 0, totalRevenue: 0 };
        }
        qrTableMap[tblNum].ordersCount++;
        qrTableMap[tblNum].totalRevenue += val;

        if (Array.isArray(o.items)) {
          o.items.forEach(item => {
            if (!qrProductMap[item.name]) {
              qrProductMap[item.name] = { name: item.name, quantity: 0, revenue: 0 };
            }
            qrProductMap[item.name].quantity += item.quantity || 1;
            qrProductMap[item.name].revenue += item.totalPrice || (item.sellingPrice || item.price || 0) * (item.quantity || 1);
          });
        }
      } else if (src === 'POS') {
        posSales += val;
        posOrdersCount++;
      } else {
        onlineSales += val;
        onlineOrdersCount++;
      }
    });

    const qrAov = qrOrdersCount > 0 ? qrSales / qrOrdersCount : 0;
    const qrOrdersByTable = Object.values(qrTableMap).sort((a, b) => b.totalRevenue - a.totalRevenue);
    const topQrProducts = Object.values(qrProductMap).sort((a, b) => b.quantity - a.quantity).slice(0, 10);

    // Aggregate Global Product Velocity & Performance
    const productMap = {};
    completedOrders.forEach((o) => {
      if (Array.isArray(o.items)) {
        o.items.forEach((item) => {
          if (!productMap[item.name]) {
            productMap[item.name] = {
              name: item.name,
              quantity: 0,
              revenue: 0,
              category: item.category || 'Coffee'
            };
          }
          productMap[item.name].quantity += item.quantity || 1;
          productMap[item.name].revenue += item.totalPrice || (item.sellingPrice || item.price || 0) * (item.quantity || 1);
        });
      }
    });

    const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue);

    return {
      totalRevenue: roundCurrency(totalRevenue),
      totalOrders: completedOrders.length,
      aov: roundCurrency(aov),
      totalDiscountGiven: roundCurrency(totalDiscountGiven),
      totalExpenses: roundCurrency(totalExpenses),
      estimatedCOGS: roundCurrency(estimatedCOGS),
      grossProfit: roundCurrency(grossProfit),
      netProfit: roundCurrency(netProfit),
      
      // QR & Channel Specific Analytics
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
      topProducts
    };
  }
}
