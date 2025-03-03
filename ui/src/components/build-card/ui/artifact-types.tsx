import { useQuery } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '@/api/dictionaries-db';
import { pbClient } from '@/api/pocketbase';
import { ArtifactTypePlans, CharacterPlans } from '@/api/types';
import { CollectionAvatar } from '@/components/collection-avatar';
import { cn } from '@/lib/utils';

type Props = { build: CharacterPlans };
export function ArtifactTypes({ build }: Props) {
  const query = useQuery({
    queryKey: ['character_plans', build.id, 'artifact_type_plans'],
    queryFn: () =>
      pbClient
        .collection<ArtifactTypePlans>('artifact_type_plans')
        .getFullList({
          filter: `character_plan = '${build.id}'`,
        }),
  });

  const artifactTypes = useLiveQuery(
    () => db.artifactTypes.toArray(),
    [query.data],
  );
  const specials = useLiveQuery(() => db.specials.toArray(), []);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-1 justify-items-center">
        {artifactTypes?.map((at) => (
          <div key={at.id}>
            <CollectionAvatar
              collectionName="artifactTypes"
              recordId={at.id}
              fileName={at.icon}
              name={at.name}
              size={32}
              className={cn('size-8')}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
