import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  bootstrap: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userRaw = await AsyncStorage.getItem('user');
      if (!token || !userRaw) {
        set({ isLoading: false });
        return;
      }
      const user = JSON.parse(userRaw);
      set({ user, token, isAuthenticated: true, isLoading: false });
      await get().fetchProfile();
    } catch (error) {
      await get().logout();
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const nextUser = data?.user;
    const nextToken = data?.tokens?.accessToken;

    await AsyncStorage.setItem('token', nextToken);
    await AsyncStorage.setItem('user', JSON.stringify(nextUser));

    set({ user: nextUser, token: nextToken, isAuthenticated: true });
    return nextUser;
  },

  fetchProfile: async () => {
    try {
      const { data } = await api.get('/auth/me');
      const nextUser = data?.user;
      if (nextUser) {
        await AsyncStorage.setItem('user', JSON.stringify(nextUser));
        set({ user: nextUser, isAuthenticated: true });
      }
    } catch (error) {
      await get().logout();
      throw error;
    }
  },

  setUser: async (user) => {
    if (user) {
      await AsyncStorage.setItem('user', JSON.stringify(user));
      set({ user });
    }
  },
  
  logout: async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
