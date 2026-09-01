import { Router } from 'express';
import * as customerController from '../controllers/customer.controller.js';

const router = Router();

router.get('/', customerController.getCustomers);
router.get('/lookup', customerController.getCustomerByPhone);
router.post('/', customerController.createCustomer);
router.post('/adjust-loyalty', customerController.adjustLoyalty);

export default router;
