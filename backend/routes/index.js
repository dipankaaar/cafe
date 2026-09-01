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

const apiRouter = Router();

// Health Check
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    database: 'SQLite (node:sqlite) WAL-Mode',
    timestamp: new Date().toISOString(),
    service: 'Dinenos Cafe Enterprise Backend API'
  });
});

// Mount modular sub-routers
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
apiRouter.use('/system', systemRoutes);
apiRouter.use('/', systemRoutes); // Flat shortcuts for /events, /notifications, /settings

export default apiRouter;
