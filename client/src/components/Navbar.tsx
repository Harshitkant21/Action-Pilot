import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Plus, Bell, Check, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { useQueryClient } from '@tanstack/react-query';
import { appConfig } from '../config/appConfig';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Notification States
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sweeping, setSweeping] = useState(false);

  // Push Notifications States
  const [desktopAlerts, setDesktopAlerts] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const checkPushSubscription = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setPushSupported(true);
      if (Notification.permission === 'granted') {
        try {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            setDesktopAlerts(true);
          }
        } catch (err) {
          console.error('Failed to check push subscription:', err);
        }
      }
    }
  };

  const handleToggleDesktopAlerts = async () => {
    if (!pushSupported) return;

    if (desktopAlerts) {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
        }
        setDesktopAlerts(false);
      } catch (err) {
        console.error('Failed to unsubscribe from push alerts:', err);
      }
    } else {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert('Notification permission denied.');
          return;
        }

        const keyRes = await api.get('/notifications/vapid-public-key');
        const vapidPublicKey = keyRes.data.data;
        if (!vapidPublicKey) {
          throw new Error('VAPID public key not found on server');
        }

        const reg = await navigator.serviceWorker.ready;
        const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey,
        });

        await api.post('/notifications/subscribe', {
          subscription: sub,
        });

        setDesktopAlerts(true);
      } catch (err) {
        console.error('Failed to subscribe to push alerts:', err);
        alert('Browser push subscription failed. Check console for logs.');
      }
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications');
      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      checkPushSubscription();
      const interval = setInterval(fetchNotifications, appConfig.notificationPollingIntervalMs);
      return () => clearInterval(interval);
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await api.patch(`/notifications/${id}/read`);
      if (response.data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await api.post('/notifications/read-all');
      if (response.data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleTriggerSweep = async () => {
    try {
      setSweeping(true);
      const response = await api.post('/ai/trigger-monitoring');
      if (response.data.success) {
        setTimeout(async () => {
          await fetchNotifications();
          queryClient.invalidateQueries();
          setSweeping(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to trigger sweep:', error);
      setSweeping(false);
    }
  };

  return (
    <header className="border-b border-dark-border/40 bg-dark-bg/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-2xl font-bold font-outfit text-white tracking-tight flex items-center gap-2 hover:text-dark-accent transition">
            <span className="bg-gradient-to-r from-dark-accent to-indigo-400 bg-clip-text text-transparent">ActionPilot</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/goals/new')}
            className="btn-primary flex items-center gap-1.5 px-4 py-1.5 text-sm"
          >
            <Plus className="w-4 h-4" />
            New Goal
          </button>

          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-dark-border/40 relative">
              {/* Notification Bell Dropdown */}
              <button
                onClick={() => {
                  setIsOpen(!isOpen);
                  if (!isOpen) {
                    fetchNotifications();
                  }
                }}
                className="p-2 text-dark-muted hover:text-white hover:bg-dark-card/60 rounded-lg transition relative"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></span>
                )}
              </button>

              {isOpen && (
                <div className="absolute right-0 top-12 w-80 glass-panel p-4 z-55 shadow-2xl flex flex-col max-h-96 overflow-hidden bg-dark-bg/95 border border-dark-border/80 rounded-xl">
                  <div className="flex justify-between items-center pb-2 border-b border-dark-border/40 mb-3">
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-outfit">Notifications ({unreadCount})</span>
                    <div className="flex gap-2">
                      <button
                        onClick={handleTriggerSweep}
                        disabled={sweeping}
                        className="text-[10px] text-dark-accent hover:underline flex items-center gap-1 disabled:opacity-50 font-bold"
                        title="Trigger AI Monitoring Sweep"
                      >
                        <RefreshCw className={`w-3 h-3 ${sweeping ? 'animate-spin' : ''}`} />
                        Sweep
                      </button>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-[10px] text-dark-muted hover:text-white font-bold"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                  </div>

                  {pushSupported && (
                    <div className="flex justify-between items-center bg-dark-card/30 border border-dark-border/40 p-2 rounded-lg mb-3 shrink-0">
                      <span className="text-[10px] font-semibold text-dark-muted uppercase tracking-wider">Desktop Alerts</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={desktopAlerts}
                          onChange={handleToggleDesktopAlerts}
                          className="sr-only peer"
                        />
                        <div className="w-7 h-4 bg-dark-border rounded-full peer peer-focus:ring-2 peer-focus:ring-dark-accent/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-dark-border after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-dark-accent"></div>
                      </label>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto space-y-2.5 max-h-64 pr-1">
                    {loading && notifications.length === 0 ? (
                      <p className="text-xs text-dark-muted text-center py-4">Loading...</p>
                    ) : notifications.length === 0 ? (
                      <p className="text-xs text-dark-muted text-center py-6">No notifications yet.</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 rounded-lg border text-left transition relative ${
                            n.isRead 
                              ? 'bg-dark-card/25 border-dark-border/20 opacity-60' 
                              : 'bg-dark-card/60 border-dark-border/40 hover:border-dark-accent/30'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                              n.type === 'RISK_ALERT'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : n.type === 'RECOVERY_SUGGESTION'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : n.type === 'PROGRESS_REMINDER'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            }`}>
                              {n.type === 'RISK_ALERT' ? 'Risk Alert' : n.type === 'RECOVERY_SUGGESTION' ? 'Recovery Plan' : n.type === 'PROGRESS_REMINDER' ? 'Inactivity' : 'Daily Standup'}
                            </span>
                            {!n.isRead && (
                              <button
                                onClick={(e) => handleMarkAsRead(n.id, e)}
                                className="text-[10px] text-dark-muted hover:text-white shrink-0 font-bold"
                                title="Mark as read"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <h5 className="text-xs font-semibold text-white mt-1.5 font-outfit">{n.title}</h5>
                          <p className="text-[11px] text-dark-muted mt-1 leading-normal font-sans">{n.message}</p>
                          <span className="text-[8px] text-dark-muted block mt-2 font-mono">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 bg-dark-card/60 px-3 py-1.5 rounded-lg border border-dark-border/40">
                <UserIcon className="w-4 h-4 text-dark-accent" />
                <span className="text-xs font-semibold text-white truncate max-w-[120px]">{user.name}</span>
              </div>
              
              <button
                onClick={logout}
                title="Logout"
                className="p-2 text-dark-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
