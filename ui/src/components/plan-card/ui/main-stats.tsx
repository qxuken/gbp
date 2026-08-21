import { WritableDraft } from 'immer';
import { useId } from 'react';

import { CharacterPlans } from '@/api/types';
import { Label } from '@/components/ui/label';
import {
  numberRange,
  ShortNumberInput,
  ShortNumberInputProps,
} from '@/components/ui/short-number-input';
import { mutateFieldImmer } from '@/lib/mutate-field';
import { cn } from '@/lib/utils';

const CONSTELLATIONS = numberRange(0, 6);
const TALENTS = numberRange(1, 13);
const MAX_LEVEL = 100;

/** Levels run 1-90, then only the five-step breakpoints: 95 and 100. */
function normalizeLevel(level: number) {
  return level <= 90 ? level : Math.min(MAX_LEVEL, Math.round(level / 5) * 5);
}

type Props = {
  plan: CharacterPlans;
  mutate(cb: (v: WritableDraft<CharacterPlans>) => void): void;
  disabled?: boolean;
};

/**
 * The character's targets as one horizontal strip — level and constellation
 * read as identity, the three talents as a group.
 */
export function MainStat({ plan, mutate, disabled }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <StatInput
        name="Lvl"
        title="Level"
        value={plan.levelTarget}
        onChange={mutateFieldImmer(mutate, 'levelTarget')}
        min={1}
        max={MAX_LEVEL}
        normalize={normalizeLevel}
        disabled={disabled}
      />
      <StatInput
        name="Const"
        title="Constellation"
        value={plan.constellationTarget}
        onChange={mutateFieldImmer(mutate, 'constellationTarget')}
        min={0}
        max={6}
        options={CONSTELLATIONS}
        optionsLabel="constellation"
        disabled={disabled}
      />
      <span className="mx-1 h-3.5 w-px bg-border/50" aria-hidden />
      <StatInput
        name="N/A"
        title="Attack talent"
        min={1}
        max={13}
        options={TALENTS}
        optionsLabel="attack talent"
        value={plan.talentAtkTarget}
        onChange={mutateFieldImmer(mutate, 'talentAtkTarget')}
        disabled={disabled}
      />
      <StatInput
        name="Skill"
        title="Skill talent"
        min={1}
        max={13}
        options={TALENTS}
        optionsLabel="skill talent"
        value={plan.talentSkillTarget}
        onChange={mutateFieldImmer(mutate, 'talentSkillTarget')}
        disabled={disabled}
      />
      <StatInput
        name="Burst"
        title="Burst talent"
        min={1}
        max={13}
        options={TALENTS}
        optionsLabel="burst talent"
        value={plan.talentBurstTarget}
        onChange={mutateFieldImmer(mutate, 'talentBurstTarget')}
        disabled={disabled}
      />
    </div>
  );
}

type StatInputProps = ShortNumberInputProps & { name: string; title?: string };
function StatInput({ name, title, className, ...props }: StatInputProps) {
  const id = useId();
  return (
    <div
      title={title}
      className={cn(
        'flex items-center gap-0.5 rounded-md bg-background/55 py-0.5 pr-1 pl-1.5 ring-1 ring-inset ring-border/70 transition-colors focus-within:ring-element/60 hover:ring-element/40',
        className,
      )}
    >
      <Label
        htmlFor={id}
        className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
      >
        {name}
      </Label>
      <ShortNumberInput
        id={id}
        {...props}
        className={cn('tabular-nums', props.max > 99 ? 'w-7' : 'w-6')}
      />
    </div>
  );
}
