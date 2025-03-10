import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';

export type ThemeValue = 'dark' | 'light' | 'system';

export interface Theme {
  theme: ThemeValue;
  setTheme(theme: ThemeValue): void;
}

export const theme = create(
  subscribeWithSelector(
    persist<Theme>(
      (set, get) => ({
        theme: get()?.theme ?? 'system',
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
  (theme) => {
    systemSub?.abort();

    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const query = window.matchMedia('(prefers-color-scheme: dark)');

      root.classList.add(query.matches ? 'dark' : 'light');

      systemSub = new AbortController();
      query.addEventListener(
        'change',
        (e) => {
          root.classList.remove('light', 'dark');
          root.classList.add(e.matches ? 'dark' : 'light');
        },
        { signal: systemSub.signal },
      );
    } else {
      systemSub = null;
      root.classList.add(theme);
    }
  },
  { fireImmediately: true },
);

export function useTheme() {
  return theme();
}
