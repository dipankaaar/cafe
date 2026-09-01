import { Router } from 'express';
import * as tableController from '../controllers/table.controller.js';

const router = Router();

// Standard Table Routes
router.get('/', tableController.getTables);
router.post('/', tableController.createTable);
router.patch('/:id/status', tableController.updateTableStatus);

// QR Table Ordering Routes
router.get('/qr/validate/:token', tableController.validateQrToken); // Public QR Token validation
router.get('/:id/qr', tableController.getTableQr);
router.post('/:id/qr/regenerate', tableController.regenerateQrToken);
router.patch('/:id/qr/status', tableController.setQrStatus);
router.get('/:id/active-orders', tableController.getTableActiveOrders);
router.get('/:id/order-history', tableController.getTableOrderHistory);

export default router;
