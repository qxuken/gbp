import { WritableDraft } from 'immer';

import { CharacterPlans } from '@/api/types';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  ShortNumberInput,
  ShortNumberInputProps,
} from '@/components/ui/short-number-input';
import { mutateFieldImmer } from '@/lib/mutate-field';

type Props = {
  plan: CharacterPlans;
  mutate(cb: (v: WritableDraft<CharacterPlans>) => void): void;
  disabled?: boolean;
};

export function MainStat({ plan, mutate, disabled }: Props) {
  return (
    <div className="grid grid-cols-[auto_min-content] items-center justify-end gap-x-1 gap-y-0.5">
      <StatInput
        name="Level"
        value={plan.levelTarget}
        onChange={mutateFieldImmer(mutate, 'levelTarget')}
        min={1}
        max={90}
        disabled={disabled}
      />
      <StatInput
        name="Constellation"
        value={plan.constellationTarget}
        onChange={mutateFieldImmer(mutate, 'constellationTarget')}
        min={0}
        max={6}
        disabled={disabled}
      />
      <Separator className="col-span-2 bg-muted-foreground rounded-lg opacity-50" />
      <StatInput
        name="Attack"
        min={1}
        max={10}
        value={plan.talentAtkTarget}
        onChange={mutateFieldImmer(mutate, 'talentAtkTarget')}
        disabled={disabled}
      />
      <StatInput
        name="Skill"
        min={1}
        max={13}
        value={plan.talentSkillTarget}
        onChange={mutateFieldImmer(mutate, 'talentSkillTarget')}
        disabled={disabled}
      />
      <StatInput
        name="Burst"
        min={1}
        max={13}
        value={plan.talentBurstTarget}
        onChange={mutateFieldImmer(mutate, 'talentBurstTarget')}
        disabled={disabled}
      />
    </div>
  );
}

type StatInputProps = ShortNumberInputProps & { name: string };
function StatInput(props: StatInputProps) {
  return (
    <>
      <Label className="justify-self-end text-xs text-muted-foreground">
        {props.name}
      </Label>
      <ShortNumberInput
        value={props.value}
        onChange={props.onChange}
        min={props.min}
        max={props.max}
        disabled={props.disabled}
      />
    </>
  );
}
