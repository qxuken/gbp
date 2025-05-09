import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';

import { updateHeaderMeta } from '@/lib/header-meta';

const DARK_MODE_QUERY = window.matchMedia('(prefers-color-scheme: dark)');
const DOCUMENT_ROOT = window.document.documentElement;

export type ThemeValue = 'dark' | 'light';
export type ExtendedThemeValue = ThemeValue | 'system';
export interface Theme {
  theme: ExtendedThemeValue;
  displayTheme: ThemeValue;
  setTheme(theme: ExtendedThemeValue): void;
}

const useThemeStore = create(
  subscribeWithSelector(
    persist<Theme>(
      (set, get) => ({
        theme: get()?.theme ?? 'system',
        displayTheme: 'dark',
        setTheme(theme) {
          set(() => ({ theme }));
        },
      }),
      {
        name: 'gbp__uiTheme',
      },
    ),
  ),
);

export function useDisplayTheme() {
  return useThemeStore((s) => s.displayTheme);
}

export function useTheme() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  return [theme, setTheme] as const;
}

let systemSub: AbortController | null;
useThemeStore.subscribe(
  (state) => state.theme,
  (themeValue) => {
    systemSub?.abort();
    systemSub = null;

    if (themeValue == 'system') {
      setSystemTheme(DARK_MODE_QUERY.matches ? 'dark' : 'light');

      systemSub = new AbortController();
      DARK_MODE_QUERY.addEventListener(
        'change',
        (e) => setSystemTheme(e.matches ? 'dark' : 'light'),
        { signal: systemSub.signal },
      );
    } else {
      setSystemTheme(themeValue);
    }
  },
  { fireImmediately: true },
);

function setSystemTheme(displayTheme: ThemeValue) {
  updateDOM(displayTheme);
  useThemeStore.setState({ displayTheme });
}

function updateDOM(theme: ThemeValue) {
  DOCUMENT_ROOT.classList.remove('light', 'dark');
  DOCUMENT_ROOT.classList.add(theme);
  const color = theme == 'dark' ? '#000000' : '#FFFFFF';
  updateHeaderMeta('theme-color', color);
  updateHeaderMeta('og:theme_color', color);
  updateHeaderMeta('msapplication-TileColor', color);
  updateHeaderMeta(
    'apple-mobile-web-app-status-bar-style',
    theme == 'dark' ? 'black' : 'default',
  );
}
