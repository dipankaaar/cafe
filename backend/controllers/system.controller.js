import { NotificationModel, AuditLogModel, SettingModel } from '../models/System.model.js';
import { eventHub } from '../services/eventHub.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// --- REAL-TIME SSE ---
export const streamEvents = (req, res) => {
  eventHub.registerClient(req, res);
};

// --- AUDIT LOGS ---
export const getAuditLogs = asyncHandler(async (req, res) => {
  const { category, limit } = req.query;
  const logs = AuditLogModel.findAll({ category, limit: limit ? Number(limit) : 200 });
  return ApiResponse.success(res, logs);
});

// --- NOTIFICATIONS ---
export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = NotificationModel.findAll();
  return ApiResponse.success(res, notifications);
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
