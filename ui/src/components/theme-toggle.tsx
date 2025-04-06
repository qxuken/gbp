import { useAtomValue, useSetAtom } from 'jotai/react';
import { animate } from 'motion';
import { useEffect, useRef } from 'react';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { themeAtom, displayThemeAtom } from '@/stores/theme';

const iconAnimationProps = {
  active: { opacity: 1, scale: 1, rotate: 0 },
  inactive: { opacity: 0, scale: 0.5, rotate: 90 },
  options: { duration: 0.3 },
};

export function ThemeToggle() {
  const displayTheme = useAtomValue(displayThemeAtom);
  const setTheme = useSetAtom(themeAtom);
  const moonRef = useRef<SVGSVGElement>(null);
  const sunRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (moonRef.current && sunRef.current) {
      const isDark = displayTheme === 'dark';
      animate(
        moonRef.current,
        isDark ? iconAnimationProps.active : iconAnimationProps.inactive,
        iconAnimationProps.options,
      );
      animate(
        sunRef.current,
        isDark ? iconAnimationProps.inactive : iconAnimationProps.active,
        iconAnimationProps.options,
      );
    }
  }, [displayTheme]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative w-10 h-10">
          <Icons.LightTheme
            ref={sunRef}
            className="w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          />
          <Icons.DarkTheme
            ref={moonRef}
            className="w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0"
          />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')} className="gap-2">
          <Icons.LightTheme className="w-4 h-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')} className="gap-2">
          <Icons.DarkTheme className="w-4 h-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')} className="gap-2">
          <Icons.SystemTheme className="w-4 h-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
