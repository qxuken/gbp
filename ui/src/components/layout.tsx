import { Link, useNavigate } from '@tanstack/react-router';
import { PropsWithChildren } from 'react';

import { Icons } from '@/components/icons';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { UserManagement } from '@/components/user-management';

interface LayoutProps extends PropsWithChildren {
  showUserManagement?: boolean;
  showLoginButton?: boolean;
}

export function Layout({
  children,
  showUserManagement,
  showLoginButton,
}: LayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-svh flex flex-col">
      <header className="border-b">
        <div className="container mx-auto p-4 flex justify-between items-center gap-4">
          <Link to="/">
            <h1 className="text-xl font-medium flex items-center gap-2">
              <Icons.Note className="size-6" />
              <span className="flex items-center gap-1">
                <span>GBP</span>
                <span className="text-muted-foreground text-sm hidden sm:inline">
                  — Genshin Build Planner
                </span>
              </span>
            </h1>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {showLoginButton && (
              <Button
                variant="outline"
                onClick={() => navigate({ to: '/login' })}
                className="gap-2"
              >
                <Icons.Logout className="size-4" />
                Login
              </Button>
            )}
            {showUserManagement && <UserManagement />}
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4">{children}</main>

      <footer className="mt-auto border-t">
        <div className="container mx-auto p-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <p className="flex items-center gap-1">
                Built with ❤️ for my wife. Open source under the MIT license.
              </p>
              <Separator
                orientation="vertical"
                className="h-4 hidden md:block"
              />
              <a
                href="https://github.com/qxuken/gbp/issues"
                className="hover:text-foreground flex items-center gap-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icons.Github className="size-4" />
                Report Issue
              </a>
            </div>
            <p className="text-xs">
              GBP is not affiliated with or endorsed by HoYoverse.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
