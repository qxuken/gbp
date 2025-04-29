import { useSortable } from '@dnd-kit/sortable';
// import { CSS } from '@dnd-kit/utilities';
import { motion, useInView } from 'motion/react';
import { useRef } from 'react';

import { useCharacterPlanMutation } from '@/api/plans/character-plans';
import {
  usePlansItemIsLoading,
  useReorderPlansIsPending,
} from '@/api/plans/plans';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { mutateFieldImmer } from '@/lib/mutate-field';
import { cn } from '@/lib/utils';
import { useFiltersEnabled } from '@/store/plans/filters';

import { ArtifactSets } from './ui/artifact-sets';
import { ArtifactSubstats } from './ui/artifact-substats';
import { ArtifactTypes } from './ui/artifact-types';
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

  const { record, updateRecord, deleteRecord, isDeleted, isPendingDeletion } =
    useCharacterPlanMutation(plan);

  const isUpdating = usePlansItemIsLoading(plan.id);

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
        className={cn('w-full overflow-hidden relative', {
          'opacity-50': isDragging,
        })}
        style={style}
      >
        <motion.div
          className="size-4 absolute top-2 left-4"
          initial={{
            scale: isUpdating ? 1 : 0,
          }}
          animate={{
            scale: isUpdating ? 1 : 0,
          }}
          transition={{ duration: 0.2 }}
          aria-hidden={!isUpdating}
        >
          <Tooltip>
            <TooltipTrigger>
              <Icons.Spinner className="size-4 animate-spin text-accent-foreground opacity-75" />
            </TooltipTrigger>
            <TooltipContent>
              Dont exit this page until updates is pending
            </TooltipContent>
          </Tooltip>
        </motion.div>
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
                disabled={isUpdating}
              >
                <Icons.Remove />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" side="top">
              <Button
                variant="destructive"
                className="w-full"
                disabled={isUpdating}
                onClick={deleteRecord}
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
          <ArtifactSets
            planId={plan.id}
            artifactSets={plan.artifactSetsPlans}
            disabled={isPendingDeletion}
          />
          <ArtifactTypes
            planId={plan.id}
            artfactTypes={plan.artifactTypePlans}
            disabled={isPendingDeletion}
          />
          <ArtifactSubstats
            substats={record.substats}
            mutate={updateRecord}
            disabled={isPendingDeletion}
          />
          <Teams buildId={plan.id} characterId={plan.id} enabled={isInView} />
          <Note
            note={record.note}
            mutate={mutateFieldImmer(updateRecord, 'note')}
          />
        </CardContent>
      </Card>
    </article>
  );
}
