import { useSortable } from '@dnd-kit/sortable';
import { WritableDraft } from 'immer';
import { motion } from 'motion/react';
import { memo, ReactNode } from 'react';

import { OptimisticPlans } from '@/api/plans/character-plans';
import { useSharedPendingPlansStatusEntry } from '@/api/plans/plans';
import type { Characters, Plans } from '@/api/types';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { useElementScope } from '@/hooks/use-element-scope';
import { mutateFieldImmer } from '@/lib/mutate-field';
import { cn } from '@/lib/utils';

import { ArtifactSets } from './ui/artifact-sets';
import { ArtifactSubstats } from './ui/artifact-substats';
import { ArtifactTypes } from './ui/artifact-types';
import { CharacterInfoContent } from './ui/character-info';
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
    const { style: elementStyle } = useElementScope(props.character.element);

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
      ...elementStyle,
      transform: transform
        ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
        : undefined,
      transition,
    };

    return (
      <Card
        id={props.plan.id}
        ref={setNodeRef}
        className={cn(
          'element-scope group/plan @container/plan relative w-full max-w-4xl gap-0 overflow-hidden p-0 shadow-sm transition-shadow hover:shadow-md',
          {
            'opacity-50': isDragging,
            'border-destructive': isError,
            'opacity-65 saturate-50': props.plan.complete,
          },
        )}
        style={style}
      >
        <PlanCardHeader
          {...props}
          isLoading={isUpdating}
          isError={isError}
          dragHandle={
            <Icons.Drag
              className={cn('size-3.5 text-muted-foreground', {
                'cursor-grab': !props.disabled,
                'cursor-default opacity-30': props.disabled,
              })}
              {...attributes}
              {...(props.disabled ? {} : listeners)}
            />
          }
          isDragging={isDragging}
        />
        <CardContent className="grid grid-cols-1 items-start gap-x-6 gap-y-4 p-4 pt-3.5 @[38rem]/plan:grid-cols-2">
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
          <div className="@[38rem]/plan:col-span-2">
            <ArtifactTypes
              planId={props.plan.id}
              artfactTypesPlans={props.plan.artifactTypePlans}
              disabled={props.disabled}
            />
          </div>
          <div className="@[38rem]/plan:col-span-2">
            <ArtifactSubstats
              substats={props.plan.substats}
              mutate={props.update}
              disabled={props.disabled}
            />
          </div>
          <div className="@[38rem]/plan:col-span-2">
            <Teams
              planId={props.plan.id}
              character={props.character}
              teamPlans={props.plan.teamPlans}
              disabled={props.disabled}
            />
          </div>
          <div className="@[38rem]/plan:col-span-2">
            <Note
              note={props.plan.note}
              mutate={mutateFieldImmer(props.update, 'note')}
              disabled={props.disabled}
            />
          </div>
        </CardContent>
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

type HeaderProps = Props & { dragHandle: ReactNode; isDragging?: boolean };

function PlanCardHeader(props: HeaderProps) {
  return (
    <div className="element-band relative">
      <div className="flex items-center gap-3 p-3">
        <PlanCardPortrait {...props} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <h3 className="truncate text-lg leading-tight font-semibold tracking-tight">
              {props.character.name}
            </h3>
            <PlanCardInfo character={props.character} />
            <div className="flex-1" />
            <PlanCardCompleteToggle {...props} />
            <PlanCardActions {...props} />
          </div>
          <MainStat
            plan={props.plan}
            mutate={props.update}
            disabled={props.disabled}
          />
        </div>
      </div>
    </div>
  );
}

function PlanCardPortrait(props: HeaderProps) {
  return (
    <div className="relative shrink-0">
      <CollectionAvatar
        className="size-18 rounded-xl bg-gradient-to-br from-element/35 to-element/5 shadow-sm @[38rem]/plan:size-20"
        record={props.character}
        fileName={props.character.icon}
        name={props.character.name}
      />
      <div
        className={cn(
          'absolute -bottom-1.5 left-1/2 flex -translate-x-1/2 items-center justify-center rounded-full border border-border bg-card px-1.5 py-0.5 shadow-sm transition-opacity focus-within:opacity-100 hoverable:opacity-0 hoverable:group-hover/plan:opacity-100',
          { 'opacity-100': props.isDragging },
        )}
      >
        {props.dragHandle}
      </div>
      <motion.div
        className="absolute -top-1 -left-1 size-4"
        initial={{ scale: props.isLoading ? 1 : 0 }}
        animate={{ scale: props.isLoading ? 1 : 0 }}
        transition={{ duration: 0.15 }}
        aria-hidden={!props.isLoading}
      >
        <Tooltip>
          <TooltipTrigger>
            <Icons.Spinner className="size-4 animate-spin text-element-fg" />
          </TooltipTrigger>
          <TooltipContent>
            Dont exit this page until updates is pending
          </TooltipContent>
        </Tooltip>
      </motion.div>
    </div>
  );
}

function PlanCardInfo({ character }: { character: Characters }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 shrink-0 rounded-full text-element-fg/70 transition-colors hover:bg-element/15 hover:text-element-fg data-[state=open]:bg-element/20 data-[state=open]:text-element-fg"
          aria-label={`${character.name} details`}
        >
          <Icons.Info className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className="w-auto">
        <CharacterInfoContent character={character} />
      </PopoverContent>
    </Popover>
  );
}

function PlanCardCompleteToggle(props: Props) {
  const complete = props.plan.complete;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 transition-colors',
            complete
              ? 'bg-element/20 text-element-fg ring-element/30 hover:bg-element/30'
              : 'bg-foreground/6 text-muted-foreground ring-border/60 hover:bg-foreground/10',
          )}
          disabled={props.disabled}
          onClick={() =>
            props.update((v) => {
              v.complete = !v.complete;
            })
          }
        >
          {complete ? (
            <Icons.Complete className="size-3" />
          ) : (
            <Icons.NotComplete className="size-3" />
          )}
          <span className="hidden @[22rem]/plan:inline">
            {complete ? 'Built' : 'Farming'}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {complete ? 'Mark as still farming' : 'Mark as built'}
      </TooltipContent>
    </Tooltip>
  );
}

function PlanCardActions(props: Props) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: props.isError ? 1 : 0 }}
        transition={{ duration: 0.15 }}
        aria-hidden={!props.isError}
      >
        <Button size="sm" variant="destructive" onClick={props.retry}>
          <Icons.Retry className="size-3.5" />
          Retry
        </Button>
      </motion.div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'size-7 text-muted-foreground transition-opacity hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 data-[state=open]:opacity-100 hoverable:opacity-0 hoverable:group-hover/plan:opacity-100',
              { hidden: props.isLoading || props.disabled },
            )}
            aria-label={`Delete ${props.character.name} plan`}
          >
            <Icons.Remove className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" side="top" align="end">
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
    </div>
  );
}
