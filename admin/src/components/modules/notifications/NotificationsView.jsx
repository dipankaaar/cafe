import React, { useState } from 'react';
import { useCafe } from '../../../context/CafeContext';
import Card from '../../common/Card';
import Badge from '../../common/Badge';
import Button from '../../common/Button';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  Calendar,
  Info,
  Clock,
  ExternalLink
} from 'lucide-react';

export default function NotificationsView({ onNavigate }) {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useCafe();
  const [filter, setFilter] = useState('all');

  const filteredNotifs = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'order') return n.type === 'order';
    if (filter === 'warning') return n.type === 'warning';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getIcon = (type) => {
    switch (type) {
      case 'order':
        return <ShoppingBag className="w-5 h-5 text-[#DD5903]" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'reservation':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      default:
        return <Info className="w-5 h-5 text-sky-500" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-['Plus_Jakarta_Sans',sans-serif] flex items-center gap-2">
            Notification Center
            {unreadCount > 0 && (
              <span className="text-xs bg-[#DD5903] text-white px-2 py-0.5 rounded-full font-bold">
                {unreadCount} Unread
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Real-time feed of kitchen orders, low stock triggers, reservations, and critical alerts.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            onClick={markAllNotificationsAsRead}
            size="sm"
            variant="outline"
            icon={CheckCheck}
          >
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <Card className="p-3.5 flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'all', label: `All Alerts (${notifications.length})` },
          { id: 'unread', label: `Unread Only (${unreadCount})` },
          { id: 'order', label: 'Order Alerts' },
          { id: 'warning', label: 'Low Stock Warnings' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              filter === tab.id
                ? 'bg-[#DD5903] text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </Card>

      {/* Notifications Stream */}
      <div className="space-y-3">
        {filteredNotifs.length === 0 ? (
          <Card className="p-12 text-center text-gray-400">
            <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold">No notifications in this view.</p>
          </Card>
        ) : (
          filteredNotifs.map((item) => (
            <Card
              key={item.id}
              onClick={() => {
                markNotificationAsRead(item.id);
                if (item.link) {
                  const cleanKey = item.link.replace('/', '') || 'dashboard';
                  onNavigate(cleanKey);
                }
              }}
              className={`p-4 transition-all cursor-pointer hover:border-[#DD5903] ${
                !item.isRead
                  ? 'bg-orange-50/40 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/40'
                  : ''
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-white dark:bg-gray-800 shadow-2xs">
                  {getIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      {item.title}
                    </h4>
                    <span className="text-xs text-gray-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" /> {item.time}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                    {item.message}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-[#DD5903] font-semibold flex items-center gap-1 hover:underline">
                      Open Module <ExternalLink className="w-3 h-3" />
                    </span>
                    {!item.isRead && (
                      <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold bg-orange-100 dark:bg-orange-900/50 px-2 py-0.5 rounded-full">
                        New
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

    </div>
  );
}
