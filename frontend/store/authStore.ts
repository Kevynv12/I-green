import { create } from 'zustand';
import storage from '../utils/storage';
import api from '../utils/api';

interface User {
  id: string;
  email: string;
  name: string;
  barbershop_name?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, barbershop_name?: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user } = response.data;
      
      await storage.setItem('token', access_token);
      set({ user, token: access_token, isAuthenticated: true });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Falha no login');
    }
  },

  register: async (email: string, password: string, name: string, barbershop_name?: string) => {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        name,
        barbershop_name,
      });
      const { access_token, user } = response.data;
      
      await storage.setItem('token', access_token);
      set({ user, token: access_token, isAuthenticated: true });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Falha no registro');
    }
  },

  logout: async () => {
    await storage.deleteItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const token = await storage.getItem('token');
      if (token) {
        const response = await api.get('/auth/me');
        set({ user: response.data, token, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      await storage.deleteItem('token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));