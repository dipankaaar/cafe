import { Router } from 'express';

import authRoutes from './auth.routes.js';
import menuRoutes from './menu.routes.js';
import orderRoutes from './order.routes.js';
import tableRoutes from './table.routes.js';
import reservationRoutes from './reservation.routes.js';
import customerRoutes from './customer.routes.js';
import couponRoutes from './coupon.routes.js';
import inventoryRoutes from './inventory.routes.js';
import expenseRoutes from './expense.routes.js';
import reportRoutes from './report.routes.js';
import systemRoutes from './system.routes.js';
import branchRoutes from './branch.routes.js';
import otpRoutes from './otp.routes.js';
import whatsappRoutes from './whatsapp.routes.js';

import * as authController from '../controllers/auth.controller.js';
import * as customerController from '../controllers/customer.controller.js';
import * as invController from '../controllers/inventory.controller.js';
import { db } from '../db/connection.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const apiRouter = Router();

// Health Check (with live DB probe — 503 when SQLite is unreachable)
apiRouter.get(
  '/health',
  asyncHandler(async (req, res) => {
    let dbStatus = 'up';
    try {
      db.prepare('SELECT 1 AS ok').get();
    } catch (e) {
      dbStatus = 'down';
    }
    const healthy = dbStatus === 'up';
    return res.status(healthy ? 200 : 503).json({
      success: healthy,
      statusCode: healthy ? 200 : 503,
      message: healthy ? 'Service healthy' : 'Service degraded: database unreachable',
      data: {
        status: healthy ? 'healthy' : 'degraded',
        uptime: process.uptime(),
        database: `SQLite (node:sqlite) WAL-Mode — ${dbStatus}`,
        timestamp: new Date().toISOString(),
        service: 'Petuk Adda Cafe Enterprise Backend API'
      }
    });
  })
);

// --- Canonical mounts (11 domains) ---
// 1. menu, 2. orders, 3. tables, 4. reservations, 5. customers (+loyalty),
// 6. coupons, 7. inventory (+suppliers/purchases), 8. expenses (+staff via auth),
// 9. reports, 10. notifications/audit/settings (system), 11. auth
apiRouter.use('/auth', authRoutes);
apiRouter.use('/menu', menuRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/tables', tableRoutes);
apiRouter.use('/reservations', reservationRoutes);
apiRouter.use('/customers', customerRoutes);
apiRouter.use('/coupons', couponRoutes);
apiRouter.use('/inventory', inventoryRoutes);
apiRouter.use('/expenses', expenseRoutes);
apiRouter.use('/reports', reportRoutes);
apiRouter.use('/branches', branchRoutes);
apiRouter.use('/otp', otpRoutes);
apiRouter.use('/whatsapp', whatsappRoutes);
apiRouter.use('/system', systemRoutes);
apiRouter.use('/', systemRoutes); // Flat shortcuts for /events, /notifications, /settings

// --- Compatibility aliases so every domain in the 11-router contract resolves ---
// 5b. Loyalty (subset of customers domain)
const loyaltyRouter = Router();
loyaltyRouter.get('/', customerController.getCustomers);
loyaltyRouter.get('/lookup', customerController.getCustomerByPhone);
loyaltyRouter.post('/adjust', customerController.adjustLoyalty);
apiRouter.use('/loyalty', loyaltyRouter);

// 7b. Suppliers (subset of inventory domain)
const suppliersRouter = Router();
suppliersRouter.get('/', invController.getSuppliers);
suppliersRouter.post('/', invController.createSupplier);
apiRouter.use('/suppliers', suppliersRouter);

// 7c. Purchases (subset of inventory domain)
const purchasesRouter = Router();
purchasesRouter.get('/', invController.getPurchases);
purchasesRouter.post('/', invController.createPurchaseOrder);
apiRouter.use('/purchases', purchasesRouter);

// 8b. Staff (subset of auth domain)
const staffRouter = Router();
staffRouter.get('/', authController.getStaff);
staffRouter.post('/', authController.createStaff);
staffRouter.put('/:id', authController.updateStaff);
apiRouter.use('/staff', staffRouter);

export default apiRouter;
