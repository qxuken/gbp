import { WritableDraft } from 'immer';
import { useEffect } from 'react';

import { CharacterPlans } from '@/api/types';
import { Separator } from '@/components/ui/separator';
import { mutateFieldImmer } from '@/lib/mutate-field';

import { DoubleInputLabeled } from './double-input-labeled';

// const MIN_BOUNDS = { skill: { min: 1, max: 10 }, burst: { min: 1, max: 10 } };
// const MED_BOUNDS = { skill: { min: 4, max: 13 }, burst: { min: 1, max: 10 } };
// const MAX_BOUNDS = { skill: { min: 4, max: 13 }, burst: { min: 4, max: 13 } };
const SIMPLE_BOUNDS = {
  skill: { min: 1, max: 13 },
  burst: { min: 1, max: 13 },
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getTalentBounds(constellation: number) {
  // if (constellation < 3) {
  //   return MIN_BOUNDS;
  // }
  // if (constellation < 6) {
  //   return MED_BOUNDS;
  // }
  // return MAX_BOUNDS;
  return SIMPLE_BOUNDS;
}

type Props = {
  plan: CharacterPlans;
  mutate(cb: (v: WritableDraft<CharacterPlans>) => void): void;
  disabled?: boolean;
};

export function MainStat({ plan, mutate, disabled }: Props) {
  const currentBounds = getTalentBounds(plan.constellationCurrent);
  const targetBounds = getTalentBounds(plan.constellationTarget);

  useEffect(() => {
    if (plan.talentSkillCurrent < currentBounds.skill.min) {
      mutate((plan) => (plan.talentSkillCurrent = currentBounds.skill.min));
    } else if (plan.talentSkillCurrent > targetBounds.skill.max) {
      mutate((plan) => (plan.talentSkillCurrent = targetBounds.skill.max));
    }
    if (
      (SIMPLE_BOUNDS.skill.max !== targetBounds.skill.max &&
        plan.talentSkillTarget == SIMPLE_BOUNDS.skill.max) ||
      plan.talentSkillTarget > targetBounds.skill.max
    ) {
      mutate((plan) => (plan.talentSkillTarget = targetBounds.skill.max));
    }
    if (plan.talentBurstCurrent < currentBounds.burst.min) {
      mutate((plan) => (plan.talentBurstCurrent = currentBounds.burst.min));
    } else if (plan.talentBurstCurrent > targetBounds.burst.max) {
      mutate((plan) => (plan.talentBurstCurrent = currentBounds.burst.max));
    }
    if (
      (SIMPLE_BOUNDS.burst.max !== targetBounds.burst.max &&
        plan.talentBurstTarget == SIMPLE_BOUNDS.burst.max) ||
      plan.talentBurstTarget > targetBounds.burst.max
    ) {
      mutate((plan) => (plan.talentBurstTarget = targetBounds.burst.max));
    }
  }, [
    currentBounds.skill.min,
    currentBounds.burst.min,
    targetBounds.skill.max,
    targetBounds.burst.max,
  ]);

  return (
    <div className="grid grid-cols-[auto_min-content] items-center justify-end gap-1">
      <DoubleInputLabeled
        name="Level"
        min={1}
        max={90}
        current={plan.levelCurrent}
        target={plan.levelTarget}
        onCurrentChange={mutateFieldImmer(mutate, 'levelCurrent')}
        onTargetChange={mutateFieldImmer(mutate, 'levelTarget')}
        disabled={disabled}
      />
      <DoubleInputLabeled
        name="Constellation"
        min={0}
        max={6}
        current={plan.constellationCurrent}
        target={plan.constellationTarget}
        onCurrentChange={mutateFieldImmer(mutate, 'constellationCurrent')}
        onTargetChange={mutateFieldImmer(mutate, 'constellationTarget')}
        disabled={disabled}
      />
      <Separator className="col-span-2 bg-muted-foreground rounded-lg opacity-50" />
      <DoubleInputLabeled
        name="Attack"
        min={1}
        max={10}
        current={plan.talentAtkCurrent}
        target={plan.talentAtkTarget}
        onCurrentChange={mutateFieldImmer(mutate, 'talentAtkCurrent')}
        onTargetChange={mutateFieldImmer(mutate, 'talentAtkTarget')}
        disabled={disabled}
      />
      <DoubleInputLabeled
        name="Skill"
        min={currentBounds.skill.min}
        max={targetBounds.skill.max}
        current={plan.talentSkillCurrent}
        target={plan.talentSkillTarget}
        onCurrentChange={mutateFieldImmer(mutate, 'talentSkillCurrent')}
        onTargetChange={mutateFieldImmer(mutate, 'talentSkillTarget')}
        disabled={disabled}
      />
      <DoubleInputLabeled
        name="Burst"
        min={currentBounds.burst.min}
        max={targetBounds.burst.max}
        current={plan.talentBurstCurrent}
        target={plan.talentBurstTarget}
        onCurrentChange={mutateFieldImmer(mutate, 'talentBurstCurrent')}
        onTargetChange={mutateFieldImmer(mutate, 'talentBurstTarget')}
        disabled={disabled}
      />
    </div>
  );
}
