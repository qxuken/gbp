import { useSortable } from '@dnd-kit/sortable';
// import { CSS } from '@dnd-kit/utilities';
import { motion, useInView } from 'motion/react';
import { useRef } from 'react';

import { useUpdateCharacterPlan } from '@/api/plans/character-plans';
import { useReorderPlansIsPending } from '@/api/plans/plans';
import type { Characters, Plans } from '@/api/types';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { CollectionAvatar } from '@/components/ui/collection-avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { mutateFieldImmer } from '@/lib/mutate-field';
import { cn } from '@/lib/utils';
import { useFiltersEnabled } from '@/store/plans/filters';

import { ArtifactSets } from './ui/artifact-sets';
import { ArtifactStats } from './ui/artifact-stats';
import { ArtifactSubstats } from './ui/artifact-substats';
import { CharacterInfo } from './ui/character-info';
import { MainStat } from './ui/main-stats';
import { Note } from './ui/note';
import { Teams } from './ui/teams';
import { Weapons } from './ui/weapons';

type Props = {
  plan: Plans;
  character: Characters;
};

export function PlanInfo({ plan, character }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true });
  const filtersEnabled = useFiltersEnabled();

  const reorderIsPending = useReorderPlansIsPending();

  const {
    record,
    updateRecord,
    deleteRecord,
    isPending,
    isDeleted,
    isPendingDeletion,
  } = useUpdateCharacterPlan(plan);

  const dndEnabled = !filtersEnabled && !isPendingDeletion;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: plan.id });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    // transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isDeleted) {
    return null;
  }

  return (
    <article id={plan.id} ref={cardRef}>
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
                onClick={() => deleteRecord()}
              >
                Yes i really want to delete
              </Button>
            </PopoverContent>
          </Popover>
        </CardTitle>
        <CardContent className="w-full pt-4 flex flex-col gap-3">
          <div className="flex items-start justify-around">
            <MainStat
              plan={record}
              mutate={updateRecord}
              disabled={isPendingDeletion}
            />
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
            buildId={plan.id}
            enabled={isInView}
          />
          <ArtifactSets buildId={plan.id} enabled={isInView} />
          <ArtifactStats buildId={plan.id} enabled={isInView} />
          <ArtifactSubstats
            substats={record?.substats}
            mutate={mutateFieldImmer(updateRecord, 'substats')}
          />
          <Teams buildId={plan.id} characterId={plan.id} enabled={isInView} />
          <Note
            note={record?.note}
            mutate={mutateFieldImmer(updateRecord, 'note')}
          />
        </CardContent>
      </Card>
    </article>
  );
}
