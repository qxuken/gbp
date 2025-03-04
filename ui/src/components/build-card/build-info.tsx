import { useMutation, useQuery } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';

import { db } from '@/api/dictionaries-db';
import { pbClient } from '@/api/pocketbase';
import type { CharacterPlans } from '@/api/types';
import { CollectionAvatar } from '@/components/collection-avatar';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AsyncDebounce } from '@/lib/async-debounce';
import { mutateField } from '@/lib/mutate-field';
import { notifyWithRetry } from '@/lib/notify-with-retry';
import { queryClient } from '@/main';

import { ArtifactSets } from './ui/artifact-sets';
import { ArtifactSubstats } from './ui/artifact-substats';
import { ArtifactTypes } from './ui/artifact-types';
import { CharacterInfo } from './ui/character-info';
import { DoubleInputLabeled } from './ui/double-input-labeled';
import { Teams } from './ui/teams';
import { Weapons } from './ui/weapons';

type Props = { buildId: string };
export function BuildInfo({ buildId }: Props) {
  const queryKey = ['character_plans', buildId];
  const query = useQuery({
    queryKey,
    queryFn: () =>
      pbClient.collection<CharacterPlans>('character_plans').getOne(buildId),
  });
  const character = useLiveQuery(
    () => db.characters.get(query.data?.character ?? ''),
    [query.data?.character],
  );

  const mutationDebouncer = useMemo(
    () =>
      new AsyncDebounce(
        (update: CharacterPlans) =>
          pbClient
            .collection<CharacterPlans>('character_plans')
            .update(buildId, update),
        1000,
      ),
    [],
  );
  const { variables, mutate } = useMutation({
    mutationFn: (v: CharacterPlans) => mutationDebouncer.run(v),
    onSettled: async (data) =>
      data
        ? queryClient.setQueryData(queryKey, data)
        : queryClient.invalidateQueries({ queryKey, exact: true }),
    onError: notifyWithRetry((v) => {
      mutate(v);
    }),
  });

  if (!query.data || !character) {
    return null;
  }

  const build = variables || query.data;

  return (
    <Card className="w-min bg-accent text-accent-foreground">
      <CardTitle className="p-4 w-full flex items-center gap-3">
        <span className="flex-1 font-semibold text-lg">{character.name}</span>
        <CharacterInfo character={character} />
      </CardTitle>
      <CardContent className="flex flex-col gap-4 w-min bg-accent">
        <div className="flex items-start gap-6">
          <div className="grid grid-cols-[auto_1fr] items-center gap-2">
            <DoubleInputLabeled
              name="Level"
              min={0}
              max={90}
              current={build.level_current}
              target={build.level_target}
              onCurrentChange={mutateField(mutate, build, 'level_current')}
              onTargetChange={mutateField(mutate, build, 'level_target')}
            />
            <DoubleInputLabeled
              name="Constelation"
              min={0}
              max={6}
              current={build.constellation_current}
              target={build.constellation_target}
              onCurrentChange={mutateField(
                mutate,
                build,
                'constellation_current',
              )}
              onTargetChange={mutateField(
                mutate,
                build,
                'constellation_target',
              )}
            />
            <Separator className="col-span-2 bg-muted-foreground rounded-lg" />
            <DoubleInputLabeled
              name="Attack"
              min={0}
              max={10}
              current={build.talent_atk_current}
              target={build.talent_atk_target}
              onCurrentChange={mutateField(mutate, build, 'talent_atk_current')}
              onTargetChange={mutateField(mutate, build, 'talent_atk_target')}
            />
            <DoubleInputLabeled
              name="Skill"
              min={0}
              max={13}
              current={build.talent_skill_current}
              target={build.talent_skill_target}
              onCurrentChange={mutateField(
                mutate,
                build,
                'talent_skill_current',
              )}
              onTargetChange={mutateField(mutate, build, 'talent_skill_target')}
            />
            <DoubleInputLabeled
              name="Burst"
              min={0}
              max={13}
              current={build.talent_burst_current}
              target={build.talent_burst_target}
              onCurrentChange={mutateField(
                mutate,
                build,
                'talent_burst_current',
              )}
              onTargetChange={mutateField(mutate, build, 'talent_burst_target')}
            />
          </div>
          <CollectionAvatar
            size={140}
            className="size-35 rounded-2xl"
            collectionName="characters"
            recordId={build.character}
            fileName={character.icon}
            name={character.name}
          />
        </div>
        <Weapons character={character} buildId={buildId} />
        <ArtifactSets
          build={build}
          mutate={mutateField(mutate, build, 'artifact_sets')}
        />
        <ArtifactTypes buildId={build.id} />
        <ArtifactSubstats buildId={build.id} />
        <Teams buildId={build.id} />
      </CardContent>
    </Card>
  );
}
