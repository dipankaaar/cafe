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

    // Aggregate Product Velocity & Performance
    const productMap = {};
    completedOrders.forEach((o) => {
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
        productMap[item.name].revenue += item.totalPrice || item.price * (item.quantity || 1);
      });
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
      topProducts
    };
  }
}
