import { useSortable } from '@dnd-kit/sortable';
import { WritableDraft } from 'immer';
import { motion } from 'motion/react';
import { memo, ReactNode } from 'react';

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
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsDesktopQuery } from '@/hooks/use-is-desktop-query';
import { mutateFieldImmer } from '@/lib/mutate-field';
import { cn } from '@/lib/utils';
import {
  UiPlansMode,
  useUiPlansConfigModeValue,
} from '@/store/ui-plans-config';

import { ArtifactSets } from './ui/artifact-sets';
import { ArtifactSubstats } from './ui/artifact-substats';
import { ArtifactTypes } from './ui/artifact-types';
import { CharacterInfo, CharacterInlineInfo } from './ui/character-info';
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

    const mode = useUiPlansConfigModeValue();
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
        className={cn('w-full overflow-hidden relative', {
          '2xl:max-w-lg': isDesktop && mode == UiPlansMode.Full,
          'xl:max-w-lg': isDesktop && mode == UiPlansMode.Short,
          '2xl:max-w-6xl': isDesktop && mode == UiPlansMode.V2,
          'px-4': mode == UiPlansMode.Full,
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
        {mode == UiPlansMode.V2 ? (
          <PlanCardV2
            {...props}
            isLoading={isUpdating}
            isError={isError}
            dragHandle={
              <Icons.Drag
                className={cn('size-5 shrink-0 py-1', {
                  'cursor-grab': !props.disabled,
                  'cursor-default opacity-25': props.disabled,
                })}
                {...attributes}
                {...(!props.disabled ? listeners : {})}
              />
            }
          />
        ) : (
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
            <CardContent
              className={cn('w-full pt-4 flex flex-col', {
                'gap-3': mode == UiPlansMode.Full,
                'gap-1.5': mode == UiPlansMode.Short,
              })}
            >
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
              {mode == UiPlansMode.Full && (
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
              )}
            </CardContent>
          </>
        )}
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
  const mode = useUiPlansConfigModeValue();

  if (mode != UiPlansMode.Full) {
    return null;
  }
  return (
    <div className="flex items-start justify-around">
      <MainStat
        plan={props.plan}
        mutate={props.update}
        disabled={props.disabled}
      />
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

function PlanCardV2(
  props: Props & { dragHandle: ReactNode; isError?: boolean },
) {
  return (
    <>
      <CardTitle className="flex w-full items-center gap-2 px-4 py-3">
        {props.dragHandle}
        <CollectionAvatar
          className="size-11 shrink-0 rounded-lg border border-border"
          record={props.character}
          fileName={props.character.icon}
          name={props.character.name}
        />
        <div className="min-w-0 flex-1">
          <span className="block truncate text-lg font-semibold">
            {props.character.name}
          </span>
          <CharacterInlineInfo character={props.character} className="mt-0.5" />
        </div>
        <span
          className={cn(
            'hidden rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground sm:inline-flex',
            { 'bg-primary/15 text-primary': props.plan.complete },
          )}
        >
          {props.plan.complete ? 'Built' : 'Farming'}
        </span>
        <PlanCardCompleteToggle {...props} />
        <PlanCardActions {...props} />
      </CardTitle>
      <CardContent className="p-0">
        <div className="grid border-t lg:grid-cols-[12rem_minmax(14rem,0.85fr)_minmax(18rem,1.2fr)]">
          <section className="min-w-0 p-4 lg:border-r">
            <MainStat
              plan={props.plan}
              mutate={props.update}
              disabled={props.disabled}
              compact
            />
          </section>
          <section className="min-w-0 border-t p-4 lg:border-t-0 lg:border-r">
            <Weapons
              planId={props.plan.id}
              weaponType={props.character.weaponType}
              weaponPlansPlans={props.plan.weaponPlans}
              disabled={props.disabled}
            />
          </section>
          <section className="min-w-0 border-t p-4 lg:border-t-0">
            <ArtifactSets
              planId={props.plan.id}
              artifactSetsPlans={props.plan.artifactSetsPlans}
              disabled={props.disabled}
            />
          </section>
        </div>
        <div className="grid border-t xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.52fr)]">
          <div className="min-w-0 xl:border-r">
            <section className="min-w-0 p-4">
              <ArtifactTypes
                title={null}
                planId={props.plan.id}
                artfactTypesPlans={props.plan.artifactTypePlans}
                disabled={props.disabled}
              />
            </section>
            <section className="min-w-0 border-t p-4">
              <ArtifactSubstats
                substats={props.plan.substats}
                mutate={props.update}
                disabled={props.disabled}
              />
            </section>
          </div>
          <section className="min-w-0 border-t p-4 xl:border-t-0">
            <Teams
              planId={props.plan.id}
              character={props.character}
              teamPlans={props.plan.teamPlans}
              disabled={props.disabled}
            />
          </section>
        </div>
        <Separator />
        <div className="p-4">
          <Note
            note={props.plan.note}
            mutate={mutateFieldImmer(props.update, 'note')}
            disabled={props.disabled}
          />
        </div>
      </CardContent>
    </>
  );
}

const DEFAULT_VISIBLE = 'block group-hover/plan-complete:hidden';
const DEFAULT_HIDDEN = 'hidden group-hover/plan-complete:block';

function PlanCardTitle(props: Props) {
  const mode = useUiPlansConfigModeValue();

  return (
    <CardTitle className="px-4 pb-2 w-full flex items-start gap-3">
      {mode == UiPlansMode.Short && (
        <CollectionAvatar
          className="size-12 rounded-md"
          record={props.character}
          fileName={props.character.icon}
          name={props.character.name}
        />
      )}
      <div
        className={cn('w-full flex gap-3', {
          'items-start': mode == UiPlansMode.Short,
          'items-center': mode == UiPlansMode.Full,
        })}
      >
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
  const mode = useUiPlansConfigModeValue();

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
        <Button
          size={mode == UiPlansMode.Full ? 'sm' : 'icon'}
          className={cn({
            'size-7': mode == UiPlansMode.Short,
          })}
          variant="destructive"
          onClick={props.retry}
        >
          <Icons.Retry className="size-4" />
          {mode == UiPlansMode.Full ? 'Retry' : null}
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
