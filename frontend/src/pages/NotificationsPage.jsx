import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Bell, Check, Clock, CheckCircle2, ShieldCheck, GitBranch, CheckSquare, Zap } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';

export const NotificationsPage = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const [filterUnread, setFilterUnread] = useState(false);

  const displayedNotifications = filterUnread
    ? notifications.filter((n) => !n.is_read)
    : notifications;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'workflow':
        return <GitBranch className="w-4 h-4 text-indigo-600" />;
      case 'task':
        return <CheckSquare className="w-4 h-4 text-blue-600" />;
      case 'approval':
        return <ShieldCheck className="w-4 h-4 text-amber-600" />;
      case 'automation':
        return <Zap className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-xs text-slate-500 mt-1">Real-time alerts, approvals, and workflow state updates</p>
        </div>

        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead} icon={Check}>
            Mark All Read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setFilterUnread(false)}
          className={`pb-3 px-3 transition-colors border-b-2 -mb-px ${
            !filterUnread
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilterUnread(true)}
          className={`pb-3 px-3 transition-colors border-b-2 -mb-px ${
            filterUnread
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {displayedNotifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No Notifications"
          description={filterUnread ? 'You have caught up with all your alerts!' : 'No notifications recorded yet.'}
        />
      ) : (
        <div className="space-y-3">
          {displayedNotifications.map((notif) => (
            <Card
              key={notif.id}
              className={`transition-colors ${
                !notif.is_read ? 'bg-indigo-50/20 border-indigo-200' : 'bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notif.entity_type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{notif.title}</h4>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                    <p className="text-[10px] text-slate-400 mt-2">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {!notif.is_read && (
                  <button
                    onClick={() => markAsRead(notif.id)}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium whitespace-nowrap"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;

