import { Link, useNavigate } from '@tanstack/react-router';
import { PropsWithChildren } from 'react';

import { Icons } from '@/components/icons';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { UserManagement } from '@/components/user-management';
import { cn } from '@/lib/utils';

interface LayoutProps extends PropsWithChildren {
  showUserManagement?: boolean;
  showLoginButton?: boolean;
  /** Use the full viewport width instead of the centered reading container. */
  wide?: boolean;
}

export function Layout({
  children,
  showUserManagement,
  showLoginButton,
  wide,
}: LayoutProps) {
  const navigate = useNavigate();
  const container = cn(
    'mx-auto px-4',
    wide ? 'w-full max-w-[160rem]' : 'container',
  );

  return (
    <div className="min-h-svh flex flex-col">
      <header className="sticky top-0 z-30 border-b bg-background">
        <div
          className={cn(
            container,
            'flex h-12 items-center justify-between gap-4',
          )}
        >
          <Link to="/">
            <h1 className="flex items-center gap-2 text-base font-medium">
              <Icons.Note className="size-5" />
              <span className="flex items-center gap-1">
                <span>GBP</span>
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  — Genshin Build Planner
                </span>
              </span>
            </h1>
          </Link>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            {showLoginButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate({ to: '/login' })}
                className="gap-2"
              >
                <Icons.Logout className="size-3.5" />
                Login
              </Button>
            )}
            {showUserManagement && <UserManagement />}
          </div>
        </div>
      </header>

      <main className={cn('flex-1 py-4', container)}>{children}</main>

      <footer className="mt-auto border-t">
        <div className={cn(container, 'py-2.5')}>
          <div className="flex flex-col items-center justify-between gap-1.5 text-xs text-muted-foreground md:flex-row md:gap-4">
            <div className="flex items-center gap-3">
              <p className="flex items-center gap-1">
                Built with ❤️ for my wife. Open source under the MIT license.
              </p>
              <Separator
                orientation="vertical"
                className="hidden h-3 md:block"
              />
              <a
                href="https://github.com/qxuken/gbp/issues"
                className="flex items-center gap-1 hover:text-foreground"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icons.Github className="size-3.5" />
                Report Issue
              </a>
            </div>
            <p>GBP is not affiliated with or endorsed by HoYoverse.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
