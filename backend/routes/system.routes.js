import { Router } from 'express';
import * as systemController from '../controllers/system.controller.js';

const router = Router();

// Live SSE Events
router.get('/events', systemController.streamEvents);

// Audit logs
router.get('/audit-logs', systemController.getAuditLogs);

// Notifications
router.get('/notifications', systemController.getNotifications);
router.post('/notifications', systemController.createNotification);
router.patch('/notifications/:id/read', systemController.markNotificationRead);
router.post('/notifications/read-all', systemController.markAllNotificationsRead);

// Settings & Data Management
router.get('/settings', systemController.getSettings);
router.put('/settings', systemController.updateSettings);
router.post('/purge-demo-data', systemController.purgeDemoData);
router.delete('/purge-demo-data', systemController.purgeDemoData);

export default router;

