import { Router } from 'express';
import * as orderController from '../controllers/order.controller.js';

const router = Router();

router.get('/', orderController.getOrders);
router.post('/', orderController.createOrder);
router.get('/track/:orderNumber', orderController.trackOrder);
router.get('/:id', orderController.getOrderById);
router.patch('/:id/status', orderController.updateOrderStatus);
router.post('/:id/refund', orderController.refundOrder);
// Delivery leg: rider assignment + OTP handover verification
router.patch('/:id/assign-rider', orderController.assignRider);
router.post('/:id/verify-delivery', orderController.verifyDelivery);

export default router;
