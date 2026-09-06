import { Router } from 'express';
import * as tableController from '../controllers/table.controller.js';

const router = Router();

// Standard Table Routes (admin CRUD + status)
router.get('/', tableController.getTables);
router.get('/:id', tableController.getTableById);
router.post('/', tableController.createTable);
router.put('/:id', tableController.updateTable);
router.delete('/:id', tableController.deleteTable);
router.patch('/:id/status', tableController.updateTableStatus);
router.post('/:id/occupy', tableController.occupyTable);
router.post('/:id/release', tableController.releaseTable);

// QR Table Ordering Routes (customer QR ordering owned by Agent 4 — admin read/toggle only)
router.get('/qr/validate/:token', tableController.validateQrToken); // Public QR Token validation
router.get('/qr/:token', tableController.validateQrToken); // Alias: GET /api/tables/qr/:token
router.get('/:id/qr', tableController.getTableQr);
router.post('/:id/qr/regenerate', tableController.regenerateQrToken);
router.patch('/:id/qr/status', tableController.setQrStatus);
router.get('/:id/active-orders', tableController.getTableActiveOrders);
router.get('/:id/order-history', tableController.getTableOrderHistory);

export default router;
