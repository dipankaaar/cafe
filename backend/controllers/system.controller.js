import { NotificationModel, AuditLogModel, SettingModel } from '../models/System.model.js';
import { eventHub } from '../services/eventHub.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// --- REAL-TIME SSE ---
export const streamEvents = (req, res, next) => {
  try {
    // Allow EventSource cross-origin where CORS permits; EventHub handles cleanup
    eventHub.registerClient(req, res);
  } catch (err) {
    next(err);
  }
};

// --- AUDIT LOGS ---
export const getAuditLogs = asyncHandler(async (req, res) => {
  const { category, action, search, limit } = req.query;
  const logs = AuditLogModel.findAll({ category, action, search, limit: limit ? Number(limit) : 200 });
  return ApiResponse.success(res, logs);
});

// --- NOTIFICATIONS ---
export const getNotifications = asyncHandler(async (req, res) => {
  const { limit, unreadOnly } = req.query;
  const notifications = NotificationModel.findAll(
    limit ? Number(limit) : 50,
    { unreadOnly: unreadOnly === 'true' || unreadOnly === '1' }
  );
  return ApiResponse.success(res, notifications);
});

export const createNotification = asyncHandler(async (req, res) => {
  const { ApiError } = await import('../utils/ApiError.js');
  const { title, message, type = 'info', time, link = '/', tableNumber = null } = req.body || {};
  if (!title || !message) {
    throw new ApiError(400, 'Notification title and message are required');
  }
  const created = NotificationModel.create({ title, message, type, time: time || new Date().toISOString(), link });
  // Push live to all SSE subscribers (Topbar bell, Notification center)
  eventHub.broadcast('NEW_NOTIFICATION', created);
  // Typed fan-out for low-stock / order / reservation consumers
  const t = String(type || 'info').toLowerCase();
  if (t === 'warning' || t === 'low-stock' || t === 'low_stock') {
    eventHub.broadcast('LOW_STOCK_ALERT', created);
  } else if (t === 'order') {
    eventHub.broadcast('ORDER_ALERT', created);
  } else if (t === 'reservation') {
    eventHub.broadcast('RESERVATION_ALERT', created);
  }
  if (tableNumber) eventHub.broadcast('notification_created', created);
  return ApiResponse.created(res, created);
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  NotificationModel.markRead(id);
  return ApiResponse.success(res, { id, success: true }, 'Notification marked as read');
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  NotificationModel.markAllRead();
  return ApiResponse.success(res, { success: true }, 'All notifications marked as read');
});

// --- SETTINGS ---
export const getSettings = asyncHandler(async (req, res) => {
  const settings = SettingModel.getAll();
  return ApiResponse.success(res, settings);
});

export const updateSettings = asyncHandler(async (req, res) => {
  const updated = SettingModel.updateAll(req.body);
  AuditLogModel.log({
    user: 'Admin',
    action: 'UPDATE_SETTINGS',
    category: 'Settings',
    details: 'Updated global cafe configuration parameters',
    ip: req.ip || '127.0.0.1'
  });
  return ApiResponse.success(res, updated, 'Settings updated successfully');
});
