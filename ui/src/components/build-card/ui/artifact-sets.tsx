import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';

import { db } from '@/api/dictionaries-db';
import { CharacterPlans } from '@/api/types';
import { CollectionAvatar } from '@/components/collection-avatar';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { ArtifactSetPicker } from './artifact-set-picker';

type ArtifactSetProps = { artifactSetId: string; deleteSet(): void };
function ArtifactSet({ artifactSetId, deleteSet }: ArtifactSetProps) {
  const artifactsSet = useLiveQuery(
    () => db.artifactSets.get(artifactSetId),
    [artifactSetId],
  );
  if (!artifactsSet) {
    return null;
  }
  return (
    <div className="flex gap-2 w-full group/artifact-set">
      <CollectionAvatar
        collectionName="artifactSets"
        recordId={artifactsSet.id}
        fileName={artifactsSet.icon}
        name={artifactsSet.name}
        size={48}
        className="size-12"
      />
      <span className="flex-1">{artifactsSet.name}</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 p-1 opacity-75 invisible group-hover/artifact-set:visible group-focus-within/artifact-set:visible focus:visible hover:outline disabled:visible data-[state=open]:visible data-[state=open]:outline data-[state=open]:animate-pulse"
          >
            <Icons.remove />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" side="top">
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => deleteSet()}
          >
            Yes i really want to delete
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}

type Props = { build: CharacterPlans; mutate(v: string[]): void };
export function ArtifactSets({ build, mutate }: Props) {
  const artifactSets = build.artifact_sets;
  return (
    <div className="flex flex-col gap-2 group/artifact-sets">
      <div className="flex items-center gap-1">
        <span className="text-sm">ArtifactSets</span>
        <ArtifactSetPicker
          title="New artifact set"
          onSelect={(as) => mutate([...artifactSets, as])}
        >
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'size-6 opacity-75 transition-opacity invisible group-hover/artifact-sets:visible group-focus-within/artifact-sets:visible focus:opacity-100 hover:opacity-100',
              {
                ['visible opacity-50']: artifactSets?.length === 0,
              },
            )}
          >
            <Icons.add />
          </Button>
        </ArtifactSetPicker>
      </div>
      <div className="grid gap-1 w-full">
        {artifactSets.map((as) => (
          <ArtifactSet
            key={as}
            artifactSetId={as}
            deleteSet={() => mutate(artifactSets.filter((it) => it !== as))}
          />
        ))}
      </div>
    </div>
  );
}
