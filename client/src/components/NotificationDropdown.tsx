import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { io } from 'socket.io-client';
import { api } from '../services/api';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const NotificationDropdown: React.FC<{ token: string }> = ({ token }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const loadNotifications = async () => {
    const res = await api.get('/notifications');
    setNotifications(res.data.data.notifications);
    setUnreadCount(res.data.data.unreadCount);
  };

  useEffect(() => {
    loadNotifications();

    const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:5000', {
      auth: { token },
    });

    socket.on('notification:new', (notif: NotificationItem) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((count) => count + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const markAllRead = async () => {
    await api.patch('/notifications/read', {});
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-slate-100 transition-colors"
      >
        <Bell className="w-6 h-6 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-rose-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <span className="font-semibold text-sm text-slate-800">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
              >
                <CheckCheck className="w-4 h-4" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <p className="p-4 text-xs text-slate-400 text-center">No notifications yet</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`p-3 text-xs ${n.isRead ? 'bg-white' : 'bg-blue-50/50'}`}>
                  <p className="font-semibold text-slate-800">{n.title}</p>
                  <p className="text-slate-600 mt-1">{n.message}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {new Date(n.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
