import { useSortable } from '@dnd-kit/sortable';
// import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, useInView } from 'motion/react';
import { useMemo, useRef } from 'react';

import { db } from '@/api/dictionaries-db';
import { pbClient } from '@/api/pocketbase';
import type { CharacterPlans } from '@/api/types';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { CollectionAvatar } from '@/components/ui/collection-avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { AsyncDebounce } from '@/lib/async-debounce';
import { mutateField } from '@/lib/mutate-field';
import { notifyWithRetry } from '@/lib/notify-with-retry';
import { cn } from '@/lib/utils';
import { queryClient } from '@/main';

import { Skeleton } from '../ui/skeleton';
import { QUERY_KEY as DOMAINS_ANALYSIS_QUERY_KEY } from './build-domains-analysis';
import { ArtifactSets, ArtifactSetsSkeleton } from './ui/artifact-sets';
import { ArtifactStats, ArtifactStatsSkeleton } from './ui/artifact-stats';
import {
  ArtifactSubstats,
  ArtifactSubstatsSkeleton,
} from './ui/artifact-substats';
import { CharacterInfo } from './ui/character-info';
import { MainStat, MainStatSkeleton } from './ui/main-stats';
import { Note, NoteSkeleton } from './ui/note';
import { Teams, TeamsSkeleton } from './ui/teams';
import { Weapons, WeaponsSkeleton } from './ui/weapons';

type Props = {
  buildId: string;
  reorderIsPending?: boolean;
  characterId: string;
  dndEnabled?: boolean;
};
export function BuildInfo({
  buildId,
  reorderIsPending,
  characterId,
  dndEnabled,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true });

  const queryKey = ['characterPlans', buildId];
  const query = useQuery({
    queryKey,
    queryFn: () =>
      pbClient.collection<CharacterPlans>('characterPlans').getOne(buildId),
    enabled: isInView,
  });
  const character = useLiveQuery(
    () => db.characters.get(characterId),
    [characterId],
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
        queryKey: ['characterPlans', 'page'],
      });
      queryClient.invalidateQueries({
        queryKey: DOMAINS_ANALYSIS_QUERY_KEY,
      });
      queryClient.removeQueries({ queryKey });
    },
    onError: notifyWithRetry(() => {
      deleteBuild();
    }),
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: buildId });

  const isPending = updateIsPending || deleteIsPending;

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    // transform: CSS.Transform.toString(transform),
    transition,
  };

  const build = variables || query.data;

  if (isDeleted) {
    return null;
  }

  if (!character) {
    return (
      <article id={buildId} ref={cardRef}>
        <BuildInfoSkeleton ref={cardRef} />;
      </article>
    );
  }

  return (
    <article id={buildId} ref={cardRef}>
      <Card
        ref={setNodeRef}
        className={cn('w-full overflow-hidden', {
          'opacity-50': isDragging,
        })}
        style={style}
      >
        <motion.div
          className="w-full flex justify-center pt-1"
          initial={{
            opacity: dndEnabled ? 1 : 0,
          }}
          animate={{
            opacity: dndEnabled ? 1 : 0,
          }}
          transition={{ duration: 0.2, type: 'spring', bounce: 0 }}
          aria-hidden={!dndEnabled}
        >
          {reorderIsPending || !dndEnabled ? (
            <Icons.Drag
              className={cn('opacity-25 py-1', {
                'animate-pulse': reorderIsPending,
                'cursor-default': !dndEnabled,
              })}
              {...attributes}
            />
          ) : (
            <Icons.Drag
              className="py-1 cursor-grab"
              {...listeners}
              {...attributes}
            />
          )}
        </motion.div>
        <CardTitle className="px-4 w-full flex items-center gap-3">
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
        <CardContent className="w-full pt-4 flex flex-col gap-3">
          <div className="flex items-start justify-around">
            <MainStat build={build} mutate={mutate} />
            <CollectionAvatar
              className="size-35 rounded-2xl ml-6"
              record={character}
              fileName={character.icon}
              name={character.name}
            />
            <div />
          </div>
          <Weapons
            weaponType={character.weaponType}
            buildId={buildId}
            enabled={isInView}
          />
          <ArtifactSets buildId={buildId} enabled={isInView} />
          <ArtifactStats buildId={buildId} enabled={isInView} />
          <ArtifactSubstats
            substats={build?.substats}
            mutate={mutateField(mutate, build, 'substats')}
          />
          <Teams
            buildId={buildId}
            characterId={characterId}
            enabled={isInView}
          />
          <Note
            note={build?.note}
            mutate={mutateField(mutate, build, 'note')}
          />
        </CardContent>
      </Card>
    </article>
  );
}

export function BuildInfoSkeleton({
  ref,
}: {
  ref?: React.Ref<HTMLDivElement | null>;
}) {
  return (
    <Card ref={ref} className="w-full overflow-hidden">
      <div className="w-full flex justify-center pt-1">
        <Skeleton className="w-6 h-4" />
      </div>
      <CardTitle className="px-4 w-full flex items-center gap-3">
        <Skeleton className="w-25 h-6" />
        <Skeleton className="size-6" />
        <div className="flex-1" />
        <Skeleton className="size-6" />
      </CardTitle>
      <CardContent className="w-full pt-4 flex flex-col gap-3">
        <div className="flex items-start justify-around">
          <MainStatSkeleton />
          <Skeleton className="size-35 rounded-2xl ml-6" />
          <div />
        </div>
        <WeaponsSkeleton />
        <ArtifactSetsSkeleton />
        <ArtifactStatsSkeleton />
        <ArtifactSubstatsSkeleton />
        <TeamsSkeleton />
        <NoteSkeleton />
      </CardContent>
    </Card>
  );
}
