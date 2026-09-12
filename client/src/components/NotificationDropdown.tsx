import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const NotificationDropdown: React.FC<{ token?: string }> = ({ token }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const activeToken = token || localStorage.getItem('token') || '';
    const wsUrl = (import.meta as any).env?.VITE_WS_URL || 'http://localhost:5001';
    
    const socket = io(wsUrl, {
      auth: { token: activeToken },
      transports: ['websocket'],
    });

    socket.on('notification', (notif: any) => {
      setNotifications((prev) => [notif, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-900 focus:outline-none"
      >
        <span className="text-xl">🔔</span>
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-rose-600 rounded-full">
            {notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-100 py-2 z-50">
          <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
            <h5 className="font-semibold text-xs text-slate-700 uppercase">Notifications</h5>
            <button
              onClick={() => setNotifications([])}
              className="text-[11px] text-indigo-600 hover:underline"
            >
              Clear all
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-400 p-4 text-center">No new notifications</p>
            ) : (
              notifications.map((n, i) => (
                <div key={i} className="p-3 text-xs text-slate-600 hover:bg-slate-50">
                  {n.message || JSON.stringify(n)}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

