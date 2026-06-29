import { create } from 'zustand';
import { IUser, ICompany } from '../types';

interface AuthState {
  user: IUser | null;
  company: ICompany | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: IUser, company: ICompany, accessToken: string, refreshToken: string) => void;
  setUser: (user: IUser) => void;
  setCompany: (company: ICompany) => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  company: null,
  accessToken: null,
  isAuthenticated: false,
  setAuth: (user, company, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ user, company, accessToken, isAuthenticated: true });
  },
  setUser: (user) => set({ user }),
  setCompany: (company) => set({ company }),
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, company: null, accessToken: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
