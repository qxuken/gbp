import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';

const DARK_MODE_QUERY = window.matchMedia('(prefers-color-scheme: dark)');
const DOCUMENT_ROOT = window.document.documentElement;

export type ThemeValue = 'dark' | 'light';
export type ExtendedThemeValue = ThemeValue | 'system';
export interface Theme {
  theme: ExtendedThemeValue;
  displayTheme: ThemeValue;
  setTheme(theme: ExtendedThemeValue): void;
}

export const theme = create(
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

let systemSub: AbortController | null;
theme.subscribe(
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
  theme.setState({ displayTheme });
}

function updateDOM(theme: ThemeValue) {
  DOCUMENT_ROOT.classList.remove('light', 'dark');
  DOCUMENT_ROOT.classList.add(theme);
}
