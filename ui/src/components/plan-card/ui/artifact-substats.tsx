import { Trigger as SelectTrigger } from '@radix-ui/react-select';
import { WritableDraft } from 'immer';
import { useCallback, useMemo } from 'react';

import { useSpecialsItem, useSubstats } from '@/api/dictionaries/hooks';
import { CharacterPlans } from '@/api/types';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Select, SelectContent, SelectItem } from '@/components/ui/select';
import { removeByPredMut } from '@/lib/array-remove-mut';
import { cn } from '@/lib/utils';
import {
  UiPlansMode,
  useUiPlansConfigModeValue,
} from '@/store/ui-plans-config';

type Props = {
  substats: string[];
  mutate(cb: (v: WritableDraft<CharacterPlans>) => void): void;
  disabled?: boolean;
};
export function ArtifactSubstats({ substats, mutate, disabled }: Props) {
  const specials = useSubstats();
  const options = useMemo(() => {
    const selectedIds = new Set(substats);
    return specials.filter((s) => !selectedIds.has(s.id));
  }, [substats, specials]);

  const addSpecial = useCallback(
    (specialId: string) => {
      mutate((plan) => void plan.substats.push(specialId));
    },
    [mutate],
  );

  const deleteSpecial = useCallback(
    (specialId: string) => {
      mutate((plan) => removeByPredMut(plan.substats, (s) => s == specialId));
    },
    [mutate],
  );

  return (
    <div>
      <span className="text-xs text-muted-foreground">Substats</span>
      <div className="flex flex-wrap gap-1 items-center">
        {substats.map((s, i) => (
          <ArtifactSubstatsItem
            key={s}
            value={s}
            deleteSpecial={() => deleteSpecial(s)}
            isLast={substats.length - 1 == i}
            disabled={disabled}
          />
        ))}
        {options.length > 0 && (
          <Select
            onValueChange={(special) => addSpecial(special)}
            value=""
            disabled={disabled}
          >
            <SelectTrigger data-slot="select-trigger" asChild>
              <Button
                size="icon"
                variant="ghost"
                className="size-6 opacity-50 hover:opacity-100 focus:opacity-100"
                disabled={disabled}
              >
                <Icons.Add />
              </Button>
            </SelectTrigger>
            <SelectContent>
              {options.map((special) => (
                <SelectItem key={special.id} value={special.id}>
                  {special.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}

export function ArtifactSubstatsItem({
  value,
  deleteSpecial,
  isLast,
  disabled,
}: {
  value: string;
  deleteSpecial(): void;
  isLast: boolean;
  disabled?: boolean;
}) {
  const special = useSpecialsItem(value);
  const mode = useUiPlansConfigModeValue();

  if (!special) {
    return null;
  }

  return (
    <div className="flex gap-1 items-center">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            size={mode == UiPlansMode.Short ? 'sm' : 'default'}
            variant="destructive"
            className={cn(
              'leading-none not-hover:text-primary not-hover:bg-transparent',
              {
                'text-md py-0 px-2': mode == UiPlansMode.Full,
                'text-xs py-0 px-2 h-6': mode == UiPlansMode.Short,
              },
            )}
            disabled={disabled}
          >
            {special.name}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" side="top">
          <Button
            variant="destructive"
            className="w-full"
            onClick={deleteSpecial}
            disabled={disabled}
          >
            Yes i really want to delete
          </Button>
        </PopoverContent>
      </Popover>
      {!isLast && <Icons.Divide className="text-gray-400 size-4" />}
    </div>
  );
}
