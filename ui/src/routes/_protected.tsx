import { Tooltip } from '@radix-ui/react-tooltip';
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

import { Icons } from '@/components/icons';
import { Separator } from '@/components/ui/separator';
import { TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { UserInfo } from '@/components/user-info';

export const Route = createFileRoute('/_protected')({
  beforeLoad({ context, location }) {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        search: {
          redirect: location.href,
        },
        to: '/login',
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="min-h-svh flex flex-col">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto p-4 flex justify-between items-center gap-4">
          <Tooltip>
            <TooltipTrigger>
              <h1 className="text-xl font-medium flex items-center gap-2">
                <Icons.Note className="size-6" />
                GBP
              </h1>
            </TooltipTrigger>
            <TooltipContent>
              <p>Genshin build planner</p>
            </TooltipContent>
          </Tooltip>
          <UserInfo />
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4">
        <Outlet />
      </main>

      <footer className="mt-auto border-t">
        <div className="container mx-auto p-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <p>© 2025 GBP. All rights reserved.</p>
              <Separator
                orientation="vertical"
                className="h-4 hidden md:block"
              />
              <a
                href="https://github.com/qxuken/gbp"
                className="hover:text-foreground flex items-center gap-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icons.New className="size-4" />
                GitHub
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
