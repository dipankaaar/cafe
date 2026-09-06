import { Router } from 'express';
import * as customerController from '../controllers/customer.controller.js';

const router = Router();

router.get('/', customerController.getCustomers);
router.get('/lookup', customerController.getCustomerByPhone);
router.get('/:id/orders', customerController.getCustomerOrders);
router.get('/:id', customerController.getCustomerById);
router.post('/', customerController.createCustomer);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);
router.post('/adjust-loyalty', customerController.adjustLoyalty);
router.post('/redeem', customerController.redeemLoyalty);

export default router;
