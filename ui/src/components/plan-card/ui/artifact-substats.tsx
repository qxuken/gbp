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

import { RemovableChip, SectionHeader } from './section';

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
    <div className="flex flex-col gap-1.5">
      <SectionHeader icon={Icons.Substat} title="Substats" />
      {/* Chip padding pulls text left; the indent lines it back up with the title. */}
      <div className="flex flex-wrap items-center gap-1 pl-3.5">
        {substats.map((s, i) => (
          <ArtifactSubstatsItem
            key={s}
            value={s}
            deleteSpecial={() => deleteSpecial(s)}
            isLast={substats.length - 1 == i}
            disabled={disabled}
          />
        ))}
        {options.length > 0 && !disabled && (
          <Select
            onValueChange={(special) => addSpecial(special)}
            value=""
            disabled={disabled}
          >
            <SelectTrigger data-slot="select-trigger" asChild>
              <Button
                size="icon"
                variant="ghost"
                className="size-5 rounded-md text-muted-foreground hover:bg-element/15 hover:text-element-fg focus-visible:bg-element/15"
                disabled={disabled}
                aria-label="Add substat"
              >
                <Icons.Add className="size-3.5" />
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

  if (!special) {
    return null;
  }

  if (disabled) {
    return (
      <div className="flex items-center gap-1">
        <span className="px-1.5 py-0.5 text-sm leading-tight font-medium">
          {special.name}
        </span>
        {!isLast && (
          <Icons.Divide className="size-3 text-muted-foreground/50" />
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Popover>
        <PopoverTrigger asChild>
          <RemovableChip disabled={disabled}>{special.name}</RemovableChip>
        </PopoverTrigger>
        <PopoverContent className="p-0" side="top">
          <Button
            variant="destructive"
            className="w-full"
            onClick={deleteSpecial}
            disabled={disabled}
          >
            Yes, I really want to delete
          </Button>
        </PopoverContent>
      </Popover>
      {!isLast && <Icons.Divide className="size-3 text-muted-foreground/50" />}
    </div>
  );
}
