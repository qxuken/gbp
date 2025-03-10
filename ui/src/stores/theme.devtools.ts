import { pane } from '@/tweakpane';

import { theme, ThemeValue } from './theme';

const params = {
  get theme() {
    return theme.getState().theme;
  },
  set theme(value: ThemeValue) {
    theme.getState().setTheme(value);
  },
};
const themeSelector = pane.addBinding(params, 'theme', {
  label: 'Theme',
  options: {
    system: 'system',
    dark: 'dark',
    light: 'light',
  },
});

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    themeSelector.dispose();
  });
}

export {};
