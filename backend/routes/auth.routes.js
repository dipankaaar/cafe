import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', authController.login);
router.post('/login-pin', authController.pinLogin);
router.get('/staff', authController.getStaff);
router.post('/staff', authController.createStaff);
router.put('/staff/:id', authController.updateStaff);
router.delete('/staff/:id', authController.deleteStaff);
router.post('/staff/attendance', authController.markAttendance);
router.get('/staff/attendance', authController.getAttendance);

export default router;
