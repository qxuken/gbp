import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '@/api/dictionaries-db';
import { CharacterPlans } from '@/api/types';
import { CollectionAvatar } from '@/components/collection-avatar';

type Props = { build: CharacterPlans };
export function ArtifactSets({ build }: Props) {
  const artifactsSets = useLiveQuery(
    () => db.artifactSets.bulkGet(build.artifact_sets ?? []),
    [build.artifact_sets],
  );
  if (!artifactsSets) {
    return null;
  }
  return (
    <div className="flex flex-col gap-2">
      <span className="text-2xl font-semibold">Artifact Sets</span>
      <div className="flex gap-4 justify-start flex-wrap w-full">
        {artifactsSets.map(
          (as) =>
            as && (
              <div key={as.id} className="flex flex-col items-center">
                <CollectionAvatar
                  collectionName="artifactSets"
                  recordId={as.id}
                  fileName={as.icon}
                  name={as.name}
                  size={64}
                  className="size-16"
                />
                <span>{as.name}</span>
              </div>
            ),
        )}
      </div>
    </div>
  );
}
