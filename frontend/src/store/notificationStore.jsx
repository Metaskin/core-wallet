import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { notificationAPI } from '../api';
import { useAuth } from './authStore';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(false);
  const [panelOpen,     setPanelOpen]     = useState(false);
  const pollRef = useRef(null);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await notificationAPI.getAll(50);
      setNotifications(data.data.items);
      setUnreadCount(data.data.unreadCount);
    } catch {
      // silent — don't disrupt the app if notifications fail
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await notificationAPI.getUnreadCount();
      setUnreadCount(data.data.unreadCount);
    } catch {
      // silent
    }
  }, [user]);

  // Fetch on login, clear on logout
  useEffect(() => {
    if (user) {
      fetchAll();
      // Poll every 60s for new notifications (badge stays current without WebSockets)
      pollRef.current = setInterval(fetchUnreadCount, 60_000);
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setPanelOpen(false);
      clearInterval(pollRef.current);
    }
    return () => clearInterval(pollRef.current);
  }, [user, fetchAll, fetchUnreadCount]);

  // Reload full list whenever panel opens so it's always fresh
  useEffect(() => {
    if (panelOpen && user) fetchAll();
  }, [panelOpen, user, fetchAll]);

  const markRead = useCallback(async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  }, []);

  const deleteNotification = useCallback(async (id) => {
    const item = notifications.find(n => n.id === id);
    try {
      await notificationAPI.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (item && !item.is_read) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  }, [notifications]);

  const openPanel  = useCallback(() => setPanelOpen(true),  []);
  const closePanel = useCallback(() => setPanelOpen(false), []);

  const ctx = useMemo(() => ({
    notifications, unreadCount, loading, panelOpen,
    fetchAll, markRead, markAllRead, deleteNotification,
    openPanel, closePanel,
  }), [notifications, unreadCount, loading, panelOpen,
       fetchAll, markRead, markAllRead, deleteNotification,
       openPanel, closePanel]);

  return (
    <NotificationContext.Provider value={ctx}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
