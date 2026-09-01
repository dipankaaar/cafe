import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', authController.login);
router.get('/staff', authController.getStaff);
router.post('/staff', authController.createStaff);
router.put('/staff/:id', authController.updateStaff);

export default router;
