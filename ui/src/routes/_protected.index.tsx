import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { pbClient } from '@/api/pocketbase';
import { BuildInfo } from '@/components/build-card/build-info';
import { CreateBuild } from '@/components/build-card/create-build';
import { PendingBuildInfo } from '@/components/build-card/pending-build-info';
import { queryClient } from '@/main';
import { useNewCharacterPlans } from '@/stores/newCharacterPlans';

export const Route = createFileRoute('/_protected/')({
  component: HomeComponent,
  validateSearch: z.object({
    page: z.number().optional(),
    perPage: z.number().optional(),
  }),
  loaderDeps: ({ search: { page = 1, perPage = 40 } }) =>
    queryOptions({
      queryKey: ['character_plans', 'collection'],
      queryFn: () =>
        pbClient
          .collection<{ id: string }>('character_plans')
          .getList(page, perPage, { fields: 'id' }),
    }),
  loader: ({ deps }) => queryClient.ensureQueryData(deps),
});

function HomeComponent() {
  const query = Route.useLoaderDeps();
  const data = useSuspenseQuery(query);
  const items = data.data.items;
  const { characterPlans } = useNewCharacterPlans();

  return (
    <div className="p-2 flex flex-wrap gap-4 justify-center">
      {items.map((build) => (
        <BuildInfo key={build.id} buildId={build.id} />
      ))}
      {characterPlans.map((pending) => (
        <PendingBuildInfo key={pending.id} characterId={pending.characterId} />
      ))}
      <CreateBuild />
    </div>
  );
}
