import React from 'react';
import { useCafe } from '../../context/CafeContext';
import { Bell, Check, CheckCheck, ExternalLink, Clock, Trash2 } from 'lucide-react';

export default function NotificationDropdown({ isOpen, onClose, onNavigate }) {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useCafe();

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#DD5903]" />
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
              Notifications
            </h4>
            {unreadCount > 0 && (
              <span className="bg-[#DD5903] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllNotificationsAsRead}
              className="text-xs text-[#DD5903] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/60">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-xs">
              No notifications right now.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  markNotificationAsRead(n.id);
                  if (n.link) {
                    const cleanKey = n.link.replace('/', '') || 'dashboard';
                    onNavigate(cleanKey);
                    onClose();
                  }
                }}
                className={`p-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 cursor-pointer transition-colors flex items-start gap-3 ${
                  !n.isRead ? 'bg-orange-50/50 dark:bg-orange-950/10' : ''
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    !n.isRead ? 'bg-[#DD5903]' : 'bg-transparent'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h5 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {n.title}
                    </h5>
                    <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {n.time}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
                    {n.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-gray-50 dark:bg-[#161616] border-t border-gray-100 dark:border-gray-800 text-center">
          <button
            onClick={() => {
              onNavigate('notifications');
              onClose();
            }}
            className="text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-[#DD5903] transition-colors cursor-pointer"
          >
            View All Notifications Center
          </button>
        </div>
      </div>
    </>
  );
}
