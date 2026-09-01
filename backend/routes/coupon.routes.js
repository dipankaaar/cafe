import { Router } from 'express';
import * as couponController from '../controllers/coupon.controller.js';

const router = Router();

router.get('/', couponController.getCoupons);
router.post('/validate', couponController.validateCoupon);
router.post('/', couponController.createCoupon);
router.patch('/:id/toggle', couponController.toggleCoupon);

export default router;
