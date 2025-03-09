import { useMutation, useQuery } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';

import { db } from '@/api/dictionaries-db';
import { pbClient } from '@/api/pocketbase';
import type { CharacterPlans } from '@/api/types';
import { CollectionAvatar } from '@/components/collection-avatar';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { AsyncDebounce } from '@/lib/async-debounce';
import { mutateField } from '@/lib/mutate-field';
import { notifyWithRetry } from '@/lib/notify-with-retry';
import { queryClient } from '@/main';

import { AutoTextarea } from '../ui/auto-textarea';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
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
  const {
    variables,
    mutate,
    isPending: updateIsPending,
  } = useMutation({
    mutationFn: (v: CharacterPlans) => mutationDebouncer.run(v),
    onSettled: async (data) =>
      data
        ? queryClient.setQueryData(queryKey, data)
        : queryClient.invalidateQueries({ queryKey, exact: true }),
    onError: notifyWithRetry((v) => {
      mutate(v);
    }),
  });
  const {
    mutate: deleteBuild,
    isPending: deleteIsPending,
    isSuccess: isDeleted,
  } = useMutation({
    mutationFn: () =>
      pbClient.collection<CharacterPlans>('characterPlans').delete(buildId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['characterPlans'],
        exact: true,
      });
      queryClient.removeQueries({ queryKey });
    },
    onError: notifyWithRetry(() => {
      deleteBuild();
    }),
  });

  const isPending = updateIsPending || deleteIsPending;

  if (!query.data || !character || isDeleted) {
    return null;
  }

  const build = variables || query.data;

  return (
    <Card className="w-full bg-accent text-accent-foreground overflow-hidden">
      <CardTitle className="p-4 w-full flex items-center gap-3">
        <span className="font-semibold text-lg">{character.name}</span>
        <CharacterInfo character={character} />
        <div className="flex-1" />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 p-1 opacity-50 hover:opacity-75 hover:outline data-[state=open]:outline data-[state=open]:animate-pulse"
              disabled={isPending}
            >
              <Icons.Remove />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" side="top">
            <Button
              variant="destructive"
              className="w-full"
              disabled={isPending}
              onClick={() => deleteBuild()}
            >
              Yes i really want to delete
            </Button>
          </PopoverContent>
        </Popover>
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
        <div className="mt-1 w-full grid gap-2">
          <Label htmlFor={buildId + '_note'} className="text-muted-foreground">
            Notes
          </Label>
          <AutoTextarea
            id={buildId + '_note'}
            placeholder="Additional build notes"
            value={build.note}
            onChange={(e) => mutateField(mutate, build, 'note')(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
