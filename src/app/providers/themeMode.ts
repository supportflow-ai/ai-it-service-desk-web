import { createContext, useContext } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'supportflow.theme';
export const DARK_QUERY = '(prefers-color-scheme: dark)';

export interface ThemeModeValue {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
}

// Without a provider (isolated component tests) the app renders light and the switch does nothing.
export const ThemeModeContext = createContext<ThemeModeValue>({ preference: 'system', resolved: 'light', setPreference: () => {} });

export function useThemeMode() {
  return useContext(ThemeModeContext);
}
