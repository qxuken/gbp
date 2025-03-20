import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';

export type ThemeValue = 'dark' | 'light' | 'system';

export interface Theme {
  theme: ThemeValue;
  displayTheme: 'dark' | 'light';
  setTheme(theme: ThemeValue): void;
}

export const theme = create(
  subscribeWithSelector(
    persist<Theme>(
      (set, get) => ({
        theme: get()?.theme ?? 'system',
        displayTheme: 'light',
        setTheme(theme: ThemeValue) {
          set(() => ({ theme }));
        },
      }),
      {
        name: 'gbp__uiTheme',
      },
    ),
  ),
);

let systemSub: AbortController | null;
theme.subscribe(
  (state) => state.theme,
  (themeValue) => {
    systemSub?.abort();

    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (themeValue === 'system') {
      const query = window.matchMedia('(prefers-color-scheme: dark)');
      const setSystemTheme = (isDark: boolean) => {
        const displayTheme = isDark ? 'dark' : 'light';
        root.classList.add(displayTheme);
        theme.setState({ displayTheme });
      };

      setSystemTheme(query.matches);

      systemSub = new AbortController();
      query.addEventListener(
        'change',
        (e) => {
          root.classList.remove('light', 'dark');
          setSystemTheme(e.matches);
        },
        { signal: systemSub.signal },
      );
    } else {
      systemSub = null;
      root.classList.add(themeValue);
      theme.setState({ displayTheme: themeValue });
    }
  },
  { fireImmediately: true },
);
