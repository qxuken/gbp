import { atomWithStorage } from 'jotai/utils';
import { atom } from 'jotai/vanilla';

import { store } from '@/store/jotai-store';

export type ThemeValue = 'dark' | 'light';
const DARK_MODE_QUERY = window.matchMedia('(prefers-color-scheme: dark)');
const DOCUMENT_ROOT = window.document.documentElement;

export const themeAtom = atomWithStorage<'dark' | 'light' | 'system'>(
  'gbp__theme',
  'system',
);
// this is module private since i want displayThemeAtom to be readonly
const actualThemeAtom = atom<'dark' | 'light'>(
  DARK_MODE_QUERY.matches ? 'dark' : 'light',
);
export const displayThemeAtom = atom<'dark' | 'light'>((get) =>
  get(actualThemeAtom),
);

let systemSub: AbortController | null;
function subSystem() {
  systemSub?.abort();
  systemSub = null;
  const theme = store.get(themeAtom);
  const setTheme = (v: ThemeValue) => {
    store.set(actualThemeAtom, v);
    updateDOM();
  };
  if (theme === 'system') {
    systemSub = new AbortController();

    setTheme(DARK_MODE_QUERY.matches ? 'dark' : 'light');
    DARK_MODE_QUERY.addEventListener(
      'change',
      (e) => setTheme(e.matches ? 'dark' : 'light'),
      {
        signal: systemSub.signal,
      },
    );
  } else {
    setTheme(theme);
  }
}
function updateDOM() {
  const theme = store.get(displayThemeAtom);
  DOCUMENT_ROOT.classList.remove('light', 'dark');
  DOCUMENT_ROOT.classList.add(theme);
}

subSystem();

store.sub(themeAtom, subSystem);
