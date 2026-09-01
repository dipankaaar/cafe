import { Router } from 'express';
import * as orderController from '../controllers/order.controller.js';

const router = Router();

router.get('/', orderController.getOrders);
router.post('/', orderController.createOrder);
router.get('/track/:orderNumber', orderController.trackOrder);
router.get('/:id', orderController.getOrderById);
router.patch('/:id/status', orderController.updateOrderStatus);

export default router;
