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
import { ArtifactStats } from './ui/artifact-stats';
import { ArtifactSubstats } from './ui/artifact-substats';
import { CharacterInfo } from './ui/character-info';
import { DoubleInputLabeled } from './ui/double-input-labeled';
import { Teams } from './ui/teams';
import { Weapons } from './ui/weapons';

type Props = { buildId: string };
export function BuildInfo({ buildId }: Props) {
  const queryKey = ['characterPlans', buildId];
  const query = useQuery({
    queryKey,
    queryFn: () =>
      pbClient.collection<CharacterPlans>('characterPlans').getOne(buildId),
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
            .collection<CharacterPlans>('characterPlans')
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
    <Card className="w-full bg-accent text-accent-foreground overflow-hidden">
      <CardTitle className="p-4 w-full flex items-center gap-3">
        <span className="flex-1 font-semibold text-lg">{character.name}</span>
        <CharacterInfo character={character} />
      </CardTitle>
      <CardContent className="w-full flex flex-col gap-3 bg-accent">
        <div className="flex items-start justify-around">
          <div className="grid grid-cols-[auto_1fr] items-center gap-1">
            <DoubleInputLabeled
              name="Level"
              min={0}
              max={90}
              current={build.levelCurrent}
              target={build.levelTarget}
              onCurrentChange={mutateField(mutate, build, 'levelCurrent')}
              onTargetChange={mutateField(mutate, build, 'levelTarget')}
            />
            <DoubleInputLabeled
              name="Constelation"
              min={0}
              max={6}
              current={build.constellationCurrent}
              target={build.constellationTarget}
              onCurrentChange={mutateField(
                mutate,
                build,
                'constellationCurrent',
              )}
              onTargetChange={mutateField(mutate, build, 'constellationTarget')}
            />
            <Separator className="col-span-2 bg-muted-foreground rounded-lg opacity-50" />
            <DoubleInputLabeled
              name="Attack"
              min={0}
              max={10}
              current={build.talentAtkCurrent}
              target={build.talentAtkTarget}
              onCurrentChange={mutateField(mutate, build, 'talentAtkCurrent')}
              onTargetChange={mutateField(mutate, build, 'talentAtkTarget')}
            />
            <DoubleInputLabeled
              name="Skill"
              min={0}
              max={13}
              current={build.talentSkillCurrent}
              target={build.talentSkillTarget}
              onCurrentChange={mutateField(mutate, build, 'talentSkillCurrent')}
              onTargetChange={mutateField(mutate, build, 'talentSkillTarget')}
            />
            <DoubleInputLabeled
              name="Burst"
              min={0}
              max={13}
              current={build.talentBurstCurrent}
              target={build.talentBurstTarget}
              onCurrentChange={mutateField(mutate, build, 'talentBurstCurrent')}
              onTargetChange={mutateField(mutate, build, 'talentBurstTarget')}
            />
          </div>
          <CollectionAvatar
            size={140}
            className="size-35 rounded-2xl ml-6"
            record={character}
            fileName={character.icon}
            name={character.name}
          />
          <div />
        </div>
        <Weapons weaponType={character.weaponType} buildId={buildId} />
        <ArtifactSets buildId={build.id} />
        <ArtifactStats buildId={build.id} />
        <ArtifactSubstats
          substats={build.substats}
          mutate={mutateField(mutate, build, 'substats')}
        />
        <Teams buildId={build.id} characterId={build.character} />
      </CardContent>
    </Card>
  );
}
