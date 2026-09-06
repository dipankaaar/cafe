import { Router } from 'express';
import * as couponController from '../controllers/coupon.controller.js';

const router = Router();

router.get('/', couponController.getCoupons);
router.get('/:id', couponController.getCouponById);
router.post('/validate', couponController.validateCoupon);
router.post('/', couponController.createCoupon);
router.put('/:id', couponController.updateCoupon);
router.delete('/:id', couponController.deleteCoupon);
router.patch('/:id/toggle', couponController.toggleCoupon);

export default router;
