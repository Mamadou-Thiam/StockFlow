import { create } from 'zustand';

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const useThemeStore = create<ThemeState>((set) => ({
  isDarkMode: localStorage.getItem('darkMode') === 'true',
  toggleTheme: () => {
    const newVal = !useThemeStore.getState().isDarkMode;
    localStorage.setItem('darkMode', String(newVal));
    set({ isDarkMode: newVal });
  },
}));

export default useThemeStore;
