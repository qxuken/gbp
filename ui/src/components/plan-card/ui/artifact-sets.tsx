import { WritableDraft } from 'immer';

import { useArtifactSetsItem } from '@/api/dictionaries/hooks';
import { useArtifactSetsPlansMutation } from '@/api/plans/artifact-sets-plans';
import { ArtifactSetsPlans } from '@/api/types';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { CollectionAvatar } from '@/components/ui/collection-avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { removeByPredMut } from '@/lib/array-remove-mut';
import { cn } from '@/lib/utils';
import {
  UiPlansMode,
  useUiPlansConfigModeValue,
} from '@/store/ui-plans-config';

import { ArtifactSetPicker } from './artifact-set-picker';

const MAX_SETS = 10;

type Props = {
  planId: string;
  artifactSetsPlans?: ArtifactSetsPlans[];
  disabled?: boolean;
};
export function ArtifactSets(props: Props) {
  const mutation = useArtifactSetsPlansMutation(
    props.planId,
    props.artifactSetsPlans,
    props.disabled,
  );

  const mode = useUiPlansConfigModeValue();
  let items = mutation.records;
  if (mode == UiPlansMode.Short) {
    items = items.slice(0, 1);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <span
          className={cn('text-sm', {
            'text-rose-700': mutation.isError,
          })}
        >
          Artifacts
        </span>
        {mode == UiPlansMode.Short && mutation.records.length > 1 && (
          <span className="text-xs text-muted-foreground self-start">
            +{mutation.records.length - 1}
          </span>
        )}
        {mutation.records.length < MAX_SETS && (
          <ArtifactSetPicker
            title="New artifact set"
            onSelect={(as) => mutation.create({ artifactSets: [as] })}
          >
            <Button
              variant="ghost"
              size="icon"
              className="size-6 opacity-50 transition-opacity focus:opacity-100 hover:opacity-100 disabled:opacity-25"
              disabled={props.disabled}
            >
              <Icons.Add />
            </Button>
          </ArtifactSetPicker>
        )}
        <div className="flex-1" />
        {mutation.isError && (
          <Button
            variant="ghost"
            className="h-6 opacity-50 transition-opacity focus:opacity-100 hover:opacity-100 disabled:opacity-25"
            onClick={mutation.retry}
            disabled={props.disabled}
          >
            <Icons.Retry className="text-rose-700" />
            Retry
          </Button>
        )}
      </div>
      <div className="grid gap-1 w-full">
        {items.map((as, i) => (
          <div key={as.id}>
            <ArtifactSetPlan
              artifactSetPlan={as}
              update={(cb) => mutation.update(as, cb)}
              delete={() => mutation.delete(as.id)}
              isLoading={as.isOptimistic}
              disabled={as.isOptimisticBlocked || props.disabled}
            />
            {mode == UiPlansMode.Full && mutation.records.length - 1 !== i && (
              <Separator className="bg-muted-foreground rounded-lg mb-1 opacity-50" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

type ArtifactSetPlanProps = {
  artifactSetPlan: ArtifactSetsPlans;
  update: (cb: (v: WritableDraft<ArtifactSetsPlans>) => void) => void;
  delete: () => void;
  isLoading?: boolean;
  disabled?: boolean;
};
function ArtifactSetPlan(props: ArtifactSetPlanProps) {
  const mode = useUiPlansConfigModeValue();
  const artifactSets = props.artifactSetPlan.artifactSets;
  const artifactSetsSet = new Set(artifactSets);
  const deleteSet = (setId: string) => {
    switch (artifactSets.length) {
      case 1:
        return props.delete();
      case 2:
        return props.update((state) => {
          removeByPredMut(state.artifactSets, (it) => it == setId);
        });
    }
  };

  const addSet = (setId: string) => {
    if (artifactSets.length == 1) {
      props.update((state) => {
        state.artifactSets.push(setId);
      });
    }
  };

  let Component: React.FC<ArtifactSetProps>;
  switch (mode) {
    case UiPlansMode.Full:
      Component = ArtifactSetFull;
      break;
    case UiPlansMode.Short:
      Component = ArtifactSetShort;
      break;
  }

  return (
    <div className={cn({ 'animate-pulse': props.isLoading })}>
      {artifactSets.map((artifactSet, _, items) => (
        <Component
          key={artifactSet}
          artifactSet={artifactSet}
          isSplit={items.length == 2}
          delete={() => deleteSet(artifactSet)}
        />
      ))}
      <div
        className={cn('min-h-2', { 'text-center': mode == UiPlansMode.Full })}
      >
        {artifactSets.length === 1 && (
          <ArtifactSetPicker
            title="Split into two peaces"
            onSelect={(as) => addSet(as)}
            ignoreArifacts={artifactSetsSet}
          >
            <Button
              variant="ghost"
              size="sm"
              className="opacity-50 transition-opacity focus:opacity-100 hover:opacity-100"
            >
              <Icons.SplitY /> Split into two peaces
            </Button>
          </ArtifactSetPicker>
        )}
      </div>
    </div>
  );
}

type ArtifactSetProps = {
  artifactSet: string;
  isSplit?: boolean;
  delete: () => void;
  disabled?: boolean;
  skipConfirmation?: boolean;
};

function ArtifactSetFull(props: ArtifactSetProps) {
  const artifactSet = useArtifactSetsItem(props.artifactSet);
  if (!artifactSet) {
    return null;
  }
  return (
    <div className="flex gap-2 w-full nth-2:mt-1">
      <CollectionAvatar
        record={artifactSet}
        fileName={artifactSet.icon}
        name={artifactSet.name}
        className="size-12"
      />
      <div className="flex-1">
        <div className="flex justify-between">
          <span className="flex-1">{artifactSet.name}</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 p-1 opacity-50 hover:opacity-75 hover:outline data-[state=open]:outline data-[state=open]:animate-pulse"
                disabled={props.disabled}
              >
                <Icons.Remove />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" side="top">
              <Button
                variant="destructive"
                className="w-full"
                onClick={props.delete}
                disabled={props.disabled}
              >
                Yes i really want to delete
              </Button>
            </PopoverContent>
          </Popover>
        </div>
        <span className="text-xs text-muted-foreground">
          {props.isSplit ? '2 pcs' : '4 pcs'}
        </span>
      </div>
    </div>
  );
}

export function ArtifactSetShort(props: ArtifactSetProps) {
  const artifactSet = useArtifactSetsItem(props.artifactSet);
  if (!artifactSet) {
    return null;
  }
  return (
    <div className="flex gap-2 w-full nth-2:mt-1">
      <CollectionAvatar
        record={artifactSet}
        fileName={artifactSet.icon}
        name={artifactSet.name}
        className="size-8"
      />
      <div className="flex-1">
        <div className="flex justify-between">
          <span className="flex-1">{artifactSet.name}</span>
          {props.skipConfirmation ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-6 p-1 opacity-50 hover:opacity-75 hover:outline data-[state=open]:outline data-[state=open]:animate-pulse"
              onClick={props.delete}
              disabled={props.disabled}
            >
              <Icons.Remove />
            </Button>
          ) : (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 p-1 opacity-50 hover:opacity-75 hover:outline data-[state=open]:outline data-[state=open]:animate-pulse"
                  disabled={props.disabled}
                >
                  <Icons.Remove />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0" side="top">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={props.delete}
                  disabled={props.disabled}
                >
                  Yes i really want to delete
                </Button>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    </div>
  );
}
