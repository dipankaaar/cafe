import { Router } from 'express';
import * as reportController from '../controllers/report.controller.js';

const router = Router();

router.get('/analytics', reportController.getAnalytics);

export default router;
