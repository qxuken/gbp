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
const ATK_TALENTS = numberRange(1, 10);
const TALENTS = numberRange(1, 13);

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
        name="Lv"
        title="Level"
        value={plan.levelTarget}
        onChange={mutateFieldImmer(mutate, 'levelTarget')}
        min={1}
        max={90}
        disabled={disabled}
      />
      <StatInput
        name="C"
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
        name="Atk"
        title="Attack talent"
        min={1}
        max={10}
        options={ATK_TALENTS}
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
      <ShortNumberInput id={id} {...props} className="w-6 tabular-nums" />
    </div>
  );
}
