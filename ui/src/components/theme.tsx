import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';

type Theme = 'dark' | 'light' | 'system';

export interface ThemeContext {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const THEME_PROVIDER_INITIAL_STATE = {
  theme: 'system',
  setTheme: () => null,
} satisfies ThemeContext;

const ThemeContext = createContext<ThemeContext>(THEME_PROVIDER_INITIAL_STATE);

type Props = PropsWithChildren<{
  defaultTheme?: Theme;
  storageKey?: string;
}>;

export function ThemeProvider({
  children,
  defaultTheme = 'system' as const,
  storageKey = 'gbp-ui-theme',
  ...props
}: Props) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme,
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeContext.Provider {...props} value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
