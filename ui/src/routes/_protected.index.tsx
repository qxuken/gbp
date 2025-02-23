import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { pbClient } from '@/api/pocketbase';
import { CharacterPlans } from '@/api/types';
import { BuildInfo } from '@/components/build-card/build-info';
import { CreateBuild } from '@/components/build-card/create-build';
import { queryClient } from '@/main';

export const Route = createFileRoute('/_protected/')({
  component: HomeComponent,
  validateSearch: z.object({
    page: z.number().optional(),
    perPage: z.number().optional(),
  }),
  loaderDeps: ({ search: { page = 1, perPage = 20 } }) =>
    queryOptions({
      queryKey: ['character_plans'],
      queryFn: () =>
        pbClient
          .collection<CharacterPlans>('character_plans')
          .getList(page, perPage),
    }),
  loader: ({ deps }) => queryClient.ensureQueryData(deps),
});

function HomeComponent() {
  const query = Route.useLoaderDeps();
  const data = useSuspenseQuery(query);
  const items = data.data.items;

  return (
    <div className="p-2 flex flex-wrap gap-4 justify-center">
      {items.map((build) => (
        <BuildInfo key={build.id} build={build} />
      ))}
      <CreateBuild />
    </div>
  );
}
