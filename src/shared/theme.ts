// Legacy re-export — kept only for backward compatibility with tests.
// All runtime consumers should use useTheme() from ThemeContext.tsx.
import { getThemeByName, DEFAULT_THEME_NAME, sizeColor as _sizeColor, ageColor as _ageColor } from './themes.js';
import type { ThemePalette } from './themes.js';

export { LOGO, TYPE_W, SIZE_W, AGE_W } from './themes.js';

const defaultTheme: ThemePalette = getThemeByName(DEFAULT_THEME_NAME);

export const theme = defaultTheme;
export const accent = defaultTheme.accent;
export const cursorBg = defaultTheme.cursorBg;
export const headerColor = defaultTheme.headerColor;
export const logoColors = defaultTheme.logoColors;
export const typeBadgeColor = defaultTheme.typeBadgeColor;

export function sizeColor(bytes: number | null): string {
  return _sizeColor(defaultTheme, bytes);
}

export function ageColor(days: number): string {
  return _ageColor(defaultTheme, days);
}
