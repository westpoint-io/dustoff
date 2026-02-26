import { createContext, useContext } from 'react';
import type { ThemePalette } from './themes.js';
import { getThemeByName, DEFAULT_THEME_NAME } from './themes.js';

const ThemeContext = createContext<ThemePalette>(getThemeByName(DEFAULT_THEME_NAME));

export const ThemeProvider = ThemeContext.Provider;

export function useTheme(): ThemePalette {
  return useContext(ThemeContext);
}
