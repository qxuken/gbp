import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
} from '@tanstack/react-router';

import { authStore } from '@/api/pocketbase';
import { router } from '@/router';

export const Route = createRootRouteWithContext()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        name: 'description',
        content:
          'Plan builds, manage teams, and track farming progress for Genshin Impact characters. Create detailed character builds with artifacts, weapons, and stats.',
      },
      {
        name: 'keywords',
        content: 'genshin impact, build planner, character builds',
      },
      {
        property: 'og:title',
        content: 'Genshin Build Planner - Plan Your Character Builds',
      },
      {
        property: 'og:description',
        content:
          'Plan builds, manage teams, and track farming progress for Genshin Impact characters.',
      },
      {
        property: 'og:type',
        content: 'website',
      },
    ],
  }),
});

authStore.onChange(() => {
  router.invalidate();
});

function RootComponent() {
  return (
    <>
      <HeadContent />
      <Outlet />
    </>
  );
}
