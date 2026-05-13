import { create } from 'zustand';
import api from '../services/api';

const useNotificationStore = create((set, get) => ({
  unreadCount: 0,
  isLoading: false,

  fetchUnreadCount: async () => {
    try {
      set({ isLoading: true });
      const { data } = await api.get('/activity/notifications', { params: { sort: 'latest' } });
      const notifications = Array.isArray(data) ? data : [];
      const count = notifications.filter(n => !n.isRead).length;
      set({ unreadCount: count });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  setUnreadCount: (count) => set({ unreadCount: count }),
  
  incrementUnreadCount: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  
  decrementUnreadCount: () => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
}));

export default useNotificationStore;
