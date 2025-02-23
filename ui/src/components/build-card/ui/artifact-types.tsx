import { useQuery } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '@/api/dictionaries-db';
import { pbClient } from '@/api/pocketbase';
import { ArtifactTypePlans, CharacterPlans } from '@/api/types';
import { CollectionAvatar } from '@/components/collection-avatar';

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
    () =>
      db.artifactTypes.bulkGet(query.data?.map((w) => w.artifact_type) ?? []),
    [query.data],
  );
  const specials = useLiveQuery(
    () => db.specials.bulkGet(query.data?.map((w) => w.special) ?? []),
    [query.data],
  );
  if (query.isPending || !artifactTypes || !specials) {
    return null;
  }
  return (
    <div className="flex flex-col gap-2">
      <span className="text-2xl font-semibold">Artifact Types</span>
      <div className="flex gap-4 justify-start flex-wrap w-full">
        {query.data?.map(
          (at, i) =>
            at &&
            artifactTypes[i] &&
            specials[i] && (
              <div key={at.id}>
                <div className="flex gap-2 items-center align-middle">
                  <CollectionAvatar
                    collectionName="artifactTypes"
                    recordId={artifactTypes[i].id}
                    fileName={artifactTypes[i].icon}
                    name={artifactTypes[i].name}
                    size={32}
                    className="size-8"
                  />
                  <span>{artifactTypes[i].name}</span>
                </div>
                <div>{specials[i].name}</div>
              </div>
            ),
        )}
      </div>
    </div>
  );
}
