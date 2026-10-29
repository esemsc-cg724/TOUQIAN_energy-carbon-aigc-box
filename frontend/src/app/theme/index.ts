// src/app/theme/index.ts

import { theme as antdTheme, type ThemeConfig } from 'antd';

export const APP_THEME_CSS_VAR_KEY = 'app-theme';

type AppThemeConfigInput = {
  fontSize: number;
  isDark: boolean;
};

export function createAppThemeConfig({ fontSize, isDark }: AppThemeConfigInput): ThemeConfig {
  return {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    cssVar: {
      key: APP_THEME_CSS_VAR_KEY,
    },
    token: {
      colorPrimary: isDark ? '#a6b6cf' : '#263b5b',
      colorLink: isDark ? '#a6b6cf' : '#263b5b',
      colorBgLayout: isDark ? '#11151c' : '#f5f6f8',
      colorBgContainer: isDark ? '#1a202b' : '#ffffff',
      borderRadius: 8,
      borderRadiusLG: 12,
      borderRadiusSM: 4,
      fontSize,
    },
  };
}
