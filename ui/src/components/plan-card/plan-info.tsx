import { useSortable } from '@dnd-kit/sortable';
import { WritableDraft } from 'immer';
import { motion } from 'motion/react';
import { memo } from 'react';

import { OptimisticPlans } from '@/api/plans/character-plans';
import { useSharedPendingPlansStatusEntry } from '@/api/plans/plans';
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
import { useIsDesktopQuery } from '@/hooks/use-is-desktop-query';
import { mutateFieldImmer } from '@/lib/mutate-field';
import { cn } from '@/lib/utils';

import { ArtifactSets } from './ui/artifact-sets';
import { ArtifactSubstats } from './ui/artifact-substats';
import { ArtifactTypes } from './ui/artifact-types';
import { CharacterInfo } from './ui/character-info';
import { MainStat } from './ui/main-stats';
import { Note } from './ui/note';
import { Teams } from './ui/teams';
import { Weapons } from './ui/weapons';

type Props = {
  plan: OptimisticPlans;
  character: Characters;
  update: (cb: (v: WritableDraft<Plans>) => void) => void;
  retry: () => void;
  delete: () => void;
  isLoading?: boolean;
  isError?: boolean;
  disabled?: boolean;
};

export const PlanInfo = memo(
  function PlanInfo(props: Props) {
    const [plansInnerMutationsIsPending, plansInnerMutationsHasError] =
      useSharedPendingPlansStatusEntry(props.plan.id);

    const isDesktop = useIsDesktopQuery();

    const isUpdating = props.isLoading || plansInnerMutationsIsPending;
    const isError = props.isError || plansInnerMutationsHasError;

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: props.plan.id });

    const style = {
      transform: transform
        ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
        : undefined,
      transition,
    };

    return (
      <Card
        id={props.plan.id}
        ref={setNodeRef}
        className={cn('w-full overflow-hidden relative px-4', {
          '2xl:max-w-lg': isDesktop,
          'opacity-50': isDragging,
          'border-rose-700': isError,
          'grayscale-100': props.plan.complete,
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
          transition={{ duration: 0.15 }}
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
        <>
          <motion.div
            className="w-full flex justify-center pt-1"
            initial={{
              opacity: props.disabled ? 0 : 1,
            }}
            animate={{
              opacity: props.disabled ? 0 : 1,
            }}
            transition={{ duration: 0.2, type: 'spring', bounce: 0 }}
            aria-hidden={!props.disabled}
          >
            {!props.disabled ? (
              <Icons.Drag
                className="py-1 cursor-grab"
                {...listeners}
                {...attributes}
              />
            ) : (
              <Icons.Drag
                className="opacity-25 py-1 cursor-default"
                {...attributes}
              />
            )}
          </motion.div>
          <PlanCardTitle {...props} isLoading={isUpdating} />
          <PlanCardStats {...props} />
          <CardContent className="w-full pt-4 flex flex-col gap-3">
            <Weapons
              planId={props.plan.id}
              weaponType={props.character.weaponType}
              weaponPlansPlans={props.plan.weaponPlans}
              disabled={props.disabled}
            />
            <ArtifactSets
              planId={props.plan.id}
              artifactSetsPlans={props.plan.artifactSetsPlans}
              disabled={props.disabled}
            />
            <ArtifactTypes
              planId={props.plan.id}
              artfactTypesPlans={props.plan.artifactTypePlans}
              disabled={props.disabled}
            />
            <ArtifactSubstats
              substats={props.plan.substats}
              mutate={props.update}
              disabled={props.disabled}
            />
            <>
              <Teams
                planId={props.plan.id}
                character={props.character}
                teamPlans={props.plan.teamPlans}
                disabled={props.disabled}
              />
              <Note
                note={props.plan.note}
                mutate={mutateFieldImmer(props.update, 'note')}
                disabled={props.disabled}
              />
            </>
          </CardContent>
        </>
      </Card>
    );
  },
  (prev, next) => {
    const toStr = (props: Props) =>
      JSON.stringify(
        Object.entries(props).map(([k, v]) => [
          k,
          typeof v === 'function' ? true : v,
        ]),
      );
    return toStr(prev) == toStr(next);
  },
);

function PlanCardStats(props: Props) {
  return (
    <div className="flex items-start justify-around">
      <MainStat
        plan={props.plan}
        mutate={props.update}
        disabled={props.disabled}
      />
      <div />
      <CollectionAvatar
        className="size-35 rounded-2xl ml-6"
        record={props.character}
        fileName={props.character.icon}
        name={props.character.name}
      />
      <div />
    </div>
  );
}

const DEFAULT_VISIBLE = 'block group-hover/plan-complete:hidden';
const DEFAULT_HIDDEN = 'hidden group-hover/plan-complete:block';

function PlanCardTitle(props: Props) {
  return (
    <CardTitle className="px-4 pb-2 w-full flex items-start gap-3">
      <div className="w-full flex gap-3 items-center">
        <span className="font-semibold text-lg">{props.character.name}</span>
        <CharacterInfo character={props.character} />
        <PlanCardCompleteToggle {...props} />
        <div className="flex-1" />
        <PlanCardActions {...props} />
      </div>
    </CardTitle>
  );
}

function PlanCardCompleteToggle(props: Props) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="group/plan-complete size-7 shrink-0 opacity-50 hover:opacity-75 hover:outline"
          disabled={props.disabled}
          onClick={() =>
            props.update((v) => {
              v.complete = !v.complete;
            })
          }
        >
          <Icons.NotComplete
            className={props.plan.complete ? DEFAULT_HIDDEN : DEFAULT_VISIBLE}
          />
          <Icons.Complete
            className={props.plan.complete ? DEFAULT_VISIBLE : DEFAULT_HIDDEN}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {props.plan.complete ? 'Mark incomplete' : 'Mark complete'}
      </TooltipContent>
    </Tooltip>
  );
}

function PlanCardActions(props: Props) {
  return (
    <>
      <motion.div
        initial={{
          scale: 0,
        }}
        animate={{
          scale: props.isError ? 1 : 0,
        }}
        transition={{ duration: 0.15 }}
        aria-hidden={!props.isError}
      >
        <Button size="sm" variant="destructive" onClick={props.retry}>
          <Icons.Retry className="size-4" />
          Retry
        </Button>
      </motion.div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 opacity-50 hover:opacity-75 hover:outline data-[state=open]:outline data-[state=open]:animate-pulse"
            disabled={props.isLoading}
          >
            <Icons.Remove />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" side="top">
          <Button
            variant="destructive"
            className="w-full"
            disabled={props.disabled}
            onClick={props.delete}
          >
            Yes, I really want to delete
          </Button>
        </PopoverContent>
      </Popover>
    </>
  );
}
